import type { AttackRecord } from "../engine/replayTypes.js";
import type { GameRecord, PlayerRecord } from "../openfront/types.js";
import { ReplayView } from "./replayView.js";
import { GOOD_STACK_RATIO, OPTIMAL_TROOP_RATIO, peakRegenPerTick, SAM_RANGE_LEVEL1, TICKS_PER_SECOND, troopRegenPerTick } from "./rules.js";

const big = (v: string | undefined | null) => (v === undefined || v === null ? 0 : Number(v));
const at = (arr: string[] | undefined, i: number) => big(arr?.[i]);

/** Everything we measure about one human player in one game. */
export interface PlayerMetrics {
  smallID: number;
  clientID: string;
  name: string;
  team: string | null;
  alive: boolean;
  eliminatedTick: number | null;
  lifeTicks: number;
  spawnTick: number | null;
  spawnPhaseEndTick: number;
  firstExpansionTick: number | null;
  finalTiles: number;
  peakTiles: number;
  peakLandShare: number;
  finalLandShare: number;
  landShareAt: Record<string, number | null>; // "60", "120", "300", "600", "900"
  tilesAt: Record<string, number | null>;
  troopEfficiency: number | null; // avg regen / peak regen, first 15 minutes after spawn
  timeAtCapPct: number | null; // share of the first 15 minutes with troops >= 90% of cap
  timeOverextendedPct: number | null; // share of life with troops < 15% of cap
  avgTroopRatio: number | null;
  peakTroops: number;
  goldEarned: number;
  goldBySource: { work: number; war: number; trade: number; piracy: number; trainSelf: number; trainOther: number; donations: number };
  avgGoldBanked: number;
  floatMinutes: number | null; // average gold held / gold income per minute
  peakGold: number;
  goldAtEnd: number;
  firstCityTick: number | null;
  /** First Port or Factory: the first building that earns gold. */
  firstIncomeTick: number | null;
  /** Gold earned per minute between 5:00 and 10:00 after spawn. */
  income5to10: number | null;
  citiesAt300: number;
  structuresBuilt: Record<string, number>;
  structuresLost: number;
  structuresCaptured: number;
  upgrades: number;
  attacksSent: number;
  attacksVsPlayers: number;
  attacksVsNullius: number;
  avgAttackRatio: number | null;
  fullSends: number; // >= 60% of troops at a player after the opening
  /** Median of your stack ÷ the defender's troops at home, over land attacks on players. */
  stackRatio: number | null;
  /** Share of those attacks sent with at least GOOD_STACK_RATIO × the defender's home troops. */
  goodStackShare: number | null;
  retreats: number;
  troopsSent: number;
  troopsReceived: number;
  biggestHitTaken: number;
  boatsSent: number;
  boatsArrived: number;
  boatsLost: number;
  tradeShipsSent: number;
  tradeGold: number;
  warshipsBuilt: number;
  nukesLaunched: number;
  nukesLanded: number;
  nukesIntercepted: number;
  nukesReceived: number;
  samsBuilt: number;
  /** First enemy human's Missile Silo (or first nuke at you, if earlier), while you could still react. */
  enemySiloTick: number | null;
  /** Seconds from enemySiloTick until your own SAM, or a teammate's SAM over one of your Cities; 9999 = never. */
  samDelaySec: number | null;
  /** Nukes aimed at land no friendly SAM covered, while you had no SAM of your own. */
  nukesWithoutOwnSam: number;
  /** Share of the first three minutes after spawn with home troops under 15% of your cap. */
  openingDrainedPct: number | null;
  donations: { troopsSent: number; troopsReceived: number; goldSent: number; goldReceived: number };
  /** Humans on your team who spawned (team games only). */
  teamSize: number | null;
  /** Your share of your team's land from 5:00 on, times team size: 1 = your fair share. */
  teamShareMultiple: number | null;
  alliancesFormed: number;
  alliancesBrokenByOthers: number;
  betrayals: number;
  conquests: number;
  maxDrawdown: number; // worst peak-to-trough tile decline as a share of the peak
  actionsPerMinute: number;
}

function median(xs: number[]): number | null {
  const v = xs.filter((x) => Number.isFinite(x)).sort((a, b) => a - b);
  if (!v.length) return null;
  const m = v.length >> 1;
  return v.length % 2 ? v[m] : (v[m - 1] + v[m]) / 2;
}

export { median };

export function spawnPhaseEnd(view: ReplayView | null, record: GameRecord): number {
  const ev = view?.data.events.find((e) => e.kind === "SpawnPhaseEnd");
  if (ev) return ev.tick;
  return record.info.config.gameType === "Singleplayer" ? 100 : record.info.config.randomSpawn ? 150 : 200;
}

export function computeMetrics(view: ReplayView, record: GameRecord, player: PlayerRecord): PlayerMetrics | null {
  const rp = view.byClientID.get(player.clientID);
  if (!rp) return null;
  const sid = rp.smallID;
  const s = view.series(sid);
  const ticks = view.ticks;
  const land = view.landTiles;
  const spEnd = spawnPhaseEnd(view, record);
  const stats = player.stats ?? {};
  const actions = view.data.actions.filter((a) => a.clientID === player.clientID);
  const fin = view.data.finalState.find((f) => f.smallID === sid);

  const tiles = view.aligned(sid, "tiles");
  const troops = view.aligned(sid, "troops");
  const maxT = view.aligned(sid, "maxTroops");
  const gold = view.aligned(sid, "gold");
  const goldEarnedSeries = view.aligned(sid, "goldEarned");
  const alive = view.aligned(sid, "alive");

  // Elimination: last sample alive, if not alive at the end.
  let eliminatedTick: number | null = null;
  // Zero territory at the end is an elimination, whatever the alive flag says.
  const aliveAtEnd = (fin?.alive ?? alive[alive.length - 1] === 1) && (fin?.tiles ?? tiles[tiles.length - 1] ?? 0) > 0;
  if (!aliveAtEnd) {
    let last = -1;
    for (let i = 0; i < alive.length; i++) if (alive[i]) last = i;
    eliminatedTick = stats.killedAt ? big(stats.killedAt) : last >= 0 ? ticks[Math.min(last + 1, ticks.length - 1)] : spEnd;
  }
  const endTick = eliminatedTick ?? view.data.meta.ticks;
  const lifeTicks = Math.max(1, endTick - spEnd);

  // Troop management over the first 15 minutes after the spawn phase. Later
  // on, a full army is often a deliberate deterrent (FFA leaders) or a
  // donation stockpile (team carries), so it says little about skill.
  const troopWindowEnd = spEnd + 900 * TICKS_PER_SECOND;
  let effSum = 0;
  let effN = 0;
  let atCap = 0;
  let over = 0;
  let ratioSum = 0;
  let goldSum = 0;
  let goldN = 0;
  for (let i = 0; i < ticks.length; i++) {
    if (ticks[i] <= spEnd + 20 || ticks[i] > endTick || !alive[i] || maxT[i] <= 0) continue;
    const r = troops[i] / maxT[i];
    goldSum += gold[i];
    goldN++;
    if (ticks[i] > troopWindowEnd) continue;
    effSum += troopRegenPerTick(troops[i], maxT[i]) / peakRegenPerTick(maxT[i]);
    effN++;
    if (r >= 0.9) atCap++;
    if (r < 0.15) over++;
    ratioSum += r;
  }

  const landShareAt: Record<string, number | null> = {};
  const tilesAt: Record<string, number | null> = {};
  for (const sec of [60, 120, 300, 600, 900]) {
    const t = spEnd + sec * TICKS_PER_SECOND;
    if (t > view.data.meta.ticks || (eliminatedTick !== null && t > eliminatedTick)) {
      landShareAt[sec] = null;
      tilesAt[sec] = null;
      continue;
    }
    const v = view.valueAt(sid, "tiles", t);
    tilesAt[sec] = v;
    landShareAt[sec] = v / land;
  }

  let peak = 0;
  let maxDD = 0;
  for (const v of tiles) {
    peak = Math.max(peak, v);
    if (peak > land * 0.002) maxDD = Math.max(maxDD, (peak - v) / peak);
  }

  const goldBySource = {
    work: at(stats.gold, 0),
    war: at(stats.gold, 1),
    trade: at(stats.gold, 2),
    piracy: at(stats.gold, 3),
    trainSelf: at(stats.gold, 4),
    trainOther: at(stats.gold, 5),
    donations: at(stats.gold, 6),
  };
  const goldEarned =
    Object.values(goldBySource).reduce((a, b) => a + b, 0) || Math.max(...goldEarnedSeries, 0);
  const incomePerMin = goldEarned / Math.max(1, lifeTicks / TICKS_PER_SECOND / 60);

  const builds = actions.filter((a) => a.type === "build_unit");
  const firstCity = builds.find((a) => a.unit === "City");
  const structuresBuilt: Record<string, number> = {};
  for (const [k, label] of Object.entries({ city: "City", port: "Port", defp: "Defense Post", silo: "Missile Silo", saml: "SAM Launcher", fact: "Factory", wshp: "Warship" })) {
    structuresBuilt[label] = at(stats.units?.[k as keyof typeof stats.units], 0);
  }
  let structuresLost = 0;
  let structuresCaptured = 0;
  let upgrades = 0;
  for (const arr of Object.values(stats.units ?? {})) {
    structuresLost += at(arr, 3);
    structuresCaptured += at(arr, 2);
    upgrades += at(arr, 4);
  }

  const myAttacks: AttackRecord[] = view.data.attacks.filter((a) => a.attacker === sid);
  const attackActions = actions.filter((a) => a.type === "attack" || a.type === "boat");
  const ratios = attackActions
    .filter((a) => (a.sent ?? 0) > 0 && (a.troops ?? 0) > 0)
    .map((a) => (a.sent ?? 0) / (a.troops ?? 1));
  const fullSends = attackActions.filter(
    (a) => a.tick > spEnd + 600 && a.targetType !== "TerraNullius" && a.targetType !== "Bot" && (a.sent ?? 0) / Math.max(1, a.troops ?? 1) >= 0.6,
  ).length;
  const firstExpansion = attackActions.find((a) => a.tick >= spEnd - 5);

  const nukesReceived = view.data.events.filter(
    (e) => e.kind === "UnitIncoming" && e.playerID === sid && (e.messageType === 4 || e.messageType === 5 || e.messageType === 7),
  ).length;

  // Land attacks on players: how big your stack was against the troops they held at home.
  const stackRatios = view.data.attacks
    .filter((a) => a.attacker === sid && !a.naval && (a.targetType === "Human" || a.targetType === "Nation") && a.targetTroopsStart > 0)
    .filter((a) => !(((a.endTick ?? a.lastTick) - a.startTick) / TICKS_PER_SECOND < 2 && Math.max(0, a.troops - (a.lastTroops ?? 0)) < 0.3 * a.troops))
    .map((a) => a.troops / a.targetTroopsStart);

  const firstIncome = builds.find((a) => a.unit === "Port" || a.unit === "Factory");
  const at5 = spEnd + 300 * TICKS_PER_SECOND;
  const at10 = spEnd + 600 * TICKS_PER_SECOND;
  const income5to10 = at10 <= endTick && at10 <= view.data.meta.ticks ? (view.valueAt(sid, "goldEarned", at10) - view.valueAt(sid, "goldEarned", at5)) / 5 : null;

  let drained = 0;
  let openN = 0;
  for (let i = 0; i < ticks.length; i++) {
    if (ticks[i] <= spEnd + 20 || ticks[i] > Math.min(endTick, spEnd + 180 * TICKS_PER_SECOND) || !alive[i] || maxT[i] <= 0) continue;
    openN++;
    if (troops[i] / maxT[i] < 0.15) drained++;
  }

  const donations = { troopsSent: 0, troopsReceived: 0, goldSent: 0, goldReceived: 0 };
  for (const e of view.data.events) {
    if (e.kind !== "DonateEvent" || !rp.id) continue;
    const amount = Number(e.amount ?? 0);
    const troopsKind = e.donationType === "troops";
    if (e.senderId === rp.id) donations[troopsKind ? "troopsSent" : "goldSent"] += amount;
    if (e.recipientId === rp.id) donations[troopsKind ? "troopsReceived" : "goldReceived"] += amount;
  }

  const team = teamShare(view, sid, rp.team, spEnd + 300 * TICKS_PER_SECOND, endTick);
  const sam = samCover(view, sid, rp.team, spEnd, endTick);

  const bombs = stats.bombs ?? {};
  const sumBomb = (i: number) => at(bombs.abomb, i) + at(bombs.hbomb, i) + at(bombs.mirv, i);
  const spawnAction = [...actions].reverse().find((a) => a.type === "spawn");

  return {
    smallID: sid,
    clientID: player.clientID,
    name: player.username,
    team: rp.team,
    alive: aliveAtEnd,
    eliminatedTick,
    lifeTicks,
    spawnTick: spawnAction?.tick ?? null,
    spawnPhaseEndTick: spEnd,
    firstExpansionTick: firstExpansion?.tick ?? null,
    finalTiles: fin?.tiles ?? tiles[tiles.length - 1] ?? 0,
    peakTiles: Math.max(peak, at(stats.tiles, 0)),
    peakLandShare: Math.max(peak, at(stats.tiles, 0)) / land,
    finalLandShare: (fin?.tiles ?? tiles[tiles.length - 1] ?? 0) / land,
    landShareAt,
    tilesAt,
    troopEfficiency: effN ? effSum / effN : null,
    timeAtCapPct: effN ? atCap / effN : null,
    timeOverextendedPct: effN ? over / effN : null,
    avgTroopRatio: effN ? ratioSum / effN : null,
    peakTroops: Math.max(big(stats.peakTroops), ...troops),
    goldEarned,
    goldBySource,
    avgGoldBanked: goldN ? goldSum / goldN : 0,
    floatMinutes: goldN && incomePerMin > 0 ? goldSum / goldN / incomePerMin : null,
    peakGold: Math.max(0, ...gold),
    goldAtEnd: fin?.gold ?? gold[gold.length - 1] ?? 0,
    firstCityTick: firstCity?.tick ?? null,
    firstIncomeTick: firstIncome?.tick ?? null,
    income5to10,
    citiesAt300: builds.filter((a) => a.unit === "City" && a.tick <= spEnd + 3000).length,
    structuresBuilt,
    structuresLost,
    structuresCaptured,
    upgrades,
    attacksSent: attackActions.length,
    attacksVsPlayers: attackActions.filter((a) => a.targetType === "Human" || a.targetType === "Nation").length,
    attacksVsNullius: attackActions.filter((a) => a.targetType === "TerraNullius").length,
    avgAttackRatio: ratios.length ? ratios.reduce((a, b) => a + b, 0) / ratios.length : null,
    fullSends,
    stackRatio: stackRatios.length >= 2 ? median(stackRatios) : null,
    goodStackShare: stackRatios.length >= 2 ? stackRatios.filter((r) => r >= GOOD_STACK_RATIO).length / stackRatios.length : null,
    retreats: actions.filter((a) => a.type === "cancel_attack").length + myAttacks.filter((a) => a.retreated).length,
    troopsSent: at(stats.attacks, 0),
    troopsReceived: at(stats.attacks, 1),
    biggestHitTaken: at(stats.attacks, 3),
    boatsSent: at(stats.boats?.trans, 0),
    boatsArrived: at(stats.boats?.trans, 1),
    boatsLost: at(stats.boats?.trans, 4) || Math.max(0, at(stats.boats?.trans, 0) - at(stats.boats?.trans, 1)),
    tradeShipsSent: at(stats.boats?.trade, 0),
    tradeGold: goldBySource.trade,
    warshipsBuilt: at(stats.units?.wshp, 0),
    nukesLaunched: sumBomb(0),
    nukesLanded: sumBomb(1),
    nukesIntercepted: sumBomb(2),
    nukesReceived,
    samsBuilt: at(stats.units?.saml, 0),
    enemySiloTick: sam.trigger,
    samDelaySec: sam.delaySec,
    nukesWithoutOwnSam: sam.uncovered,
    openingDrainedPct: openN >= 5 ? drained / openN : null,
    donations,
    teamSize: team.size,
    teamShareMultiple: team.multiple,
    alliancesFormed: at(stats.alliances, 0),
    alliancesBrokenByOthers: at(stats.alliances, 1),
    betrayals: big(stats.betrayals) || fin?.betrayals || 0,
    conquests: (stats.conquests ?? []).reduce((a, b) => a + big(b), 0),
    maxDrawdown: maxDD,
    actionsPerMinute: actions.filter((a) => a.type !== "mark_disconnected").length / Math.max(1, lifeTicks / TICKS_PER_SECOND / 60),
  };
}

/** Your share of your team's land from `from` to `to`, as a multiple of a fair 1/teamSize share. */
function teamShare(view: ReplayView, sid: number, team: string | null, from: number, to: number) {
  if (team === null) return { size: null, multiple: null };
  const mates = view.data.players.filter((p) => p.type === "Human" && p.team === team && view.series(p.smallID)?.tiles.some((t) => t > 0));
  if (mates.length < 2) return { size: mates.length || null, multiple: null };
  const series = mates.map((p) => view.aligned(p.smallID, "tiles"));
  const mine = view.aligned(sid, "tiles");
  let sum = 0;
  let n = 0;
  view.ticks.forEach((t, i) => {
    if (t < from || t > to) return;
    const total = series.reduce((a, s) => a + s[i], 0);
    if (total <= 0) return;
    sum += mine[i] / total;
    n++;
  });
  return { size: mates.length, multiple: n ? (sum / n) * mates.length : null };
}

/**
 * When SAM cover arrived after the first enemy Silo (or the first nuke at
 * you): your own SAM, or a teammate's SAM within range of one of your Cities
 * (SAMs shoot down any enemy nuke that passes through their range). Also
 * counts nukes aimed at uncovered land while you had no SAM of your own, using
 * the launcher's target tile when a human launched it and your Cities
 * otherwise. (Attackers aim at uncovered land on purpose, so uncovered hits
 * alone just measure being a target.) Only human structures are tracked, so
 * nations' Silos don't count.
 */
function samCover(view: ReplayView, sid: number, team: string | null, spEnd: number, endTick: number) {
  const structs = view.data.structures;
  if (!structs) return { trigger: null, delaySec: null, uncovered: 0 };
  const friendly = (owner: number) => owner === sid || (team !== null && view.bySmallID.get(owner)?.team === team);
  const firstSilo = Math.min(Infinity, ...structs.filter((s) => s.type === "Missile Silo" && !friendly(s.owner) && s.builtTick >= spEnd).map((s) => s.builtTick));
  const nukes = view.data.events.filter((e) => e.kind === "UnitIncoming" && e.playerID === sid && [4, 5, 7].includes(e.messageType as number)).map((e) => e.tick);
  const trigger = Math.min(firstSilo, nukes[0] ?? Infinity);
  // Not judged if you were gone within 90 seconds of it.
  if (!Number.isFinite(trigger) || trigger > endTick - 90 * TICKS_PER_SECOND) return { trigger: null, delaySec: null, uncovered: 0 };
  const live = (s: { builtTick: number; endTick?: number }, t: number) => s.builtTick <= t && (s.endTick === undefined || s.endTick > t);
  const cities = structs.filter((s) => s.owner === sid && s.type === "City" && s.context);
  const sams = structs.filter((s) => s.type === "SAM Launcher" && friendly(s.owner) && s.context);
  const inRange = (x: number, y: number, t: number) => sams.some((s) => live(s, t) && Math.hypot(x - s.context!.x, y - s.context!.y) <= SAM_RANGE_LEVEL1);
  const covered = (t: number) => sams.some((s) => s.owner === sid && live(s, t)) || cities.some((c) => live(c, t) && inRange(c.context!.x, c.context!.y, t));

  const launches = view.data.actions.filter((a) => a.type === "build_unit" && a.target === sid && a.x != null && a.y != null && ["Atom Bomb", "Hydrogen Bomb", "MIRV"].includes(a.unit ?? ""));
  const used = new Set<number>();
  let uncovered = 0;
  for (const t of nukes) {
    if (sams.some((s) => s.owner === sid && live(s, t))) continue;
    const i = launches.findIndex((a, k) => !used.has(k) && Math.abs(a.tick - t) <= 20);
    if (i >= 0) {
      used.add(i);
      if (!inRange(launches[i].x!, launches[i].y!, t)) uncovered++;
      continue;
    }
    // A nation's nuke: no target tile, so ask whether most of your Cities were covered.
    const liveCities = cities.filter((c) => live(c, t));
    if (liveCities.filter((c) => inRange(c.context!.x, c.context!.y, t)).length < liveCities.length / 2) uncovered++;
  }

  const candidates = [trigger, ...sams.map((s) => s.builtTick), ...cities.map((c) => c.builtTick)].filter((t) => t >= trigger && t <= endTick).sort((a, b) => a - b);
  for (const t of candidates) if (covered(t)) return { trigger, delaySec: (t - trigger) / TICKS_PER_SECOND, uncovered };
  return { trigger, delaySec: 9999, uncovered };
}

/** The share of land each tracked player holds at each sample. */
export function landShareTable(view: ReplayView) {
  const land = view.landTiles;
  return view.trackedPlayers().map((p) => ({ p, share: view.aligned(p.smallID, "tiles").map((t) => t / land) }));
}

export { OPTIMAL_TROOP_RATIO };
