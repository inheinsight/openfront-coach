import { fork } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";
import { config } from "../config.js";
import type { GameRecord } from "../openfront/types.js";
import type { ReplayData } from "./replayTypes.js";
import { builtEngines, ensureEngine, ensureMap, UnsupportedEngineLayout } from "./manager.js";

export interface ReplayProgress {
  stage: "engine" | "map" | "simulate" | "done";
  percent?: number;
  message?: string;
}

export interface ReplayResult {
  data: ReplayData;
  exactBuild: boolean;
}

/** Node permission-model flags (Node 20: --experimental-permission; 22.13+: --permission). */
export function sandboxFlags(opts: { read: string[]; write: string[] }): string[] {
  const [major, minor] = process.versions.node.split(".").map(Number);
  const stable = major > 23 || (major === 23 && minor >= 5) || (major === 22 && minor >= 13);
  // Directories as "<dir>/*" only: granting both "<dir>" and "<dir>/*" trips
  // an assertion in Node 20's permission radix tree.
  const expand = (paths: string[]) =>
    [...new Set(paths.map((p) => (fs.existsSync(p) && fs.statSync(p).isDirectory() ? path.join(p, "*") : p)))];
  // One flag per path: Node 20's comma-separated form mis-parses some lists.
  return [
    stable ? "--permission" : "--experimental-permission",
    ...expand(opts.read).map((p) => `--allow-fs-read=${p}`),
    ...expand(opts.write).map((p) => `--allow-fs-write=${p}`),
    "--no-warnings",
  ];
}

function replayPath(gameId: string) {
  return path.join(config.replaysDir, `${gameId}.json.gz`);
}

export function loadCachedReplay(gameId: string): ReplayData | null {
  const p = replayPath(gameId);
  if (!fs.existsSync(p)) return null;
  return JSON.parse(zlib.gunzipSync(fs.readFileSync(p)).toString("utf8")) as ReplayData;
}

/** Re-simulates a finished game with the engine of the build that played it. */
export async function replayGame(
  record: GameRecord,
  onProgress: (p: ReplayProgress) => void = () => {},
): Promise<ReplayResult> {
  const gameId = record.info.gameID;
  const cached = loadCachedReplay(gameId);
  if (cached) return { data: cached, exactBuild: cached.meta.engineCommit === record.gitCommit };

  onProgress({ stage: "engine", message: `Fetching OpenFront engine ${record.gitCommit.slice(0, 9)}` });
  let build;
  let exactBuild = true;
  try {
    build = await ensureEngine(record.gitCommit);
  } catch (e) {
    if (e instanceof UnsupportedEngineLayout) throw e;
    // The commit may be unreachable (force-pushed, private hotfix). Fall back
    // to the newest engine we have; the hash check flags where it drifts.
    const fallback = builtEngines()[0];
    if (!fallback) throw e;
    build = await ensureEngine(fallback);
    exactBuild = false;
  }
  onProgress({ stage: "map", message: `Loading map ${record.info.config.gameMap}` });
  const mapDir = await ensureMap(build, record.info.config.gameMap);

  const recordPath = path.join(config.recordsDir, `${gameId}.json`);
  if (!fs.existsSync(recordPath)) {
    fs.mkdirSync(config.recordsDir, { recursive: true });
    fs.writeFileSync(recordPath, JSON.stringify(record));
  }
  const outPath = replayPath(gameId);
  const inputPath = path.join(config.replaysDir, `${gameId}.input.json`);
  fs.mkdirSync(config.replaysDir, { recursive: true });
  fs.writeFileSync(
    inputPath,
    JSON.stringify({ recordPath, mapDir, outPath, engineCommit: build.commit, allowDesync: !exactBuild }),
  );

  onProgress({ stage: "simulate", percent: 0, message: "Re-simulating the game" });
  await new Promise<void>((resolve, reject) => {
    // The engine is third-party code fetched from GitHub, so it runs under
    // Node's permission model: it may read only its own bundle, the record,
    // the map and its input file, may write only the replay output, and may
    // not spawn processes or workers.
    const child = fork(build.harnessPath, [inputPath], {
      execArgv: [...sandboxFlags({
        read: [path.dirname(build.harnessPath), recordPath, mapDir, inputPath],
        write: [config.replaysDir],
      }), "--max-old-space-size=6144"],
      stdio: ["ignore", "ignore", "pipe", "ipc"],
    });
    let stderr = "";
    let failed: string | null = null;
    child.stderr?.on("data", (d) => (stderr = (stderr + d.toString()).slice(-4000)));
    child.on("message", (m: { type: string; percent?: number; error?: string }) => {
      if (m.type === "progress") onProgress({ stage: "simulate", percent: m.percent });
      if (m.type === "error") failed = m.error ?? "harness error";
    });
    child.on("exit", (code) => {
      fs.rmSync(inputPath, { force: true });
      if (code === 0 && fs.existsSync(outPath)) resolve();
      else reject(new Error(failed ?? `replay harness exited with ${code}: ${stderr}`));
    });
  });
  onProgress({ stage: "done", percent: 100 });
  const data = loadCachedReplay(gameId)!;
  return { data, exactBuild };
}
