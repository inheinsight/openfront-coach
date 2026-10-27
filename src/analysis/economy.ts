// Economy, building placement and warship coaching.
//
// Reads the structures the harness tracked (with the surroundings at the
// moment each was placed and what became of it), income by source, and your
// build actions, and turns them into verdicts with concrete alternatives.
import type { PlacementContext, StructureRecord } from "../engine/replayTypes.js";
import type { GameRecord, PlayerRecord } from "../openfront/types.js";
import type { PlayerMetrics } from "./metrics.js";
import { median } from "./metrics.js";
import { ReplayView } from "./replayView.js";
import { clock, fmtNum, pct, TICKS_PER_SECOND } from "./rules.js";
import type { KeyMoment, Severity } from "./types.js";

const SEC = TICKS_PER_SECOND;
const BASE_PER_MIN = 60_000;

export interface PlacementReview {
  id: number;
  type: string;
  tick: number;
  x: number;
  y: number;
  level: number;
  fate: "kept" | "captured" | "destroyed";
  endTick: number | null;
  lostTo: string | null;
  verdict: Severity;
  /** The main problem (or strength), as a short headline. */
  issue: string;
  notes: string[];
  better?: { x: number; y: number; why: string };
  context: PlacementContext | null;
}

export interface BuildOrderRow {
  tick: number;
  unit: string;
  upgrade: boolean;
  cost: number;
  waitedSec: number | null;
  troopRatio: number | null;
  verdict: Severity;
  note: string;
}

export interface WarshipReview {
  id: number;
  tick: number;
  endTick: number | null;
  fate: "kept" | "captured" | "destroyed";
  lostTo: string | null;
  path: [number, number, number][];
  nearPortShare: number | null;
  verdict: Severity;
  note: string;
}

export interface EconomyReport {
  income: { ticks: number[]; base: number[]; trade: number[]; trains: number[]; conquest: number[] };
  totals: { work: number; war: number; trade: number; piracy: number; trains: number; donations: number; total: number };
  incomeAt: { sec: number; you: number | null; median: number | null; best: number | null; bestName: string | null }[];
  spending: { economy: number; defense: number; military: number; nukes: number };
  buildOrder: BuildOrderRow[];
  placements: PlacementReview[];
  warships: {
    reviews: WarshipReview[];
    tradeShipsLost: number;
    tradeLostTo: { name: string; count: number }[];
    enemyTradeCaptured: number;
    transportsLost: number;
    advice: string[];
  };
  you: { firstCity: number | null; firstPort: number | null; firstFactory: number | null; counts10: Record<string, number>; tradeShare: number | null };
  benchmark: { name: string; result: string; firstCity: number | null; firstPort: number | null; firstFactory: number | null; counts10: Record<string, number>; tradeShare: number | null } | null;
  advice: string[];
  score: number;
}

const ECON = ["City", "Port", "Factory"];
const DEF = ["Defense Post", "SAM Launcher"];
const NUKES = ["Atom Bomb", "Hydrogen Bomb", "MIRV", "Missile Silo"];

const compass = (dx: number, dy: number) => {
  const a = (Math.atan2(-dy, dx) * 180) / Math.PI;
  const dirs = ["east", "north-east", "north", "north-west", "west", "south-west", "south", "south-east"];
  return dirs[(Math.round(((a + 360) % 360) / 45) % 8)];
};
const away = (from: { x: number; y: number }, to: { x: number; y: number }) =>
  `about ${Math.round(Math.hypot(to.x - from.x, to.y - from.y))} tiles ${compass(to.x - from.x, to.y - from.y)}`;

function rateSeries(cum: number[], ticks: number[], windowTicks: number) {
  const out = new Array(cum.length).fill(0);
  let j = 0;
  for (let i = 0; i < cum.length; i++) {
    while (ticks[i] - ticks[j] > windowTicks) j++;
    const dt = (ticks[i] - ticks[j]) / SEC / 60;
    out[i] = dt > 0 ? Math.max(0, (cum[i] - cum[j]) / dt) : 0;
  }
  return out;
}

function firstBuild(actions: { type: string; unit?: string; tick: number }[], unit: string) {
  return actions.find((a) => a.type === "build_unit" && a.unit === unit)?.tick ?? null;
}

function countsAt(structs: StructureRecord[], owner: number, tick: number) {
  const out: Record<string, number> = {};
  for (const s of structs) {
    if (s.owner !== owner || s.builtTick > tick || (s.endTick !== undefined && s.endTick <= tick)) continue;
    out[s.type] = (out[s.type] ?? 0) + 1;
  }
  return out;
}

function hostileNearFactory(name: (id: number | null | undefined) => string) {
  return (c: PlacementContext) =>
    c.frontEnemy !== null && !c.frontEnemyAllied && c.distFront !== null && c.distFront < 40 ? `${c.distFront} tiles from ${name(c.frontEnemy)}'s border` : null;
}

export function analyzeEconomy(view: ReplayView, record: GameRecord, meRec: PlayerRecord, me: PlayerMetrics, all: PlayerMetrics[]): { report: EconomyReport; moments: Omit<KeyMoment, "id">[] } {
  const sid = me.smallID;
  const data = view.data;
  const ticks = view.ticks;
  const spEnd = me.spawnPhaseEndTick;
  const endTick = me.eliminatedTick ?? data.meta.ticks;
  const name = (id: number | null | undefined) => (id ? view.name(id) : "unclaimed land");
  const moments: Omit<KeyMoment, "id">[] = [];
  const hostileNear = hostileNearFactory(name);
  const structs = data.structures ?? [];
  const mine = structs.filter((s) => s.owner === sid);
  const actions = data.actions.filter((a) => a.clientID === me.clientID);

  // ---- income by source ---------------------------------------------------
  const earned = view.aligned(sid, "goldEarned");
  const trade = view.aligned(sid, "tradeGold");
  const trains = view.aligned(sid, "trainGold");
  const piracy = view.aligned(sid, "piracyGold");
  const alive = view.aligned(sid, "alive");
  const win = 60 * SEC;
  const total = rateSeries(earned, ticks, win);
  const tradeR = rateSeries(trade, ticks, win);
  const trainR = rateSeries(trains, ticks, win);
  const pirR = rateSeries(piracy, ticks, win);
  const base = ticks.map((t, i) => (alive[i] && t > spEnd ? BASE_PER_MIN : 0));
  // Everything above base income, trade and trains: conquest gold, captured ships, donations.
  const conquest = total.map((v, i) => Math.max(0, v - base[i] - tradeR[i] - trainR[i]));
  void pirR;
  const step = Math.max(1, Math.ceil(ticks.length / 300));
  const pick = <T,>(a: T[]) => a.filter((_, i) => i % step === 0 || i === a.length - 1);
  const income = { ticks: pick(ticks), base: pick(base), trade: pick(tradeR), trains: pick(trainR), conquest: pick(conquest) };

  const g = meRec.stats?.gold ?? [];
  const n = (i: number) => Number(g[i] ?? 0);
  const totals = { work: n(0), war: n(1), trade: n(2), piracy: n(3), trains: n(4) + n(5), donations: n(6), total: 0 };
  totals.total = totals.work + totals.war + totals.trade + totals.piracy + totals.trains + totals.donations;

  const humanIds = all.map((m) => m.smallID);
  const rateAt = (id: number, t: number) => {
    const cum = view.aligned(id, "goldEarned");
    const i = view.sampleIndex(t);
    let j = i;
    while (j > 0 && ticks[i] - ticks[j] < win) j--;
    const dt = (ticks[i] - ticks[j]) / SEC / 60;
    return i > 0 && dt > 0 && view.valueAt(id, "alive", t) ? (cum[i] - cum[j]) / dt : null;
  };
  const incomeAt = [300, 600, 900]
    .map((sec) => {
      const t = spEnd + sec * SEC;
      if (t > data.meta.ticks) return null;
      const vals = humanIds.map((id) => ({ id, v: rateAt(id, t) })).filter((x): x is { id: number; v: number } => x.v !== null);
      const others = vals.filter((x) => x.id !== sid).map((x) => x.v);
      const best = vals.sort((a, b) => b.v - a.v)[0];
      return {
        sec,
        you: rateAt(sid, t),
        median: others.length >= 2 ? median(others) : null,
        best: others.length >= 1 ? best?.v ?? null : null,
        bestName: others.length >= 1 && best ? view.name(best.id) : null,
      };
    })
    .filter((x): x is NonNullable<typeof x> => x !== null);

  // ---- spending and build order -------------------------------------------
  const spending = { economy: 0, defense: 0, military: 0, nukes: 0 };
  const gold = view.aligned(sid, "gold");
  const buildOrder: BuildOrderRow[] = [];
  for (const a of actions.filter((a) => a.type === "build_unit" || a.type === "upgrade_structure")) {
    const unit = a.unit ?? "?";
    const cost = a.cost ?? 0;
    if (ECON.includes(unit)) spending.economy += cost;
    else if (DEF.includes(unit)) spending.defense += cost;
    else if (NUKES.includes(unit)) spending.nukes += cost;
    else spending.military += cost;
    // How long the gold was already in the bank before this purchase.
    let waited: number | null = null;
    if (cost > 0) {
      const i = view.sampleIndex(a.tick);
      let j = i;
      while (j > 0 && gold[j - 1] >= cost) j--;
      waited = Math.max(0, (a.tick - ticks[j]) / SEC);
    }
    const ratio = a.troops !== undefined && a.maxTroops ? a.troops / a.maxTroops : null;
    let verdict: Severity = "info";
    let note = "";
    const upgrade = a.type === "upgrade_structure";
    if (unit === "City") {
      if (ratio !== null && ratio >= 0.8) {
        verdict = "good";
        note = `good timing: your army was at ${pct(ratio)} of its cap, so +250k cap paid off at once`;
      }
      if (waited !== null && waited > 60) {
        verdict = waited > 150 ? "mistake" : "inaccuracy";
        note = `you had the ${fmtNum(cost)} for ${Math.round(waited)}s before buying it` + (ratio !== null && ratio >= 0.8 ? ", while your army sat at its cap" : "");
      }
    } else if (unit === "Port" || unit === "Factory") {
      if (waited !== null && waited > 120) {
        verdict = "inaccuracy";
        note = `gold for it sat in the bank for ${Math.round(waited)}s`;
      }
    } else if (unit === "Warship") {
      note = "warship";
    }
    buildOrder.push({ tick: a.tick, unit, upgrade, cost, waitedSec: waited === null ? null : Math.round(waited), troopRatio: ratio === null ? null : +ratio.toFixed(2), verdict, note });
  }
  const lateCity = buildOrder.find((b) => b.unit === "City" && !b.upgrade && (b.waitedSec ?? 0) > 60);
  if (lateCity) {
    moments.push({
      tick: lateCity.tick,
      kind: "economy",
      severity: lateCity.verdict === "mistake" ? "mistake" : "inaccuracy",
      title: `City bought ${lateCity.waitedSec}s after you could afford it`,
      detail: `${clock(lateCity.tick)}: ${lateCity.note}. Every second without it is 250k troop cap you don't have.`,
      suggestion: "Buy Cities the moment the gold is there, unless you're saving for something specific.",
      evidence: { waitedSec: lateCity.waitedSec, cost: lateCity.cost, troopRatio: lateCity.troopRatio },
    });
  }

  // ---- placements ----------------------------------------------------------
  const nukesAtMe = data.events.filter((e) => e.kind === "UnitIncoming" && e.playerID === sid && [4, 5, 7].includes(e.messageType as number)).map((e) => e.tick);
  const nukedAt = (t: number) => nukesAtMe.some((n) => n <= t && t - n <= 60 * SEC);
  const placements: PlacementReview[] = [];
  for (const s of mine.filter((s) => s.type !== "Warship")) {
    const c = s.context;
    if (!c) continue;
    const fate: PlacementReview["fate"] = s.fate ?? "kept";
    const lostAfter = s.endTick !== undefined ? (s.endTick - s.builtTick) / SEC : null;
    const lostTo = s.fate === "captured" ? name(s.capturedBy) : s.fate === "destroyed" && s.destroyedBy ? name(s.destroyedBy) : null;
    const notes: string[] = [];
    let verdict: Severity = "info";
    let better: PlacementReview["better"];
    const enemyName = c.frontEnemy ? name(c.frontEnemy) : null;
    const hostile = c.frontEnemy !== null && !c.frontEnemyAllied;
    let issue = "";
    const worse = (v: Severity, why?: string) => {
      const rank: Record<Severity, number> = { blunder: 0, mistake: 1, inaccuracy: 2, info: 3, good: 4, brilliant: 5 };
      if (rank[v] < rank[verdict]) {
        verdict = v;
        if (why) issue = why;
      } else if (!issue && why) issue = why;
    };
    const landing = s.endTick !== undefined && data.events.some((e) => e.kind === "UnitIncoming" && e.playerID === sid && e.messageType === 8 && e.tick <= s.endTick! && s.endTick! - e.tick <= 120 * SEC);
    // Losing a building while your whole territory falls is the collapse's
    // fault, not the placement's: only blame the spot if most of your land held.
    const inCollapse =
      s.endTick !== undefined &&
      view.valueAt(sid, "tiles", s.endTick) < 0.5 * Math.max(1, view.valueAt(sid, "tiles", Math.max(s.builtTick, s.endTick - 900)));
    const nuked = fate === "destroyed" && s.endTick !== undefined && nukedAt(s.endTick);
    const where = hostileNear(c);
    if (fate !== "kept" && lostAfter !== null && inCollapse) {
      notes.push(`${fate} at ${clock(s.endTick!)} when your territory collapsed${lostTo ? ` (${lostTo})` : ""}`);
    } else if (nuked) {
      worse(c.underSam ? "info" : "inaccuracy", `${s.type} nuked${c.underSam ? "" : " with no SAM cover"}`);
      notes.push(`destroyed by a nuke at ${clock(s.endTick!)}${c.underSam ? "" : ", with no SAM covering it"}`);
    } else if (fate !== "kept" && lostAfter !== null && lostAfter < 150) {
      worse("mistake", `${s.type} lost ${Math.round(lostAfter)}s after you built it`);
      notes.push(
        `${fate === "captured" ? "captured" : "destroyed"} ${Math.round(lostAfter)}s after you placed it${lostTo ? ` by ${lostTo}` : ""}, while the rest of your land held` +
          (where ? `; it stood ${where}` : landing ? "; it was taken by a naval landing, so it was exposed from the sea" : ""),
      );
    } else if (fate !== "kept" && lostAfter !== null) {
      notes.push(`${fate} at ${clock(s.endTick!)}${lostTo ? ` by ${lostTo}` : ""}`);
    }
    switch (s.type) {
      case "City":
      case "Missile Silo":
      case "Factory": {
        if (hostile && c.distFront !== null && c.distFront < 20) {
          worse(fate === "kept" ? "inaccuracy" : "mistake", `${s.type} ${c.distFront} tiles from ${enemyName}'s border`);
          if (!where || fate === "kept") notes.push(`only ${c.distFront} tiles from ${enemyName}'s border${c.frontEnemyTroops ? ` (${fmtNum(c.frontEnemyTroops)} troops)` : ""}; buildings change hands when that land is taken`);
        } else if (fate === "kept" && (c.distFront === null || c.distFront >= 40) && s.type === "City") {
          if (verdict === "info") verdict = "good";
          notes.push(c.distFront === null ? "no enemy border nearby: safe interior spot" : `${c.distFront} tiles from the nearest enemy border: safe`);
        } else if (s.type === "City" && c.distFront !== null && !notes.some((n) => n.includes("tiles from"))) {
          notes.push(`${c.distFront} tiles from ${c.frontEnemy ? name(c.frontEnemy) : "the nearest enemy"}'s border${c.frontEnemyAllied ? " (an ally)" : ""}`);
        }
        if (s.type === "Factory") {
          if (c.railLinks < 2) {
            worse("inaccuracy", "Factory with almost no rail links");
            notes.push(`only ${c.railLinks} of your Cities/Ports/Factories within rail range (110 tiles); trains need stations to visit to earn anything`);
          } else {
            if (verdict === "info") verdict = "good";
            notes.push(`links ${c.railLinks} of your stations by rail`);
          }
        }
        if (s.type === "Missile Silo" && !c.underSam && !notes.some((n) => n.includes("no SAM"))) notes.push("no SAM covering it");
        if (c.betterSpot && c.distFront !== null && c.betterSpot.distFront && c.betterSpot.distFront > c.distFront * 2 && hostile && c.distFront < 30) {
          better = { x: c.betterSpot.x, y: c.betterSpot.y, why: `deepest point of your land then, ${c.betterSpot.distFront} tiles from any enemy (${away(c, c.betterSpot)})` };
        }
        break;
      }
      case "Port": {
        const t = c.trade;
        if (t && t.partners === 0) {
          worse("mistake", "Port with no trade partners");
          notes.push("no other player's port shared this water, so it could never trade (fine only if it was meant for warships)");
        } else if (t) {
          notes.push(`${t.partners} trade partner${t.partners === 1 ? "" : "s"}, about ${fmtNum(t.expGold)} gold per trade ship${t.medianDist ? `, median route ${t.medianDist} tiles` : ""}`);
          if (t.shortShare >= 0.5) notes.push(`${pct(t.shortShare)} of its partners were under 300 tiles away; short routes pay only a few thousand`);
          if (t.expGold >= 80_000 && verdict === "info") verdict = "good";
        }
        if (t && c.betterSpot?.trade) {
          const gain = c.betterSpot.trade.expGold - t.expGold;
          if (gain >= 15_000 && c.betterSpot.trade.expGold >= t.expGold * 1.25) {
            worse(gain >= 40_000 ? "mistake" : "inaccuracy", "Port on a weaker stretch of coast");
            better = { x: c.betterSpot.x, y: c.betterSpot.y, why: `${away(c, c.betterSpot)} on your coast: about ${fmtNum(c.betterSpot.trade.expGold)} per ship vs ${fmtNum(t.expGold)} here (longer routes)` };
          }
        }
        if (hostile && c.distFront !== null && c.distFront < 20) notes.push(`${c.distFront} tiles from ${enemyName}'s border`);
        break;
      }
      case "Defense Post": {
        if (c.distFront === null) {
          worse("mistake", "Defense Post with no front to defend");
          notes.push("no enemy border anywhere near it; a Defense Post only protects tiles within 30 of it");
        } else if (c.distFront > 40) {
          worse("inaccuracy", `Defense Post ${c.distFront} tiles from the front`);
          notes.push(`${c.distFront} tiles from the nearest front (${enemyName}); it only protects tiles within 30`);
        } else {
          if (verdict === "info") verdict = "good";
          notes.push(`on the ${enemyName} front, ${c.distFront} tiles from the border`);
        }
        if (c.betterSpot?.enemy) {
          better = { x: c.betterSpot.x, y: c.betterSpot.y, why: `the border with ${name(c.betterSpot.enemy)}, your strongest neighbour then (${away(c, c.betterSpot)})` };
          notes.push(`your strongest neighbour was ${name(c.betterSpot.enemy)}, on a different border`);
        }
        break;
      }
      case "SAM Launcher": {
        if ((c.samCovers ?? 0) === 0) {
          worse("mistake", "SAM covering none of your buildings");
          notes.push("covered none of your buildings (level-1 range is 70 tiles)");
        } else {
          if (verdict === "info") verdict = "good";
          notes.push(`covered ${c.samCovers} of your buildings`);
        }
        if (hostile && c.distFront !== null && c.distFront < 25) {
          worse("inaccuracy", `SAM ${c.distFront} tiles from ${enemyName}'s border`);
          notes.push(`${c.distFront} tiles from ${enemyName}'s border: a 1.5M SAM is easy to lose there`);
        }
        break;
      }
    }
    placements.push({
      id: s.id,
      type: s.type,
      tick: s.builtTick,
      x: c.x,
      y: c.y,
      level: s.levels[s.levels.length - 1]?.[1] ?? 1,
      fate,
      endTick: s.endTick ?? null,
      lostTo,
      verdict,
      issue: issue || (verdict === "good" ? `Well-placed ${s.type}` : s.type),
      notes,
      better,
      context: c,
    });
  }
  const sevRank: Record<string, number> = { blunder: 0, mistake: 1, inaccuracy: 2 };
  const badPlacements = placements.filter((p) => p.verdict in sevRank).sort((a, b) => sevRank[a.verdict] - sevRank[b.verdict]);
  for (const p of badPlacements.slice(0, 3)) {
    moments.push({
      tick: p.tick,
      kind: "build",
      severity: p.verdict,
      title: p.issue,
      detail: `${clock(p.tick)}: ${p.notes.join("; ")}.`,
      suggestion: p.better ? `Better spot: ${p.better.why}.` : undefined,
      focus: p.context?.frontEnemy ? [p.context.frontEnemy] : [],
      evidence: { type: p.type, x: p.x, y: p.y, fate: p.fate, distFront: p.context?.distFront ?? null },
    });
  }

  // ---- warships --------------------------------------------------------------
  const ports = mine.filter((s) => s.type === "Port" && s.context);
  const warReviews: WarshipReview[] = [];
  for (const w of mine.filter((s) => s.type === "Warship")) {
    const path = w.path ?? [];
    let near = 0;
    let counted = 0;
    for (const [t, x, y] of path) {
      const live = ports.filter((p) => p.builtTick <= t && (p.endTick === undefined || p.endTick > t));
      if (!live.length) continue;
      counted++;
      if (live.some((p) => Math.hypot(p.context!.x - x, p.context!.y - y) <= 100)) near++;
    }
    const share = counted ? near / counted : null;
    const lostAfter = w.endTick !== undefined ? (w.endTick - w.builtTick) / SEC : null;
    let verdict: Severity = "info";
    let note = "";
    if (w.fate && lostAfter !== null && lostAfter < 90) {
      verdict = "mistake";
      note = `lost ${Math.round(lostAfter)}s after launch`;
    } else if (share !== null && share < 0.3) {
      verdict = "inaccuracy";
      note = `spent ${pct(1 - share)} of its time more than 100 tiles from your ports, where your trade ships sail`;
    } else if (share !== null) {
      verdict = "good";
      note = `stayed near your ports ${pct(share)} of the time`;
    }
    warReviews.push({ id: w.id, tick: w.builtTick, endTick: w.endTick ?? null, fate: w.fate ?? "kept", lostTo: w.fate === "captured" ? name(w.capturedBy) : w.destroyedBy ? name(w.destroyedBy) : null, path, nearPortShare: share, verdict, note });
  }
  const tradeStats = meRec.stats?.boats?.trade ?? [];
  const transStats = meRec.stats?.boats?.trans ?? [];
  const capturedMsgs = data.events.filter((e) => e.kind === "Message" && e.playerID === sid && String(e.message ?? "").includes("trade_ship_captured")).length;
  // Older records have no "lost" entry in the trade stats; the in-game messages always do.
  const tradeShipsLost = Math.max(Number(tradeStats[4] ?? 0), capturedMsgs);
  const enemyTradeCaptured = Number(tradeStats[2] ?? 0);
  const transportsLost = Number(transStats[4] ?? 0);
  const lostTo = new Map<string, number>();
  for (const e of data.events) {
    if (e.kind !== "Message" || e.playerID !== sid) continue;
    if (String(e.message ?? "").includes("trade_ship_captured")) {
      const who = String((e.params as Record<string, unknown> | undefined)?.name ?? "someone");
      lostTo.set(who, (lostTo.get(who) ?? 0) + 1);
    }
  }
  const tradeLostTo = [...lostTo.entries()].map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count);
  const wAdvice: string[] = [];
  if (tradeShipsLost >= 3 && warReviews.length === 0) {
    wAdvice.push(`${tradeShipsLost} of your trade ships were captured${tradeLostTo[0] ? `, ${tradeLostTo[0].count} of them by ${tradeLostTo[0].name}` : ""}, and you had no warship. One warship parked by your busiest port (250k) protects every ship that passes it.`);
    moments.push({
      tick: endTick - 3,
      kind: "naval",
      severity: tradeShipsLost >= 6 ? "mistake" : "inaccuracy",
      title: `${tradeShipsLost} trade ships captured with no warship to protect them`,
      detail: tradeLostTo.map((t) => `${t.name} took ${t.count}`).join(", ") + ".",
      suggestion: "Buy a warship once you have two or more ports, and keep it within 100 tiles of them.",
      evidence: { tradeShipsLost },
    });
  }
  if (tradeShipsLost >= 5 && warReviews.length > 0) {
    const sunkFast = warReviews.filter((w) => w.verdict === "mistake").length;
    const top = tradeLostTo[0];
    wAdvice.push(
      `${tradeShipsLost} of your trade ships were still captured despite ${warReviews.length} warship${warReviews.length > 1 ? "s" : ""}${top ? `; ${top.name} alone took ${top.count}` : ""}.` +
        (sunkFast ? ` ${sunkFast} of your warships were sunk within 90 seconds of launch: send them out in pairs, or after the enemy warship has moved on, rather than one at a time into its range.` : "") +
        " Keep them on the lanes between your ports and your partners' ports, where captures happen.",
    );
    moments.push({
      tick: endTick - 4,
      kind: "naval",
      severity: tradeShipsLost >= 12 ? "mistake" : "inaccuracy",
      title: `${tradeShipsLost} trade ships captured${top ? `, ${top.count} by ${top.name}` : ""}`,
      detail: `Each captured ship pays its full value to the captor instead of you. Your warships: ${warReviews.map((w) => w.note).filter(Boolean).join("; ")}.`,
      suggestion: "Guard your trade lanes with warships in pairs, and don't sail into an enemy warship's range alone.",
      focus: [],
      evidence: { tradeShipsLost, warships: warReviews.length },
    });
  }
  if (warReviews.some((w) => w.verdict === "inaccuracy")) wAdvice.push("Warships patrol about 100 tiles around where you send them. Park them by your own ports and trade lanes rather than chasing far-off targets.");
  if (warReviews.length && !ports.length) wAdvice.push("You built warships without any ports: they had no trade to guard. Without ports, a warship mostly helps by hunting enemy transports near your coast.");
  if (!warReviews.length && enemyTradeCaptured === 0 && tradeShipsLost === 0 && ports.length >= 2) wAdvice.push("Your ports traded safely this game. If an enemy warship starts taking your ships, answer with one of your own near the busiest port.");
  if (enemyTradeCaptured > 0) wAdvice.push(`Your warships captured ${enemyTradeCaptured} enemy trade ship${enemyTradeCaptured > 1 ? "s" : ""}: piracy pays the captor the ship's full value.`);

  // ---- benchmark: the strongest human in the lobby ------------------------------
  const tenMin = spEnd + 600 * SEC;
  const youCounts = countsAt(structs, sid, tenMin);
  const share = (m: PlayerMetrics) => (m.goldEarned > 0 ? (m.goldBySource.trade + m.goldBySource.trainSelf + m.goldBySource.trainOther) / m.goldEarned : null);
  const others = all.filter((m) => m.smallID !== sid);
  const top = [...others].sort((a, b) => Number(b.alive) - Number(a.alive) || b.peakLandShare - a.peakLandShare)[0];
  const actionsOf = (clientID: string) => data.actions.filter((a) => a.clientID === clientID);
  const rel = (t: number | null, m: PlayerMetrics) => (t === null ? null : (t - m.spawnPhaseEndTick) / SEC);
  const benchmark = top
    ? {
        name: top.name,
        result: top.alive ? `finished with ${pct(top.finalLandShare, 1)} of the map` : `peaked at ${pct(top.peakLandShare, 1)}`,
        firstCity: rel(firstBuild(actionsOf(top.clientID), "City"), top),
        firstPort: rel(firstBuild(actionsOf(top.clientID), "Port"), top),
        firstFactory: rel(firstBuild(actionsOf(top.clientID), "Factory"), top),
        counts10: countsAt(structs, top.smallID, top.spawnPhaseEndTick + 600 * SEC),
        tradeShare: share(top),
      }
    : null;
  const you = {
    firstCity: rel(firstBuild(actions, "City"), me),
    firstPort: rel(firstBuild(actions, "Port"), me),
    firstFactory: rel(firstBuild(actions, "Factory"), me),
    counts10: youCounts,
    tradeShare: share(me),
  };

  // ---- economy advice ---------------------------------------------------------
  const advice: string[] = [];
  const spent = spending.economy + spending.defense + spending.military + spending.nukes;
  const lobbyTrade = median(others.map((m) => share(m) ?? NaN));
  if (!mine.some((s) => s.type === "Port") && (lobbyTrade ?? 0) >= 0.15) {
    advice.push(`Trade was paying in this lobby: the median human earned ${pct(lobbyTrade ?? 0)} of their gold from trade and trains, and you built no Port. If you hold any coast, a Port 300+ tiles from other players' ports earns 50–130k per trade ship, and both ends get paid.`);
  }
  if (you.firstCity !== null && you.firstCity > 150) advice.push(`Your first City came at ${clock(you.firstCity * SEC)} after spawn${benchmark?.firstCity ? `; ${benchmark.name} built theirs at ${clock(benchmark.firstCity * SEC)}` : ""}. Aim for 125k gold, then a City at once, by about 2:30.`);
  if (you.firstCity === null && me.lifeTicks > 2400) advice.push("You never built a City. It's the best early purchase: each level adds 250k troop cap.");
  const cities10 = youCounts.City ?? 0;
  if (cities10 >= 3 && !mine.some((s) => s.type === "Factory")) advice.push(`You had ${cities10} Cities but no Factory. A Factory puts rail between your Cities and Ports within 110 tiles; each train pays 10k per stop at your own Cities and 25–35k at neighbours'.`);
  if (spent > 0 && spending.economy / spent < 0.4 && me.lifeTicks > 3600) advice.push(`Only ${pct(spending.economy / spent)} of your spending went to the economy (Cities, Ports, Factories). Until minute ~8, most gold should go there.`);
  if (me.floatMinutes !== null && me.floatMinutes > 3) advice.push(`You sat on ${me.floatMinutes.toFixed(1)} minutes of income on average. Spend as it comes in, unless you're saving for a specific nuke.`);
  if (benchmark && benchmark.tradeShare !== null && you.tradeShare !== null && benchmark.tradeShare - you.tradeShare > 0.2) {
    advice.push(`${benchmark.name} made ${pct(benchmark.tradeShare)} of their gold from trade and trains; you made ${pct(you.tradeShare)}. They had ${benchmark.counts10.Port ?? 0} Ports and ${benchmark.counts10.Factory ?? 0} Factories at 10:00; you had ${youCounts.Port ?? 0} and ${youCounts.Factory ?? 0}.`);
  }
  for (const p of placements.filter((p) => p.better).slice(0, 2)) advice.push(`${p.type} at ${clock(p.tick)}: ${p.notes[0]}. Better: ${p.better!.why}.`);
  // Build order for ports and cities: which spots paid off, which went first.
  const costOf = (p: PlacementReview) => buildOrder.find((b) => b.unit === p.type && !b.upgrade && Math.abs(b.tick - p.tick) <= 30 * SEC)?.cost ?? 0;
  const myPorts = placements.filter((p) => p.type === "Port");
  const lostEarlyPorts = myPorts.filter((p) => p.fate !== "kept" && p.endTick !== null && p.endTick - p.tick < 150 * SEC && !p.notes.some((n) => n.includes("collapsed") || n.includes("nuke")));
  const bestPort = [...myPorts].filter((p) => p.fate === "kept" && p.context?.trade).sort((a, b) => b.context!.trade!.expGold - a.context!.trade!.expGold)[0];
  if (lostEarlyPorts.length && bestPort) {
    const first = lostEarlyPorts[0];
    advice.push(
      `Port order: ${lostEarlyPorts.length} of your Ports were lost within 2.5 minutes of building them${hostileNear(first.context!) ? ` (the first stood ${hostileNear(first.context!)})` : ""}, at ${fmtNum(lostEarlyPorts.reduce((a, p) => a + costOf(p), 0))} gold. ` +
        `Your best Port, built at ${clock(bestPort.tick)}, earned about ${fmtNum(bestPort.context!.trade!.expGold)} per trade ship and was never lost. Next time, build your first Port on that safe stretch of coast, then add more along coasts away from your fronts.`,
    );
  }
  const lostEarlyCities = placements.filter((p) => p.type === "City" && p.fate !== "kept" && p.endTick !== null && p.endTick - p.tick < 150 * SEC && !p.notes.some((n) => n.includes("collapsed")));
  if (lostEarlyCities.length >= 1) {
    const nukedCities = lostEarlyCities.filter((p) => p.notes.some((n) => n.includes("nuke")));
    advice.push(
      `City placement: ${lostEarlyCities.length} of your Cities were lost within 2.5 minutes of building them` +
        (nukedCities.length ? `, ${nukedCities.length} to nukes` : "") +
        `. Put Cities where enemies can't reach them quickly: deep inside your land${nukedCities.length ? ", under a SAM once rivals own Missile Silos" : ""}.`,
    );
  }

  // Score: placement quality, income vs lobby, structures kept, and spending discipline.
  const vScore: Record<Severity, number> = { brilliant: 100, good: 90, info: 70, inaccuracy: 50, mistake: 25, blunder: 10 };
  const placeScore = placements.length ? placements.reduce((a, p) => a + vScore[p.verdict], 0) / placements.length : 55;
  const inc = incomeAt.find((x) => x.sec === 600) ?? incomeAt[incomeAt.length - 1];
  const incScore = inc && inc.you !== null && inc.median ? Math.max(10, Math.min(100, 60 * (inc.you / inc.median))) : 60;
  const score = Math.round(0.55 * placeScore + 0.45 * incScore);

  return {
    report: {
      income,
      totals,
      incomeAt,
      spending,
      buildOrder,
      placements,
      warships: { reviews: warReviews, tradeShipsLost, tradeLostTo, enemyTradeCaptured, transportsLost, advice: wAdvice },
      you,
      benchmark,
      advice,
      score,
    },
    moments,
  };
}
