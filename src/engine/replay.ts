import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";
import { config } from "../config.js";
import { assertGameId, insideDir } from "../openfront/ids.js";
import type { GameRecord } from "../openfront/types.js";
import type { ReplayData } from "./replayTypes.js";
import { builtEngines, ensureEngine, ensureMap, HARNESS_VERSION, UnsupportedEngineLayout, verifyUpstreamCommit } from "./manager.js";

export interface ReplayProgress {
  stage: "engine" | "map" | "simulate" | "done";
  percent?: number;
  message?: string;
}

export interface ReplayResult {
  data: ReplayData;
  exactBuild: boolean;
}

export interface ReplayOptions {
  /**
   * The record didn't come from OpenFront's own archive (e.g. an imported
   * file), so its gitCommit is checked against OpenFront's main branch
   * before any engine code for it is downloaded.
   */
  untrustedRecord?: boolean;
}

/** Hard limits for one replay: a stuck or runaway engine is killed. */
const STALL_MS = 120_000;
const TOTAL_MS = 30 * 60_000;

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

const sbString = (s: string) => `"${s.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`;

/**
 * OS-level isolation around the Node permission model, which on its own
 * neither blocks the network nor counts as a security boundary. macOS:
 * sandbox-exec with no network and writes limited to the output file.
 * Linux: an unprivileged network namespace via `unshare -rn` when allowed.
 */
export function osSandbox(writeFiles: string[]): { cmd: string; args: string[]; kind: string } | null {
  if (process.platform === "darwin" && fs.existsSync("/usr/bin/sandbox-exec")) {
    const writes = writeFiles.map((f) => `(literal ${sbString(fs.realpathSync(path.dirname(f)) + "/" + path.basename(f))})`).join(" ");
    const profile = `(version 1)(allow default)(deny network*)(deny file-write*)(allow file-write* ${writes} (literal "/dev/null"))`;
    return { cmd: "/usr/bin/sandbox-exec", args: ["-p", profile], kind: "sandbox-exec (no network, no writes outside the output file)" };
  }
  if (process.platform === "linux") {
    for (const dir of ["/usr/bin", "/bin"]) {
      if (fs.existsSync(`${dir}/unshare`)) return { cmd: `${dir}/unshare`, args: ["-rn", "--"], kind: "unshare (no network)" };
    }
  }
  return null;
}

function replayPath(gameId: string) {
  return insideDir(config.replaysDir, `${assertGameId(gameId)}.h${HARNESS_VERSION}.json.gz`);
}

export function loadCachedReplay(gameId: string): ReplayData | null {
  const p = replayPath(gameId);
  if (!fs.existsSync(p)) return null;
  return JSON.parse(zlib.gunzipSync(fs.readFileSync(p)).toString("utf8")) as ReplayData;
}

/** The newest cached replay of any harness version (for the map viewer). */
export function loadAnyReplay(gameId: string): ReplayData | null {
  assertGameId(gameId);
  if (!fs.existsSync(config.replaysDir)) return null;
  const files = fs
    .readdirSync(config.replaysDir)
    .map((f) => ({ f, v: Number(f.match(new RegExp(`^${gameId}\\.h(\\d+)\\.json\\.gz$`))?.[1] ?? NaN) }))
    .filter((x) => Number.isFinite(x.v))
    .sort((a, b) => b.v - a.v);
  if (!files.length) return null;
  return JSON.parse(zlib.gunzipSync(fs.readFileSync(insideDir(config.replaysDir, files[0].f))).toString("utf8")) as ReplayData;
}

/** Only complete replays on the game's own build are worth keeping. */
function isComplete(d: ReplayData, record: GameRecord) {
  return d.meta.engineCommit === record.gitCommit && !d.meta.stoppedEarly && !d.meta.desync;
}

/** Re-simulates a finished game with the engine of the build that played it. */
export async function replayGame(
  record: GameRecord,
  onProgress: (p: ReplayProgress) => void = () => {},
  opts: ReplayOptions = {},
): Promise<ReplayResult> {
  const gameId = assertGameId(record.info.gameID);
  if (!/^[0-9a-f]{7,40}$/.test(record.gitCommit ?? "")) throw new Error("record has no valid gitCommit");
  const cached = loadCachedReplay(gameId);
  if (cached && isComplete(cached, record)) return { data: cached, exactBuild: true };

  if (opts.untrustedRecord) {
    onProgress({ stage: "engine", message: "Checking this build is an official OpenFront commit" });
    if (!(await verifyUpstreamCommit(record.gitCommit))) {
      throw new UntrustedBuild(record.gitCommit);
    }
  }

  onProgress({ stage: "engine", message: `Fetching OpenFront engine ${record.gitCommit.slice(0, 9)}` });
  let build;
  let exactBuild = true;
  try {
    build = await ensureEngine(record.gitCommit);
  } catch (e) {
    if (e instanceof UnsupportedEngineLayout) throw e;
    // The commit may be unreachable (offline, force-pushed). Fall back to
    // the newest engine we have; the hash check flags where it drifts, and
    // the result isn't cached so a later re-analysis can do better.
    const fallback = builtEngines()[0];
    if (!fallback) throw e;
    build = await ensureEngine(fallback);
    exactBuild = false;
  }
  onProgress({ stage: "map", message: `Loading map ${record.info.config.gameMap}` });
  const mapDir = await ensureMap(build, record.info.config.gameMap);

  fs.mkdirSync(config.recordsDir, { recursive: true });
  fs.mkdirSync(config.replaysDir, { recursive: true });
  const recordPath = insideDir(config.recordsDir, `${gameId}.json`);
  if (!fs.existsSync(recordPath)) fs.writeFileSync(recordPath, JSON.stringify(record));
  const outPath = replayPath(gameId);
  const inputPath = insideDir(config.replaysDir, `${gameId}.input.json`);
  fs.rmSync(outPath, { force: true });
  fs.writeFileSync(
    inputPath,
    JSON.stringify({ recordPath, mapDir, outPath, engineCommit: build.commit, allowDesync: !exactBuild }),
  );

  onProgress({ stage: "simulate", percent: 0, message: "Re-simulating the game" });
  try {
    await runHarness(build.harnessPath, inputPath, outPath, [path.dirname(build.harnessPath), recordPath, mapDir, inputPath], (p) =>
      onProgress({ stage: "simulate", percent: p }),
    );
  } finally {
    fs.rmSync(inputPath, { force: true });
  }
  onProgress({ stage: "done", percent: 100 });
  const data = JSON.parse(zlib.gunzipSync(fs.readFileSync(outPath)).toString("utf8")) as ReplayData;
  if (!isComplete(data, record)) fs.rmSync(outPath, { force: true });
  return { data, exactBuild };
}

export class UntrustedBuild extends Error {
  constructor(commit: string) {
    super(`build ${commit.slice(0, 9)} isn't on OpenFront's main branch, so its engine wasn't downloaded; this game gets stats-and-actions analysis only`);
  }
}

/**
 * Runs the harness for one game. The engine is third-party code fetched from
 * GitHub, so it gets: an empty environment (no API keys or shell secrets),
 * Node's permission model (read only its bundle, the record, the map and its
 * input; write only the output file; no child processes or workers), and,
 * where available, an OS sandbox with no network at all.
 */
function runHarness(harnessPath: string, inputPath: string, outPath: string, read: string[], onPercent: (p: number) => void) {
  return new Promise<void>((resolve, reject) => {
    const nodeArgs = [...sandboxFlags({ read, write: [outPath] }), "--max-old-space-size=6144", harnessPath, inputPath];
    const os = osSandbox([outPath]);
    const child = os
      ? spawn(os.cmd, [...os.args, process.execPath, ...nodeArgs], { env: {}, stdio: ["ignore", "ignore", "pipe", "ipc"] })
      : spawn(process.execPath, nodeArgs, { env: {}, stdio: ["ignore", "ignore", "pipe", "ipc"] });
    let stderr = "";
    let failed: string | null = null;
    let settled = false;
    let lastProgress = Date.now();
    const started = Date.now();
    const finish = (err?: Error) => {
      if (settled) return;
      settled = true;
      clearInterval(watchdog);
      if (err) reject(err);
      else resolve();
    };
    const watchdog = setInterval(() => {
      const now = Date.now();
      if (now - lastProgress > STALL_MS || now - started > TOTAL_MS) {
        child.kill("SIGKILL");
        finish(new Error(now - started > TOTAL_MS ? "replay took longer than 30 minutes and was stopped" : "replay stalled (no progress for 2 minutes) and was stopped"));
      }
    }, 5000);
    child.stderr?.on("data", (d) => (stderr = (stderr + d.toString()).slice(-4000)));
    child.on("message", (m: { type: string; percent?: number; error?: string }) => {
      lastProgress = Date.now();
      if (m.type === "progress" && typeof m.percent === "number") onPercent(m.percent);
      if (m.type === "error") failed = String(m.error ?? "harness error").slice(0, 2000);
    });
    child.on("error", (e) => finish(e));
    child.on("exit", (code) => {
      if (code === 0 && fs.existsSync(outPath)) finish();
      else finish(new Error(failed ?? `replay harness exited with ${code}: ${stderr}`));
    });
  });
}
