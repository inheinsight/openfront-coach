// Fallback analysis from the game record alone (no re-simulation): end-of-game
// stats for every player plus each player's intents with their tick. Used
// when the build that played the game can't be replayed.
import type { GameRecord, PlayerRecord } from "../openfront/types.js";
import { median } from "./metrics.js";
import { clock, fmtNum, pct, TICKS_PER_SECOND } from "./rules.js";
import { grade } from "./scoring.js";
import type { Analysis, CategoryScore, KeyMoment, MetricLine } from "./types.js";

const big = (v: string | undefined | null) => (v === undefined || v === null ? 0 : Number(v));
const at = (arr: string[] | undefined, i: number) => big(arr?.[i]);

interface Flat {
  p: PlayerRecord;
  goldTotal: number;
  tradeGold: number;
  peakTiles: number;
  finalTiles: number;
  drawdown: number;
  troopsSent: number;
  conquests: number;
  cities: number;
  firstCityTick: number | null;
  firstAttackTick: number | null;
  actions: number;
  retreats: number;
  boatsSent: number;
  boatsArrived: number;
  alliances: number;
  betrayals: number;
  nukesLaunched: number;
  nukesLanded: number;
  killedAt: number | null;
  peakTroops: number;
}

function flatten(record: GameRecord, p: PlayerRecord, spawnEnd: number): Flat {
  const s = p.stats ?? {};
  const intents = record.turns.flatMap((t) => t.intents.filter((i) => i.clientID === p.clientID).map((i) => ({ ...i, tick: t.turnNumber })));
  const firstCity = intents.find((i) => i.type === "build_unit" && (i as { unit?: unknown }).unit === "City");
  const firstAttack = intents.find((i) => (i.type === "attack" || i.type === "boat") && i.tick >= spawnEnd - 5);
  const peak = at(s.tiles, 0);
  return {
    p,
    goldTotal: (s.gold ?? []).reduce((a, b) => a + big(b), 0),
    tradeGold: at(s.gold, 2),
    peakTiles: peak,
    finalTiles: big(s.finalTiles),
    drawdown: at(s.tiles, 1) > 0 ? (at(s.tiles, 1) - at(s.tiles, 2)) / at(s.tiles, 1) : 0,
    troopsSent: at(s.attacks, 0),
    conquests: (s.conquests ?? []).reduce((a, b) => a + big(b), 0),
    cities: at(s.units?.city, 0),
    firstCityTick: firstCity?.tick ?? null,
    firstAttackTick: firstAttack?.tick ?? null,
    actions: intents.filter((i) => i.type !== "mark_disconnected").length,
    retreats: intents.filter((i) => i.type === "cancel_attack").length,
    boatsSent: at(s.boats?.trans, 0),
    boatsArrived: at(s.boats?.trans, 1),
    alliances: at(s.alliances, 0),
    betrayals: big(s.betrayals),
    nukesLaunched: at(s.bombs?.abomb, 0) + at(s.bombs?.hbomb, 0) + at(s.bombs?.mirv, 0),
    nukesLanded: at(s.bombs?.abomb, 1) + at(s.bombs?.hbomb, 1) + at(s.bombs?.mirv, 1),
    killedAt: s.killedAt ? big(s.killedAt) : null,
    peakTroops: big(s.peakTroops),
  };
}

export function analyzeStatsOnly(record: GameRecord, meRec: PlayerRecord, note: string | null): Analysis {
  const cfg = record.info.config;
  const spawnEnd = cfg.gameType === "Singleplayer" ? 100 : cfg.randomSpawn ? 150 : 200;
  const flats = record.info.players.map((p) => flatten(record, p, spawnEnd));
  const me = flats.find((f) => f.p.clientID === meRec.clientID)!;
  const others = flats.filter((f) => f !== me);
  const durationTicks = record.info.num_turns;
  const minutes = Math.max(1, ((me.killedAt ?? durationTicks) - spawnEnd) / TICKS_PER_SECOND / 60);

  const lineFor = (key: string, label: string, get: (f: Flat) => number | null, fmt: (v: number) => string, higher: boolean): MetricLine & { score: number | null } => {
    const v = get(me);
    const vals = others.map(get).filter((x): x is number => x !== null);
    let pctile: number | null = null;
    if (v !== null && vals.length >= 3) pctile = Math.round((vals.filter((o) => (higher ? o < v : o > v)).length / vals.length) * 100);
    const all = [v, ...vals].filter((x): x is number => x !== null);
    const best = all.length ? (higher ? Math.max(...all) : Math.min(...all)) : null;
    const med = median(all);
    return {
      key,
      label,
      value: v,
      display: v === null ? "—" : fmt(v),
      best,
      bestDisplay: best === null ? undefined : fmt(best),
      median: med,
      medianDisplay: med === null ? undefined : fmt(med),
      percentile: pctile,
      higherIsBetter: higher,
      score: pctile,
    };
  };

  const cats: { key: CategoryScore["key"]; label: string; lines: (MetricLine & { score: number | null })[] }[] = [
    {
      key: "expansion",
      label: "Expansion",
      lines: [
        lineFor("peakTiles", "Peak territory (tiles)", (f) => f.peakTiles, fmtNum, true),
        lineFor("firstAttack", "First expansion after spawn", (f) => (f.firstAttackTick === null ? null : (f.firstAttackTick - spawnEnd) / TICKS_PER_SECOND), (v) => `${v.toFixed(0)}s`, false),
      ],
    },
    {
      key: "economy",
      label: "Economy",
      lines: [
        lineFor("goldPerMin", "Gold earned per minute", (f) => f.goldTotal / Math.max(1, ((f.killedAt ?? durationTicks) - spawnEnd) / 600), fmtNum, true),
        lineFor("firstCity", "First City after spawn", (f) => (f.firstCityTick === null ? null : (f.firstCityTick - spawnEnd) / TICKS_PER_SECOND), (v) => clock(v * TICKS_PER_SECOND), false),
        lineFor("tradeGold", "Trade gold", (f) => f.tradeGold, fmtNum, true),
      ],
    },
    {
      key: "combat",
      label: "Combat",
      lines: [
        lineFor("conquests", "Players eliminated", (f) => f.conquests, String, true),
        lineFor("retreats", "Retreats", (f) => f.retreats, String, false),
        lineFor("peakTroops", "Peak army", (f) => f.peakTroops, fmtNum, true),
      ],
    },
    {
      key: "defense",
      label: "Defense & survival",
      lines: [lineFor("drawdown", "Worst territory collapse", (f) => f.drawdown, (v) => pct(v), false)],
    },
  ];
  const categories: CategoryScore[] = cats
    .map((c) => {
      const scored = c.lines.filter((l) => l.score !== null);
      const score = scored.length ? Math.round(scored.reduce((a, l) => a + (l.score as number), 0) / scored.length) : 50;
      return {
        key: c.key,
        label: c.label,
        score,
        grade: grade(score),
        summary: scored.length ? `Ranked against the other ${others.length} humans in this game.` : "Not enough other humans to compare against.",
        metrics: c.lines.map(({ score: _s, ...rest }) => rest),
      };
    });
  const overall = Math.round(categories.reduce((a, c) => a + c.score, 0) / categories.length);

  const moments: KeyMoment[] = [];
  let n = 0;
  if (me.firstCityTick === null && minutes > 4)
    moments.push({ id: `s${++n}`, tick: spawnEnd + 1800, kind: "economy", severity: "mistake", title: "Never built a City", detail: "Cities add 250k troop cap per level — the best early investment.", evidence: {} });
  if (me.retreats > 0)
    moments.push({ id: `s${++n}`, tick: spawnEnd, kind: "attack", severity: "inaccuracy", title: `${me.retreats} retreat${me.retreats > 1 ? "s" : ""}`, detail: "Retreating from a player forfeits 25% of the surviving troops.", evidence: { retreats: me.retreats } });
  if (me.boatsSent >= 3 && me.boatsArrived / me.boatsSent < 0.6)
    moments.push({ id: `s${++n}`, tick: spawnEnd, kind: "naval", severity: "inaccuracy", title: `${me.boatsSent - me.boatsArrived} transports never landed`, detail: "Sunk transports lose every troop on board.", evidence: {} });

  const w = record.info.winner;
  const won = !!w && ((w[0] === "player" && w[1] === meRec.clientID) || (w[0] === "team" && w.includes(meRec.clientID)));
  const result: Analysis["me"]["result"] = won ? "victory" : me.killedAt !== null ? "eliminated" : w ? "defeat" : "survived";
  return {
    analysisVersion: 1,
    gameId: record.info.gameID,
    analyzedAt: new Date().toISOString(),
    depth: "stats",
    replayNote: note,
    game: {
      map: cfg.gameMap,
      mapSize: cfg.gameMapSize ?? "Normal",
      mode: cfg.gameMode,
      type: cfg.gameType,
      difficulty: cfg.difficulty,
      durationTicks,
      startedAt: record.info.start,
      endedAt: record.info.end,
      gitCommit: record.gitCommit,
      humans: record.info.players.length,
      nations: 0,
      bots: cfg.bots ?? 0,
      winner: w ? (w[0] === "player" ? record.info.players.find((p) => p.clientID === w[1])?.username ?? w[1] : w[1]) : null,
      teams: null,
    },
    me: {
      clientID: meRec.clientID,
      name: meRec.username,
      smallID: null,
      team: null,
      result,
      placement: null,
      placementOf: record.info.players.length,
      eliminatedTick: me.killedAt,
      finalLandShare: 0,
      peakLandShare: 0,
    },
    headline: `${result === "victory" ? "Victory" : result === "eliminated" ? `Eliminated at ${clock(me.killedAt ?? 0)}` : "Game over"} on ${cfg.gameMap}. (Stats-only analysis: ${note ?? "no replay available"}.)`,
    overall: { score: overall, grade: grade(overall) },
    categories,
    keyNumbers: categories.flatMap((c) => c.metrics).slice(0, 6),
    moments,
    attacks: [],
    builds: [],
    strengths: categories.filter((c) => c.score >= 70).map((c) => `${c.label} (${c.grade})`),
    weaknesses: categories.filter((c) => c.score < 50).map((c) => `${c.label} (${c.grade})`),
    drills: [],
    phases: [],
    timeline: null,
    leaderboard: [],
    narrative: null,
    ai: { jev: { used: false }, narrator: { used: false } },
    trendMetrics: { overall, ...Object.fromEntries(categories.map((c) => [`cat.${c.key}`, c.score])), won: won ? 1 : 0 },
  };
}
