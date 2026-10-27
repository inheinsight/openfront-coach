/**
 * Engine manager: gets the exact OpenFront engine that played a game and
 * bundles the replay harness against it.
 *
 * OpenFront's simulation is only deterministic within one build, so a game
 * must be replayed by the engine of the commit recorded in its game record
 * (`record.gitCommit`). For each commit we keep a sparse, shallow, blobless
 * checkout of just `packages/` and the top-level JSON resources, plus each
 * map's files, then esbuild the harness against that source.
 */
import { execFile } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { promisify } from "node:util";
import * as esbuild from "esbuild";
import { config, ROOT_DIR } from "../config.js";

const exec = promisify(execFile);
const HARNESS_VERSION = 4; // bump when harness.ts changes so cached bundles rebuild

async function git(cwd: string, ...args: string[]) {
  const { stdout } = await exec("git", args, { cwd, maxBuffer: 64 * 1024 * 1024, env: { ...process.env, GIT_TERMINAL_PROMPT: "0" } });
  return stdout.trim();
}

const SPARSE_BASE = ["/packages/", "/resources/*.json", "/tsconfig.json", "/tsconfig.base.json", "/package.json"];

export interface EngineBuild {
  commit: string;
  srcDir: string;
  harnessPath: string;
}

const locks = new Map<string, Promise<unknown>>();
function once<T>(key: string, fn: () => Promise<T>): Promise<T> {
  const existing = locks.get(key) as Promise<T> | undefined;
  if (existing) return existing;
  const p = fn().finally(() => locks.delete(key));
  locks.set(key, p);
  return p;
}

function commitDir(commit: string) {
  return path.join(config.enginesDir, commit);
}

async function ensureCheckout(commit: string): Promise<string> {
  const dir = path.join(commitDir(commit), "src");
  if (fs.existsSync(path.join(dir, ".coach-ready"))) return dir;
  fs.rmSync(dir, { recursive: true, force: true });
  fs.mkdirSync(dir, { recursive: true });
  await git(dir, "init", "-q");
  await git(dir, "remote", "add", "origin", config.openfrontRepo);
  await git(dir, "sparse-checkout", "set", "--no-cone", ...SPARSE_BASE);
  await git(dir, "fetch", "-q", "--depth", "1", "--filter=blob:none", "origin", commit);
  await git(dir, "checkout", "-q", "FETCH_HEAD");
  if (!fs.existsSync(path.join(dir, "packages", "engine", "src", "GameRunner.ts"))) {
    throw new UnsupportedEngineLayout(commit);
  }
  fs.writeFileSync(path.join(dir, ".coach-ready"), new Date().toISOString());
  return dir;
}

export class UnsupportedEngineLayout extends Error {
  constructor(commit: string) {
    super(
      `build ${commit.slice(0, 9)} predates OpenFront's engine package split (Oct 2025); ` +
        "full replays need a newer build, so this game gets stats-and-actions analysis only",
    );
  }
}

/** Directory holding one map's files for the given engine checkout (shared across commits by git tree hash). */
export async function ensureMap(build: EngineBuild, gameMap: string): Promise<string> {
  const dirName = await mapDirName(build.srcDir, gameMap);
  return once(`map:${build.commit}:${dirName}`, async () => {
    const tree = await git(build.srcDir, "rev-parse", `HEAD:resources/maps/${dirName}`);
    const cached = path.join(config.dataDir, "maps", tree);
    if (fs.existsSync(path.join(cached, "manifest.json"))) return cached;
    await git(build.srcDir, "sparse-checkout", "add", `/resources/maps/${dirName}/`);
    const src = path.join(build.srcDir, "resources", "maps", dirName);
    fs.mkdirSync(cached, { recursive: true });
    for (const f of fs.readdirSync(src)) {
      if (f.endsWith(".bin") || f === "manifest.json") fs.copyFileSync(path.join(src, f), path.join(cached, f));
    }
    // Drop the working copy; the shared cache keeps the files.
    await git(build.srcDir, "sparse-checkout", "set", "--no-cone", ...SPARSE_BASE);
    return cached;
  });
}

/**
 * Upstream keys map folders by the GameMapType enum key, lowercased
 * (src/server/MapFiles.ts). Read the enum from this build's source.
 */
async function mapDirName(srcDir: string, gameMap: string): Promise<string> {
  const file = path.join(srcDir, "packages", "engine-api", "src", "game", "GameTypes.ts");
  const text = fs.readFileSync(file, "utf8");
  const enumBody = text.match(/export enum GameMapType \{([\s\S]*?)\n\}/)?.[1] ?? "";
  for (const m of enumBody.matchAll(/(\w+)\s*=\s*"([^"]+)"/g)) {
    if (m[2] === gameMap) return m[1].toLowerCase();
  }
  return gameMap.replace(/[^A-Za-z0-9]/g, "").toLowerCase();
}

function aliasPlugin(srcDir: string): esbuild.Plugin {
  const exts = [".ts", ".tsx", ".js", ".mjs", ".json", "/index.ts"];
  const resolveFile = (base: string) => {
    if (fs.existsSync(base) && fs.statSync(base).isFile()) return base;
    for (const e of exts) if (fs.existsSync(base + e)) return base + e;
    return null;
  };
  return {
    name: "openfront-alias",
    setup(b) {
      b.onResolve({ filter: /^@openfront\/[^/]+(\/.*)?$/ }, (args) => {
        const m = args.path.match(/^@openfront\/([^/]+)(?:\/(.*))?$/)!;
        const base = path.join(srcDir, "packages", m[1], "src", m[2] ?? "index");
        const file = resolveFile(base);
        if (!file) return { errors: [{ text: `cannot resolve ${args.path} in engine source` }] };
        return { path: file };
      });
      b.onResolve({ filter: /^resources\// }, (args) => {
        const file = resolveFile(path.join(srcDir, args.path));
        if (!file) return { errors: [{ text: `cannot resolve ${args.path}` }] };
        return { path: file };
      });
    },
  };
}

export async function ensureEngine(commit: string): Promise<EngineBuild> {
  if (!/^[0-9a-f]{7,40}$/.test(commit)) throw new Error(`not a commit hash: ${commit}`);
  return once(`engine:${commit}`, async () => {
    const srcDir = await ensureCheckout(commit);
    const harnessPath = path.join(commitDir(commit), `harness.v${HARNESS_VERSION}.mjs`);
    if (!fs.existsSync(harnessPath)) {
      await esbuild.build({
        entryPoints: [path.join(ROOT_DIR, "src", "engine", "harness", "harness.ts")],
        outfile: harnessPath,
        bundle: true,
        platform: "node",
        format: "esm",
        target: "node20",
        sourcemap: false,
        logLevel: "silent",
        nodePaths: [path.join(ROOT_DIR, "node_modules")],
        plugins: [aliasPlugin(srcDir)],
        banner: { js: "import { createRequire as __cr } from 'module'; const require = __cr(import.meta.url);" },
      });
    }
    return { commit, srcDir, harnessPath };
  });
}

/** Engines already built on this machine, newest first (fallback for unknown commits). */
export function builtEngines(): string[] {
  if (!fs.existsSync(config.enginesDir)) return [];
  return fs
    .readdirSync(config.enginesDir)
    .filter((c) => fs.existsSync(path.join(config.enginesDir, c, `harness.v${HARNESS_VERSION}.mjs`)))
    .map((c) => ({ c, t: fs.statSync(path.join(config.enginesDir, c)).mtimeMs }))
    .sort((a, b) => b.t - a.t)
    .map((x) => x.c);
}

export async function latestUpstreamCommit(): Promise<string> {
  const out = await exec("git", ["ls-remote", config.openfrontRepo, "refs/heads/main"]);
  return out.stdout.split(/\s+/)[0];
}
