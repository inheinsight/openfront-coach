import { EventEmitter } from "node:events";
import { analyzeGame, findMe } from "../analysis/analyze.js";
import { judgeWithJev, jevAvailable } from "../ai/jev.js";
import { writeNarrative } from "../ai/narrator.js";
import { getGame, getSettings, listGames, saveAnalysis, setGameState, upsertGameRequest, dueJobs, type GameRow, type Identity } from "../db/db.js";
import { replayGame } from "../engine/replay.js";
import { UnsupportedEngineLayout } from "../engine/manager.js";
import { fetchGameRecord, fetchPlayerSessions, NotArchivedYet } from "../openfront/api.js";
import type { GameRecord } from "../openfront/types.js";

export const bus = new EventEmitter();
bus.setMaxListeners(100);

const ARCHIVE_GIVE_UP_MS = 8 * 60 * 60 * 1000;

function notify(gameId: string) {
  const row = getGame(gameId);
  if (!row) return;
  const { analysis_gz: _a, identity_json: _i, trend_json: _t, ...summary } = row;
  bus.emit("game", summary);
}

function update(gameId: string, patch: Partial<GameRow>) {
  setGameState(gameId, patch);
  notify(gameId);
}

/** Every identity we might be in this game: the job's, then the saved settings. */
function identities(row: GameRow): Identity[] {
  const job = JSON.parse(row.identity_json || "{}") as Identity;
  const s = getSettings();
  const out: Identity[] = [job];
  if (s.publicId) out.push({ publicId: s.publicId });
  for (const u of [...s.usernames].reverse()) out.push({ username: u });
  return out;
}

export function whoAmI(record: GameRecord, row: GameRow): Identity | null {
  for (const id of identities(row)) {
    const p = findMe(record, id);
    if (p) return { clientID: p.clientID, username: p.username, publicId: p.publicID ?? null };
  }
  return null;
}

async function processGame(row: GameRow) {
  const id = row.game_id;
  let record: GameRecord;
  try {
    update(id, { stage: "Fetching game record", status: row.status === "waiting_archive" ? "waiting_archive" : "replaying" });
    record = await fetchGameRecord(id);
  } catch (e) {
    if (e instanceof NotArchivedYet) {
      const waited = Date.now() - row.created_at;
      if (waited > ARCHIVE_GIVE_UP_MS) {
        update(id, { status: "error", error: "OpenFront never archived this game (it may have been abandoned before it started)." });
        return;
      }
      const delay = Math.min(120_000, 15_000 * 2 ** Math.min(3, row.attempts));
      update(id, { status: "waiting_archive", stage: "Waiting for the game to end and be archived", attempts: row.attempts + 1, next_check_at: Date.now() + delay });
      return;
    }
    throw e;
  }

  const me = whoAmI(record, row);
  if (!me) {
    update(id, {
      status: "error",
      error: `Couldn't find you among this game's players (${record.info.players.map((p) => p.username).slice(0, 12).join(", ")}). Add your OpenFront username in Settings and re-run.`,
    });
    return;
  }

  update(id, { status: "replaying", stage: "Fetching the OpenFront engine for this build", progress: 0, next_check_at: null });
  let replay = null;
  let note: string | null = null;
  try {
    const res = await replayGame(record, (p) => {
      if (p.stage === "simulate") update(id, { stage: "Re-simulating the game", progress: p.percent ?? 0 });
      else if (p.message) update(id, { stage: p.message });
    });
    replay = res.data;
    if (!res.exactBuild) note = `replayed with engine ${replay.meta.engineCommit.slice(0, 9)} instead of the game's own build; results after the first desync are approximate`;
    if (replay.meta.desync) note = `the replay drifted from the real game at ${Math.round(replay.meta.desync.tick / 10)}s; analysis after that point is approximate`;
  } catch (e) {
    note = e instanceof UnsupportedEngineLayout ? e.message : `replay failed (${(e instanceof Error ? e.message : String(e)).slice(0, 200)})`;
  }

  update(id, { status: "analyzing", stage: "Analyzing your decisions", progress: 100 });
  const analysis = analyzeGame(record, replay, me, note);

  const s = getSettings();
  if (s.useJev && jevAvailable() && analysis.depth === "replay") {
    update(id, { stage: "Asking Jev to judge your key moments" });
    analysis.ai.jev = await judgeWithJev(analysis);
  } else {
    analysis.ai.jev = { used: false, error: jevAvailable() ? "disabled in settings" : "TYPESAFE_API_KEY not set" };
  }
  if (s.useNarrator) {
    update(id, { stage: "Writing your debrief" });
    const { narrative, error } = await writeNarrative(analysis);
    analysis.narrative = narrative;
    analysis.ai.narrator = { used: narrative.provider !== "template", provider: narrative.provider, error };
  }
  saveAnalysis(id, analysis);
  notify(id);
}

let running = false;
async function tick() {
  if (running) return;
  const job = dueJobs()[0];
  if (!job) return;
  running = true;
  try {
    await processGame(job);
  } catch (e) {
    update(job.game_id, { status: "error", error: (e instanceof Error ? e.message : String(e)).slice(0, 500) });
  } finally {
    running = false;
  }
}

export function enqueue(gameId: string, source: string, identity: Identity, opts: { force?: boolean; waitForArchive?: boolean } = {}) {
  const row = upsertGameRequest(gameId, source, identity, opts);
  notify(gameId);
  setTimeout(() => void tick(), 50);
  return row;
}

/** Pull recent games from the OpenFront API for the configured public ID. */
export async function syncFromPublicId(limit = 15): Promise<{ added: string[] }> {
  const s = getSettings();
  if (!s.publicId) return { added: [] };
  const sessions = await fetchPlayerSessions(s.publicId);
  const known = new Set(listGames(1000).map((g) => g.game_id));
  const added: string[] = [];
  for (const sess of sessions.slice(0, limit)) {
    if (known.has(sess.gameId)) continue;
    enqueue(sess.gameId, "sync", { clientID: sess.clientId, publicId: s.publicId, username: sess.username });
    added.push(sess.gameId);
  }
  return { added };
}

export function startWorker() {
  // Jobs interrupted by a restart resume from the start.
  for (const j of dueJobs(Number.MAX_SAFE_INTEGER)) {
    if (j.status === "replaying" || j.status === "analyzing") setGameState(j.game_id, { status: "queued", next_check_at: null });
  }
  setInterval(() => void tick(), 3000);
  const sync = () => {
    if (getSettings().autoSync) syncFromPublicId(5).catch(() => {});
  };
  setTimeout(sync, 5000);
  setInterval(sync, 10 * 60 * 1000);
}
