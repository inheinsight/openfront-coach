const GAME_ID = /^[A-Za-z0-9_-]{4,40}$/;

/** Accepts a bare game ID or any openfront.io game/replay/join link. */
export function parseGameId(input: string): string | null {
  const s = input.trim();
  const m =
    s.match(/(?:\/game\/|replay-viewer=|join=|replay\.[a-z0-9.-]+\/)([A-Za-z0-9_-]{6,40})/i) ??
    s.match(/^([A-Za-z0-9_-]{6,40})$/);
  return m && GAME_ID.test(m[1]) ? m[1] : null;
}
