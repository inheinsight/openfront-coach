// Dev helper: replay one archived game and print what the harness produced.
// Usage: npx tsx scripts/try-replay.ts <gameId>
import { fetchGameRecord } from "../src/openfront/api.js";
import { replayGame } from "../src/engine/replay.js";

const id = process.argv[2];
if (!id) throw new Error("usage: try-replay <gameId>");
const t0 = Date.now();
const rec = await fetchGameRecord(id);
let last = -10;
const res = await replayGame(rec, (p) => {
  if (p.stage !== "simulate" || (p.percent ?? 0) >= last + 10) {
    last = p.percent ?? last;
    console.log(`${((Date.now() - t0) / 1000).toFixed(1)}s`, p.stage, p.percent ?? "", p.message ?? "");
  }
});
const d = res.data;
console.log("exact build:", res.exactBuild);
console.log(JSON.stringify(d.meta, null, 1));
console.log(
  `players ${d.players.length}, samples ${d.samples.ticks.length}, attacks ${d.attacks.length}, ` +
    `actions ${d.actions.length}, events ${d.events.length}, frames ${d.frames.length}`,
);
