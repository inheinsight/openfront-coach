import type { AttackRecord } from "../engine/replayTypes.js";
import type { GameRecord, PlayerRecord } from "../openfront/types.js";
import { ReplayView } from "./replayView.js";
import { OPTIMAL_TROOP_RATIO, peakRegenPerTick, TICKS_PER_SECOND, troopRegenPerTick } from "./rules.js";

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
  troopEfficiency: number | null; // avg regen / peak regen, post spawn
  timeAtCapPct: number | null; // share of life with troops >= 90% of cap
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

  // Troop management over the player's life after the spawn phase.
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
    effSum += troopRegenPerTick(troops[i], maxT[i]) / peakRegenPerTick(maxT[i]);
    effN++;
    if (r >= 0.9) atCap++;
    if (r < 0.15) over++;
    ratioSum += r;
    goldSum += gold[i];
    goldN++;
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
    alliancesFormed: at(stats.alliances, 0),
    alliancesBrokenByOthers: at(stats.alliances, 1),
    betrayals: big(stats.betrayals) || fin?.betrayals || 0,
    conquests: (stats.conquests ?? []).reduce((a, b) => a + big(b), 0),
    maxDrawdown: maxDD,
    actionsPerMinute: actions.filter((a) => a.type !== "mark_disconnected").length / Math.max(1, lifeTicks / TICKS_PER_SECOND / 60),
  };
}

/** The share of land each tracked player holds at each sample. */
export function landShareTable(view: ReplayView) {
  const land = view.landTiles;
  return view.trackedPlayers().map((p) => ({ p, share: view.aligned(p.smallID, "tiles").map((t) => t / land) }));
}

export { OPTIMAL_TROOP_RATIO };
