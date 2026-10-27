import type { AttackRecord } from "../engine/replayTypes.js";
import type { GameRecord } from "../openfront/types.js";
import type { PlayerMetrics } from "./metrics.js";
import { median } from "./metrics.js";
import { ReplayView } from "./replayView.js";
import { clock, fmtNum, pct, TICKS_PER_SECOND } from "./rules.js";
import type { AttackLedgerRow, KeyMoment, Severity } from "./types.js";

const SEC = TICKS_PER_SECOND;

interface Ctx {
  view: ReplayView;
  record: GameRecord;
  me: PlayerMetrics;
  all: PlayerMetrics[];
  myId: string | null;
}

let seq = 0;
function moment(m: Omit<KeyMoment, "id">): KeyMoment {
  return { id: `m${++seq}`, ...m };
}

function shareAt(ctx: Ctx, tick: number) {
  return ctx.view.valueAt(ctx.me.smallID, "tiles", tick) / ctx.view.landTiles;
}

function landDelta(ctx: Ctx, tick: number, after = 60 * SEC) {
  const end = Math.min(ctx.view.data.meta.ticks, tick + after);
  return +((shareAt(ctx, end) - shareAt(ctx, tick)) * 100).toFixed(2);
}

/** Build the attack ledger for the focus player and flag notable attacks. */
export function attackLedger(ctx: Ctx): { rows: AttackLedgerRow[]; moments: KeyMoment[] } {
  const { view, me } = ctx;
  const sid = me.smallID;
  const mine = view.data.attacks.filter((a) => a.attacker === sid);
  const rows: AttackLedgerRow[] = [];
  // Efficiency distribution of every human's real (non-merged) attacks on
  // players in this game, so "bad" means bad for this lobby.
  const humanIds = new Set(view.humans().map((h) => h.smallID));
  const effOf = (a: AttackRecord) => {
    const used = Math.max(0, a.troops - (a.lastTroops ?? 0));
    const gain = Math.max(0, (a.attackerTilesEnd ?? a.attackerTilesStart) - a.attackerTilesStart);
    const loss = a.target ? Math.max(0, a.targetTilesStart - (a.targetTilesEnd ?? a.targetTilesStart)) : gain;
    const taken = a.tilesCaptured ?? Math.min(gain, loss);
    return used > 0 ? (taken / used) * 1000 : null;
  };
  const isMerged = (a: AttackRecord) => ((a.endTick ?? a.lastTick) - a.startTick) / SEC < 2 && Math.max(0, a.troops - (a.lastTroops ?? 0)) < 0.3 * a.troops;
  const lobby = view.data.attacks
    .filter((a) => humanIds.has(a.attacker) && (a.targetType === "Human" || a.targetType === "Nation") && !isMerged(a))
    .map(effOf)
    .filter((x): x is number => x !== null)
    .sort((x, y) => x - y);
  const q = (p: number) => (lobby.length ? lobby[Math.min(lobby.length - 1, Math.floor(p * lobby.length))] : null);
  const p25 = q(0.25);
  const p75 = q(0.75);
  const peers = humanIds.size > 1 ? "of this lobby" : "of your attacks this game";
  const flagged: { sev: Severity; score: number; m: KeyMoment }[] = [];

  for (const a of mine) {
    const before = a.troops + a.attackerTroopsAfterLaunch;
    const ratio = before > 0 ? a.troops / before : null;
    const troopsUsed = Math.max(0, a.troops - (a.lastTroops ?? 0));
    const ownGain = Math.max(0, (a.attackerTilesEnd ?? a.attackerTilesStart) - a.attackerTilesStart);
    const targetLoss = a.target ? Math.max(0, a.targetTilesStart - (a.targetTilesEnd ?? a.targetTilesStart)) : ownGain;
    // Exact captures when the harness recorded them; otherwise estimate from net tile changes.
    const tilesGained = a.tilesCaptured ?? (a.target ? Math.min(ownGain, targetLoss) : ownGain);
    const tpk = troopsUsed > 0 ? (tilesGained / troopsUsed) * 1000 : null;
    const isPlayer = a.targetType === "Human" || a.targetType === "Nation";
    const durationS = Math.max(0, (a.endTick ?? a.lastTick) - a.startTick) / SEC;
    let verdict: Severity = "info";
    let note = "";

    if (isPlayer) {
      const stackVsArmy = a.targetTroopsStart > 0 ? a.troops / a.targetTroopsStart : 99;
      const eliminated = a.targetAliveEnd === false;
      const significant = troopsUsed > 0.15 * before;
      if (isMerged(a)) {
        note = "joined an attack already under way";
      } else if (eliminated && tilesGained > 0) {
        verdict = "good";
        note = `finished off ${view.name(a.target)}`;
      } else if (a.retreated && significant) {
        verdict = "inaccuracy";
        note = "retreated: a retreat from a player forfeits 25% of the surviving troops";
      } else if (tpk !== null && p25 !== null && tpk < p25 && significant && tilesGained < Math.max(30, a.targetTilesStart * 0.1)) {
        verdict = ratio !== null && ratio >= 0.6 && !a.naval ? "blunder" : a.naval ? "inaccuracy" : "mistake";
        note =
          `spent ${fmtNum(troopsUsed)} troops for ${fmtNum(tilesGained)} tiles (${tpk.toFixed(1)} per 1k, bottom quarter ${peers})` +
          (stackVsArmy < 0.5 ? `; your ${fmtNum(a.troops)} stack was ${pct(stackVsArmy)} of their ${fmtNum(a.targetTroopsStart)} army, and stacks below ~60% of the defender's army pay up to double losses per tile` : "") +
          (ratio !== null && ratio >= 0.6 ? `; it was a ${pct(ratio)} send` : "");
      } else if (ratio !== null && ratio >= 0.6 && a.startTick > me.spawnPhaseEndTick + 600 && significant && tilesGained < a.targetTilesStart * 0.25) {
        verdict = "inaccuracy";
        note = `full send (${pct(ratio)} of your troops) left you at ${pct(a.attackerTroopsAfterLaunch / Math.max(1, before))} and took only ${fmtNum(tilesGained)} tiles`;
      } else if (tpk !== null && p75 !== null && tpk >= p75 && tilesGained > view.landTiles * 0.002) {
        verdict = "good";
        note = `efficient: ${tpk.toFixed(0)} tiles per 1k troops (top quarter ${peers})`;
      }
    } else if (a.targetType === "TerraNullius") {
      note = "expansion into unclaimed land";
    } else if (a.targetType === "Bot") {
      note = "attack on a bot tribe";
      if (tpk !== null && tpk > 25) verdict = "good";
    }

    rows.push({
      tick: a.startTick,
      endTick: a.endTick ?? a.lastTick,
      target: view.name(a.target),
      targetType: a.targetType,
      naval: a.naval,
      sent: a.troops,
      ratio,
      troopsUsed,
      tilesGained,
      tilesPer1kTroops: tpk,
      targetTroopsAtStart: a.targetTroopsStart,
      retreated: a.retreated,
      verdict,
      note,
    });

    if (verdict === "mistake" || verdict === "blunder" || verdict === "inaccuracy" || (verdict === "good" && isPlayer)) {
      const severityWeight = { blunder: 4, mistake: 3, inaccuracy: 1.5, good: 2, brilliant: 3, info: 0 }[verdict];
      flagged.push({
        sev: verdict,
        score: severityWeight * Math.log10(10 + a.troops),
        m: moment({
          tick: a.startTick,
          kind: "attack",
          focus: a.target ? [a.target] : [],
          severity: verdict,
          title:
            verdict === "good"
              ? `Strong attack on ${view.name(a.target)}`
              : `${a.naval ? "Naval attack" : "Attack"} on ${view.name(a.target)} went badly`,
          detail: `${clock(a.startTick)} — ${note}. The attack ran ${durationS.toFixed(0)}s.`,
          suggestion:
            verdict === "good"
              ? undefined
              : a.retreated
                ? "Commit or don't start: pick targets you can finish, and let a stalled attack burn out against unclaimed land rather than retreating from a player."
                : "Hit players who are already fighting someone else, and send a stack at least ~1.7× their whole army (or wait until they are weaker).",
          landShareDelta: landDelta(ctx, a.startTick),
          evidence: {
            sent: a.troops,
            ratio: ratio === null ? null : +ratio.toFixed(2),
            targetType: a.targetType,
            targetTroops: a.targetTroopsStart,
            targetTiles: a.targetTilesStart,
            tilesGained,
            troopsUsed,
            retreated: a.retreated,
            naval: a.naval,
            yourTroopsLeft: a.attackerTroopsAfterLaunch,
          },
        }),
      });
    }
  }

  // Fold repeated bad attacks on the same target into one moment.
  const rank: Record<Severity, number> = { blunder: 5, mistake: 4, inaccuracy: 3, info: 2, good: 1, brilliant: 0 };
  const badAll = flagged.filter((f) => f.sev !== "good");
  const groups = new Map<string, typeof badAll>();
  for (const f of badAll) {
    const key = String(f.m.title);
    groups.set(key, [...(groups.get(key) ?? []), f]);
  }
  const folded: typeof badAll = [];
  for (const g of groups.values()) {
    if (g.length === 1) {
      folded.push(g[0]);
      continue;
    }
    g.sort((x, y) => x.m.tick - y.m.tick);
    const worst = [...g].sort((x, y) => rank[y.sev] - rank[x.sev])[0];
    const used = g.reduce((a, f) => a + Number(f.m.evidence.troopsUsed ?? 0), 0);
    const tiles = g.reduce((a, f) => a + Number(f.m.evidence.tilesGained ?? 0), 0);
    const target = worst.m.title.replace(/^(Naval attack|Attack) on /, "").replace(/ went badly$/, "");
    folded.push({
      sev: worst.sev,
      score: g.reduce((a, f) => a + f.score, 0),
      m: {
        ...worst.m,
        tick: g[0].m.tick,
        title: `${g.length} attacks on ${target} went badly`,
        detail: `Between ${clock(g[0].m.tick)} and ${clock(g[g.length - 1].m.tick)} you spent ${fmtNum(used)} troops on ${target} for ${fmtNum(tiles)} tiles (${used > 0 ? ((tiles / used) * 1000).toFixed(1) : "0"} per 1k). Worst one: ${worst.m.detail}`,
        evidence: { ...worst.m.evidence, attacks: g.length, totalTroopsUsed: used, totalTilesGained: tiles },
      },
    });
  }
  folded.sort((x, y) => y.score - x.score);
  flagged.sort((x, y) => y.score - x.score);
  const bad = folded.slice(0, 4);
  const good = flagged.filter((f) => f.sev === "good").slice(0, 2);
  return { rows, moments: [...bad, ...good].map((f) => f.m) };
}

function intervals(ticks: number[], pred: (i: number) => boolean, minTicks: number) {
  const out: { start: number; end: number; i0: number; i1: number }[] = [];
  let s = -1;
  for (let i = 0; i <= ticks.length; i++) {
    const on = i < ticks.length && pred(i);
    if (on && s < 0) s = i;
    if (!on && s >= 0) {
      const start = ticks[s];
      const end = ticks[i - 1];
      if (end - start >= minTicks) out.push({ start, end, i0: s, i1: i - 1 });
      s = -1;
    }
  }
  return out;
}

export function detectMoments(ctx: Ctx): { moments: KeyMoment[]; ledger: AttackLedgerRow[] } {
  seq = 0;
  const { view, me, all } = ctx;
  const sid = me.smallID;
  const ticks = view.ticks;
  const spEnd = me.spawnPhaseEndTick;
  const end = me.eliminatedTick ?? view.data.meta.ticks;
  const moments: KeyMoment[] = [];
  const others = all.filter((m) => m.smallID !== sid);

  // ---- Opening --------------------------------------------------------
  if (me.firstExpansionTick !== null && me.firstExpansionTick - spEnd > 30) {
    const delay = (me.firstExpansionTick - spEnd) / SEC;
    moments.push(
      moment({
        tick: me.firstExpansionTick,
        kind: "opening",
        severity: delay > 10 ? "mistake" : "inaccuracy",
        title: "Slow first expansion",
        detail: `Your first expansion went out ${delay.toFixed(0)}s after the spawn phase ended. Every second at the start is land the neighbours take first.`,
        suggestion: "Have your first big send (60–100% of starting troops) queued the moment the spawn timer ends.",
        landShareDelta: landDelta(ctx, me.firstExpansionTick),
        evidence: { delaySeconds: +delay.toFixed(1) },
      }),
    );
  }
  const med60 = median(others.map((o) => o.landShareAt["60"] ?? NaN));
  const med120 = median(others.map((o) => o.landShareAt["120"] ?? NaN));
  const my120 = me.landShareAt["120"];
  if (my120 !== null && med120 !== null && med120 > 0) {
    const rel = my120 / med120;
    const openingRatios = view.data.actions
      .filter((a) => a.clientID === me.clientID && (a.type === "attack" || a.type === "boat") && a.tick <= spEnd + 1200)
      .map((a) => (a.sent ?? 0) / Math.max(1, a.troops ?? 1));
    const avgOpenRatio = openingRatios.length ? openingRatios.reduce((a, b) => a + b, 0) / openingRatios.length : null;
    if (rel < 0.6) {
      moments.push(
        moment({
          tick: spEnd + 120 * SEC,
          kind: "opening",
          severity: rel < 0.35 ? "mistake" : "inaccuracy",
          title: "Opening fell behind",
          detail:
            `At 2:00 after spawn you held ${pct(my120, 2)} of the land; the median human held ${pct(med120, 2)}.` +
            (avgOpenRatio !== null ? ` Your opening sends averaged ${pct(avgOpenRatio)} of your troops.` : ""),
          suggestion:
            avgOpenRatio !== null && avgOpenRatio < 0.4
              ? "Open with bigger sends into unclaimed land (60–70%, or 100% on the very first click), then drop the ratio once you touch neighbours."
              : "Pick a spawn with open unclaimed land on at least two sides and expand along two lanes, not three.",
          landShareDelta: undefined,
          evidence: { yourShare120: +(my120 * 100).toFixed(2), medianShare120: +(med120 * 100).toFixed(2), avgOpeningRatio: avgOpenRatio === null ? null : +avgOpenRatio.toFixed(2), median60: med60 === null ? null : +(med60 * 100).toFixed(2) },
        }),
      );
    } else if (rel > 1.6) {
      moments.push(
        moment({
          tick: spEnd + 120 * SEC,
          kind: "opening",
          severity: "good",
          title: "Excellent opening",
          detail: `At 2:00 after spawn you held ${pct(my120, 2)} of the land, ${rel.toFixed(1)}× the median human.`,
          landShareDelta: undefined,
          evidence: { yourShare120: +(my120 * 100).toFixed(2), medianShare120: +(med120 * 100).toFixed(2) },
        }),
      );
    }
  }

  // ---- Attacks ----------------------------------------------------------
  const { rows: ledger, moments: attackMoments } = attackLedger(ctx);
  moments.push(...attackMoments);

  // ---- Troops: idle at cap, overextended under attack ---------------------
  const s = view.series(sid);
  if (s) {
    const troops = view.aligned(sid, "troops");
    const maxT = view.aligned(sid, "maxTroops");
    const alive = view.aligned(sid, "alive");
    const atk = view.aligned(sid, "attacksOut");
    const inc = view.aligned(sid, "attacksIn");
    const capRuns = intervals(
      ticks,
      (i) => ticks[i] > spEnd && ticks[i] <= end && !!alive[i] && maxT[i] > 0 && troops[i] / maxT[i] >= 0.88 && atk[i] === 0,
      30 * SEC,
    ).sort((a, b) => b.end - b.start - (a.end - a.start));
    for (const r of capRuns.slice(0, 2)) {
      const dur = (r.end - r.start) / SEC;
      moments.push(
        moment({
          tick: r.start,
          kind: "troops",
          severity: dur >= 90 ? "mistake" : "inaccuracy",
          title: `Army idle at the troop cap for ${dur.toFixed(0)}s`,
          detail: `From ${clock(r.start)} to ${clock(r.end)} your troops sat above 88% of the cap with no attack running. Troop growth falls to zero at the cap and peaks around 42%.`,
          suggestion: "When the bar is nearly full, spend it: take land from bots or a weak neighbour, or build a City to raise the cap.",
          landShareDelta: landDelta(ctx, r.start),
          evidence: { seconds: dur, troops: troops[r.i0], cap: maxT[r.i0] },
        }),
      );
    }
    const overRuns = intervals(
      ticks,
      (i) => ticks[i] > spEnd + 300 && ticks[i] <= end && !!alive[i] && maxT[i] > 0 && troops[i] / maxT[i] < 0.12 && inc[i] > troops[i],
      10 * SEC,
    );
    for (const r of overRuns.slice(0, 2)) {
      const hitters = [...new Set(view.data.attacks.filter((a) => a.target === sid && a.startTick <= r.end && (a.endTick ?? a.lastTick) >= r.start).map((a) => a.attacker))];
      moments.push(
        moment({
          tick: r.start,
          kind: "troops",
          focus: hitters.slice(0, 3),
          severity: "mistake",
          title: "Caught with an empty army",
          detail: `At ${clock(r.start)} you were under attack by ${fmtNum(inc[r.i0])} troops while holding only ${fmtNum(troops[r.i0])} (${pct(troops[r.i0] / Math.max(1, maxT[r.i0]))} of your cap).`,
          suggestion: "Keep 35–50% of your cap at home whenever a neighbour can reach you; only full-send when nobody can punish it.",
          landShareDelta: landDelta(ctx, r.start),
          evidence: { troops: troops[r.i0], incoming: inc[r.i0], cap: maxT[r.i0] },
        }),
      );
    }
  }

  // ---- Collapses and surges ----------------------------------------------
  const tiles = view.aligned(sid, "tiles");
  const win = Math.max(1, Math.round((60 * SEC) / view.data.meta.sampleEvery));
  const used = new Set<number>();
  const drops: { i: number; drop: number }[] = [];
  const gains: { i: number; gain: number }[] = [];
  for (let i = 0; i + win < tiles.length; i++) {
    if (ticks[i] < spEnd) continue;
    const a = tiles[i];
    const b = tiles[i + win];
    if (a > view.landTiles * 0.003 && (a - b) / a >= 0.15) drops.push({ i, drop: (a - b) / a });
    if (b - a > view.landTiles * 0.02 || (a > view.landTiles * 0.003 && (b - a) / a >= 0.5)) gains.push({ i, gain: b - a });
  }
  drops.sort((x, y) => y.drop - x.drop);
  for (const d of drops) {
    if ([...used].some((u) => Math.abs(u - d.i) < win * 2)) continue;
    if (used.size >= 3) break;
    used.add(d.i);
    const t0 = ticks[d.i];
    const t1 = ticks[d.i + win];
    const takers = view.takenFrom(sid, t0, t1).filter((x) => x.to !== 0);
    const attackers = view.data.attacks.filter((a) => a.target === sid && a.startTick <= t1 && (a.endTick ?? a.lastTick) >= t0);
    const byAttacker = new Map<number, number>();
    for (const a of attackers) byAttacker.set(a.attacker, (byAttacker.get(a.attacker) ?? 0) + a.troops);
    const main = [...byAttacker.entries()].sort((x, y) => y[1] - x[1])[0];
    const nukes = view.data.events.filter((e) => e.kind === "UnitIncoming" && e.playerID === sid && e.tick >= t0 - 100 && e.tick <= t1 && [4, 5, 7].includes(e.messageType as number));
    const myOut = view.data.attacks.filter((a) => a.attacker === sid && a.startTick <= t1 && (a.endTick ?? a.lastTick) >= t0 && a.target);
    const betrayed = view.data.events.find((e) => e.kind === "BrokeAlliance" && e.betrayedID === sid && e.tick >= t0 - 600 && e.tick <= t1);
    const troopRatio = view.valueAt(sid, "troops", t0) / Math.max(1, view.valueAt(sid, "maxTroops", t0));
    const causes: string[] = [];
    if (main) causes.push(`${view.name(main[0])} (${view.type(main[0]).toLowerCase()}) attacked with ${fmtNum(main[1])} troops`);
    if (takers[0] && (!main || takers[0].to !== main[0])) causes.push(`${view.name(takers[0].to)} took the most ground`);
    if (nukes.length) causes.push(`${nukes.length} nuke${nukes.length > 1 ? "s" : ""} hit you`);
    if (betrayed) causes.push(`${view.name(betrayed.traitorID as number)} broke your alliance first`);
    const otherFronts = [...new Set(myOut.map((a) => a.target).filter((t) => !main || t !== main[0]))];
    if (otherFronts.length) causes.push(`you were attacking ${otherFronts.map((t) => view.name(t)).join(", ")} at the same time`);
    if (troopRatio < 0.25) causes.push(`your army was at ${pct(troopRatio)} of its cap going in`);
    const dps = view.unitCountAt(sid, "Defense Post", t0);
    const severity: Severity = d.drop >= 0.5 ? "blunder" : d.drop >= 0.3 ? "mistake" : "inaccuracy";
    moments.push(
      moment({
        tick: t0,
        kind: "collapse",
        focus: [...new Set([...(main ? [main[0]] : []), ...takers.slice(0, 2).map((t) => t.to)])],
        severity,
        title: `Lost ${pct(d.drop)} of your territory in a minute`,
        detail: `${clock(t0)}–${clock(t1)}: ${causes.join("; ") || "pressure on several fronts"}.`,
        suggestion:
          otherFronts.length && main
            ? "Avoid two-front wars: before attacking, check who borders you and whether they are free to hit you back."
            : nukes.length
              ? "Cover your core with overlapping SAM launchers once rivals can afford nukes (around minute 5+)."
              : troopRatio < 0.25
                ? "Don't let your army drain below ~35% of the cap when a strong neighbour is idle."
                : dps === 0
                  ? "Put a Defense Post on the border you expect to be hit; it multiplies attacker losses."
                  : "Ally or make peace with one side before a bigger neighbour turns on you.",
        landShareDelta: +((-(tiles[d.i] - tiles[d.i + win]) / view.landTiles) * 100).toFixed(2),
        evidence: {
          tilesBefore: tiles[d.i],
          tilesAfter: tiles[d.i + win],
          mainAttacker: main ? view.name(main[0]) : null,
          attackerTroops: main ? main[1] : null,
          nukes: nukes.length,
          twoFront: otherFronts.length > 0,
          troopRatio: +troopRatio.toFixed(2),
          defensePosts: dps,
          betrayed: !!betrayed,
        },
      }),
    );
  }
  gains.sort((x, y) => y.gain - x.gain);
  const usedG = new Set<number>();
  for (const g of gains) {
    if ([...usedG].some((u) => Math.abs(u - g.i) < win * 2)) continue;
    if (usedG.size >= 2) break;
    usedG.add(g.i);
    const t0 = ticks[g.i];
    const t1 = ticks[g.i + win];
    const conquered = view.data.events.filter((e) => e.kind === "ConquestEvent" && e.conquerorId === ctx.myId && e.tick >= t0 && e.tick <= t1);
    moments.push(
      moment({
        tick: t0,
        kind: "surge",
        focus: conquered.map((c) => view.byId.get(c.conqueredId as string)).filter((v) => v && v.type !== "Bot").map((v) => v!.smallID),
        severity: g.gain > view.landTiles * 0.05 ? "brilliant" : "good",
        title: `Big push: +${pct(g.gain / view.landTiles, 1)} of the map in a minute`,
        detail: `${clock(t0)}–${clock(t1)}` + (() => {
          if (!conquered.length) return ".";
          const victims = conquered.map((c) => view.byId.get(c.conqueredId as string));
          const named = victims.filter((v) => v && v.type !== "Bot").map((v) => v!.name);
          const bots = victims.length - named.length;
          const parts = [...named, ...(bots ? [`${bots} bot tribe${bots > 1 ? "s" : ""}`] : [])];
          return `, eliminating ${parts.join(", ")}.`;
        })(),
        landShareDelta: +((g.gain / view.landTiles) * 100).toFixed(2),
        evidence: { tilesGained: g.gain, eliminations: conquered.length },
      }),
    );
  }

  // ---- Economy -------------------------------------------------------------
  const gameSecs = (end - spEnd) / SEC;
  if (me.firstCityTick === null && gameSecs > 240) {
    moments.push(
      moment({
        tick: spEnd + 180 * SEC,
        kind: "economy",
        severity: "mistake",
        title: "Never built a City",
        detail: `You played ${Math.round(gameSecs / 60)} minutes without a City. Each City level adds 250k to your troop cap, which more than doubles an early army.`,
        suggestion: "Build your first City in a safe interior spot as soon as you have 125k gold (about 2 minutes of income).",
        evidence: { minutes: Math.round(gameSecs / 60) },
      }),
    );
  } else if (me.firstCityTick !== null && me.firstCityTick - spEnd > 180 * SEC) {
    moments.push(
      moment({
        tick: me.firstCityTick,
        kind: "economy",
        severity: me.firstCityTick - spEnd > 300 * SEC ? "mistake" : "inaccuracy",
        title: "Late first City",
        detail: `Your first City went down at ${clock(me.firstCityTick - spEnd)} after spawn. The median human built theirs at ${(() => {
          const m = median(others.map((o) => (o.firstCityTick === null ? NaN : o.firstCityTick - o.spawnPhaseEndTick)));
          return m === null ? "—" : clock(m);
        })()}.`,
        suggestion: "Aim for the first City by ~2:30 after spawn; it pays for itself in troop cap almost immediately.",
        evidence: { firstCitySeconds: (me.firstCityTick - spEnd) / SEC },
      }),
    );
  }
  if (s) {
    const gold = view.aligned(sid, "gold");
    const alive = view.aligned(sid, "alive");
    const incomePerSec = me.goldEarned / Math.max(1, me.lifeTicks / SEC);
    const threshold = Math.max(1_500_000, incomePerSec * 240);
    const hoards = intervals(ticks, (i) => ticks[i] > spEnd && !!alive[i] && gold[i] > threshold, 120 * SEC).sort((a, b) => b.end - b.start - (a.end - a.start));
    for (const h of hoards.slice(0, 1)) {
      const spentAfter = view.data.actions.find((a) => a.clientID === me.clientID && a.type === "build_unit" && a.tick >= h.end - 50 && a.tick <= h.end + 600 && (a.cost ?? 0) >= threshold * 0.6);
      if (spentAfter) continue; // saving up for something big is fine
      moments.push(
        moment({
          tick: h.start,
          kind: "economy",
          severity: (h.end - h.start) / SEC > 300 ? "mistake" : "inaccuracy",
          title: "Gold piled up unspent",
          detail: `From ${clock(h.start)} to ${clock(h.end)} you held more than ${fmtNum(threshold)} gold (peaking at ${fmtNum(Math.max(...gold.slice(h.i0, h.i1 + 1)))}) without a big purchase.`,
          suggestion: "Unspent gold does nothing. Convert it into Cities (troop cap), Ports/Factories (income), or SAMs once nukes are in play.",
          evidence: { peakGold: Math.max(...gold.slice(h.i0, h.i1 + 1)), seconds: (h.end - h.start) / SEC },
        }),
      );
    }
    if (me.eliminatedTick !== null && me.goldAtEnd > 400_000) {
      moments.push(
        moment({
          tick: me.eliminatedTick - 10,
          kind: "economy",
          severity: "mistake",
          title: `Died with ${fmtNum(me.goldAtEnd)} gold in the bank`,
          detail: "That gold could have been Defense Posts on the front, a SAM, or a City to raise the troop cap during the final fight.",
          evidence: { gold: me.goldAtEnd },
        }),
      );
    }
  }

  // ---- Diplomacy ---------------------------------------------------------
  for (const e of view.data.events.filter((e) => e.kind === "BrokeAlliance" && (e.traitorID === sid || e.betrayedID === sid))) {
    if (e.traitorID === sid) {
      const d = landDelta(ctx, e.tick, 90 * SEC);
      moments.push(
        moment({
          tick: e.tick,
          kind: "diplomacy",
          focus: [e.betrayedID as number],
          severity: d > 1 ? "good" : d < -1 ? "mistake" : "inaccuracy",
          title: `You betrayed ${view.name(e.betrayedID as number)}`,
          detail: `Breaking the alliance marked you a traitor for 30s (attackers lose half as many troops against you) and soured every neighbour's opinion of you. Your land share moved ${d >= 0 ? "+" : ""}${d.toFixed(1)} points over the next 90s.`,
          suggestion: d > 1 ? undefined : "Only betray when the payoff is immediate and nobody else can punish your 30-second traitor window.",
          landShareDelta: d,
          evidence: { landShareDelta90s: d },
        }),
      );
    } else {
      const ratio = view.valueAt(sid, "troops", e.tick) / Math.max(1, view.valueAt(sid, "maxTroops", e.tick));
      moments.push(
        moment({
          tick: e.tick,
          kind: "diplomacy",
          focus: [e.traitorID as number],
          severity: "info",
          title: `${view.name(e.traitorID as number)} broke your alliance`,
          detail: `Your army was at ${pct(ratio)} of its cap when it happened.` + (ratio < 0.25 ? " Hard and Impossible nations betray allies whose troops fall below about 20% of their cap." : ""),
          suggestion: ratio < 0.25 ? "An ally is only as reliable as your army is strong. Keep a reserve even when allied." : undefined,
          landShareDelta: landDelta(ctx, e.tick),
          evidence: { troopRatio: +ratio.toFixed(2) },
        }),
      );
    }
  }

  // ---- Nukes ---------------------------------------------------------------
  const incomingNukes = view.data.events.filter((e) => e.kind === "UnitIncoming" && e.playerID === sid && [4, 5, 7].includes(e.messageType as number));
  if (incomingNukes.length >= 2) {
    const first = incomingNukes[0];
    const samsThen = view.unitCountAt(sid, "SAM Launcher", first.tick);
    if (samsThen === 0) {
      moments.push(
        moment({
          tick: first.tick,
          kind: "nuke",
          severity: incomingNukes.length >= 4 ? "mistake" : "inaccuracy",
          title: `${incomingNukes.length} nukes launched at you with no SAM cover`,
          detail: `The first nuke was inbound at ${clock(first.tick)} and you had no SAM Launcher.`,
          suggestion: "From minute ~5, put 1–2 SAMs over your densest Cities; a level-1 SAM covers 70 tiles.",
          evidence: { nukes: incomingNukes.length, samsAtFirstNuke: samsThen },
        }),
      );
    }
  }
  if (me.nukesLaunched >= 2 && me.nukesIntercepted / me.nukesLaunched >= 0.5) {
    moments.push(
      moment({
        tick: end - 1,
        kind: "nuke",
        severity: "mistake",
        title: `${me.nukesIntercepted} of your ${me.nukesLaunched} nukes were shot down`,
        detail: "Launching into SAM coverage burns 750k–5M gold per missile.",
        suggestion: "Target areas outside SAM range, or overwhelm one SAM with several missiles at once.",
        evidence: { launched: me.nukesLaunched, intercepted: me.nukesIntercepted },
      }),
    );
  }

  // ---- Naval ---------------------------------------------------------------
  if (me.boatsLost >= 3 && me.boatsLost / Math.max(1, me.boatsSent) >= 0.3) {
    moments.push(
      moment({
        tick: end - 2,
        kind: "naval",
        severity: me.boatsLost >= 6 ? "mistake" : "inaccuracy",
        title: `${me.boatsLost} of ${me.boatsSent} transport boats lost`,
        detail: "A sunk transport loses every troop on board.",
        suggestion: "Check for enemy warships before sailing, send several smaller boats rather than one big one, and escort landings with your own warship.",
        evidence: { boatsSent: me.boatsSent, boatsLost: me.boatsLost },
      }),
    );
  }

  // ---- Outcome -------------------------------------------------------------
  if (me.eliminatedTick !== null) {
    const t0 = Math.max(spEnd, me.eliminatedTick - 120 * SEC);
    const takers = view.takenFrom(sid, t0, me.eliminatedTick).filter((x) => x.to !== 0);
    const killer = ctx.record.info.players.find((p) => p.clientID === me.clientID)?.stats?.killedBy;
    const killerName = killer ? view.byClientID.get(killer)?.name : takers[0] ? view.name(takers[0].to) : null;
    moments.push(
      moment({
        tick: me.eliminatedTick,
        kind: "death",
        focus: (() => {
          const k = killer ? view.byClientID.get(killer)?.smallID : undefined;
          return [...new Set([...(k ? [k] : []), ...takers.slice(0, 2).map((t) => t.to)])];
        })(),
        severity: "info",
        title: "Eliminated",
        detail: `You were knocked out at ${clock(me.eliminatedTick)}` + (killerName ? `, mostly by ${killerName}.` : ".") + ` You peaked at ${pct(me.peakLandShare, 1)} of the map.`,
        evidence: { peakLandShare: +(me.peakLandShare * 100).toFixed(2), killer: killerName ?? null },
      }),
    );
  }

  moments.sort((a, b) => a.tick - b.tick);
  return { moments, ledger };
}
