import "dotenv/config";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
export const ROOT_DIR = path.resolve(here, "..");

function env(name: string): string | undefined {
  const v = process.env[name];
  return v === undefined || v.trim() === "" ? undefined : v.trim();
}

const dataDir = path.resolve(ROOT_DIR, env("DATA_DIR") ?? "data");

export const config = {
  port: Number(env("PORT") ?? 5317),
  dataDir,
  dbPath: path.join(dataDir, "coach.sqlite"),
  recordsDir: path.join(dataDir, "records"),
  replaysDir: path.join(dataDir, "replays"),
  enginesDir: path.join(dataDir, "engines"),
  sourceRepoDir: path.join(dataDir, "openfront-src"),
  openfrontRepo: env("OPENFRONT_REPO") ?? "https://github.com/openfrontio/OpenFrontIO.git",
  openfrontApi: env("OPENFRONT_API") ?? "https://api.openfront.io",
  publicId: env("OPENFRONT_PUBLIC_ID"),
  typesafeApiKey: env("TYPESAFE_API_KEY"),
  jevModel: env("JEV_MODEL") ?? "jev-latest",
  narrator: (env("NARRATOR") ?? "claude-cli") as "claude-cli" | "off",
  claudeModel: env("CLAUDE_MODEL") ?? "haiku",
  claudeBin: env("CLAUDE_BIN") ?? "claude",
  webDistDir: path.join(ROOT_DIR, "web", "dist"),
};

export type Config = typeof config;
