// Re-run the analysis for finished games from their cached records and
// replays, keeping each game's written debrief and Jev verdicts. Use it after
// the analysis changes, instead of re-analyzing every game from the dashboard.
// Usage: npx tsx scripts/reanalyze.ts [gameId ...]   (no IDs: every game)
// It reads ./data, or DATA_DIR; a git worktree has its own ./data.
import fs from "node:fs";
import { analyzeGame } from "../src/analysis/analyze.js";
import { config } from "../src/config.js";
import { getGame, listGames, loadAnalysis, saveAnalysis } from "../src/db/db.js";
import { loadAnyReplay } from "../src/engine/replay.js";
import { whoAmI } from "../src/jobs/pipeline.js";
import { fetchGameRecord } from "../src/openfront/api.js";

const hint = "Set DATA_DIR to your coach's data folder, e.g. DATA_DIR=~/openFrontCoach/data npx tsx scripts/reanalyze.ts";
if (!fs.existsSync(config.dbPath)) {
  console.log(`No coach database at ${config.dbPath}. ${hint}`);
  process.exit(1);
}
const ids = process.argv.slice(2);
const games = ids.length ? ids : listGames(1000).filter((g) => g.status === "done").map((g) => g.game_id);
if (!games.length) {
  console.log(`No finished games in ${config.dbPath}. ${hint}`);
  process.exit(1);
}
console.log(`Re-analysing ${games.length} game${games.length === 1 ? "" : "s"} in ${config.dbPath}`);
for (const id of games) {
  const row = getGame(id);
  const old = loadAnalysis(id);
  const replay = loadAnyReplay(id);
  if (!row || (!old && !replay)) {
    console.log(`${id}: skipped (no analysis or cached replay yet)`);
    continue;
  }
  try {
    const record = await fetchGameRecord(id);
    const me = whoAmI(record, row);
    if (!me) throw new Error("couldn't find you in this game");
    const a = analyzeGame(record, replay, me, old?.replayNote ?? null);
    if (old) {
      a.narrative = old.narrative;
      a.ai = old.ai;
    }
    saveAnalysis(id, a);
    console.log(`${id}: ${a.game.map}, ${a.troops?.lesson ? `lesson: ${a.troops.lesson.rule}` : "no troop lesson"}`);
  } catch (e) {
    console.log(`${id}: failed (${e instanceof Error ? e.message : String(e)})`);
  }
}
