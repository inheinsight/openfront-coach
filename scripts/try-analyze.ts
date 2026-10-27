// Dev helper: analyze a replayed game for one player and print the report.
// Usage: npx tsx scripts/try-analyze.ts <gameId> <username>
import { analyzeGame } from "../src/analysis/analyze.js";
import { replayGame } from "../src/engine/replay.js";
import { fetchGameRecord } from "../src/openfront/api.js";
import { clock } from "../src/analysis/rules.js";

const [id, username] = process.argv.slice(2);
const rec = await fetchGameRecord(id);
const { data } = await replayGame(rec);
const a = analyzeGame(rec, data, { username });
console.log(a.headline);
console.log("overall", a.overall, "result", a.me.result, "placement", a.me.placement, "/", a.me.placementOf);
for (const c of a.categories) console.log(` ${c.label.padEnd(20)} ${String(c.score).padStart(3)} ${c.grade.padEnd(2)} ${c.summary}`);
console.log("key numbers:", a.keyNumbers.map((k) => `${k.label}=${k.display} (med ${k.medianDisplay ?? "-"})`).join(" | "));
for (const m of a.moments) console.log(` [${clock(m.tick)}] ${m.severity.toUpperCase().padEnd(10)} ${m.title} — ${m.detail}${m.suggestion ? "  → " + m.suggestion : ""}`);
console.log("phases:", a.phases.map((p) => `${p.name} ${p.grade}: ${p.note}`).join(" | "));
console.log("strengths:", a.strengths);
console.log("weaknesses:", a.weaknesses);
for (const d of a.drills) console.log(" DRILL", d.title, "—", d.how, "GOAL:", d.goal);
console.log("attacks:", a.attacks.length, "builds:", a.builds.length, "leaderboard top3:", a.leaderboard.slice(0, 3).map((l) => l.name));
