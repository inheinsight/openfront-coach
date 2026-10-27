import path from "node:path";

export const GAME_ID_RE = /^[A-Za-z0-9_-]{4,40}$/;

export function isGameId(s: unknown): s is string {
  return typeof s === "string" && GAME_ID_RE.test(s);
}

/** Throws unless `s` is a plain game ID (letters, digits, - and _ only). */
export function assertGameId(s: unknown): string {
  if (!isGameId(s)) throw new Error(`invalid game id: ${JSON.stringify(String(s)).slice(0, 60)}`);
  return s;
}

/** Joins and checks the result stays inside `dir` (defence against traversal). */
export function insideDir(dir: string, ...parts: string[]): string {
  const root = path.resolve(dir);
  const p = path.resolve(root, ...parts);
  if (p !== root && !p.startsWith(root + path.sep)) throw new Error(`path escapes ${root}`);
  return p;
}

/** Accepts a bare game ID or any openfront.io game/replay/join link. */
export function parseGameId(input: string): string | null {
  const s = input.trim();
  const m =
    s.match(/(?:\/game\/|replay-viewer=|join=|replay\.[a-z0-9.-]+\/)([A-Za-z0-9_-]{6,40})/i) ??
    s.match(/^([A-Za-z0-9_-]{6,40})$/);
  return m && isGameId(m[1]) ? m[1] : null;
}
