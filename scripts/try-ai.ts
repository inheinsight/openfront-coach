// Dev helper: analysis + Jev + narrator for one game/player.
// Usage: npx tsx scripts/try-ai.ts <gameId> <username>
import { analyzeGame } from "../src/analysis/analyze.js";
import { replayGame } from "../src/engine/replay.js";
import { fetchGameRecord } from "../src/openfront/api.js";
import { judgeWithJev } from "../src/ai/jev.js";
import { writeNarrative } from "../src/ai/narrator.js";

const [id, username] = process.argv.slice(2);
const rec = await fetchGameRecord(id);
const { data } = await replayGame(rec);
const a = analyzeGame(rec, data, { username });
const t0 = Date.now();
a.ai.jev = await judgeWithJev(a);
console.log("jev", JSON.stringify(a.ai.jev), `${Date.now() - t0}ms`);
for (const m of a.moments.filter((m) => m.jev)) console.log(" ", m.title, "| rules→final", m.severity, "| jev", JSON.stringify(m.jev), "avoidable", m.evidence.jevAvoidable, "lesson", m.evidence.jevLesson);
const t1 = Date.now();
const { narrative, error } = await writeNarrative(a);
console.log("narrator", narrative.provider, narrative.model, error ?? "", `${Date.now() - t1}ms`);
console.log(narrative.text);
