import type { ReplayData } from "../engine/replayTypes.js";
import type { GameRecord, PlayerRecord } from "../openfront/types.js";
import { computeMetrics, median, type PlayerMetrics } from "./metrics.js";
import { detectMoments } from "./moments.js";
import { ReplayView } from "./replayView.js";
import { clock, fmtNum, pct, TICKS_PER_SECOND } from "./rules.js";
import { coach, grade, scoreGame } from "./scoring.js";
import { analyzeStatsOnly } from "./statsOnly.js";
import type { Analysis, BuildRow, KeyMoment, PlayerSummary } from "./types.js";

export const ANALYSIS_VERSION = 1;

export interface Identity {
  clientID?: string | null;
  publicId?: string | null;
  username?: string | null;
}

export function findMe(record: GameRecord, who: Identity): PlayerRecord | null {
  const ps = record.info.players;
  if (who.clientID) {
    const p = ps.find((x) => x.clientID === who.clientID);
    if (p) return p;
  }
  if (who.publicId) {
    const p = ps.find((x) => x.publicID === who.publicId);
    if (p) return p;
  }
  if (who.username) {
    const u = who.username.trim().toLowerCase();
    const exact = ps.filter((x) => x.username.trim().toLowerCase() === u);
    if (exact.length === 1) return exact[0];
    const loose = ps.filter((x) => x.username.toLowerCase().replace(/^\[[^\]]*\]\s*/, "") === u.replace(/^\[[^\]]*\]\s*/, ""));
    if (loose.length === 1) return loose[0];
  }
  if (ps.length === 1) return ps[0];
  return null;
}

export function resultFor(record: GameRecord, me: PlayerRecord, myTeam: string | null, alive: boolean): Analysis["me"]["result"] {
  const w = record.info.winner;
  if (w && w.length >= 2) {
    const [kind, ...rest] = w;
    if (kind === "player" && rest[0] === me.clientID) return "victory";
    if (kind === "team" && (rest.includes(me.clientID) || (myTeam !== null && rest[0] === myTeam))) return "victory";
    return alive ? "defeat" : "eliminated";
  }
  return alive ? "survived" : "eliminated";
}

function winnerName(record: GameRecord, view: ReplayView | null): string | null {
  const w = record.info.winner;
  if (!w || w.length < 2) return null;
  if (w[0] === "player") return record.info.players.find((p) => p.clientID === w[1])?.username ?? view?.byClientID.get(w[1])?.name ?? w[1];
  if (w[0] === "team") return `Team ${w[1]}`;
  return w[1];
}

/** Lower-case only the first letter, so player names inside titles keep their case. */
const lc = (s: string) => s.charAt(0).toLowerCase() + s.slice(1);

function downsample<T>(arr: T[], idx: number[]): T[] {
  return idx.map((i) => arr[i]);
}

export function analyzeGame(record: GameRecord, replay: ReplayData | null, who: Identity, replayNote: string | null = null): Analysis {
  const meRec = findMe(record, who);
  if (!meRec) {
    throw new Error(
      `couldn't find you in game ${record.info.gameID} (players: ${record.info.players.map((p) => p.username).join(", ")}). ` +
        "Set your OpenFront username or public ID in the coach settings.",
    );
  }
  if (!replay) return analyzeStatsOnly(record, meRec, replayNote);

  const view = new ReplayView(replay);
  const humans = record.info.players;
  const all = humans.map((p) => computeMetrics(view, record, p)).filter((m): m is PlayerMetrics => m !== null);
  const me = all.find((m) => m.clientID === meRec.clientID);
  if (!me) return analyzeStatsOnly(record, meRec, "You never spawned in this game, so there is nothing to replay.");

  // A replay that ended early (desync on the exact build, engine error) only
  // covers part of the game: the outcome comes from the record instead.
  const truncated = replay.meta.ticks < record.info.num_turns - 100;
  if (truncated) {
    const killedAt = meRec.stats?.killedAt ? Number(meRec.stats.killedAt) : null;
    me.alive = killedAt === null;
    me.eliminatedTick = killedAt;
  }

  const myId = view.byClientID.get(me.clientID)?.id ?? null;
  const { moments, ledger } = detectMoments({ view, record, me, all, myId });
  const { categories, overall: baseScore } = scoreGame(view, me, all, ledger);
  const { strengths, weaknesses, drills } = coach(categories, moments, me);

  // ---- placement & leaderboard ------------------------------------------
  const finals = new Map(replay.finalState.map((f) => [f.smallID, f]));
  const elimTick = new Map<number, number>();
  for (const p of view.trackedPlayers()) {
    const alive = view.aligned(p.smallID, "alive");
    const f = finals.get(p.smallID);
    if (f?.alive && f.tiles > 0) continue;
    let last = -1;
    for (let i = 0; i < alive.length; i++) if (alive[i]) last = i;
    elimTick.set(p.smallID, last >= 0 ? view.ticks[last] : 0);
  }
  const ranked = view
    .trackedPlayers()
    .filter((p) => (view.series(p.smallID)?.tiles.some((t) => t > 0) ?? false))
    .map((p) => {
      const f = finals.get(p.smallID);
      const peak = Math.max(0, ...(view.series(p.smallID)?.tiles ?? [0]));
      return {
        p,
        alive: (f?.alive ?? false) && (f?.tiles ?? 0) > 0,
        tiles: f?.tiles ?? 0,
        peak,
        elim: elimTick.get(p.smallID) ?? null,
      };
    })
    .sort((a, b) => (a.alive !== b.alive ? (a.alive ? -1 : 1) : a.alive ? b.tiles - a.tiles : (b.elim ?? 0) - (a.elim ?? 0) || b.peak - a.peak));
  const leaderboard: PlayerSummary[] = ranked.map((r, i) => ({
    smallID: r.p.smallID,
    clientID: r.p.clientID,
    name: r.p.name,
    type: r.p.type,
    team: r.p.team,
    isMe: r.p.smallID === me.smallID,
    finalTiles: r.tiles,
    peakLandShare: r.peak / view.landTiles,
    alive: r.alive,
    eliminatedTick: r.elim,
    placement: i + 1,
  }));
  const result = resultFor(record, meRec, me.team, me.alive);
  // Placement: in team games, your team's rank (winning team first, then by
  // territory); otherwise your own rank, with the winner always first.
  const teamMode = record.info.config.gameMode === "Team" && me.team !== null;
  let myPlacement = leaderboard.find((l) => l.isMe)?.placement ?? null;
  let placementOf = leaderboard.length;
  let placementUnit: "players" | "teams" = "players";
  if (teamMode) {
    const teams = new Map<string, number>();
    for (const l of leaderboard) if (l.team) teams.set(l.team, (teams.get(l.team) ?? 0) + l.finalTiles);
    const w = record.info.winner;
    const winTeam = w && w[0] === "team" ? w[1] : null;
    const order = [...teams.entries()].sort((a, b) => (a[0] === winTeam ? -1 : b[0] === winTeam ? 1 : b[1] - a[1]));
    myPlacement = order.findIndex(([t]) => t === me.team) + 1 || null;
    placementOf = order.length;
    placementUnit = "teams";
  } else if (result === "victory" && myPlacement !== 1) {
    myPlacement = 1;
  }

  let overall = baseScore;
  if (result === "victory") overall = Math.max(overall, Math.min(100, overall + 12));
  else if (myPlacement !== null && placementOf > 2) {
    const frac = 1 - (myPlacement - 1) / (placementOf - 1);
    overall = Math.round(overall * 0.85 + frac * 100 * 0.15);
  }
  overall = Math.max(0, Math.min(100, Math.round(overall)));

  // ---- timeline ---------------------------------------------------------
  const n = view.ticks.length;
  const step = Math.max(1, Math.ceil(n / 360));
  const idx: number[] = [];
  for (let i = 0; i < n; i += step) idx.push(i);
  if (idx[idx.length - 1] !== n - 1) idx.push(n - 1);
  const land = view.landTiles;
  const myTiles = view.aligned(me.smallID, "tiles");
  const tracked = view.trackedPlayers();
  const shares = new Map(tracked.map((p) => [p.smallID, view.aligned(p.smallID, "tiles")]));
  const rankSeries = view.ticks.map((_, i) => 1 + tracked.filter((p) => p.smallID !== me.smallID && (shares.get(p.smallID)?.[i] ?? 0) > myTiles[i]).length);
  // Rivals: whoever hit you hardest first, then the biggest players.
  const pressure = new Map<number, number>();
  for (const at of replay.attacks) if (at.target === me.smallID) pressure.set(at.attacker, (pressure.get(at.attacker) ?? 0) + at.troops);
  const byPressure = [...pressure.entries()].sort((a, b) => b[1] - a[1]).map(([sid]) => sid).filter((sid) => shares.has(sid));
  const byPeak = tracked
    .filter((p) => p.smallID !== me.smallID)
    .map((p) => ({ p, peak: Math.max(0, ...(shares.get(p.smallID) ?? [0])) }))
    .sort((a, b) => b.peak - a.peak)
    .map((x) => x.p.smallID);
  const rivalIds = [...new Set([...byPressure.slice(0, 2), ...byPeak])].slice(0, 4);
  const rivals = rivalIds
    .map((sid) => ({ p: view.bySmallID.get(sid)! }))
    .map(({ p }) => ({ name: p.name, smallID: p.smallID, type: p.type, landShare: downsample(shares.get(p.smallID)!, idx).map((t) => +(t / land).toFixed(5)) }));
  const leader = view.ticks.map((_, i) => Math.max(0, ...tracked.map((p) => shares.get(p.smallID)?.[i] ?? 0)) / land);

  const timeline = {
    ticks: downsample(view.ticks, idx),
    me: {
      tiles: downsample(myTiles, idx),
      troops: downsample(view.aligned(me.smallID, "troops"), idx),
      maxTroops: downsample(view.aligned(me.smallID, "maxTroops"), idx),
      gold: downsample(view.aligned(me.smallID, "gold"), idx),
      landShare: downsample(myTiles, idx).map((t) => +(t / land).toFixed(5)),
      rank: downsample(rankSeries, idx),
    },
    rivals,
    leaderLandShare: downsample(leader, idx).map((x) => +x.toFixed(5)),
  };

  // ---- builds -------------------------------------------------------------
  const builds: BuildRow[] = replay.actions
    .filter((a) => a.clientID === me.clientID && (a.type === "build_unit" || a.type === "upgrade_structure"))
    .map((a) => ({ tick: a.tick, unit: a.unit ?? "?", cost: a.cost ?? 0, goldBefore: a.gold ?? 0, upgrade: a.type === "upgrade_structure" || undefined }));

  // ---- phases -------------------------------------------------------------
  const spEnd = me.spawnPhaseEndTick;
  const endTick = me.eliminatedTick ?? replay.meta.ticks;
  const openingEnd = Math.min(endTick, spEnd + 180 * TICKS_PER_SECOND);
  const midEnd = Math.max(openingEnd, Math.min(endTick, spEnd + Math.max(480 * TICKS_PER_SECOND, (endTick - spEnd) * 0.65)));
  const phaseDefs = [
    { name: "Opening", startTick: 0, endTick: openingEnd },
    { name: "Mid game", startTick: openingEnd, endTick: midEnd },
    { name: "Late game", startTick: midEnd, endTick },
  ].filter((p) => p.endTick - p.startTick > 30 * TICKS_PER_SECOND);
  const sev = { brilliant: 14, good: 7, info: 0, inaccuracy: -6, mistake: -12, blunder: -20 } as const;
  const phases = phaseDefs.map((ph) => {
    const ms = moments.filter((m) => m.tick >= ph.startTick && m.tick < ph.endTick);
    const startShare = view.valueAt(me.smallID, "tiles", ph.startTick) / land;
    const endShare = view.valueAt(me.smallID, "tiles", ph.endTick) / land;
    const startLead = Math.max(...tracked.map((p) => view.valueAt(p.smallID, "tiles", ph.startTick))) / land;
    const endLead = Math.max(...tracked.map((p) => view.valueAt(p.smallID, "tiles", ph.endTick))) / land;
    const relStart = startLead > 0 ? startShare / startLead : 0;
    const relEnd = endLead > 0 ? endShare / endLead : 0;
    let score = 68 + ms.reduce((a, m) => a + sev[m.severity], 0) + (relEnd - relStart) * 60;
    if (ph.name === "Opening") {
      const e = categories.find((c) => c.key === "expansion");
      if (e) score = 0.5 * score + 0.5 * e.score;
    }
    score = Math.max(5, Math.min(100, score));
    const worst = ms.filter((m) => m.severity === "blunder" || m.severity === "mistake")[0];
    const best = ms.filter((m) => m.severity === "brilliant" || m.severity === "good")[0];
    return {
      name: ph.name,
      startTick: ph.startTick,
      endTick: ph.endTick,
      grade: grade(score),
      note: `${pct(startShare, 1)} → ${pct(endShare, 1)} of the map.` + (worst ? ` Key mistake: ${lc(worst.title)}.` : best ? ` Highlight: ${lc(best.title)}.` : ""),
    };
  });

  // ---- headline -----------------------------------------------------------
  const winner = winnerName(record, view);
  const biggest = [...moments].filter((m) => m.severity === "blunder" || m.severity === "mistake").sort((a, b) => (a.landShareDelta ?? 0) - (b.landShareDelta ?? 0))[0];
  let headline: string;
  if (result === "victory") headline = `Victory on ${record.info.config.gameMap} — you finished with ${pct(me.finalLandShare, 1)} of the map.`;
  else if (result === "eliminated")
    headline = `Eliminated at ${clock(me.eliminatedTick ?? 0)} after peaking at ${pct(me.peakLandShare, 1)} of the map` + (myPlacement ? ` (${placementUnit === "teams" ? `your team placed #${myPlacement} of ${placementOf} teams` : `placed #${myPlacement} of ${placementOf}`}).` : ".");
  else if (truncated) headline = `Analysis covers the first ${clock(replay.meta.ticks)} of the game; you held ${pct(me.finalLandShare, 1)} of the map by then` + (winner ? ` and ${winner} went on to win.` : ".");
  else headline = `Survived to the end with ${pct(me.finalLandShare, 1)} of the map` + (winner ? `; ${winner} won.` : ".");
  if (biggest) headline += ` Biggest swing: ${lc(biggest.title)} at ${clock(biggest.tick)}.`;

  const counts = { humans: humans.length, nations: replay.players.filter((p) => p.type === "Nation").length };
  const trendMetrics: Record<string, number | null> = { overall };
  for (const c of categories) {
    trendMetrics[`cat.${c.key}`] = c.score;
    for (const m of c.metrics) trendMetrics[m.key] = m.value;
  }
  trendMetrics.peakLandShare = me.peakLandShare;
  trendMetrics.placement = myPlacement;
  trendMetrics.won = result === "victory" ? 1 : 0;

  const keyNumbers = keyNumbersFor(me, all, categories);

  return {
    analysisVersion: ANALYSIS_VERSION,
    gameId: record.info.gameID,
    analyzedAt: new Date().toISOString(),
    depth: "replay",
    replayNote,
    game: {
      map: record.info.config.gameMap,
      mapSize: record.info.config.gameMapSize ?? "Normal",
      mode: record.info.config.gameMode,
      type: record.info.config.gameType,
      difficulty: record.info.config.difficulty,
      durationTicks: replay.meta.ticks,
      startedAt: record.info.start,
      endedAt: record.info.end,
      gitCommit: record.gitCommit,
      humans: counts.humans,
      nations: counts.nations,
      bots: record.info.config.bots ?? 0,
      winner,
      teams: typeof record.info.config.playerTeams === "number" && record.info.config.gameMode === "Team" ? record.info.config.playerTeams : null,
    },
    me: {
      clientID: me.clientID,
      name: me.name,
      smallID: me.smallID,
      team: me.team,
      result,
      placement: myPlacement,
      placementOf,
      placementUnit,
      eliminatedTick: me.eliminatedTick,
      finalLandShare: me.finalLandShare,
      peakLandShare: me.peakLandShare,
    },
    headline,
    overall: { score: overall, grade: grade(overall) },
    categories,
    keyNumbers,
    moments,
    attacks: ledger,
    builds,
    strengths,
    weaknesses,
    drills,
    phases,
    timeline,
    leaderboard: leaderboard.slice(0, 12).concat(leaderboard.slice(12).filter((l) => l.isMe)),
    narrative: null,
    ai: { jev: { used: false }, narrator: { used: false } },
    trendMetrics,
  };
}

/** The "five numbers" triage card (AoE2-style): read these before anything else. */
function keyNumbersFor(me: PlayerMetrics, all: PlayerMetrics[], categories: Analysis["categories"]) {
  const pick = (key: string) => categories.flatMap((c) => c.metrics).find((m) => m.key === key);
  const out = ["share120", "firstCity", "troopEff", "atCap", "float", "drawdown"].map(pick).filter((x): x is NonNullable<typeof x> => !!x);
  const others = all.filter((m) => m.smallID !== me.smallID);
  out.push({
    key: "apm",
    label: "Actions per minute",
    value: me.actionsPerMinute,
    display: me.actionsPerMinute.toFixed(1),
    median: others.length >= 2 ? median(others.map((o) => o.actionsPerMinute)) : null,
    medianDisplay: (() => {
      const m = others.length >= 2 ? median(others.map((o) => o.actionsPerMinute)) : null;
      return m === null ? undefined : m.toFixed(1);
    })(),
    higherIsBetter: true,
    hint: "Attacks, builds, boats and diplomacy per minute alive.",
  });
  void fmtNum;
  return out;
}

export type { KeyMoment };
