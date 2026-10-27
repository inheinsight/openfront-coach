import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";
import { config } from "../config.js";
import type { Analysis } from "../analysis/types.js";

export type GameStatus = "queued" | "waiting_archive" | "replaying" | "analyzing" | "done" | "error";

export interface Identity {
  clientID?: string | null;
  publicId?: string | null;
  username?: string | null;
}

export interface GameRow {
  game_id: string;
  status: GameStatus;
  stage: string | null;
  progress: number | null;
  error: string | null;
  source: string;
  identity_json: string;
  next_check_at: number | null;
  attempts: number;
  started_at: number | null;
  ended_at: number | null;
  map: string | null;
  mode: string | null;
  game_type: string | null;
  result: string | null;
  score: number | null;
  grade: string | null;
  placement: number | null;
  placement_of: number | null;
  player_name: string | null;
  headline: string | null;
  depth: string | null;
  analysis_gz: Buffer | null;
  trend_json: string | null;
  created_at: number;
  updated_at: number;
}

let db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (db) return db;
  fs.mkdirSync(path.dirname(config.dbPath), { recursive: true });
  db = new Database(config.dbPath);
  db.pragma("journal_mode = WAL");
  db.exec(`
    CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY, value TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS games (
      game_id TEXT PRIMARY KEY,
      status TEXT NOT NULL,
      stage TEXT,
      progress REAL,
      error TEXT,
      source TEXT NOT NULL DEFAULT 'manual',
      identity_json TEXT NOT NULL DEFAULT '{}',
      next_check_at INTEGER,
      attempts INTEGER NOT NULL DEFAULT 0,
      started_at INTEGER,
      ended_at INTEGER,
      map TEXT,
      mode TEXT,
      game_type TEXT,
      result TEXT,
      score REAL,
      grade TEXT,
      placement INTEGER,
      placement_of INTEGER,
      player_name TEXT,
      headline TEXT,
      depth TEXT,
      analysis_gz BLOB,
      trend_json TEXT,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );
    CREATE INDEX IF NOT EXISTS games_status ON games(status, next_check_at);
  `);
  return db;
}

// ---- settings -----------------------------------------------------------

export interface Settings {
  usernames: string[];
  publicId: string | null;
  autoSync: boolean;
  useJev: boolean;
  useNarrator: boolean;
}

const DEFAULT_SETTINGS: Settings = { usernames: [], publicId: config.publicId ?? null, autoSync: true, useJev: true, useNarrator: true };

export function getSettings(): Settings {
  const rows = getDb().prepare("SELECT key, value FROM settings").all() as { key: string; value: string }[];
  const s: Record<string, unknown> = { ...DEFAULT_SETTINGS };
  for (const r of rows) s[r.key] = JSON.parse(r.value);
  return s as unknown as Settings;
}

export function updateSettings(patch: Partial<Settings>): Settings {
  const stmt = getDb().prepare("INSERT INTO settings(key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value");
  for (const [k, v] of Object.entries(patch)) {
    if (!(k in DEFAULT_SETTINGS) || v === undefined) continue;
    stmt.run(k, JSON.stringify(v));
  }
  return getSettings();
}

/** Remember identities the extension reports so manual imports find you too. */
export function learnIdentity(id: Identity) {
  const s = getSettings();
  const patch: Partial<Settings> = {};
  if (id.username && !s.usernames.includes(id.username)) patch.usernames = [...s.usernames, id.username].slice(-8);
  if (id.publicId && !s.publicId) patch.publicId = id.publicId;
  if (Object.keys(patch).length) updateSettings(patch);
}

// ---- games ---------------------------------------------------------------

export function getGame(gameId: string): GameRow | undefined {
  return getDb().prepare("SELECT * FROM games WHERE game_id = ?").get(gameId) as GameRow | undefined;
}

export function upsertGameRequest(gameId: string, source: string, identity: Identity, opts: { force?: boolean; waitForArchive?: boolean } = {}): GameRow {
  const now = Date.now();
  const existing = getGame(gameId);
  if (existing && !opts.force && existing.status !== "error") {
    // Merge in any identity we didn't have.
    const merged = { ...JSON.parse(existing.identity_json || "{}"), ...Object.fromEntries(Object.entries(identity).filter(([, v]) => v)) };
    getDb().prepare("UPDATE games SET identity_json = ?, updated_at = ? WHERE game_id = ?").run(JSON.stringify(merged), now, gameId);
    return getGame(gameId)!;
  }
  getDb()
    .prepare(
      `INSERT INTO games(game_id, status, stage, progress, error, source, identity_json, next_check_at, attempts, created_at, updated_at)
       VALUES (@game_id, @status, NULL, 0, NULL, @source, @identity, @next, 0, @now, @now)
       ON CONFLICT(game_id) DO UPDATE SET status = excluded.status, stage = NULL, progress = 0, error = NULL,
         source = excluded.source, identity_json = excluded.identity_json, next_check_at = excluded.next_check_at, attempts = 0, updated_at = excluded.updated_at`,
    )
    .run({ game_id: gameId, status: opts.waitForArchive ? "waiting_archive" : "queued", source, identity: JSON.stringify(identity), next: now, now });
  return getGame(gameId)!;
}

export function setGameState(gameId: string, patch: Partial<GameRow>) {
  const keys = Object.keys(patch);
  if (!keys.length) return;
  const sets = keys.map((k) => `${k} = @${k}`).join(", ");
  getDb().prepare(`UPDATE games SET ${sets}, updated_at = @updated_at WHERE game_id = @game_id`).run({ ...patch, updated_at: Date.now(), game_id: gameId });
}

export function saveAnalysis(gameId: string, a: Analysis) {
  setGameState(gameId, {
    status: "done",
    stage: null,
    progress: 100,
    error: null,
    started_at: a.game.startedAt,
    ended_at: a.game.endedAt,
    map: a.game.map,
    mode: a.game.mode,
    game_type: a.game.type,
    result: a.me.result,
    score: a.overall.score,
    grade: a.overall.grade,
    placement: a.me.placement,
    placement_of: a.me.placementOf,
    player_name: a.me.name,
    headline: a.headline,
    depth: a.depth,
    analysis_gz: zlib.gzipSync(JSON.stringify(a)),
    trend_json: JSON.stringify(a.trendMetrics),
  });
}

export function loadAnalysis(gameId: string): Analysis | null {
  const row = getGame(gameId);
  if (!row?.analysis_gz) return null;
  return JSON.parse(zlib.gunzipSync(row.analysis_gz).toString("utf8")) as Analysis;
}

export function listGames(limit = 200) {
  return getDb()
    .prepare(
      `SELECT game_id, status, stage, progress, error, source, started_at, ended_at, map, mode, game_type, result, score, grade,
              placement, placement_of, player_name, headline, depth, created_at, updated_at
       FROM games ORDER BY COALESCE(started_at, created_at) DESC LIMIT ?`,
    )
    .all(limit) as Omit<GameRow, "analysis_gz" | "identity_json" | "trend_json" | "next_check_at" | "attempts">[];
}

export function dueJobs(now = Date.now()): GameRow[] {
  return getDb()
    .prepare("SELECT * FROM games WHERE status IN ('queued','waiting_archive','replaying','analyzing') AND (next_check_at IS NULL OR next_check_at <= ?) ORDER BY created_at")
    .all(now) as GameRow[];
}

export function trends() {
  return getDb()
    .prepare("SELECT game_id, started_at, map, mode, game_type, result, score, grade, trend_json FROM games WHERE status = 'done' AND trend_json IS NOT NULL ORDER BY started_at ASC")
    .all() as { game_id: string; started_at: number; map: string; mode: string; game_type: string; result: string; score: number; grade: string; trend_json: string }[];
}

export function deleteGame(gameId: string) {
  getDb().prepare("DELETE FROM games WHERE game_id = ?").run(gameId);
}
