import fs from "node:fs/promises";
import path from "node:path";
import { config } from "../config.js";
import type { GameListing, GameRecord, PlayerSession } from "./types.js";

// Client for OpenFront's documented public API (docs/API.md upstream).
// Only finished games are archived there, so everything the coach reads is
// post-game by construction.

const UA = "OpenFrontCoach/0.1 (+post-game analysis; local)";

export class NotArchivedYet extends Error {
  constructor(gameId: string) {
    super(`game ${gameId} is not archived yet (still running, or just ended)`);
  }
}

async function getJson<T>(url: string, attempts = 3): Promise<T> {
  let lastErr: unknown;
  for (let i = 0; i < attempts; i++) {
    try {
      const res = await fetch(url, { headers: { Accept: "application/json", "User-Agent": UA } });
      if (res.status === 404) throw Object.assign(new Error(`404 ${url}`), { status: 404 });
      if (res.status === 429 || res.status >= 500) {
        lastErr = new Error(`${res.status} ${url}`);
        await new Promise((r) => setTimeout(r, 1000 * 2 ** i));
        continue;
      }
      if (!res.ok) throw Object.assign(new Error(`${res.status} ${url}`), { status: res.status });
      return (await res.json()) as T;
    } catch (e) {
      if ((e as { status?: number }).status === 404) throw e;
      lastErr = e;
      await new Promise((r) => setTimeout(r, 500 * 2 ** i));
    }
  }
  throw lastErr;
}

function recordPath(gameId: string) {
  return path.join(config.recordsDir, `${gameId.replace(/[^A-Za-z0-9_-]/g, "")}.json`);
}

/** Full game record (with turns). Cached on disk: archived games never change. */
export async function fetchGameRecord(gameId: string): Promise<GameRecord> {
  const file = recordPath(gameId);
  try {
    return JSON.parse(await fs.readFile(file, "utf8")) as GameRecord;
  } catch {
    // not cached
  }
  let record: GameRecord;
  try {
    record = await getJson<GameRecord>(`${config.openfrontApi}/public/game/${encodeURIComponent(gameId)}`);
  } catch (e) {
    if ((e as { status?: number }).status === 404) throw new NotArchivedYet(gameId);
    throw e;
  }
  if (!record?.info?.gameID || !Array.isArray(record.turns)) {
    throw new Error(`unexpected record shape for ${gameId}`);
  }
  await fs.mkdir(config.recordsDir, { recursive: true });
  await fs.writeFile(file, JSON.stringify(record));
  return record;
}

export async function importRecordFile(file: string): Promise<GameRecord> {
  const record = JSON.parse(await fs.readFile(file, "utf8")) as GameRecord;
  if (!record?.info?.gameID) throw new Error("not an OpenFront game record");
  await fs.mkdir(config.recordsDir, { recursive: true });
  await fs.writeFile(recordPath(record.info.gameID), JSON.stringify(record));
  return record;
}

export async function isArchived(gameId: string): Promise<boolean> {
  try {
    await getJson(`${config.openfrontApi}/public/game/${encodeURIComponent(gameId)}?turns=false`, 1);
    return true;
  } catch {
    return false;
  }
}

export async function listGames(params: {
  start: string;
  end: string;
  type?: string;
  mode?: string;
  limit?: number;
  offset?: number;
}): Promise<GameListing[]> {
  const q = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) if (v !== undefined) q.set(k, String(v));
  return getJson<GameListing[]>(`${config.openfrontApi}/public/games?${q}`);
}

export async function fetchPlayerSessions(
  publicId: string,
  opts: { type?: "public" | "private" | "singleplayer"; maxPages?: number } = {},
): Promise<PlayerSession[]> {
  const out: PlayerSession[] = [];
  let cursor: string | null = null;
  for (let page = 0; page < (opts.maxPages ?? 1); page++) {
    const q = new URLSearchParams();
    if (opts.type) q.set("type", opts.type);
    if (cursor) q.set("cursor", cursor);
    const res: { results: PlayerSession[]; nextCursor: string | null } = await getJson(
      `${config.openfrontApi}/public/player/${encodeURIComponent(publicId)}/sessions?${q}`,
    );
    out.push(...res.results);
    cursor = res.nextCursor;
    if (!cursor) break;
  }
  return out;
}

export async function fetchPlayerProfile(publicId: string): Promise<unknown> {
  return getJson(`${config.openfrontApi}/public/player/${encodeURIComponent(publicId)}`);
}
