import type { PlayerMetrics } from "./metrics.js";
import { median } from "./metrics.js";
import { ReplayView } from "./replayView.js";
import { clock, fmtNum, pct, TICKS_PER_SECOND } from "./rules.js";
import type { AttackLedgerRow, CategoryScore, Drill, KeyMoment, MetricLine } from "./types.js";

/** Piecewise-linear map from a raw value to 0-100 through (x, score) points. */
function curve(x: number | null, pts: [number, number][]): number | null {
  if (x === null || !Number.isFinite(x)) return null;
  if (x <= pts[0][0]) return pts[0][1];
  for (let i = 1; i < pts.length; i++) {
    const [x0, y0] = pts[i - 1];
    const [x1, y1] = pts[i];
    if (x <= x1) return y0 + ((x - x0) / (x1 - x0)) * (y1 - y0);
  }
  return pts[pts.length - 1][1];
}

export function grade(score: number): string {
  if (score >= 92) return "A+";
  if (score >= 85) return "A";
  if (score >= 78) return "B+";
  if (score >= 70) return "B";
  if (score >= 62) return "C+";
  if (score >= 55) return "C";
  if (score >= 45) return "D";
  return "F";
}

interface MetricDef {
  key: string;
  label: string;
  get: (m: PlayerMetrics) => number | null;
  fmt: (v: number) => string;
  higherIsBetter: boolean;
  absolute?: [number, number][];
  hint?: string;
  weight?: number;
}

function percentileOf(value: number, others: number[], higher: boolean): number {
  if (!others.length) return 50;
  let worse = 0;
  let equal = 0;
  for (const o of others) {
    if (o === value) equal++;
    else if (higher ? o < value : o > value) worse++;
  }
  return Math.round(((worse + equal * 0.5) / others.length) * 100);
}

function line(def: MetricDef, me: PlayerMetrics, all: PlayerMetrics[]): MetricLine & { score: number | null } {
  const v = def.get(me);
  const vals = all.map((m) => def.get(m)).filter((x): x is number => x !== null && Number.isFinite(x));
  const others = all.filter((m) => m.smallID !== me.smallID).map((m) => def.get(m)).filter((x): x is number => x !== null && Number.isFinite(x));
  const best = vals.length ? (def.higherIsBetter ? Math.max(...vals) : Math.min(...vals)) : null;
  const med = median(vals);
  const pctile = v !== null && others.length >= 3 ? percentileOf(v, others, def.higherIsBetter) : null;
  const abs = def.absolute ? curve(v, def.absolute) : null;
  let score: number | null = null;
  if (v !== null) {
    if (pctile !== null && abs !== null) score = 0.55 * pctile + 0.45 * abs;
    else score = abs ?? pctile;
  }
  return {
    key: def.key,
    label: def.label,
    value: v,
    display: v === null ? "—" : def.fmt(v),
    best,
    bestDisplay: best === null ? undefined : def.fmt(best),
    median: med,
    medianDisplay: med === null ? undefined : def.fmt(med),
    percentile: pctile,
    higherIsBetter: def.higherIsBetter,
    hint: def.hint,
    score: score === null ? null : Math.round(score),
  };
}

const lcFirst = (s: string) => (/^[A-Z][a-z]/.test(s) ? s.charAt(0).toLowerCase() + s.slice(1) : s);
const share = (v: number) => pct(v, v < 0.01 ? 2 : 1);
const secs = (v: number) => clock(v * TICKS_PER_SECOND);

export function scoreGame(view: ReplayView, me: PlayerMetrics, all: PlayerMetrics[], ledger: AttackLedgerRow[]) {
  // Land share relative to the median tracked player (humans + nations),
  // so the scale works for 1-human single-player games and 50-player lobbies.
  const tracked = view.trackedPlayers();
  const relShare = (m: PlayerMetrics, sec: number) => {
    const v = m.landShareAt[String(sec)];
    if (v === null || v === undefined) return null;
    const t = m.spawnPhaseEndTick + sec * TICKS_PER_SECOND;
    const meds = median(tracked.map((p) => view.valueAt(p.smallID, "tiles", t) / view.landTiles).filter((x) => x > 0));
    return meds ? v / meds : null;
  };
  const relCurve: [number, number][] = [
    [0.25, 10],
    [0.5, 35],
    [1, 60],
    [2, 82],
    [3.5, 100],
  ];
  const attackEff = (m: PlayerMetrics) => {
    const rows = m.smallID === me.smallID ? ledger : null;
    const list = (rows ?? view.data.attacks.filter((a) => a.attacker === m.smallID).map((a) => {
      const used = Math.max(0, a.troops - (a.lastTroops ?? 0));
      const gain = Math.max(0, Math.min((a.attackerTilesEnd ?? a.attackerTilesStart) - a.attackerTilesStart, a.target ? a.targetTilesStart - (a.targetTilesEnd ?? a.targetTilesStart) : Infinity));
      return { targetType: a.targetType, tilesPer1kTroops: used > 0 ? (gain / used) * 1000 : null };
    })).filter((r) => (r.targetType === "Human" || r.targetType === "Nation") && r.tilesPer1kTroops !== null);
    return list.length >= 2 ? median(list.map((r) => r.tilesPer1kTroops as number)) : null;
  };
  const incomePerMin = (m: PlayerMetrics) => m.goldEarned / Math.max(1, m.lifeTicks / TICKS_PER_SECOND / 60);
  const survival = (m: PlayerMetrics) => (m.alive ? 1 : m.lifeTicks / Math.max(1, view.data.meta.ticks - m.spawnPhaseEndTick));

  const defs: Record<CategoryScore["key"], { label: string; metrics: MetricDef[] }> = {
    expansion: {
      label: "Expansion",
      metrics: [
        { key: "share60", label: "Land at 1:00 vs typical player", get: (m) => relShare(m, 60), fmt: (v) => `${v.toFixed(2)}×`, higherIsBetter: true, absolute: relCurve, hint: "Your land share 1 minute after spawn, divided by the median player's." },
        { key: "share120", label: "Land at 2:00 vs typical player", get: (m) => relShare(m, 120), fmt: (v) => `${v.toFixed(2)}×`, higherIsBetter: true, absolute: relCurve, weight: 1.5 },
        { key: "share300", label: "Land at 5:00 vs typical player", get: (m) => relShare(m, 300), fmt: (v) => `${v.toFixed(2)}×`, higherIsBetter: true, absolute: relCurve, weight: 1.5 },
        { key: "peakShare", label: "Peak share of the map", get: (m) => m.peakLandShare, fmt: share, higherIsBetter: true, absolute: [[0.005, 20], [0.02, 45], [0.05, 65], [0.15, 85], [0.4, 100]], weight: 1.5 },
      ],
    },
    economy: {
      label: "Economy",
      metrics: [
        { key: "goldPerMin", label: "Gold income per minute", get: incomePerMin, fmt: fmtNum, higherIsBetter: true, absolute: [[60_000, 35], [120_000, 60], [250_000, 80], [500_000, 100]], hint: "Base income is 60k/min; trade, trains and conquest add the rest.", weight: 1.5 },
        { key: "firstCity", label: "First City after spawn", get: (m) => (m.firstCityTick === null ? (m.lifeTicks > 2400 ? 9999 : null) : (m.firstCityTick - m.spawnPhaseEndTick) / TICKS_PER_SECOND), fmt: (v) => (v >= 9999 ? "never" : secs(v)), higherIsBetter: false, absolute: [[90, 100], [150, 85], [240, 60], [360, 35], [9999, 5]] },
        { key: "float", label: "Gold sitting unspent", get: (m) => m.floatMinutes, fmt: (v) => `${v.toFixed(1)} min of income`, higherIsBetter: false, absolute: [[1, 100], [2, 85], [4, 60], [8, 30], [15, 10]], hint: "Average gold held, in minutes of your own income. Like StarCraft's spending quotient: lower is better." },
        { key: "tradeShare", label: "Gold from trade and trains", get: (m) => (m.goldEarned > 0 ? (m.goldBySource.trade + m.goldBySource.trainSelf + m.goldBySource.trainOther) / m.goldEarned : null), fmt: (v) => pct(v), higherIsBetter: true, absolute: [[0, 30], [0.2, 60], [0.5, 85], [0.7, 100]], weight: 0.75 },
      ],
    },
    troops: {
      label: "Troop management",
      metrics: [
        { key: "troopEff", label: "Troop growth efficiency", get: (m) => m.troopEfficiency, fmt: (v) => pct(v), higherIsBetter: true, absolute: [[0.4, 25], [0.6, 50], [0.75, 72], [0.85, 88], [0.93, 100]], hint: "Average regen as a share of the maximum possible regen (troops at ~42% of cap).", weight: 2 },
        { key: "atCap", label: "Time with troops at the cap", get: (m) => m.timeAtCapPct, fmt: (v) => pct(v), higherIsBetter: false, absolute: [[0, 100], [0.08, 80], [0.2, 55], [0.4, 25]], hint: "Troop growth stops at the cap." },
        { key: "overextended", label: "Time nearly empty (<15% of cap)", get: (m) => m.timeOverextendedPct, fmt: (v) => pct(v), higherIsBetter: false, absolute: [[0, 100], [0.05, 80], [0.15, 50], [0.3, 20]] },
      ],
    },
    combat: {
      label: "Combat",
      metrics: [
        { key: "attackEff", label: "Tiles taken per 1k troops (vs players)", get: attackEff, fmt: (v) => v.toFixed(1), higherIsBetter: true, absolute: [[1, 20], [3, 45], [8, 70], [20, 95]], weight: 1.5 },
        { key: "fullSends", label: "Mid-game full sends at players", get: (m) => m.fullSends, fmt: (v) => String(v), higherIsBetter: false, absolute: [[0, 100], [1, 80], [3, 50], [6, 20]] },
        { key: "retreats", label: "Retreats", get: (m) => m.retreats, fmt: (v) => String(v), higherIsBetter: false, absolute: [[0, 100], [1, 85], [3, 60], [6, 30]] },
        { key: "conquests", label: "Players eliminated", get: (m) => m.conquests, fmt: (v) => String(v), higherIsBetter: true, absolute: [[0, 40], [2, 65], [5, 85], [10, 100]] },
      ],
    },
    defense: {
      label: "Defense & survival",
      metrics: [
        { key: "drawdown", label: "Worst territory collapse", get: (m) => m.maxDrawdown, fmt: (v) => pct(v), higherIsBetter: false, absolute: [[0.1, 100], [0.25, 80], [0.5, 50], [0.8, 20], [1, 5]], weight: 1.5 },
        { key: "survival", label: "Share of the game survived", get: survival, fmt: (v) => pct(v), higherIsBetter: true, absolute: [[0.2, 10], [0.5, 40], [0.8, 70], [1, 100]], weight: 1.5 },
        { key: "structuresLost", label: "Structures lost", get: (m) => m.structuresLost, fmt: (v) => String(v), higherIsBetter: false, absolute: [[0, 100], [2, 80], [6, 50], [15, 20]], weight: 0.5 },
      ],
    },
    diplomacy: {
      label: "Diplomacy",
      metrics: [
        { key: "alliances", label: "Alliances formed", get: (m) => m.alliancesFormed, fmt: (v) => String(v), higherIsBetter: true, absolute: [[0, 40], [1, 65], [3, 85], [6, 100]] },
        { key: "betrayedBy", label: "Times betrayed", get: (m) => m.alliancesBrokenByOthers, fmt: (v) => String(v), higherIsBetter: false, absolute: [[0, 100], [1, 70], [3, 40]], weight: 0.5 },
      ],
    },
    naval: {
      label: "Naval",
      metrics: [
        { key: "boatSuccess", label: "Transports that landed", get: (m) => (m.boatsSent > 0 ? m.boatsArrived / m.boatsSent : null), fmt: (v) => pct(v), higherIsBetter: true, absolute: [[0.3, 20], [0.6, 55], [0.85, 85], [1, 100]] },
        { key: "tradeGold", label: "Trade-ship gold", get: (m) => m.tradeGold, fmt: fmtNum, higherIsBetter: true, absolute: [[0, 30], [500_000, 60], [3_000_000, 85], [10_000_000, 100]] },
      ],
    },
    nuclear: {
      label: "Nuclear",
      metrics: [
        { key: "nukeHitRate", label: "Your nukes that landed", get: (m) => (m.nukesLaunched > 0 ? m.nukesLanded / m.nukesLaunched : null), fmt: (v) => pct(v), higherIsBetter: true, absolute: [[0.2, 20], [0.5, 50], [0.8, 85], [1, 100]] },
        { key: "nukesTaken", label: "Nukes launched at you", get: (m) => m.nukesReceived, fmt: (v) => String(v), higherIsBetter: false, absolute: [[0, 100], [2, 70], [5, 40], [10, 15]] },
      ],
    },
  };

  const relevant = (key: string) => {
    if (key === "naval") return all.some((m) => m.boatsSent > 0 || m.tradeGold > 0);
    if (key === "nuclear") return me.nukesLaunched > 0 || me.nukesReceived > 0;
    if (key === "combat") return me.attacksVsPlayers > 0;
    return true;
  };

  const categories: CategoryScore[] = [];
  const allLines: (MetricLine & { score: number | null })[] = [];
  for (const [key, def] of Object.entries(defs) as [CategoryScore["key"], (typeof defs)[CategoryScore["key"]]][]) {
    if (!relevant(key)) continue;
    const lines = def.metrics.map((d) => ({ d, l: line(d, me, all) }));
    const scored = lines.filter((x) => x.l.score !== null);
    if (!scored.length) continue;
    const wsum = scored.reduce((a, x) => a + (x.d.weight ?? 1), 0);
    const score = Math.round(scored.reduce((a, x) => a + (x.l.score as number) * (x.d.weight ?? 1), 0) / wsum);
    allLines.push(...lines.map((x) => x.l));
    const best = [...scored].sort((a, b) => (b.l.score as number) - (a.l.score as number))[0];
    const worst = [...scored].sort((a, b) => (a.l.score as number) - (b.l.score as number))[0];
    categories.push({
      key,
      label: def.label,
      score,
      grade: grade(score),
      summary:
        score >= 75
          ? `Strong: ${lcFirst(best.l.label)} was ${best.l.display}.`
          : score >= 55
            ? `Solid, with room to improve ${lcFirst(worst.l.label)} (${worst.l.display}).`
            : `Weak spot: ${lcFirst(worst.l.label)} was ${worst.l.display}.`,
      metrics: lines.map(({ l }) => {
        const { score: _s, ...rest } = l;
        return rest;
      }),
    });
  }

  const weights: Record<string, number> = { expansion: 1.3, economy: 1.1, troops: 1.2, combat: 0.9, defense: 1.1, diplomacy: 0.4, naval: 0.5, nuclear: 0.5 };
  const wsum = categories.reduce((a, c) => a + (weights[c.key] ?? 1), 0);
  let overall = categories.reduce((a, c) => a + c.score * (weights[c.key] ?? 1), 0) / Math.max(1, wsum);
  return { categories, overall: Math.round(overall), lines: allLines };
}

/** Turn scores and moments into strengths, weaknesses and drills. */
export function coach(categories: CategoryScore[], moments: KeyMoment[], me: PlayerMetrics) {
  const lines = categories.flatMap((c) => c.metrics.map((m) => ({ c, m })));
  const scoreOf = (key: string) => categories.find((c) => c.metrics.some((m) => m.key === key));
  const strengths: string[] = [];
  const weaknesses: string[] = [];
  for (const c of [...categories].sort((a, b) => b.score - a.score)) {
    if (c.key === "nuclear" && me.nukesLaunched === 0) continue;
    if (c.score >= 72 && strengths.length < 3) strengths.push(`${c.label} (${c.grade}): ${c.summary.replace(/^Strong: /, "")}`);
  }
  for (const c of [...categories].sort((a, b) => a.score - b.score)) {
    if (c.score < 60 && weaknesses.length < 3) weaknesses.push(`${c.label} (${c.grade}): ${c.summary.replace(/^Weak spot: /, "")}`);
  }

  const drills: Drill[] = [];
  const val = (k: string) => lines.find((x) => x.m.key === k)?.m.value ?? null;
  const add = (d: Drill) => {
    if (drills.length < 3 && !drills.some((x) => x.metricKey === d.metricKey)) drills.push(d);
  };
  const ordered = [...categories].sort((a, b) => a.score - b.score);
  for (const c of ordered) {
    if (c.key === "troops" && c.score < 75) {
      const atCap = val("atCap");
      add({
        title: "Keep the troop bar between 40% and 60%",
        why: `Your troops grew at ${pct(val("troopEff") ?? 0)} of the best possible rate${atCap !== null ? ` and sat at the cap ${pct(atCap)} of the time` : ""}. Regen peaks at about 42% of the cap and stops at 100%.`,
        how: "Play a single-player game on Easy. Whenever the troop bar passes 70%, send an attack (bots or unclaimed land) at 30–40% until it drops back under 60%.",
        goal: "Troop growth efficiency above 80% in your next game.",
        metricKey: "troopEff",
        target: 0.8,
      });
    }
    if (c.key === "expansion" && c.score < 70 && (val("share120") ?? 0) < 1.2) {
      add({
        title: "Faster opening",
        why: `You reached ${lines.find((x) => x.m.key === "share120")?.m.display ?? "—"} of the typical player's land by 2:00.`,
        how: "In the first 10 seconds after spawn, full-send into unclaimed land, then keep two expansion lanes busy at 60–70% until you touch neighbours. Hit bot tribes next: they take only 70% of normal losses and hand over their gold.",
        goal: "At least 1.5× the typical player's land at 2:00.",
        metricKey: "share120",
        target: 1.5,
      });
    }
    if (c.key === "economy" && c.score < 70) {
      const fc = val("firstCity");
      add({
        title: fc !== null && fc > 180 ? "First City by 2:30" : "Spend your gold",
        why:
          fc !== null && fc > 180
            ? `Your first City came at ${fc >= 9999 ? "never" : secs(fc)}. A level-1 City adds 250k to your troop cap, which more than doubles an early army.`
            : `Your gold sat at ${lines.find((x) => x.m.key === "float")?.m.display ?? "—"} on average.`,
        how: "Build a City the moment you hit 125k gold, in your interior. After that, alternate City upgrades with Ports on long coastal trade routes (300+ tiles pays far better than short hops).",
        goal: fc !== null && fc > 180 ? "First City within 2:30 of spawn." : "Average unspent gold under 2 minutes of income.",
        metricKey: fc !== null && fc > 180 ? "firstCity" : "float",
        target: fc !== null && fc > 180 ? 150 : 2,
      });
    }
    if (c.key === "combat" && c.score < 65) {
      add({
        title: "Pick fights you can win",
        why: `You took ${lines.find((x) => x.m.key === "attackEff")?.m.display ?? "—"} tiles per 1k troops against players${(val("fullSends") ?? 0) > 0 ? ` and made ${val("fullSends")} mid-game full sends` : ""}.`,
        how: "Before attacking a player, compare your stack to their whole army: below ~60% of it you pay up to double losses per tile. Prefer targets already fighting someone else, and use ~30% sends mid-game instead of full sends.",
        goal: "No mid-game full sends, and better than 8 tiles per 1k troops against players.",
        metricKey: "attackEff",
        target: 8,
      });
    }
    if (c.key === "defense" && c.score < 65) {
      add({
        title: "Defend the border you'll be hit on",
        why: `Your worst collapse lost ${lines.find((x) => x.m.key === "drawdown")?.m.display ?? "—"} of your territory.`,
        how: "Identify your strongest neighbour by 3:00. Put a Defense Post on that border, keep 35–50% of your cap at home, and ally a second neighbour so you only have one front.",
        goal: "No collapse bigger than 25% of your peak territory.",
        metricKey: "drawdown",
        target: 0.25,
      });
    }
    if (c.key === "nuclear" && c.score < 60) {
      add({
        title: "SAM cover before minute 6",
        why: `${val("nukesTaken") ?? 0} nukes were launched at you.`,
        how: "Once a rival owns a Missile Silo, put a SAM (1.5M) over your densest Cities; place a second so their ranges overlap.",
        goal: "Zero nukes landing on your core.",
        metricKey: "nukesTaken",
        target: 0,
      });
    }
  }
  if (!drills.length) {
    const worst = moments.find((m) => m.severity === "blunder" || m.severity === "mistake");
    drills.push({
      title: worst ? `Fix this: ${worst.title}` : "Push for the win earlier",
      why: worst ? worst.detail : "Your fundamentals were strong across the board.",
      how: worst?.suggestion ?? "Look for the moment the leader over-commits and hit their weakest border with a full stack.",
      goal: "Repeat this game's score with one fewer mistake.",
    });
  }
  void scoreOf;
  return { strengths, weaknesses, drills };
}
