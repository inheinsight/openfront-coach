// Dev helper: check that the coaching rules separate winners from everyone else.
// Re-runs the analysis for every human in every cached game (as if each were
// the player), then compares how often each key moment and drill fires on each
// lobby's top five (by peak land) against the rest. A rule that fires on the
// top five as often as on the rest measures activity or wealth, not mistakes.
// Reads only: records and cached replays under DATA_DIR (default ./data).
// Usage: npx tsx scripts/rule-audit.ts [--team | --ffa]
import fs from "node:fs";
import path from "node:path";
import { analyzeGame } from "../src/analysis/analyze.js";
import { playModeOf } from "../src/analysis/mode.js";
import { config } from "../src/config.js";
import { loadAnyReplay } from "../src/engine/replay.js";
import type { GameRecord } from "../src/openfront/types.js";

const only = process.argv.includes("--team") ? "team" : process.argv.includes("--ffa") ? "ffa" : null;

/** Collapse a moment title to its rule: drop numbers and anything naming a player. */
function ruleOf(title: string): string {
  const fixed: [RegExp, string][] = [
    [/^Counter-attacked /, "Counter-attacked a bigger push"],
    [/^You betrayed /, "You betrayed an ally"],
    [/ broke your alliance$/, "An ally broke your alliance"],
    [/attacks? on .* went badly$/i, "Attack(s) on a player went badly"],
    [/^(Naval attack|Attack) on .* went badly$/, "Attack(s) on a player went badly"],
  ];
  for (const [re, name] of fixed) if (re.test(title)) return name;
  const m = title.match(/^Fix this: (.*)$/);
  if (m) return `Fix this: ${ruleOf(m[1])}`;
  return title
    .replace(/ (on|by|from|after|with|in) .*$/, "")
    .replace(/[\d][\d.,:]*\s*(%|s|k|M|×)?/g, "N")
    .trim();
}

const fire = new Map<string, { top: number; rest: number }>();
let topN = 0;
let restN = 0;
let games = 0;

for (const f of fs.readdirSync(config.recordsDir).filter((f) => f.endsWith(".json"))) {
  const record = JSON.parse(fs.readFileSync(path.join(config.recordsDir, f), "utf8")) as GameRecord;
  if (record.info.config.gameType !== "Public") continue;
  const mode = playModeOf(record);
  if (only === "team" && !mode.teammates) continue;
  if (only === "ffa" && mode.teammates) continue;
  const replay = loadAnyReplay(record.info.gameID);
  if (!replay || replay.meta.desync || replay.meta.stoppedEarly || replay.meta.engineCommit !== record.gitCommit) continue;
  games++;
  const peak = (sid: number) => Math.max(0, ...(replay.samples.series[String(sid)]?.tiles ?? [0]));
  const humans = replay.players.filter((p) => p.type === "Human" && p.clientID && peak(p.smallID) > 0);
  const top = new Set([...humans].sort((a, b) => peak(b.smallID) - peak(a.smallID)).slice(0, 5).map((p) => p.clientID));
  for (const h of humans) {
    let a;
    try {
      a = analyzeGame(record, replay, { clientID: h.clientID });
    } catch {
      continue;
    }
    if (a.depth !== "replay") continue;
    const isTop = top.has(h.clientID);
    if (isTop) topN++;
    else restN++;
    const rules = new Set([...a.moments.filter((m) => m.severity !== "good" && m.severity !== "brilliant" && m.severity !== "info").map((m) => ruleOf(m.title)), ...a.drills.map((d) => `drill: ${d.title}`)]);
    for (const r of rules) {
      const e = fire.get(r) ?? { top: 0, rest: 0 };
      if (isTop) e.top++;
      else e.rest++;
      fire.set(r, e);
    }
  }
}

console.log(`${games} games, ${topN} top-five player-games, ${restN} others${only ? ` (${only} only)` : ""}\n`);
console.log("rule".padEnd(62), "top 5".padStart(7), "rest".padStart(7), "  verdict");
for (const [rule, e] of [...fire.entries()].sort((a, b) => b[1].rest + b[1].top - (a[1].rest + a[1].top))) {
  const t = e.top / Math.max(1, topN);
  const r = e.rest / Math.max(1, restN);
  const verdict = e.top + e.rest < 5 ? "too rare" : t >= r ? "FIRES ON WINNERS" : t < r * 0.6 ? "separates" : "weak";
  console.log(rule.slice(0, 61).padEnd(62), `${(t * 100).toFixed(0)}%`.padStart(7), `${(r * 100).toFixed(0)}%`.padStart(7), " ", verdict);
}
