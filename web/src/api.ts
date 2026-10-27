import type { Analysis, Severity } from "../../src/analysis/types";

export type { Analysis, Severity };

export interface GameSummary {
  game_id: string;
  status: "queued" | "waiting_archive" | "replaying" | "analyzing" | "done" | "error";
  stage: string | null;
  progress: number | null;
  error: string | null;
  source: string;
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
  created_at: number;
  updated_at: number;
}

export interface Settings {
  usernames: string[];
  publicId: string | null;
  autoSync: boolean;
  useJev: boolean;
  useNarrator: boolean;
}

export interface Health {
  ok: boolean;
  jev: boolean;
  narrator: boolean;
  settings: Settings;
}

export interface MapData {
  width: number;
  height: number;
  frameEvery?: number;
  frameScale?: number;
  ticks?: number;
  terrain: string | null;
  frames: { tick: number; data: string }[];
  me: number | null;
  players: { smallID: number; name: string; type: string; team: string | null }[];
}

export interface TrendRow {
  game_id: string;
  started_at: number;
  map: string;
  mode: string;
  game_type: string;
  result: string;
  score: number;
  grade: string;
  metrics: Record<string, number | null>;
}

// The server puts this install's API token in the page; writes must send it.
const TOKEN = document.querySelector<HTMLMetaElement>('meta[name="coach-token"]')?.content ?? "";

async function req<T>(method: string, url: string, body?: unknown): Promise<T> {
  const headers: Record<string, string> = {};
  if (body) headers["Content-Type"] = "application/json";
  if (TOKEN && method !== "GET") headers["X-Coach-Token"] = TOKEN;
  const res = await fetch(url, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((data as { error?: string }).error ?? `${res.status} ${res.statusText}`);
  return data as T;
}

export const api = {
  health: () => req<Health>("GET", "/api/health"),
  games: () => req<GameSummary[]>("GET", "/api/games"),
  game: (id: string) => req<{ summary: GameSummary; analysis: Analysis | null }>("GET", `/api/games/${id}`),
  map: (id: string) => req<MapData>("GET", `/api/games/${id}/map`),
  importGame: (game: string) => req<{ gameId: string }>("POST", "/api/games/import", { game }),
  importRecord: (record: unknown) => req<{ gameId: string }>("POST", "/api/games/import", { record }),
  reanalyze: (id: string) => req<{ gameId: string }>("POST", `/api/games/${id}/reanalyze`),
  remove: (id: string) => req<{ ok: boolean }>("DELETE", `/api/games/${id}`),
  sync: () => req<{ added: string[] }>("POST", "/api/sync"),
  settings: () => req<Settings>("GET", "/api/settings"),
  saveSettings: (s: Partial<Settings>) => req<Settings>("PUT", "/api/settings", s),
  trends: () => req<TrendRow[]>("GET", "/api/trends"),
  ask: (id: string, question: string) => req<{ answer: string }>("POST", `/api/games/${id}/ask`, { question }),
};

/** Live job updates from the server. */
export function onGameEvents(cb: (g: GameSummary) => void): () => void {
  const es = new EventSource("/api/events");
  es.addEventListener("game", (e) => cb(JSON.parse((e as MessageEvent).data)));
  return () => es.close();
}
