// Troop habits: how big your attacks on players were against their home army,
// whether quick clicks added up to a near-full send, whether you kept a floor
// at home, and (team games) where your donated troops went. Turns them into
// one lesson per game, a decision card per attack, and drills.

import type { AttackRecord } from "../engine/replayTypes.js";
import type { PlayerMetrics } from "./metrics.js";
import { median } from "./metrics.js";
import type { ReplayView } from "./replayView.js";
import { CHEAPEST_STACK_RATIO, clock, fmtNum, GOOD_STACK_RATIO, HOME_FLOOR, lossMultiplier, OPENING_FLOOR, OPENING_SECONDS, pct, TICKS_PER_SECOND } from "./rules.js";
import type { AttackCard, DrillSpot, DrillVerdict, Severity, TroopLesson, TroopReport, TroopRule } from "./types.js";

const SEC = TICKS_PER_SECOND;
/** Clicks on the same player this close together are one decision. */
export const BURST_GAP = 2 * SEC;

const x = (v: number) => `${v < 10 ? v.toFixed(2) : v.toFixed(0)}×`;

/** One decision to attack a player: a single click or a burst of quick clicks. */
export interface Send {
  tick: number;
  lastTick: number;
  target: number;
  clicks: number;
  clickShares: number[];
  sent: number;
  homeBefore: number;
  cap: number;
  share: number;
  targetHome: number;
  stack: number;
}

/** Your clicks on enemy players, grouped into decisions. Teammates and allies are left out. */
export function sendsOf(view: ReplayView, clientID: string, team: string | null): Send[] {
  const out: Send[] = [];
  for (const a of view.data.actions) {
    if (a.clientID !== clientID || a.type !== "attack" || !a.target) continue;
    if (a.targetType !== "Human" && a.targetType !== "Nation") continue;
    if (a.targetAllied || (team !== null && view.bySmallID.get(a.target)?.team === team)) continue;
    const sent = Math.max(0, a.sent ?? 0);
    const last = out[out.length - 1];
    if (last && last.target === a.target && a.tick - last.lastTick <= BURST_GAP) {
      last.sent += sent;
      last.lastTick = a.tick;
      last.clicks++;
      last.share = Math.min(1, last.sent / Math.max(1, last.homeBefore));
      last.clickShares.push(last.share);
      last.stack = last.sent / Math.max(1, last.targetHome);
      continue;
    }
    const home = Math.max(1, a.troops ?? sent);
    const share = Math.min(1, sent / home);
    out.push({
      tick: a.tick,
      lastTick: a.tick,
      target: a.target,
      clicks: 1,
      clickShares: [share],
      sent,
      homeBefore: home,
      cap: a.maxTroops ?? 0,
      share,
      targetHome: a.targetTroops ?? 0,
      stack: sent / Math.max(1, a.targetTroops ?? 0),
    });
  }
  return out;
}

/** Troops an attack used up and the tiles it took (same accounting as the attack ledger). */
function outcome(a: AttackRecord) {
  const used = Math.max(0, a.troops - (a.lastTroops ?? 0));
  const ownGain = Math.max(0, (a.attackerTilesEnd ?? a.attackerTilesStart) - a.attackerTilesStart);
  const targetLoss = Math.max(0, a.targetTilesStart - (a.targetTilesEnd ?? a.targetTilesStart));
  return { used, tiles: a.tilesCaptured ?? Math.min(ownGain, targetLoss) };
}

/** Home-army floor at this tick: 25% of your cap in the opening, 35% after. */
export function floorAt(spawnPhaseEndTick: number, tick: number, cap: number): number {
  const opening = (tick - spawnPhaseEndTick) / SEC <= OPENING_SECONDS;
  return Math.round((opening ? OPENING_FLOOR : HOME_FLOOR) * Math.max(0, cap));
}

/**
 * What the stack and floor rules say to send at a player, in whole percent of
 * your home army: at least their home army, and no more than what sits above
 * your floor. When nothing fits both, hold: 0 to 0. The attack card's call and
 * the drill's grade both come from this, so they can't disagree.
 */
export function attackRange(home: number, floor: number, theirHome: number): { lo: number; hi: number; aim: number } {
  const h = Math.max(1, home);
  const lo = Math.max(1, Math.ceil((100 * theirHome) / h - 1e-9));
  const hi = Math.floor((100 * Math.max(0, home - floor)) / h + 1e-9);
  if (lo > hi) return { lo: 0, hi: 0, aim: 0 };
  return { lo, hi, aim: Math.max(lo, Math.min(hi, Math.round((100 * GOOD_STACK_RATIO * theirHome) / h))) };
}

function severityOf(s: Send, floor: number): Severity {
  if (s.stack >= 1) return s.homeBefore - s.sent >= floor ? "good" : "inaccuracy";
  if (s.stack <= 0.5) return s.share >= 0.6 ? "blunder" : "mistake";
  return "inaccuracy";
}

/** Lowest value of a series in a tick window. */
function lowest(view: ReplayView, sid: number, from: number, to: number): number | null {
  let min: number | null = null;
  const s = view.series(sid);
  if (!s) return null;
  for (let i = Math.max(s.from, view.sampleIndex(from)); i < view.ticks.length && view.ticks[i] <= to; i++) {
    const v = s.troops[i - s.from];
    if (v !== undefined) min = min === null ? v : Math.min(min, v);
  }
  return min;
}

/** A push on you: one enemy player's attacks within a few seconds of each other. */
interface Push {
  tick: number;
  attacker: number;
  troops: number;
}

function pushesOn(view: ReplayView, me: PlayerMetrics): Push[] {
  const out: Push[] = [];
  for (const a of [...view.data.attacks].filter((a) => a.target === me.smallID).sort((p, q) => p.startTick - q.startTick)) {
    const type = view.type(a.attacker);
    if ((type !== "Human" && type !== "Nation") || (me.team !== null && view.bySmallID.get(a.attacker)?.team === me.team)) continue;
    const last = out[out.length - 1];
    if (last && last.attacker === a.attacker && a.startTick - last.tick <= BURST_GAP * 2) last.troops = Math.max(last.troops, a.troops);
    else out.push({ tick: a.startTick, attacker: a.attacker, troops: a.troops });
  }
  return out;
}

/** The push this send answered, if you clicked on the attacker within 10 s of it landing. */
const answering = (s: Send, pushes: Push[]) => pushes.find((p) => p.attacker === s.target && s.tick >= p.tick && s.tick <= p.tick + 10 * SEC) ?? null;

function cardFor(view: ReplayView, me: PlayerMetrics, s: Send, i: number, pushes: Push[], teamGame: boolean): AttackCard {
  const sid = me.smallID;
  const end = Math.min(view.data.meta.ticks, me.eliminatedTick ?? Infinity);
  const from = Math.max(0, s.tick - 20 * SEC);
  const to = Math.min(end, s.lastTick + 60 * SEC);

  // Their home army from the samples, sharpened by every click anyone made on them.
  const pts = new Map<number, { tick: number; theirs: number | null; yours: number | null }>();
  for (let k = Math.max(0, view.sampleIndex(from)); k < view.ticks.length && view.ticks[k] <= to; k++) {
    const t = view.ticks[k];
    pts.set(t, { tick: t, theirs: view.valueAt(s.target, "troops", t), yours: view.valueAt(sid, "troops", t) });
  }
  for (const a of view.data.actions) {
    if (a.type !== "attack" || a.target !== s.target || a.tick < from || a.tick > to || a.targetTroops === undefined) continue;
    const p = pts.get(a.tick);
    if (p) p.theirs = a.targetTroops;
    else pts.set(a.tick, { tick: a.tick, theirs: a.targetTroops, yours: a.clientID === me.clientID ? (a.troops ?? null) : null });
  }
  let series = [...pts.values()].sort((p, q) => p.tick - q.tick);
  if (series.length > 160) series = series.filter((_, k) => k % Math.ceil(series.length / 160) === 0);

  // Outcome: every attack record of yours on them that this decision started or fed.
  let troopsUsed = 0;
  let tilesGained = 0;
  for (const a of view.data.attacks) {
    if (a.attacker !== sid || a.target !== s.target || a.startTick < s.tick - 1 || a.startTick > s.lastTick + SEC) continue;
    const o = outcome(a);
    troopsUsed += o.used;
    tilesGained += o.tiles;
  }
  const homeAfter = lowest(view, sid, s.lastTick, s.lastTick + 10 * SEC);

  const floor = floorAt(me.spawnPhaseEndTick, s.tick, s.cap);
  const sendable = Math.max(0, s.homeBefore - floor);
  const range = attackRange(s.homeBefore, floor, s.targetHome);
  const keep = s.homeBefore - s.sent;

  // Holding instead: what sat above your floor, against their home army afterwards.
  const push = answering(s, pushes);
  let window: AttackCard["window"] = null;
  if (range.hi === 0 && !push) {
    let best: AttackCard["window"] = null;
    for (const p of series) {
      if (p.tick <= s.lastTick || !p.theirs || p.theirs <= 0) continue;
      const st = sendable / p.theirs;
      if (st >= CHEAPEST_STACK_RATIO) {
        window = { tick: p.tick, theirHome: p.theirs, stack: st };
        break;
      }
      if (st >= 1 && (!best || st > best.stack)) best = { tick: p.tick, theirHome: p.theirs, stack: st };
    }
    window ??= best;
  }

  // Teammates already attacking the same player.
  const teammates =
    me.team === null
      ? []
      : [
          ...new Set(
            view.data.attacks
              .filter((a) => a.target === s.target && a.attacker !== sid && Math.abs(a.startTick - s.tick) <= 10 * SEC && view.bySmallID.get(a.attacker)?.team === me.team)
              .map((a) => view.name(a.attacker)),
          ),
        ];

  const name = view.name(s.target);
  const atCap = s.cap > 0 && s.homeBefore >= 0.9 * s.cap;
  const did: string[] = [];
  if (atCap) did.push(`You were at your cap (${fmtNum(s.homeBefore)}), so your army had stopped growing.`);
  did.push(
    `${clock(s.tick)}: sent ${fmtNum(s.sent)} (${pct(s.share)} of your army${s.clicks > 1 ? `, in ${s.clicks} clicks over ${((s.lastTick - s.tick) / SEC).toFixed(1)} s` : ""}) at ${name}, who held ${fmtNum(s.targetHome)} at home: ${x(s.stack)}.`,
  );
  if (troopsUsed > 0) did.push(`Lost ${fmtNum(troopsUsed)} troops for ${fmtNum(tilesGained)} tiles.`);
  if (homeAfter !== null && homeAfter < s.homeBefore * 0.6) did.push(`Your home army fell from ${fmtNum(s.homeBefore)} to ${fmtNum(homeAfter)}.`);

  const at = (p: number) => fmtNum((s.homeBefore * p) / 100);
  let call: string;
  if (push && s.share > 0.4) {
    call =
      `They had just sent ${fmtNum(push.troops)} at you. Keep your army home: their attack has to win every tile against it, and opposing attacks cancel troop for troop, so a big counter mostly trades your reserve away.` +
      (teamGame ? " Ask your team for troops instead." : "");
  } else if (range.hi > 0 && s.stack >= 1 && keep >= floor) {
    call =
      `Good stack: ${x(s.stack)} their home army, with ${fmtNum(keep)} kept at home.` +
      (s.stack < CHEAPEST_STACK_RATIO ? ` At ${x(CHEAPEST_STACK_RATIO)} or more every tile costs the least.` : " That's the cheapest loss rate there is.");
  } else if (range.hi > 0) {
    const send = `Send ${range.lo}–${range.hi}% of your army: at least ${at(range.lo)} to match their home army, and no more than ${at(range.hi)} so your ${fmtNum(floor)} floor stays home.`;
    const aimStack = (s.homeBefore * range.aim) / 100 / Math.max(1, s.targetHome);
    const aim = range.aim > range.lo ? ` Aim for ${range.aim}% (${at(range.aim)})${range.aim === range.hi && aimStack < GOOD_STACK_RATIO - 0.05 ? ", the most your floor allows" : ""}: ${x(aimStack)} their home army.` : "";
    call =
      s.stack >= 1
        ? `${send}${aim} ${fmtNum(s.sent)} beat them but left ${fmtNum(keep)} at home.`
        : `${send}${aim} ${fmtNum(s.sent)} was ${x(s.stack)}, so every tile cost you ${lossMultiplier(s.sent, s.targetHome).toFixed(1)}× the base rate.`;
  } else {
    const parts = [
      `Hold. Matching their ${fmtNum(s.targetHome)} at home while keeping your ${fmtNum(floor)} floor needed ${fmtNum(s.targetHome + floor)}, and you had ${fmtNum(s.homeBefore)}.`,
    ];
    if (s.stack >= 1) parts.push(`Your ${fmtNum(s.sent)} beat their home army but left ${fmtNum(keep)} at home.`);
    if (window)
      parts.push(
        `Watch for the opening: at ${clock(window.tick)} their home army fell to ${fmtNum(window.theirHome)}, and the ${fmtNum(sendable)} above your floor would have been ${x(window.stack)}` +
          (window.stack >= CHEAPEST_STACK_RATIO ? ", the cheapest loss rate there is." : "."),
      );
    else if (teammates.length) parts.push(`Or donate to ${teammates[0]}, who was already attacking them.`);
    else parts.push("Wait until they send troops elsewhere, or pick a player your army outnumbers.");
    call = parts.join(" ");
  }

  return {
    id: `c${i + 1}`,
    tick: s.tick,
    lastTick: s.lastTick,
    target: name,
    targetId: s.target,
    severity: severityOf(s, floor),
    clicks: s.clicks,
    clickShares: s.clickShares.map((v) => +v.toFixed(3)),
    sent: s.sent,
    share: +s.share.toFixed(3),
    homeBefore: s.homeBefore,
    cap: s.cap,
    floor,
    targetHome: s.targetHome,
    stack: +s.stack.toFixed(3),
    loss: +lossMultiplier(s.sent, s.targetHome).toFixed(2),
    troopsUsed,
    tilesGained,
    homeAfter,
    series,
    window,
    counter: push ? { tick: push.tick, incoming: push.troops } : null,
    teammates,
    did,
    call,
    featured: false,
  };
}

/** Median stack and burst counts for every human in the lobby, for benchmarks. */
function lobbyStats(view: ReplayView, all: PlayerMetrics[]) {
  return all.map((m) => {
    const ss = sendsOf(view, m.clientID, m.team);
    return {
      m,
      sends: ss.length,
      stackMedian: ss.length >= 2 ? median(ss.map((s) => s.stack)) : null,
      stackPass: ss.length >= 2 ? ss.filter((s) => s.stack >= 1).length / ss.length : null,
      burstsOverHalf: ss.filter((s) => s.clicks >= 3 && s.share > 0.5).length,
    };
  });
}

const medianOf = (xs: (number | null)[]) => {
  const v = xs.filter((n): n is number => n !== null && Number.isFinite(n));
  return v.length ? median(v) : null;
};

export function analyzeTroops(view: ReplayView, me: PlayerMetrics, all: PlayerMetrics[], teamGame: boolean): { report: TroopReport; trend: Record<string, number | null> } {
  const sid = me.smallID;
  const sends = sendsOf(view, me.clientID, me.team);
  const pushes = pushesOn(view, me);
  const cards = sends.map((s, i) => cardFor(view, me, s, i, pushes, teamGame));
  [...cards]
    .filter((c) => c.stack < 1)
    .sort((a, b) => b.troopsUsed - a.troopsUsed || b.sent - a.sent)
    .slice(0, 3)
    .forEach((c) => (c.featured = true));

  const lobby = lobbyStats(view, all);
  const others = lobby.filter((l) => l.m.smallID !== sid);
  const topFive = [...lobby].sort((a, b) => b.m.peakLandShare - a.m.peakLandShare).slice(0, 5);
  const enoughLobby = others.length >= 2;

  // ---- Rule 2: stack at least their home army --------------------------
  const passed = sends.filter((s) => s.stack >= 1).length;
  const stackMedian = sends.length ? median(sends.map((s) => s.stack)) : null;
  const passRate = sends.length ? passed / sends.length : null;
  const stack: TroopRule = {
    key: "stack",
    label: "Stack at least their home army",
    status: sends.length < 3 ? "unscored" : passRate! >= 0.5 ? "met" : passRate! >= 0.25 ? "close" : "missed",
    summary:
      sends.length < 3
        ? `Only ${sends.length} attack${sends.length === 1 ? "" : "s"} on players: not enough to judge.`
        : `${passed} of ${sends.length} attacks on players met it. Median stack ${x(stackMedian!)}.`,
    passed,
    total: sends.length,
  };

  // ---- Rule 1: decide the total before the first click -----------------
  const bursts = sends.filter((s) => s.clicks >= 3);
  const overHalf = bursts.filter((s) => s.share > 0.5);
  const clicks: TroopRule = {
    key: "clicks",
    label: "Decide the total, then click",
    status: !sends.length ? "unscored" : overHalf.length === 0 ? "met" : overHalf.length === 1 ? "close" : "missed",
    summary: !sends.length
      ? "No attacks on players to judge."
      : bursts.length
        ? `${bursts.length} burst${bursts.length === 1 ? "" : "s"} of 3+ quick clicks on a player; ${overHalf.length} sent more than half your army.`
        : "No bursts of quick clicks on players.",
    passed: bursts.length - overHalf.length,
    total: bursts.length,
  };

  // ---- Rule 3: hold a floor at home --------------------------------------
  const empty = me.timeOverextendedPct;
  const emptyMed = enoughLobby ? medianOf(others.map((l) => l.m.timeOverextendedPct)) : null;
  const emptyTop = enoughLobby ? medianOf(topFive.map((l) => l.m.timeOverextendedPct)) : null;
  const bar = Math.max(0.05, emptyMed ?? 0.05);
  const floor: TroopRule = {
    key: "floor",
    label: "Hold a floor at home",
    status: empty === null ? "unscored" : empty <= bar ? "met" : empty <= 2 * bar ? "close" : "missed",
    summary: empty === null ? "Not enough of the game to judge." : `Under 15% of your cap for ${pct(empty)} of the game.` + (emptyMed !== null ? ` Lobby median: ${pct(emptyMed)}.` : ""),
    passed: null,
    total: null,
  };

  // ---- Rule 4: feed one front (team games) -----------------------------
  const rules: TroopRule[] = [clicks, stack, floor];
  if (teamGame && me.team !== null) {
    const dons = view.data.actions.filter((a) => a.clientID === me.clientID && a.type === "donate_troops");
    const given = dons.reduce((s, a) => s + Number(a.amount ?? 0), 0);
    const to = new Set(dons.map((a) => a.target));
    const back = view.data.actions.filter((a) => a.type === "donate_troops" && a.target === sid).reduce((s, a) => s + Number(a.amount ?? 0), 0);
    rules.push({
      key: "feed",
      label: "Feed one front",
      status: "unscored",
      summary: dons.length
        ? `You donated ${fmtNum(given)} to ${to.size} teammate${to.size === 1 ? "" : "s"}; ${fmtNum(back)} came back.`
        : "No troop donations this game.",
      passed: null,
      total: null,
    });
  }

  // ---- This game's lesson ----------------------------------------------
  const order: TroopRule["key"][] = ["stack", "floor", "clicks"];
  const pick = order.find((k) => rules.find((r) => r.key === k)?.status === "missed") ?? order.find((k) => rules.find((r) => r.key === k)?.status === "close") ?? null;
  const worstCard = cards.filter((c) => c.featured)[0] ?? null;
  const burstCard = [...cards].filter((c) => c.clicks >= 3 && c.share > 0.5).sort((a, b) => b.share - a.share || b.sent - a.sent)[0] ?? null;
  const bench = (label: string, v: number | null, f: (n: number) => string, you = false) => (v === null ? [] : [{ label, display: f(v), you }]);

  let lesson: TroopLesson | null = null;
  if (pick === "stack") {
    const lobbyMed = enoughLobby ? medianOf(others.map((l) => l.stackMedian)) : null;
    const topMed = enoughLobby ? medianOf(topFive.map((l) => l.stackMedian)) : null;
    lesson = {
      rule: "stack",
      title: "Attack a player only when your stack is at least their home army.",
      why: `Aim for ${x(GOOD_STACK_RATIO)}. At half their home army or less, the engine charges you double troops for every tile you take.`,
      stat: `${passed} of ${sends.length}`,
      statLabel: "attacks you started on players met it",
      benchmarks: [
        ...bench("Your median stack", stackMedian, x, true),
        ...bench("Median human in this lobby", lobbyMed, x),
        ...bench("This lobby's top five", topMed, x),
      ],
      nextGoal: "Half your attacks on players at 1× or more.",
      how: "Before you click a player, compare your home troops with theirs. Short? Wait until they send their army somewhere else" + (teamGame ? ", or donate to the teammate already hitting them." : "."),
      trend: { key: "stackMedian", label: "Median stack against their home army", target: 1, format: "x" },
      exampleCardId: worstCard?.id ?? null,
    };
  } else if (pick === "floor") {
    lesson = {
      rule: "floor",
      title: "Keep a floor of troops at home.",
      why: `Troops out in an attack don't defend. With a neighbour who can reach you, keep ${pct(OPENING_FLOOR)} of your cap at home in the first ${OPENING_SECONDS / 60} minutes and ${pct(HOME_FLOOR)} after.`,
      stat: pct(empty ?? 0),
      statLabel: "of the game with under 15% of your cap at home",
      benchmarks: [
        ...bench("You", empty, (v) => pct(v), true),
        ...bench("Median human in this lobby", emptyMed, (v) => pct(v)),
        ...bench("This lobby's top five", emptyTop, (v) => pct(v)),
      ],
      nextGoal: emptyMed !== null ? `Under 15% of your cap for less than ${pct(Math.max(0.05, emptyMed))} of the game.` : "Under 15% of your cap for less than 5% of the game.",
      how: "Before each click, check what stays home. When a bigger neighbour borders you, stop expanding at the floor and let your army regrow.",
      trend: { key: "overextended", label: "Time under 15% of your cap", target: Math.max(0.05, emptyMed ?? 0.05), format: "pct" },
      exampleCardId: burstCard?.id ?? worstCard?.id ?? null,
    };
  } else if (pick === "clicks") {
    const lobbyBursts = enoughLobby ? medianOf(others.map((l) => l.burstsOverHalf)) : null;
    lesson = {
      rule: "clicks",
      title: "Decide the total before the first click.",
      why: "Each 20% click takes a fifth of what's left: three quick clicks send half your army, eight send 83%. Check the total against their home army, not each click.",
      stat: String(overHalf.length),
      statLabel: `burst${overHalf.length === 1 ? "" : "s"} of quick clicks that sent more than half your army`,
      benchmarks: [
        ...bench("Your bursts", bursts.length, (v) => String(v), true),
        ...bench("Median end of a burst", bursts.length ? median(bursts.map((b) => b.share)) : null, (v) => pct(v)),
        ...bench("Median human in this lobby (over half)", lobbyBursts, (v) => String(Math.round(v))),
      ],
      nextGoal: "No burst of clicks that sends more than half your army.",
      how: "Pick the total first. If it takes more than two clicks, stop and compare that total with their home army.",
      trend: { key: "burstsOverHalf", label: "Bursts that sent more than half your army", target: 0, format: "count" },
      exampleCardId: burstCard?.id ?? null,
    };
  }

  // ---- Drills ------------------------------------------------------------
  const drills: DrillSpot[] = [];
  const tiles = (id: number, t: number) => view.valueAt(id, "tiles", t);
  // Attack drills; counters to a push become defence drills below.
  for (const c of cards.filter((c) => c.featured && !c.counter).slice(0, 2)) {
    drills.push({
      id: `attack-${c.tick}`,
      kind: "attack",
      rule: "stack",
      tick: c.tick,
      question: `${c.target} holds ${fmtNum(c.targetHome)} at home. How much do you send at them?`,
      target: c.target,
      targetId: c.targetId,
      facts: { yourHome: c.homeBefore, cap: c.cap, theirHome: c.targetHome, incoming: null, yourTiles: tiles(sid, c.tick), theirTiles: tiles(c.targetId, c.tick) },
      floor: c.floor,
      youDid: { share: c.share, clicks: c.clicks, text: c.did.filter((d) => !d.startsWith("You were at your cap")).join(" ") },
      call: c.call,
    });
  }

  // Defence: a big push lands and you answer with a big counter.
  const defends: (DrillSpot & { weight: number })[] = [];
  for (const p of pushes) {
    if (p.tick <= me.spawnPhaseEndTick) continue;
    const answer = sends.filter((s) => answering(s, [p]) !== null);
    if (!answer.length) continue;
    const home = answer[0].homeBefore;
    const cap = answer[0].cap || view.valueAt(sid, "maxTroops", p.tick);
    if (p.troops < 0.3 * home) continue;
    const share = Math.min(1, answer.reduce((s, a) => s + a.sent, 0) / Math.max(1, home));
    if (share <= 0.4) continue;
    const clicksN = answer.reduce((s, a) => s + a.clicks, 0);
    const floorTroops = floorAt(me.spawnPhaseEndTick, p.tick, cap);
    const lastAnswer = answer[answer.length - 1].lastTick;
    const after = lowest(view, sid, lastAnswer, lastAnswer + 10 * SEC);
    const name = view.name(p.attacker);
    defends.push({
      weight: p.troops * share,
      id: `defend-${p.tick}`,
      kind: "defend",
      rule: "floor",
      tick: p.tick,
      question: `${name} sends ${fmtNum(p.troops)} at you. How much do you send back?`,
      target: name,
      targetId: p.attacker,
      facts: { yourHome: home, cap, theirHome: answer[0].targetHome, incoming: p.troops, yourTiles: tiles(sid, p.tick), theirTiles: tiles(p.attacker, p.tick) },
      floor: floorTroops,
      youDid: {
        share,
        clicks: clicksN,
        text: `You sent ${pct(share)} of your army back at ${name} in ${clicksN} click${clicksN === 1 ? "" : "s"}.` + (after !== null && after < home * 0.6 ? ` Your home army fell from ${fmtNum(home)} to ${fmtNum(after)}.` : ""),
      },
      call:
        `Send 0–10%. Keep your ${fmtNum(home)} at home: their ${fmtNum(p.troops)} has to win every tile against it, and opposing attacks cancel troop for troop, so a big counter mostly trades your reserve away.` +
        (teamGame ? " Ask your team for troops now; a donation lands at once." : ""),
    });
  }
  defends.sort((a, b) => b.weight - a.weight);
  for (const { weight: _w, ...d } of defends.slice(0, 2)) drills.push(d);
  drills.sort((a, b) => a.tick - b.tick);

  return {
    report: { rules, lesson, cards, drills },
    trend: {
      stackMedian,
      stackPass: passRate,
      burstsOverHalf: sends.length ? overHalf.length : null,
    },
  };
}

/** The drill's right answer, in whole percent of your home army: the same rules as its call. */
export function drillRange(d: DrillSpot): { lo: number; hi: number; aim: number } {
  if (d.kind === "defend") return { lo: 0, hi: 10, aim: 0 };
  return attackRange(d.facts.yourHome, d.floor ?? Math.round(HOME_FLOOR * d.facts.cap), d.facts.theirHome);
}

/** How an answer to a drill compares with the coach's call. Right means inside drillRange. */
export function gradeDrill(d: DrillSpot, pctSent: number): DrillVerdict {
  const p = Math.max(0, Math.min(100, Math.round(pctSent)));
  const home = d.facts.yourHome;
  const exact = (home * p) / 100;
  const sent = Math.round(exact);
  const keep = home - sent;
  const range = drillRange(d);
  const correct = p >= range.lo && p <= range.hi;
  const r = (severity: Severity, title: string, body: string): DrillVerdict => ({ severity, title, body, correct, range: { lo: range.lo, hi: range.hi } });
  if (d.kind === "attack") {
    const theirs = Math.max(1, d.facts.theirHome);
    const floor = d.floor ?? Math.round(HOME_FLOOR * d.facts.cap);
    const most = Math.max(0, home - floor);
    const st = exact / theirs;
    if (correct && p === 0) return r("good", "Good call", `Keeping your ${fmtNum(floor)} floor, you could send ${fmtNum(most)}: ${x(most / theirs)} their home army. Holding cost you nothing.`);
    if (correct) return r("good", "Good stack", `${fmtNum(sent)} is ${x(st)} their home army${st >= CHEAPEST_STACK_RATIO ? ", the cheapest loss rate there is" : ""}, and ${fmtNum(keep)} stays home.`);
    if (p === 0) return r("inaccuracy", "You could have hit them", `Keeping your ${fmtNum(floor)} floor, you could send up to ${fmtNum(most)}: ${x(most / theirs)} their home army.`);
    if (st >= 1) return r(keep >= floor / 2 ? "inaccuracy" : "mistake", "Below your floor", `${fmtNum(sent)} beats their home army (${x(st)}) but leaves ${fmtNum(keep)} at home, under your ${fmtNum(floor)} floor.`);
    if (st > 0.5) return r("inaccuracy", "Short of their home army", `${fmtNum(sent)} is ${x(st)} their home army, so each tile costs you ${lossMultiplier(sent, theirs).toFixed(1)}× the base rate.`);
    return r(p >= 60 ? "blunder" : "mistake", "At the double-loss ceiling", `${fmtNum(sent)} into ${fmtNum(theirs)} at home is ${x(st)}: every tile costs you double.`);
  }
  const floor = d.floor ?? 0;
  if (correct) return r("good", "Good call", `You keep ${fmtNum(keep)} at home${floor ? ` (floor ${fmtNum(floor)})` : ""}. Their attack has to grind through it tile by tile.`);
  if (keep >= floor) return r("inaccuracy", "Bigger than it needs to be", `You keep your ${fmtNum(floor)} floor, but a ${p}% counter mostly trades troops with their attack. 0–10% does the job.`);
  if (p <= 40) return r("inaccuracy", "Below your floor", `You drop to ${fmtNum(keep)}, under your ${fmtNum(floor)} floor. If they follow up, you are thin.`);
  return r(p >= 60 ? "blunder" : "mistake", "That empties your home", `Sending ${p}% leaves ${fmtNum(keep)} at home against a player holding ${fmtNum(d.facts.theirHome)}.`);
}
