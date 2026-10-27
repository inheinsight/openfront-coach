// Dev helper: replay + analyze a few recent public games for a random human each.
import { analyzeGame } from "../src/analysis/analyze.js";
import { replayGame } from "../src/engine/replay.js";
import { fetchGameRecord, listGames } from "../src/openfront/api.js";

const end = new Date(Date.now() - 2 * 3600_000);
const start = new Date(end.getTime() - 3 * 3600_000);
const picks: string[] = [];
for (const mode of ["Team", "Free For All"]) {
  const games = await listGames({ start: start.toISOString(), end: end.toISOString(), type: "Public", mode, limit: 30 });
  picks.push(...games.filter((g) => g.numPlayers >= 6).slice(0, mode === "Team" ? 2 : 1).map((g) => g.game));
}
for (const id of picks) {
  const t0 = Date.now();
  try {
    const rec = await fetchGameRecord(id);
    const { data } = await replayGame(rec);
    const humans = rec.info.players.filter((p) => p.stats && Object.keys(p.stats).length);
    const p = humans[Math.floor(humans.length / 2)] ?? rec.info.players[0];
    const a = analyzeGame(rec, data, { clientID: p.clientID });
    console.log(`${id} ${rec.info.config.gameMode} ${rec.info.config.gameMap} ${rec.info.players.length}p desync=${data.meta.desync ? "YES" : "no"} hashes=${data.meta.hashesChecked} ${((Date.now() - t0) / 1000).toFixed(0)}s`);
    console.log(`   ${p.username}: ${a.overall.grade} ${a.me.result} #${a.me.placement}/${a.me.placementOf}, ${a.moments.length} moments, team=${a.me.team} — ${a.headline}`);
  } catch (e) {
    console.log(`${id} FAILED: ${(e as Error).stack?.slice(0, 600)}`);
  }
}
