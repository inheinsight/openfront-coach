import type { PlayerMetrics } from "./metrics.js";
import { median } from "./metrics.js";
import type { PlayMode } from "./mode.js";
import { ReplayView } from "./replayView.js";
import { clock, fmtNum, GOOD_STACK_RATIO, pct, TICKS_PER_SECOND } from "./rules.js";
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
  /** Shown for context but not graded: these don't separate winners from the rest. */
  info?: boolean;
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
  // Lobby context only means something with other humans to compare against.
  const best = others.length >= 2 && vals.length ? (def.higherIsBetter ? Math.max(...vals) : Math.min(...vals)) : null;
  const med = others.length >= 2 ? median(vals) : null;
  const pctile = v !== null && others.length >= 3 ? percentileOf(v, others, def.higherIsBetter) : null;
  const abs = def.absolute ? curve(v, def.absolute) : null;
  let score: number | null = null;
  if (v !== null && !def.info) {
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

export function scoreGame(view: ReplayView, me: PlayerMetrics, all: PlayerMetrics[], ledger: AttackLedgerRow[], mode: PlayMode) {
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
      const gain = a.tilesCaptured ?? Math.max(0, Math.min((a.attackerTilesEnd ?? a.attackerTilesStart) - a.attackerTilesStart, a.target ? a.targetTilesStart - (a.targetTilesEnd ?? a.targetTilesStart) : Infinity));
      return { targetType: a.targetType, tilesPer1kTroops: used > 0 ? (gain / used) * 1000 : null };
    })).filter((r) => (r.targetType === "Human" || r.targetType === "Nation") && r.tilesPer1kTroops !== null);
    return list.length >= 2 ? median(list.map((r) => r.tilesPer1kTroops as number)) : null;
  };
  const incomePerMin = (m: PlayerMetrics) => m.goldEarned / Math.max(1, m.lifeTicks / TICKS_PER_SECOND / 60);
  const sinceSpawn = (t: number | null, m: PlayerMetrics) => (t === null ? (m.lifeTicks > 2400 ? 9999 : null) : (t - m.spawnPhaseEndTick) / TICKS_PER_SECOND);
  const structuresLostShare = (m: PlayerMetrics) => {
    const built = Object.values(m.structuresBuilt).reduce((a, b) => a + b, 0);
    return built >= 3 ? Math.min(1, m.structuresLost / built) : null;
  };
  const survival = (m: PlayerMetrics) => (m.alive ? 1 : m.lifeTicks / Math.max(1, view.data.meta.ticks - m.spawnPhaseEndTick));

  const defs: Partial<Record<CategoryScore["key"], { label: string; metrics: MetricDef[] }>> = {
    expansion: {
      label: "Expansion",
      metrics: [
        { key: "share60", label: "Land at 1:00 vs typical player", get: (m) => relShare(m, 60), fmt: (v) => `${v.toFixed(2)}×`, higherIsBetter: true, absolute: relCurve, hint: "Your land share 1 minute after spawn, divided by the median player's." },
        { key: "share120", label: "Land at 2:00 vs typical player", get: (m) => relShare(m, 120), fmt: (v) => `${v.toFixed(2)}×`, higherIsBetter: true, absolute: relCurve, weight: 1.25 },
        { key: "share300", label: "Land at 5:00 vs typical player", get: (m) => relShare(m, 300), fmt: (v) => `${v.toFixed(2)}×`, higherIsBetter: true, absolute: relCurve, weight: 2, hint: "The strongest early predictor of where you finish." },
        {
          key: "peakShare",
          label: "Peak share of the map",
          get: (m) => m.peakLandShare,
          fmt: share,
          higherIsBetter: true,
          absolute: [[0.005, 20], [0.02, 45], [0.05, 65], [0.15, 85], [0.4, 100]],
          weight: 1.5,
          // With 25+ humans a side, a winning team's members average ~3% each.
          info: mode.bigTeams,
        },
      ],
    },
    economy: {
      label: "Economy",
      metrics: [
        { key: "income5to10", label: "Income per minute, 5:00–10:00", get: (m) => m.income5to10, fmt: fmtNum, higherIsBetter: true, absolute: [[100_000, 20], [500_000, 45], [1_500_000, 70], [3_000_000, 90], [5_000_000, 100]], hint: "Trade ships and trains pay most of everyone's gold from minute 5; this is where winners pull ahead.", weight: 1.5 },
        { key: "goldPerMin", label: "Gold income per minute", get: incomePerMin, fmt: fmtNum, higherIsBetter: true, absolute: [[60_000, 30], [300_000, 55], [1_000_000, 75], [2_500_000, 90], [5_000_000, 100]], hint: "Base income is 60k/min; trade, trains and conquest add the rest." },
        { key: "firstIncome", label: "First Port or Factory after spawn", get: (m) => sinceSpawn(m.firstIncomeTick, m), fmt: (v) => (v >= 9999 ? "never" : secs(v)), higherIsBetter: false, absolute: [[120, 100], [180, 85], [300, 55], [480, 25], [9999, 5]] },
        { key: "firstCity", label: "First City after spawn", get: (m) => sinceSpawn(m.firstCityTick, m), fmt: (v) => (v >= 9999 ? "never" : secs(v)), higherIsBetter: false, info: true, hint: "Not graded: when the first City lands barely affects results. Build it when the troop cap holds you back." },
        { key: "float", label: "Gold sitting unspent", get: (m) => m.floatMinutes, fmt: (v) => `${v.toFixed(1)} min of income`, higherIsBetter: false, absolute: [[1, 100], [2, 85], [4, 60], [8, 30], [15, 10]], hint: "Average gold held, in minutes of your own income. A bank for a SAM or a Hydrogen bomb once rivals have Silos is fine.", weight: 0.5 },
        { key: "tradeShare", label: "Gold from trade and trains", get: (m) => (m.goldEarned > 0 ? (m.goldBySource.trade + m.goldBySource.trainSelf + m.goldBySource.trainOther) / m.goldEarned : null), fmt: (v) => pct(v), higherIsBetter: true, absolute: [[0, 30], [0.2, 60], [0.5, 85], [0.7, 100]], weight: 0.75 },
      ],
    },
    troops: {
      label: "Troop management",
      metrics: [
        { key: "troopEff", label: "Troop growth efficiency (first 15 min)", get: (m) => m.troopEfficiency, fmt: (v) => pct(v), higherIsBetter: true, absolute: [[0.4, 25], [0.6, 50], [0.75, 72], [0.85, 88], [0.93, 100]], hint: "Average regen as a share of the maximum possible regen (troops at ~42% of cap).", weight: 2 },
        { key: "atCap", label: "Time with troops at the cap (first 15 min)", get: (m) => m.timeAtCapPct, fmt: (v) => pct(v), higherIsBetter: false, absolute: [[0, 100], [0.08, 80], [0.2, 55], [0.4, 25]], hint: "Troop growth stops at the cap." },
        { key: "overextended", label: "Time nearly empty (<15% of cap, first 15 min)", get: (m) => m.timeOverextendedPct, fmt: (v) => pct(v), higherIsBetter: false, absolute: [[0, 100], [0.05, 80], [0.15, 50], [0.3, 20]] },
      ],
    },
    combat: {
      label: "Combat",
      metrics: [
        { key: "stackRatio", label: "Attack stack vs the defender's home troops", get: (m) => m.stackRatio, fmt: (v) => `${v.toFixed(2)}×`, higherIsBetter: true, absolute: [[0.3, 15], [0.6, 40], [1, 65], [GOOD_STACK_RATIO, 88], [3, 100]], hint: `Median over your land attacks on players. Losses per tile double at 0.5× and are cheapest from about 1.67×.`, weight: 1.5 },
        { key: "attackEff", label: "Tiles taken per 1k troops (vs players)", get: attackEff, fmt: (v) => v.toFixed(1), higherIsBetter: true, absolute: [[1, 20], [3, 45], [8, 70], [20, 95]], weight: 1.5 },
        { key: "fullSends", label: "Mid-game full sends at players", get: (m) => m.fullSends, fmt: (v) => String(v), higherIsBetter: false, absolute: [[0, 100], [1, 80], [3, 50], [6, 20]], weight: 0.5 },
        { key: "retreats", label: "Retreats", get: (m) => m.retreats, fmt: (v) => String(v), higherIsBetter: false, info: true, hint: "Not graded: a retreat costs 25% of the surviving troops against a player, and is free against open land." },
        { key: "conquests", label: "Players eliminated", get: (m) => m.conquests, fmt: (v) => String(v), higherIsBetter: true, absolute: [[0, 40], [2, 65], [5, 85], [10, 100]] },
      ],
    },
    defense: {
      label: "Defense & survival",
      metrics: [
        { key: "drawdown", label: "Worst territory collapse", get: (m) => m.maxDrawdown, fmt: (v) => pct(v), higherIsBetter: false, absolute: [[0.1, 100], [0.25, 80], [0.5, 50], [0.8, 20], [1, 5]], weight: 1.5 },
        { key: "survival", label: "Share of the game survived", get: survival, fmt: (v) => pct(v), higherIsBetter: true, absolute: [[0.2, 10], [0.5, 40], [0.8, 70], [1, 100]], weight: 1.5 },
        { key: "structuresLost", label: "Structures lost, per structure built", get: structuresLostShare, fmt: (v) => pct(v), higherIsBetter: false, absolute: [[0, 100], [0.2, 80], [0.4, 55], [0.7, 25]], weight: 0.5 },
      ],
    },
    diplomacy: {
      label: "Diplomacy",
      metrics: [
        { key: "alliances", label: "Alliances formed", get: (m) => m.alliancesFormed, fmt: (v) => String(v), higherIsBetter: true, absolute: [[0, 40], [1, 65], [3, 85], [6, 100]] },
        { key: "betrayedBy", label: "Times betrayed", get: (m) => m.alliancesBrokenByOthers, fmt: (v) => String(v), higherIsBetter: false, absolute: [[0, 100], [1, 70], [3, 40]], weight: 0.5 },
      ],
    },
    teamwork: {
      label: "Teamwork",
      metrics: [
        { key: "troopsDonated", label: "Troops given to teammates", get: (m) => (m.team === null ? null : m.donations.troopsSent), fmt: fmtNum, higherIsBetter: true, hint: "Feeding the teammate who is fighting beats attacking with a small stack." },
        { key: "teamShare", label: "Your share of the team's land vs a fair share", get: (m) => m.teamShareMultiple, fmt: (v) => `${v.toFixed(2)}×`, higherIsBetter: true, absolute: [[0.25, 25], [0.5, 50], [1, 75], [2, 95]], hint: "From 5:00 on; 1× means you held 1/(team size) of your team's land." },
        { key: "troopsReceived", label: "Troops received from teammates", get: (m) => (m.team === null ? null : m.donations.troopsReceived), fmt: fmtNum, higherIsBetter: true, info: true },
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
        { key: "samDelay", label: "SAM cover after the first enemy Silo", get: (m) => m.samDelaySec, fmt: (v) => (v >= 9999 ? "never" : `${Math.round(v)}s`), higherIsBetter: false, absolute: [[60, 100], [90, 85], [180, 55], [300, 30], [9999, 10]], hint: mode.teammates ? "Your own SAM, or a teammate's SAM in range of your Cities." : "Seconds until a SAM of yours was up.", weight: 1.5 },
        { key: "nukesNoSam", label: "Nukes at you while you had no SAM of your own", get: (m) => (m.enemySiloTick === null ? null : m.nukesWithoutOwnSam), fmt: (v) => String(v), higherIsBetter: false, absolute: [[0, 100], [2, 70], [5, 35], [10, 15]], hint: "Nukes aimed at land no SAM covered, before you had any SAM yourself." },
        { key: "nukeHitRate", label: "Your nukes that landed", get: (m) => (m.nukesLaunched > 0 ? Math.min(1, m.nukesLanded / m.nukesLaunched) : null), fmt: (v) => pct(v), higherIsBetter: true, absolute: [[0.2, 20], [0.5, 50], [0.8, 85], [1, 100]] },
        { key: "nukesTaken", label: "Nukes launched at you", get: (m) => m.nukesReceived, fmt: (v) => String(v), higherIsBetter: false, info: true, hint: "Not graded: nukes go to the leaders." },
      ],
    },
  };

  const relevant = (key: string) => {
    if (key === "naval") return all.some((m) => m.boatsSent > 0 || m.tradeGold > 0);
    if (key === "nuclear") return me.nukesLaunched > 0 || me.nukesReceived > 0 || me.enemySiloTick !== null;
    if (key === "combat") return me.attacksVsPlayers > 0;
    // Alliances between the sides of a 2- or 3-team game don't decide anything.
    if (key === "diplomacy") return !mode.bigTeams;
    if (key === "teamwork") return mode.teammates && mode.donations && me.lifeTicks > 300 * TICKS_PER_SECOND;
    return true;
  };

  const categories: CategoryScore[] = [];
  const allLines: (MetricLine & { score: number | null })[] = [];
  for (const [key, def] of Object.entries(defs) as [CategoryScore["key"], { label: string; metrics: MetricDef[] }][]) {
    if (!relevant(key)) continue;
    const lines = def.metrics.map((d) => ({ d, l: line(d, me, all) }));
    const scored = lines.filter((x) => x.l.score !== null);
    if (!scored.length) continue;
    const wsum = scored.reduce((a, x) => a + (x.d.weight ?? 1), 0);
    // Teamwork: feeding the front and carrying it are both contributions, so take the better one.
    const score =
      key === "teamwork"
        ? Math.max(...scored.map((x) => x.l.score as number))
        : Math.round(scored.reduce((a, x) => a + (x.l.score as number) * (x.d.weight ?? 1), 0) / wsum);
    allLines.push(...lines.map((x) => x.l));
    const best = [...scored].sort((a, b) => (b.l.score as number) - (a.l.score as number))[0];
    const worst = [...scored].sort((a, b) => (a.l.score as number) - (b.l.score as number))[0];
    categories.push({
      key,
      label: def.label,
      score,
      grade: grade(score),
      summary:
        key === "teamwork"
          ? `${score >= 75 ? "Strong" : score >= 55 ? "Solid" : "Weak spot"}: you gave ${lines.find((x) => x.d.key === "troopsDonated")?.l.display ?? "—"} troops to teammates (median ${lines.find((x) => x.d.key === "troopsDonated")?.l.medianDisplay ?? "—"}) and held ${lines.find((x) => x.d.key === "teamShare")?.l.display ?? "—"} of a fair share of your team's land.`
          : score >= 75
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

  return { categories, overall: overallOf(categories), lines: allLines };
}

const WEIGHTS: Record<string, number> = { expansion: 1.3, economy: 1.1, buildings: 0.9, troops: 1.2, combat: 1.0, defense: 1.1, teamwork: 1.0, diplomacy: 0.4, naval: 0.5, nuclear: 0.6 };

/** Weighted average of the category scores. */
export function overallOf(categories: CategoryScore[]): number {
  const wsum = categories.reduce((a, c) => a + (WEIGHTS[c.key] ?? 1), 0);
  return Math.round(categories.reduce((a, c) => a + c.score * (WEIGHTS[c.key] ?? 1), 0) / Math.max(1, wsum));
}

/** Turn scores and moments into strengths, weaknesses and drills. */
export function coach(categories: CategoryScore[], moments: KeyMoment[], me: PlayerMetrics, mode: PlayMode) {
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
  const lineOf = (k: string) => lines.find((x) => x.m.key === k)?.m;
  const ordered = [...categories].sort((a, b) => a.score - b.score);
  for (const c of ordered) {
    // A fed carry sits at the cap by the team's choice; drill the players doing the feeding instead.
    const fedCarry = mode.donations && me.donations.troopsReceived > me.donations.troopsSent;
    if (c.key === "troops" && c.score < 75 && !fedCarry) {
      const atCap = val("atCap");
      add({
        title: "Keep the troop bar between 40% and 60%",
        why: `Your troops grew at ${pct(val("troopEff") ?? 0)} of the best possible rate${atCap !== null ? ` and sat at the cap ${pct(atCap)} of the time` : ""}. Regen peaks at about 42% of the cap and stops at 100%.`,
        how: mode.donations
          ? "Whenever the bar passes about 60%, either attack with a stack bigger than the target's home troops or donate 30–40% of your troops to the teammate who is fighting."
          : "Play a single-player game on Easy. Whenever the troop bar passes 70%, send an attack (bots or unclaimed land) at 20–30% until it drops back under 60%.",
        goal: "Troop growth efficiency above 80% in your next game.",
        metricKey: "troopEff",
        target: 0.8,
      });
    }
    if (c.key === "expansion" && c.score < 70 && (val("share300") ?? val("share120") ?? 0) < 1) {
      const key = val("share300") !== null ? "share300" : "share120";
      add({
        title: "Out-grow the lobby by 5:00",
        why: `You held ${lineOf(key)?.display ?? "—"} of the typical player's land at ${key === "share300" ? "5:00" : "2:00"}. Land at 5:00 predicts where you finish better than anything else in the first minutes.`,
        how: "Click about 20% into open land every time the bar refills, along two lanes; big sends don't expand faster and their troops stop regrowing. Then clear the bot tribes around you: you lose only 70% of the usual troops per bot tile, and finishing one hands you its gold. Keep at least a quarter of your cap at home.",
        goal: "Land at 5:00 at or above the typical player's (1.0×).",
        metricKey: key,
        target: 1,
      });
    }
    if (c.key === "economy" && c.score < 70) {
      const fi = val("firstIncome");
      const inc = lineOf("income5to10");
      const fl = val("float");
      if (fi !== null && fi > 240) {
        add({
          title: "A Port or Factory earning by 3:00",
          why: `Your first Port or Factory came at ${fi >= 9999 ? "never" : secs(fi)}. After minute 5, trade ships and trains pay 90%+ of everyone's gold.`,
          how: "Build a City first if your troops are at the cap, then a Port on coast with partners 300+ tiles away (both ends of every trade get paid), then a Factory where rail can reach several Cities or Ports, yours or a teammate's.",
          goal: "First Port or Factory within 3:00 of spawn.",
          metricKey: "firstIncome",
          target: 180,
        });
      } else if (inc && inc.value !== null && inc.median != null && inc.value < inc.median && (val("share300") ?? 0) < 1.5) {
        add({
          title: "Grow income between minutes 5 and 10",
          why: `You earned ${inc.display} a minute between 5:00 and 10:00; the median player earned ${inc.medianDisplay}.`,
          how: `Keep adding Port levels (each level rolls for its own trade ships) and Factories that link to other players' stations: a train stop pays 10k at your own station and 25k at anyone else's, to both sides.${mode.bigTeams ? " Trade with teammates and turn on Stop Trading with Enemies." : ""}`,
          goal: `Income from 5:00 to 10:00 at or above the lobby median (${inc.medianDisplay}/min).`,
          metricKey: "income5to10",
          target: inc.median,
        });
      } else if (fl !== null && fl > 3 && me.enemySiloTick === null) {
        add({
          title: "Put idle gold to work",
          why: `Your gold sat at ${lineOf("float")?.display ?? "—"} on average with no enemy Silo to save against.`,
          how: mode.donations
            ? "Spend on Ports and Factories as the gold comes in, or give it to a front-line teammate who can turn it into Defense Posts and Cities. Bank only for a SAM or a bomb once rivals have Silos."
            : "Spend on Ports and Factories as the gold comes in. Bank only for a SAM or a Hydrogen bomb once rivals have Silos.",
          goal: "Average unspent gold under 2 minutes of income before the first enemy Silo.",
          metricKey: "float",
          target: 2,
        });
      }
    }
    if (c.key === "buildings" && c.score < 70) {
      const bad = c.metrics.find((m) => m.key === "placeBad")?.value ?? 0;
      add({
        title: "Place every building where it earns and survives",
        why: `${bad} of your buildings were in poor spots or lost soon after you built them (see Economy & buildings for each one).`,
        how: `Cities and Silos go deep inside your land, away from enemy borders${mode.teammates ? " (behind your front-line teammates)" : ""}. Ports go on coast whose partners are 300+ tiles away. Factories go where rail reaches several Cities or Ports, yours or anyone's. Defense Posts go where you are being attacked, on high ground if you can. SAMs go where they cover your Cities.`,
        goal: "No building lost within 2.5 minutes, and no badly placed buildings.",
        metricKey: "placeBad",
        target: 0,
      });
    }
    if (c.key === "combat" && c.score < 65) {
      const sr = val("stackRatio");
      add({
        title: "Only attack with a bigger stack than they hold at home",
        why: `Your median attack on a player was ${lineOf("stackRatio")?.display ?? "—"} the defender's home troops, and you took ${lineOf("attackEff")?.display ?? "—"} tiles per 1k troops. At half their home troops or less you pay double losses per tile.`,
        how: mode.bigTeams
          ? `Before attacking a player, compare your stack with the troops they hold at home. Below 1× it, donate the troops to the teammate fighting there instead; at ${GOOD_STACK_RATIO}× or more, attack. Hitting someone right after they send their army elsewhere is cheapest.`
          : `Before attacking a player, compare your stack with the troops they hold at home. Below 1× it, wait and grow; at ${GOOD_STACK_RATIO}× or more, attack. Hitting someone right after they send their army elsewhere is cheapest.`,
        goal: `Median attack stack at least 1× the defender's home troops (then aim for ${GOOD_STACK_RATIO}×).`,
        metricKey: sr !== null ? "stackRatio" : "attackEff",
        target: sr !== null ? 1 : 8,
      });
    }
    if (c.key === "teamwork" && c.score < 60) {
      add({
        title: "Feed the front",
        why: `You gave ${lineOf("troopsDonated")?.display ?? "0"} troops to teammates (median ${lineOf("troopsDonated")?.medianDisplay ?? "—"}) and held ${lineOf("teamShare")?.display ?? "—"} of a fair share of your team's land.`,
        how: "Decide in the first two minutes whether you border the enemy team. If you don't, keep troops near 40–50% of your cap and donate 30–40% to the teammate who is fighting each time you pass half your cap; build Ports and Factories that link to teammates. If you do, ask for troops before you attack or collapse.",
        goal: "Give at least the lobby median in troops to teammates, or hold at least your fair share (1×) of your team's land.",
        metricKey: "troopsDonated",
        target: lineOf("troopsDonated")?.median ?? undefined,
      });
    }
    if (c.key === "defense" && c.score < 65) {
      add({
        title: "Defend the border you'll be hit on",
        why: `Your worst collapse lost ${lineOf("drawdown")?.display ?? "—"} of your territory.`,
        how: mode.bigTeams
          ? "Know which teammates border the enemy and where you'd be hit. Keep 35–50% of your cap at home on a live front, drop a Defense Post on high ground where the push lands, and ask a teammate for troops before the border breaks."
          : "Identify your strongest neighbour by 3:00. Keep 35–50% of your cap at home, put a Defense Post on that border (on high ground if you can), and ally a second neighbour so you only have one front.",
        goal: "No collapse bigger than 25% of your peak territory.",
        metricKey: "drawdown",
        target: 0.25,
      });
    }
    if (c.key === "nuclear" && c.score < 60 && val("samDelay") !== null) {
      const d = val("samDelay")!;
      add({
        title: "SAM cover within a minute of the first enemy Silo",
        why: `${d >= 9999 ? "None of your Cities was ever under a SAM" : `Your first City came under a SAM ${Math.round(d)}s after the first enemy Silo`}${me.nukesWithoutOwnSam ? `, and ${me.nukesWithoutOwnSam} nukes hit you while you had no SAM of your own` : ""}. A SAM takes 30s to build; a Hydrogen bomb arrives in about 10.`,
        how: mode.teammates
          ? "Watch for the first enemy Missile Silo. Within a minute, build a SAM (1.5M) over your densest Cities, or keep your Cities within 70 tiles of a teammate's SAM: it shoots down any enemy nuke in range."
          : "Watch for the first Missile Silo near you. Within a minute, build a SAM (1.5M) over your densest Cities, and a second whose range overlaps it once you can afford it.",
        goal: "A SAM over your Cities within 90 seconds of the first enemy Silo.",
        metricKey: "samDelay",
        target: 90,
      });
    }
  }
  if (!drills.length) {
    const worst = moments.find((m) => m.severity === "blunder" || m.severity === "mistake");
    drills.push({
      title: worst ? `Fix this: ${worst.title}` : "Push for the win earlier",
      why: worst ? worst.detail : "Your fundamentals were strong across the board.",
      how: worst?.suggestion ?? "Look for the moment the leader sends their army elsewhere and hit the border they left, with a stack bigger than the troops they still hold at home.",
      goal: "Repeat this game's score with one fewer mistake.",
    });
  }
  void scoreOf;
  return { strengths, weaknesses, drills };
}
