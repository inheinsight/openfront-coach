import type { AttackRecord } from "../engine/replayTypes.js";
import type { GameRecord } from "../openfront/types.js";
import type { PlayerMetrics } from "./metrics.js";
import { median } from "./metrics.js";
import type { PlayMode } from "./mode.js";
import { ReplayView } from "./replayView.js";
import { clock, fmtNum, GOOD_STACK_RATIO, OVERTIME_DROP_PER_MINUTE, OVERTIME_START_MINUTES, pct, TEAM_LEAVE_CREDIT_SHARE, TICKS_PER_SECOND, UNCLAIMED_SPEED_CAP_TROOPS, WIN_LAND_SHARE } from "./rules.js";
import type { AttackLedgerRow, KeyMoment, Severity } from "./types.js";

const SEC = TICKS_PER_SECOND;

interface Ctx {
  view: ReplayView;
  record: GameRecord;
  me: PlayerMetrics;
  all: PlayerMetrics[];
  myId: string | null;
  mode: PlayMode;
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

/** What to do instead of an undersized or stalled attack on a player. */
function stackAdvice(ctx: Ctx, retreated: boolean): string {
  const base = `Attack players with at least ${GOOD_STACK_RATIO}× the troops they hold at home (bigger still pays), ideally right after they send their army at someone else.`;
  const commit = retreated ? " A retreat costs 25% of the surviving troops, so only start attacks you can finish." : "";
  return ctx.mode.bigTeams
    ? `${base}${commit} If you can't reach that, donate the troops to the teammate who is fighting there: one big stack loses far fewer troops per tile than two small ones.`
    : `${base}${commit} If you can't reach that, wait and let your troops grow near 42% of your cap.`;
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
      } else if (tpk !== null && p25 !== null && tpk < p25 && significant && tilesGained < Math.max(30, a.targetTilesStart * 0.1)) {
        verdict = ratio !== null && ratio >= 0.6 && !a.naval ? "blunder" : a.naval ? "inaccuracy" : "mistake";
        note =
          `spent ${fmtNum(troopsUsed)} troops for ${fmtNum(tilesGained)} tiles (${tpk.toFixed(1)} per 1k, bottom quarter ${peers})` +
          (stackVsArmy <= 0.5
            ? `; your ${fmtNum(a.troops)} stack was ${pct(stackVsArmy)} of the ${fmtNum(a.targetTroopsStart)} troops they held at home, and at half their home troops or less you pay double losses per tile`
            : stackVsArmy < 1
              ? `; your ${fmtNum(a.troops)} stack was smaller than the ${fmtNum(a.targetTroopsStart)} troops they held at home`
              : "") +
          (ratio !== null && ratio >= 0.6 ? `; it was a ${pct(ratio)} send` : "") +
          (a.retreated ? "; you then retreated, which costs 25% of the surviving troops" : "");
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
              : stackAdvice(ctx, a.retreated),
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
  // Strong players attack far more often and have the same ~10% of attacks go
  // badly, so only a high rate of bad attacks is a pattern worth a moment.
  const judged = rows.filter((r) => (r.targetType === "Human" || r.targetType === "Nation") && r.note !== "joined an attack already under way").length;
  const badRate = judged ? badAll.length / judged : 0;
  // What separates winners is stack size, so only undersized attacks become moments.
  const undersized = (f: (typeof folded)[number]) => {
    const army = Number(f.m.evidence.targetTroops ?? 0);
    return army > 0 && Number(f.m.evidence.sent ?? 0) < army;
  };
  // ...and only for players whose typical stack is smaller than the defender's home army.
  const habit = me.stackRatio === null || me.stackRatio < 1;
  const bad = (habit && (badRate > 0.15 || judged < 4) ? folded : []).filter(undersized).slice(0, 4);
  const good = flagged.filter((f) => f.sev === "good").slice(0, 2);
  return { rows, moments: [...bad, ...good].map((f) => f.m) };
}

/** Troops at 80%+ of the cap for at least 60 seconds before `tick`: the cap, not gold, was the limit. */
function capLimitedBefore(ctx: Ctx, tick: number): boolean {
  const { view, me } = ctx;
  const troops = view.aligned(me.smallID, "troops");
  const maxT = view.aligned(me.smallID, "maxTroops");
  const step = view.data.meta.sampleEvery / SEC;
  let secs = 0;
  view.ticks.forEach((t, i) => {
    if (t > me.spawnPhaseEndTick && t < tick && maxT[i] > 0 && troops[i] / maxT[i] >= 0.8) secs += step;
  });
  return secs >= 60;
}

/** Teammates who were fighting (attacking or attacked) with troops under 60% of their cap at `tick`. */
function teammatesWithRoom(ctx: Ctx, tick: number): number[] {
  const { view, me } = ctx;
  if (me.team === null) return [];
  return view.data.players
    .filter((p) => p.type === "Human" && p.team === me.team && p.smallID !== me.smallID && view.valueAt(p.smallID, "alive", tick))
    .filter((p) => {
      const cap = view.valueAt(p.smallID, "maxTroops", tick);
      const fighting = view.valueAt(p.smallID, "attacksOut", tick) + view.valueAt(p.smallID, "attacksIn", tick) > 0;
      return cap > 0 && fighting && view.valueAt(p.smallID, "troops", tick) / cap < 0.6;
    })
    .sort((a, b) => view.valueAt(b.smallID, "tiles", tick) - view.valueAt(a.smallID, "tiles", tick))
    .map((p) => p.smallID);
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

function openingAdvice(avgOpenRatio: number | null): string {
  return avgOpenRatio !== null && avgOpenRatio >= 0.35
    ? `Your sends were big. Expansion into open land stops speeding up once an attack holds about ${fmtNum(UNCLAIMED_SPEED_CAP_TROOPS)} troops, and troops away on an attack don't regrow, so click about 20% at a time, again each time the bar refills, and keep two expansion lanes busy.`
    : "Click about 20% into open land every time the bar refills, along two lanes rather than three. Pick a spawn with open land on at least two sides, and clear bot tribes next to you once you can finish them.";
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
  // Seconds before the first click don't predict anything (almost everyone
  // clicks within 1–2 s); land at 2:00 and 5:00 do.
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
          suggestion: openingAdvice(avgOpenRatio),
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

  const med300 = median(others.map((o) => o.landShareAt["300"] ?? NaN));
  const my300 = me.landShareAt["300"];
  const fellBehindAt2 = moments.some((m) => m.title === "Opening fell behind");
  if (!fellBehindAt2 && my300 !== null && med300 !== null && med300 > 0 && my300 / med300 < 0.6) {
    moments.push(
      moment({
        tick: spEnd + 300 * SEC,
        kind: "opening",
        severity: my300 / med300 < 0.35 ? "mistake" : "inaccuracy",
        title: "Fell behind by 5:00",
        detail: `At 5:00 after spawn you held ${pct(my300, 2)} of the land; the median human held ${pct(med300, 2)}. Land at 5:00 is the strongest early predictor of where you finish.`,
        suggestion: "Between 2:00 and 5:00, keep clearing the bot tribes and open land around you with small clicks, and get a Port or Factory earning; don't start a war with a human neighbour until you can send at least their home army.",
        evidence: { yourShare300: +(my300 * 100).toFixed(2), medianShare300: +(med300 * 100).toFixed(2) },
      }),
    );
  }
  // Big sends that leave nothing at home are how most early eliminations start.
  if (me.openingDrainedPct !== null && me.openingDrainedPct >= 0.3) {
    const diedEarly = me.eliminatedTick !== null && me.eliminatedTick - spEnd < 300 * SEC;
    moments.push(
      moment({
        tick: spEnd + 30 * SEC,
        kind: "troops",
        severity: diedEarly ? "mistake" : "inaccuracy",
        title: "Army drained in the opening",
        detail:
          `For ${pct(me.openingDrainedPct)} of the first three minutes your troops at home were under 15% of your cap.` +
          (diedEarly ? ` You were eliminated at ${clock(me.eliminatedTick! - spEnd)} after spawn.` : "") +
          " Troops away on an attack don't regrow, and an empty border invites the neighbours" + (ctx.mode.nations ? " and the nations, which go after weak neighbours first." : "."),
        suggestion: "Keep at least a quarter of your cap at home in the first three minutes: click about 20% at a time, and only send more into land no player can reach you from.",
        evidence: { drainedShare: +me.openingDrainedPct.toFixed(2), eliminatedEarly: diedEarly },
      }),
    );
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
    // A late-game FFA leader sitting on a full army is holding a deterrent, not idling.
    const leading = (t: number) => {
      const mine = view.valueAt(sid, "tiles", t);
      return view.trackedPlayers().filter((p) => p.smallID !== sid && view.valueAt(p.smallID, "tiles", t) > mine).length < 5;
    };
    // In team games a carry sits at the cap because teammates feed it: only
    // flag it when you weren't being fed and someone fighting had room.
    const fedDuring = (r: { start: number; end: number }) =>
      !!ctx.myId && view.data.events.some((e) => e.kind === "DonateEvent" && e.recipientId === ctx.myId && e.donationType === "troops" && e.tick >= r.start - 300 && e.tick <= r.end);
    const runs = capRuns.filter((r) =>
      ctx.mode.teammates && ctx.mode.donations ? !fedDuring(r) && teammatesWithRoom(ctx, r.start).length > 0 : ctx.mode.teammates || r.start - spEnd < 600 * SEC || !leading(r.start),
    );
    for (const r of runs.slice(0, 2)) {
      const dur = (r.end - r.start) / SEC;
      const roomy = ctx.mode.donations ? teammatesWithRoom(ctx, r.start) : [];
      moments.push(
        moment({
          tick: r.start,
          kind: "troops",
          severity: dur >= 90 ? "mistake" : "inaccuracy",
          title: `Army idle at the troop cap for ${dur.toFixed(0)}s`,
          detail:
            `From ${clock(r.start)} to ${clock(r.end)} your troops sat above 88% of the cap with no attack running. Troop growth falls to zero at the cap and peaks around 42%.` +
            (roomy.length ? ` Meanwhile ${roomy.map((x) => view.name(x)).join(" and ")} had room for more troops.` : ""),
          suggestion: ctx.mode.teammates
            ? `When the bar passes about half, donate 30–40% of your troops to the teammate who is fighting${roomy.length ? ` (${view.name(roomy[0])} here)` : ""}, or take land from bots on the enemy side.`
            : "When the bar is nearly full, spend it: take land from bots or a weak neighbour, or build a City to raise the cap.",
          focus: roomy.slice(0, 2),
          landShareDelta: landDelta(ctx, r.start),
          evidence: { seconds: dur, troops: troops[r.i0], cap: maxT[r.i0], teammatesWithRoom: roomy.length },
        }),
      );
    }
    const overRuns = intervals(
      ticks,
      (i) => ticks[i] > spEnd + 300 && ticks[i] <= end && !!alive[i] && maxT[i] > 0 && troops[i] / maxT[i] < 0.12 && inc[i] > troops[i],
      10 * SEC,
    );
    // Only when you emptied the army yourself (a big send just before) and it cost you land.
    const selfInflicted = (r: { start: number }) =>
      view.data.attacks.some((a) => a.attacker === sid && a.startTick >= r.start - 30 * SEC && a.startTick <= r.start && a.troops >= 0.4 * (a.troops + a.attackerTroopsAfterLaunch));
    for (const r of overRuns.filter((r) => selfInflicted(r) && landDelta(ctx, r.start) <= -0.1 * shareAt(ctx, r.start) * 100).slice(0, 2)) {
      const hitters = [...new Set(view.data.attacks.filter((a) => a.target === sid && a.startTick <= r.end && (a.endTick ?? a.lastTick) >= r.start).map((a) => a.attacker))];
      moments.push(
        moment({
          tick: r.start,
          kind: "troops",
          focus: hitters.slice(0, 3),
          severity: "mistake",
          title: "Caught with an empty army",
          detail: `At ${clock(r.start)}, just after a big send of your own, you were under attack by ${fmtNum(inc[r.i0])} troops while holding only ${fmtNum(troops[r.i0])} at home (${pct(troops[r.i0] / Math.max(1, maxT[r.i0]))} of your cap).`,
          suggestion: ctx.mode.teammates
            ? "Keep 35–50% of your cap at home whenever an enemy can reach you, and ask a teammate for troops before the border breaks, not after."
            : "Keep 35–50% of your cap at home whenever a neighbour can reach you; only full-send when nobody can punish it.",
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
            ? ctx.mode.bigTeams
              ? "Don't open a second front while one is under pressure: ask a teammate to cover it, and send your troops where the team is pushing."
              : "Avoid two-front wars: before attacking, check who borders you and whether they are free to hit you back."
            : nukes.length
              ? `Get SAM cover over your Cities as soon as an enemy builds a Missile Silo${ctx.mode.teammates ? "; a teammate's SAM in range protects you too" : ""}.`
              : troopRatio < 0.25
                ? ctx.mode.teammates
                  ? "Don't let your army drain below ~35% of the cap on a live front, and ask for troops before you collapse."
                  : "Don't let your army drain below ~35% of the cap when a strong neighbour is idle."
                : dps === 0
                  ? "Put a Defense Post where you're being hit, on high ground if you can: attackers lose about 5× as many troops near it, and far more on mountains."
                  : ctx.mode.bigTeams
                    ? "Ask teammates for troops early, and fall back toward them rather than fighting alone."
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
  } else if (me.firstCityTick !== null && me.firstCityTick - spEnd > 180 * SEC && capLimitedBefore(ctx, me.firstCityTick)) {
    moments.push(
      moment({
        tick: me.firstCityTick,
        kind: "economy",
        severity: me.firstCityTick - spEnd > 300 * SEC ? "mistake" : "inaccuracy",
        title: "Late first City",
        detail: `Your first City went down at ${clock(me.firstCityTick - spEnd)} after spawn, after your troops had sat near the cap for a minute or more. The median human built theirs at ${(() => {
          const m = median(others.map((o) => (o.firstCityTick === null ? NaN : o.firstCityTick - o.spawnPhaseEndTick)));
          return m === null ? "—" : clock(m);
        })()}.`,
        suggestion: "Build a City as soon as the troop cap is what's holding you back: +250k cap is worth more than doubling a small army.",
        evidence: { firstCitySeconds: (me.firstCityTick - spEnd) / SEC },
      }),
    );
  }
  if (s) {
    const gold = view.aligned(sid, "gold");
    const alive = view.aligned(sid, "alive");
    const incomePerSec = me.goldEarned / Math.max(1, me.lifeTicks / SEC);
    const threshold = Math.max(1_500_000, incomePerSec * 240);
    // Before 15:00 only: later, big banks are SAM, bomb and MIRV money (nations' Silos aren't tracked).
    const hoards = intervals(ticks, (i) => ticks[i] > spEnd && ticks[i] < spEnd + 900 * SEC && !!alive[i] && gold[i] > threshold, 120 * SEC).sort((a, b) => b.end - b.start - (a.end - a.start));
    for (const h of hoards.slice(0, 1)) {
      const spentAfter = view.data.actions.find((a) => a.clientID === me.clientID && a.type === "build_unit" && a.tick >= h.end - 50 && a.tick <= h.end + 600 && (a.cost ?? 0) >= threshold * 0.6);
      if (spentAfter) continue; // saving up for something big is fine
      // Once rivals own Silos, a bank is SAM money and a deterrent.
      if (me.enemySiloTick !== null && me.enemySiloTick <= h.end) continue;
      moments.push(
        moment({
          tick: h.start,
          kind: "economy",
          severity: (h.end - h.start) / SEC > 300 ? "mistake" : "inaccuracy",
          title: "Gold piled up unspent",
          detail: `From ${clock(h.start)} to ${clock(h.end)} you held more than ${fmtNum(threshold)} gold (peaking at ${fmtNum(Math.max(...gold.slice(h.i0, h.i1 + 1)))}) without a big purchase.`,
          suggestion: ctx.mode.donations
            ? "Gold with nothing to buy should go to a teammate who can use it (a front-liner's Cities and Defense Posts), or into Ports and Factories that link to your teammates."
            : "Gold with nothing to buy does nothing: put it into Ports and Factories (income), a City if the cap is holding you back, or a Silo and SAM once rivals have them.",
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
          detail: ctx.mode.donations
            ? "Donate your gold to a teammate before you fall: it does nothing in an eliminated bank, and a teammate can turn it into Defense Posts, a SAM or Cities."
            : "That gold could have been Defense Posts on the front, a SAM, or a City to raise the troop cap during the final fight.",
          evidence: { gold: me.goldAtEnd },
        }),
      );
    }
  }

  // ---- Diplomacy ---------------------------------------------------------
  for (const e of view.data.events.filter((e) => e.kind === "BrokeAlliance" && (e.traitorID === sid || e.betrayedID === sid))) {
    if (e.traitorID === sid) {
      const window = ctx.mode.teammates ? 90 : 180;
      const d = landDelta(ctx, e.tick, window * SEC);
      moments.push(
        moment({
          tick: e.tick,
          kind: "diplomacy",
          focus: [e.betrayedID as number],
          // Strong FFA players betray often; report the outcome, don't grade the choice.
          severity: d > 1 ? "good" : "info",
          title: `You betrayed ${view.name(e.betrayedID as number)}`,
          detail: `Breaking the alliance marked you a traitor for 30s (attackers lose half as many troops against you and take your land about 25% faster) and cost you relations with nearby players. Your land share moved ${d >= 0 ? "+" : ""}${d.toFixed(1)} points over the next ${window}s.`,
          suggestion: d > 1 ? undefined : "Only betray when the payoff is immediate and nobody else can punish your 30-second traitor window.",
          landShareDelta: d,
          evidence: { landShareDelta: d, windowSeconds: window },
        }),
      );
    } else {
      const ratio = view.valueAt(sid, "troops", e.tick) / Math.max(1, view.valueAt(sid, "maxTroops", e.tick));
      const traitor = e.traitorID as number;
      const outnumbered = view.valueAt(traitor, "troops", e.tick) / Math.max(1, view.valueAt(sid, "troops", e.tick));
      const isNation = view.type(traitor) === "Nation";
      moments.push(
        moment({
          tick: e.tick,
          kind: "diplomacy",
          focus: [e.traitorID as number],
          severity: "info",
          title: `${view.name(e.traitorID as number)} broke your alliance`,
          detail:
            `Your army was at ${pct(ratio)} of its cap, and they had ${outnumbered.toFixed(1)}× your troops.` +
            (isNation ? " Medium nations betray an ally once they hold 10× its troops, or 3× when it is their only neighbour." : ""),
          suggestion: isNation && outnumbered >= 3 ? "An ally is only as reliable as your army is strong: keep enough troops at home that no allied nation outnumbers you 3 to 1." : undefined,
          landShareDelta: landDelta(ctx, e.tick),
          evidence: { troopRatio: +ratio.toFixed(2), theirTroopsVsYours: +outnumbered.toFixed(2), nation: isNation },
        }),
      );
    }
  }

  // ---- Nukes ---------------------------------------------------------------
  // Judged on how fast SAM cover followed the first enemy Silo, not on how
  // many nukes came in: leaders get nuked whatever they do.
  const incomingNukes = view.data.events.filter((e) => e.kind === "UnitIncoming" && e.playerID === sid && [4, 5, 7].includes(e.messageType as number));
  // Judged on how soon SAM cover followed the first enemy Silo, not on how
  // many nukes came in: leaders draw the nukes, and attackers aim at
  // uncovered land on purpose.
  if (me.enemySiloTick !== null && me.samDelaySec !== null) {
    const never = me.samDelaySec >= 9999;
    const coverTick = never ? null : me.enemySiloTick + me.samDelaySec * SEC;
    const before = incomingNukes.filter((e) => coverTick === null || e.tick < coverTick).length;
    const late = me.samDelaySec > 120 && before >= 1;
    if (late || me.nukesWithoutOwnSam >= 3) {
      moments.push(
        moment({
          tick: late ? me.enemySiloTick : (incomingNukes[0]?.tick ?? me.enemySiloTick),
          kind: "nuke",
          severity: (late && never && before >= 2) || me.nukesWithoutOwnSam >= 5 ? "mistake" : "inaccuracy",
          title: late
            ? never
              ? "No SAM cover after enemies built Missile Silos"
              : `SAM cover came ${Math.round(me.samDelaySec)}s after the first enemy Silo`
            : `${me.nukesWithoutOwnSam} nukes hit you while you had no SAM of your own`,
          detail:
            `The first enemy Missile Silo (or nuke at you) appeared at ${clock(me.enemySiloTick)}` +
            (late
              ? never
                ? " and none of your Cities was ever under a SAM."
                : `; your first City came under a SAM at ${clock(coverTick!)}, after ${before} nuke${before > 1 ? "s" : ""} had been launched at you.`
              : `. ${me.nukesWithoutOwnSam} nukes were aimed at your uncovered land while you relied on ${ctx.mode.teammates ? "teammates' SAMs" : "luck"}.`) +
            " A SAM takes 30s to build and a Hydrogen bomb arrives in about 10, so cover has to be up before the launch.",
          suggestion: `Build a SAM (1.5M) over your densest Cities within a minute of the first enemy Silo, and add one where you build new Cities${ctx.mode.teammates ? "; a teammate's SAM covers you only within its 70-tile range" : ""}. A level-1 SAM never misses.`,
          evidence: { samDelaySec: never ? null : Math.round(me.samDelaySec), nukesBeforeCover: before, nukesWithoutOwnSam: me.nukesWithoutOwnSam, nukesTotal: incomingNukes.length },
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
        suggestion: "Check for enemy warships before sailing: they shoot transports first. Use tiny boats (about 1% of your troops) to grab footholds, and send big ones only where no enemy warship patrols (you can have at most 3 at sea).",
        evidence: { boatsSent: me.boatsSent, boatsLost: me.boatsLost },
      }),
    );
  }

  // ---- Panic counter-attack ------------------------------------------------
  // Opposing attacks cancel troop for troop, so throwing most of your army at
  // a bigger incoming push mostly turns your reserve into nothing.
  const panics = view.data.actions
    .filter((a) => a.clientID === me.clientID && a.type === "attack" && a.target && (a.targetType === "Human" || a.targetType === "Nation") && (a.sent ?? 0) >= 0.5 * Math.max(1, a.troops ?? 0))
    .map((a) => {
      const incoming = view.data.attacks
        .filter((x) => x.attacker === a.target && x.target === sid && x.startTick <= a.tick && (x.endTick ?? x.lastTick) >= a.tick)
        .reduce((sum, x) => sum + x.troops, 0);
      return { a, incoming };
    })
    .filter((p) => p.incoming > 1.5 * (p.a.sent ?? 0))
    .filter((p) => (p.a.troops ?? 0) - (p.a.sent ?? 0) < 0.2 * Math.max(1, p.a.maxTroops ?? 0))
    .filter((p) => landDelta(ctx, p.a.tick) <= -0.15 * shareAt(ctx, p.a.tick) * 100)
    .sort((x, y) => (y.a.sent ?? 0) - (x.a.sent ?? 0));
  if (panics[0]) {
    const { a, incoming } = panics[0];
    moments.push(
      moment({
        tick: a.tick,
        kind: "attack",
        focus: [a.target as number],
        severity: "mistake",
        title: `Counter-attacked ${view.name(a.target)}'s bigger push with ${pct((a.sent ?? 0) / Math.max(1, a.troops ?? 1))} of your army`,
        detail: `${clock(a.tick)}: ${view.name(a.target)} was attacking you with ${fmtNum(incoming)} troops and you answered with ${fmtNum(a.sent ?? 0)}. Opposing attacks cancel troop for troop before any land changes hands, so a smaller counter mostly empties your home army.`,
        suggestion: ctx.mode.teammates
          ? "Against a bigger push, defend at home: wear it down with small clicks, drop a Defense Post on high ground in its path, and ask a teammate for troops."
          : "Against a bigger push, defend at home: wear it down with small clicks, drop a Defense Post on high ground in its path, and offer an alliance once it stalls.",
        landShareDelta: landDelta(ctx, a.tick),
        evidence: { sent: a.sent ?? 0, incoming, ratio: +((a.sent ?? 0) / Math.max(1, a.troops ?? 1)).toFixed(2) },
      }),
    );
  }

  // ---- Leaving a team game while alive ----------------------------------------
  if (ctx.mode.teammates && me.team !== null) {
    const marks = view.data.actions.filter((a) => a.clientID === me.clientID && a.type === "mark_disconnected");
    const last = marks[marks.length - 1];
    const decided = view.data.events.find((e) => e.kind === "Win")?.tick ?? view.data.meta.ticks;
    if (last?.isDisconnected && view.valueAt(sid, "alive", last.tick) && decided - last.tick > 60 * SEC) {
      const mates = view.data.players.filter((p) => p.type === "Human" && p.team === me.team);
      const teamShare = mates.reduce((a, p) => a + view.valueAt(p.smallID, "tiles", last.tick), 0) / view.landTiles;
      const w = ctx.record.info.winner;
      const teamWon = !!w && w[0] === "team" && w[1] === me.team;
      if (teamShare < TEAM_LEAVE_CREDIT_SHARE) {
        moments.push(
          moment({
            tick: last.tick,
            kind: "death",
            severity: teamWon ? "mistake" : "inaccuracy",
            title: "Left the game while still alive",
            detail:
              `You disconnected at ${clock(last.tick)} while your team held ${pct(teamShare)} of the land.` +
              (teamWon ? " Your team went on to win, but a player who leaves alive only keeps the win if the team already held 70% of the land." : " Your land was left for the enemy to take."),
            suggestion: "Stay connected to the end, even with a tiny territory: eliminated or not, a connected teammate shares the win, and your land isn't handed to the enemy.",
            evidence: { teamShare: +teamShare.toFixed(3), teamWon },
          }),
        );
      }
    }
  }

  // ---- FFA overtime ------------------------------------------------------------
  const otTick = OVERTIME_START_MINUTES * 60 * SEC;
  if (ctx.mode.overtime && view.data.meta.ticks > otTick + 60 * SEC && end > otTick) {
    const mine = view.valueAt(sid, "tiles", otTick);
    const rank = 1 + view.trackedPlayers().filter((p) => p.smallID !== sid && view.valueAt(p.smallID, "tiles", otTick) > mine).length;
    if (rank >= 2 && rank <= 3) {
      moments.push(
        moment({
          tick: otTick,
          kind: "victory",
          severity: "info",
          title: `Overtime began with you in ${rank === 2 ? "second" : "third"} place`,
          detail: `From ${OVERTIME_START_MINUTES}:00 the win bar drops ${OVERTIME_DROP_PER_MINUTE * 100} points a minute from ${WIN_LAND_SHARE * 100}%, so whoever leads only has to hold on.`,
          suggestion: "In overtime, waiting loses: break the leader (nukes on their densest land, or a joint attack with whoever else borders them) while the bar is still high, or keep enough troops to stop them crossing it.",
          evidence: { rank, landShare: +(mine / view.landTiles).toFixed(3) },
        }),
      );
    }
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
