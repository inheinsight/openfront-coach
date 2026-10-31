// Throwaway research extractor: per-human features + coach moments for every public game.
// Run from the repo root: npx tsx <this file> [gameId ...]
import fs from "node:fs";
import zlib from "node:zlib";

const REPO = "/Users/justinhein/Development/openFrontCoach/.claude/worktrees/openfront-coaching-research-36333c";
const D = "/Users/justinhein/Development/openFrontCoach/data";
const OUT = "/private/tmp/claude-501/-Users-justinhein-Development-openFrontCoach--claude-worktrees-openfront-coaching-research-36333c/0a6aa421-0e8a-4d79-9dac-5316864f0a94/scratchpad/out";
fs.mkdirSync(OUT, { recursive: true });

const { ReplayView } = await import(REPO + "/src/analysis/replayView.ts");
const { computeMetrics, spawnPhaseEnd } = await import(REPO + "/src/analysis/metrics.ts");
const { analyzeGame } = await import(REPO + "/src/analysis/analyze.ts");
const { overallOf } = await import(REPO + "/src/analysis/scoring.ts");

const SEC = 10;
const reps = fs.readdirSync(D + "/replays");
const only = process.argv.slice(2);
const ids = fs.readdirSync(D + "/records").map((f) => f.replace(".json", "")).filter((id) => !only.length || only.includes(id));

const num = (v: unknown) => (v === undefined || v === null ? 0 : Number(v));
const median = (xs: number[]) => {
  const v = xs.filter((x) => Number.isFinite(x)).sort((a, b) => a - b);
  if (!v.length) return null;
  const m = v.length >> 1;
  return v.length % 2 ? v[m] : (v[m - 1] + v[m]) / 2;
};

for (const id of ids) {
  const rec = JSON.parse(fs.readFileSync(`${D}/records/${id}.json`, "utf8"));
  if (rec.info.config.gameType !== "Public") continue;
  const cands = reps
    .filter((f) => f.startsWith(id + "."))
    .map((f) => ({ f, v: Number((f.match(/\.h(\d+)\./) ?? [0, 0])[1]) }))
    .sort((a, b) => b.v - a.v);
  if (!cands.length) continue;
  const t0 = Date.now();
  const replay = JSON.parse(zlib.gunzipSync(fs.readFileSync(`${D}/replays/${cands[0].f}`)).toString());
  const view = new ReplayView(replay);
  const spEnd = spawnPhaseEnd(view, rec);
  const land = view.landTiles;
  const ticks: number[] = view.ticks;
  const se = replay.meta.sampleEvery;
  const all = rec.info.players.map((p: any) => computeMetrics(view, rec, p)).filter((m: any) => m !== null);
  const winner = rec.info.winner as string[] | null;
  const teamMode = rec.info.config.gameMode === "Team";
  const winTeam = winner && winner[0] === "team" ? winner[1] : null;
  const winPlayer = winner && winner[0] === "player" ? winner[1] : null;
  const structs: any[] = replay.structures ?? [];
  const hasStructs = structs.length > 0;

  // ranks among spawned humans
  const finals = new Map(replay.finalState.map((f: any) => [f.smallID, f]));
  const order = [...all].sort((a: any, b: any) =>
    a.alive !== b.alive ? (a.alive ? -1 : 1) : a.alive ? b.finalTiles - a.finalTiles : (b.eliminatedTick ?? 0) - (a.eliminatedTick ?? 0) || b.peakTiles - a.peakTiles,
  );
  const finalRank = new Map(order.map((m: any, i: number) => [m.smallID, i + 1]));
  const peakOrder = [...all].sort((a: any, b: any) => b.peakTiles - a.peakTiles);
  const peakRank = new Map(peakOrder.map((m: any, i: number) => [m.smallID, i + 1]));

  // land rank among humans at arbitrary tick
  const tilesAligned = new Map(all.map((m: any) => [m.smallID, view.aligned(m.smallID, "tiles")]));
  const rankAt = (sid: number, tick: number) => {
    const i = view.sampleIndex(tick);
    if (i < 0) return null;
    const mine = tilesAligned.get(sid)![i];
    if (!mine) return null;
    let r = 1;
    for (const [o, arr] of tilesAligned) if (o !== sid && arr[i] > mine) r++;
    return r;
  };

  // team totals
  const teamOf = new Map(all.map((m: any) => [m.smallID, m.team]));
  const teamFinal = new Map<string, number>();
  const teamPeakSum = new Map<string, number>();
  const teamSize = new Map<string, number>();
  for (const m of all as any[]) {
    if (!m.team) continue;
    teamFinal.set(m.team, (teamFinal.get(m.team) ?? 0) + m.finalTiles);
    teamPeakSum.set(m.team, (teamPeakSum.get(m.team) ?? 0) + m.peakTiles);
    teamSize.set(m.team, (teamSize.get(m.team) ?? 0) + 1);
  }

  // game-level nukes & silos
  const nukeEvents = replay.events.filter((e: any) => e.kind === "UnitIncoming" && [4, 5, 7].includes(e.messageType));
  const silos = structs.filter((s) => s.type === "Missile Silo").sort((a, b) => a.builtTick - b.builtTick);
  const sams = structs.filter((s) => s.type === "SAM Launcher").sort((a, b) => a.builtTick - b.builtTick);
  const game = {
    id,
    harness: cands[0].f,
    commit: String(rec.gitCommit).slice(0, 8),
    start: new Date(rec.info.start).toISOString(),
    map: rec.info.config.gameMap,
    mode: rec.info.config.gameMode,
    teams: rec.info.config.playerTeams ?? null,
    nations: replay.players.filter((p: any) => p.type === "Nation").length,
    bots: rec.info.config.bots,
    humansSpawned: all.length,
    humansInRecord: rec.info.players.length,
    durationSec: Math.round((replay.meta.ticks - spEnd) / SEC),
    spEnd,
    sampleEvery: se,
    landTiles: land,
    winTeam,
    winPlayer,
    hasStructs,
    firstSiloSec: silos[0] ? (silos[0].builtTick - spEnd) / SEC : null,
    firstSamSec: sams[0] ? (sams[0].builtTick - spEnd) / SEC : null,
    firstNukeSec: nukeEvents[0] ? (nukeEvents[0].tick - spEnd) / SEC : null,
    nukesTotal: nukeEvents.length,
    nukesByType: nukeEvents.reduce((a: any, e: any) => ((a[e.messageType] = (a[e.messageType] ?? 0) + 1), a), {}),
    teamFinal: Object.fromEntries(teamFinal),
    teamSize: Object.fromEntries(teamSize),
  };

  const rows: any[] = [];
  for (const m of all as any[]) {
    const sid = m.smallID;
    const rp = view.bySmallID.get(sid);
    const pid = rp?.id;
    const isMe = /astrongerfellow/i.test(m.name);
    const won = teamMode ? m.team !== null && m.team === winTeam : m.clientID === winPlayer;
    const endTick = m.eliminatedTick ?? replay.meta.ticks;
    const st = rec.info.players.find((p: any) => p.clientID === m.clientID)?.stats ?? {};

    // ---- expansion
    const shares: Record<string, number | null> = {};
    const ranks: Record<string, number | null> = {};
    for (const s of [30, 60, 120, 180, 300, 600, 900, 1200]) {
      const t = spEnd + s * SEC;
      if (t > replay.meta.ticks || (m.eliminatedTick !== null && t > m.eliminatedTick)) {
        shares[s] = null;
        ranks[s] = null;
        continue;
      }
      shares[s] = view.valueAt(sid, "tiles", t) / land;
      ranks[s] = rankAt(sid, t);
    }
    const firstExpDelay = m.firstExpansionTick !== null ? (m.firstExpansionTick - spEnd) / SEC : null;

    // ---- troops
    const troops = view.aligned(sid, "troops");
    const maxT = view.aligned(sid, "maxTroops");
    const alive = view.aligned(sid, "alive");
    const atkOut = view.aligned(sid, "attacksOut");
    const gold = view.aligned(sid, "gold");
    let n = 0, nearPeak = 0, cap88 = 0, low15 = 0, idleCap = 0, mid55_88 = 0, below30 = 0;
    const phaseBands: Record<string, { n: number; nearPeak: number; cap88: number; sum: number }> = { early: { n: 0, nearPeak: 0, cap88: 0, sum: 0 }, mid: { n: 0, nearPeak: 0, cap88: 0, sum: 0 }, late: { n: 0, nearPeak: 0, cap88: 0, sum: 0 } };
    let goldOver15 = 0, goldN = 0;
    for (let i = 0; i < ticks.length; i++) {
      if (ticks[i] <= spEnd + 20 || ticks[i] > endTick || !alive[i] || maxT[i] <= 0) continue;
      const r = troops[i] / maxT[i];
      n++;
      if (r >= 0.3 && r <= 0.55) nearPeak++;
      if (r >= 0.88) cap88++;
      if (r > 0.55 && r < 0.88) mid55_88++;
      if (r < 0.3) below30++;
      if (r < 0.15) low15++;
      if (r >= 0.88 && atkOut[i] === 0) idleCap++;
      const sec = (ticks[i] - spEnd) / SEC;
      const ph = sec < 300 ? "early" : sec < 900 ? "mid" : "late";
      phaseBands[ph].n++;
      phaseBands[ph].sum += r;
      if (r >= 0.3 && r <= 0.55) phaseBands[ph].nearPeak++;
      if (r >= 0.88) phaseBands[ph].cap88++;
      goldN++;
      if (gold[i] > 1_500_000) goldOver15++;
    }
    const troopsOut = {
      samples: n,
      avgRatio: m.avgTroopRatio,
      eff: m.troopEfficiency,
      nearPeak: n ? nearPeak / n : null,
      mid55_88: n ? mid55_88 / n : null,
      cap88: n ? cap88 / n : null,
      below30: n ? below30 / n : null,
      low15: n ? low15 / n : null,
      idleCapSec: (idleCap * se) / SEC,
      phases: Object.fromEntries(Object.entries(phaseBands).map(([k, v]) => [k, v.n ? { avg: v.sum / v.n, nearPeak: v.nearPeak / v.n, cap88: v.cap88 / v.n, n: v.n } : null])),
      peakTroops: m.peakTroops,
    };

    // ---- attacks (records)
    const isMerged = (a: any) => ((a.endTick ?? a.lastTick) - a.startTick) / SEC < 2 && Math.max(0, a.troops - (a.lastTroops ?? 0)) < 0.3 * a.troops;
    const mineA = replay.attacks.filter((a: any) => a.attacker === sid);
    const atk: any[] = [];
    const pool: Record<string, { used: number; tiles: number; n: number }> = {};
    for (const a of mineA) {
      const used = Math.max(0, a.troops - (a.lastTroops ?? 0));
      const tiles = a.tilesCaptured ?? 0;
      const tt = a.targetType;
      pool[tt] = pool[tt] ?? { used: 0, tiles: 0, n: 0 };
      pool[tt].used += used;
      pool[tt].tiles += tiles;
      pool[tt].n++;
      if (tt !== "Human" && tt !== "Nation") continue;
      if (isMerged(a)) continue;
      const before = a.troops + a.attackerTroopsAfterLaunch;
      atk.push([
        Math.round((a.startTick - spEnd) / SEC),
        a.targetTroopsStart > 0 ? +(a.troops / a.targetTroopsStart).toFixed(3) : null,
        before > 0 ? +(a.troops / before).toFixed(3) : null,
        used,
        tiles,
        a.naval ? 1 : 0,
        a.retreated ? 1 : 0,
        tt === "Human" ? 1 : 0,
        a.targetAliveEnd === false ? 1 : 0,
        teamMode ? (teamOf.get(a.target) === m.team ? 1 : 0) : 0,
        a.troops,
        a.targetTroopsStart,
      ]);
    }

    // ---- send ratios (intents)
    const acts = replay.actions.filter((a: any) => a.clientID === m.clientID);
    const sendR = (pred: (a: any) => boolean) =>
      median(acts.filter((a: any) => (a.type === "attack" || a.type === "boat") && (a.troops ?? 0) > 0 && (a.sent ?? 0) > 0 && pred(a)).map((a: any) => a.sent / a.troops));
    const sends = {
      openingTN: sendR((a) => a.tick <= spEnd + 120 * SEC && a.targetType === "TerraNullius"),
      firstSend: (() => {
        const f = acts.find((a: any) => (a.type === "attack" || a.type === "boat") && a.tick >= spEnd - 5);
        return f && f.troops ? f.sent / f.troops : null;
      })(),
      playersEarly: sendR((a) => a.tick <= spEnd + 300 * SEC && (a.targetType === "Human" || a.targetType === "Nation")),
      playersMid: sendR((a) => a.tick > spEnd + 300 * SEC && a.tick <= spEnd + 900 * SEC && (a.targetType === "Human" || a.targetType === "Nation")),
      playersLate: sendR((a) => a.tick > spEnd + 900 * SEC && (a.targetType === "Human" || a.targetType === "Nation")),
      bots: sendR((a) => a.targetType === "Bot"),
      nAttackIntents: acts.filter((a: any) => a.type === "attack").length,
      ratioHist: (() => {
        const rs = acts.filter((a: any) => (a.type === "attack" || a.type === "boat") && (a.troops ?? 0) > 0 && (a.sent ?? 0) > 0 && a.tick > spEnd + 60 * SEC).map((a: any) => a.sent / a.troops);
        return { n: rs.length, def20: rs.filter((r: number) => r >= 0.18 && r <= 0.22).length, ge50: rs.filter((r: number) => r >= 0.5).length, ge60: rs.filter((r: number) => r >= 0.6).length, le12: rs.filter((r: number) => r <= 0.12).length };
      })(),
      opening15: (() => {
        const os = acts.filter((a: any) => (a.type === "attack" || a.type === "boat") && a.tick >= spEnd - 5 && a.tick <= spEnd + 15 * SEC);
        const t0 = os[0]?.troops ?? 0;
        return { n: os.length, sentShare: t0 > 0 ? os.reduce((x: number, a: any) => x + (a.sent ?? 0), 0) / t0 : null };
      })(),
      opening60n: acts.filter((a: any) => (a.type === "attack" || a.type === "boat") && a.tick >= spEnd - 5 && a.tick <= spEnd + 60 * SEC).length,
      nBoatIntents: acts.filter((a: any) => a.type === "boat").length,
    };

    // ---- structures & builds
    const myStructs = structs.filter((s) => s.owner === sid);
    const firstBuilt: Record<string, number | null> = {};
    const built10: Record<string, number> = {};
    const builtAll: Record<string, number> = {};
    const lostFast: Record<string, number> = {};
    for (const T of ["City", "Port", "Factory", "Defense Post", "Missile Silo", "SAM Launcher", "Warship"]) {
      const ss = myStructs.filter((s) => s.type === T);
      firstBuilt[T] = ss.length ? (Math.min(...ss.map((s) => s.builtTick)) - spEnd) / SEC : null;
      built10[T] = ss.filter((s) => s.builtTick <= spEnd + 600 * SEC).length;
      builtAll[T] = ss.length;
      lostFast[T] = ss.filter((s) => s.endTick !== undefined && s.endTick - s.builtTick < 150 * SEC).length;
    }
    const builds = acts.filter((a: any) => a.type === "build_unit" || a.type === "upgrade_structure");
    const firstOrder: Record<string, number | null> = {};
    for (const T of ["City", "Port", "Factory", "Defense Post", "Missile Silo", "SAM Launcher", "Warship", "Atom Bomb", "Hydrogen Bomb", "MIRV"]) {
      const f = builds.find((a: any) => a.type === "build_unit" && a.unit === T);
      firstOrder[T] = f ? (f.tick - spEnd) / SEC : null;
    }
    const b10 = builds.filter((a: any) => a.tick <= spEnd + 600 * SEC);
    const order10 = b10.map((a: any) => (a.type === "upgrade_structure" ? "^" : "") + a.unit);
    const spend10: Record<string, number> = {};
    for (const a of b10) {
      const k = (a.type === "upgrade_structure" ? "up:" : "") + a.unit;
      spend10[k] = (spend10[k] ?? 0) + (a.cost ?? 0);
    }
    const upgrades = builds.filter((a: any) => a.type === "upgrade_structure").reduce((acc: any, a: any) => ((acc[a.unit] = (acc[a.unit] ?? 0) + 1), acc), {});
    // City upgrades vs new cities; levels at end
    const cityLevelsEnd = myStructs.filter((s) => s.type === "City").map((s) => s.levels[s.levels.length - 1]?.[1] ?? 1);

    // ---- gold
    const g = st.gold ?? [];
    const goldStats = { work: num(g[0]), war: num(g[1]), trade: num(g[2]), steal: num(g[3]), trainSelf: num(g[4]), trainOther: num(g[5]), donRecv: num(g[6]) };
    const earned = view.aligned(sid, "goldEarned");
    const tradeS = view.aligned(sid, "tradeGold");
    const trainS = view.aligned(sid, "trainGold");
    const pirS = view.aligned(sid, "piracyGold");
    const cumAt = (arr: number[], t: number) => {
      const i = view.sampleIndex(Math.min(t, endTick));
      return i < 0 ? 0 : arr[i];
    };
    const windows: any[] = [];
    for (let k = 0; k < 6; k++) {
      const a = spEnd + k * 300 * SEC;
      const b = spEnd + (k + 1) * 300 * SEC;
      if (a >= endTick) break;
      const mins = (Math.min(b, endTick) - a) / SEC / 60;
      if (mins < 1) break;
      const e = cumAt(earned, b) - cumAt(earned, a);
      const tr = cumAt(tradeS, b) - cumAt(tradeS, a);
      const trn = cumAt(trainS, b) - cumAt(trainS, a);
      const pi = cumAt(pirS, b) - cumAt(pirS, a);
      windows.push({ k, perMin: e / mins, trade: tr / mins, train: trn / mins, piracy: pi / mins, other: (e - tr - trn - pi) / mins });
    }
    const goldAt: Record<string, number | null> = {};
    for (const s of [120, 300, 600, 900, 1200]) {
      const t = spEnd + s * SEC;
      goldAt[s] = t > endTick ? null : view.valueAt(sid, "gold", t);
    }

    // ---- donations
    const donTroopsSent = acts.filter((a: any) => a.type === "donate_troops");
    const donGoldSent = acts.filter((a: any) => a.type === "donate_gold");
    const dEv = replay.events.filter((e: any) => e.kind === "DonateEvent");
    const recvT = dEv.filter((e: any) => e.recipientId === pid && e.donationType === "troops");
    const recvG = dEv.filter((e: any) => e.recipientId === pid && e.donationType === "gold");
    const sentTEv = dEv.filter((e: any) => e.senderId === pid && e.donationType === "troops");
    const sentGEv = dEv.filter((e: any) => e.senderId === pid && e.donationType === "gold");
    const donations = {
      troopsSentN: sentTEv.length || donTroopsSent.length,
      troopsSent: sentTEv.reduce((a: number, e: any) => a + num(e.amount), 0),
      goldSentN: sentGEv.length || donGoldSent.length,
      goldSent: sentGEv.reduce((a: number, e: any) => a + num(e.amount), 0),
      troopsRecvN: recvT.length,
      troopsRecv: recvT.reduce((a: number, e: any) => a + num(e.amount), 0),
      goldRecvN: recvG.length,
      goldRecv: recvG.reduce((a: number, e: any) => a + num(e.amount), 0),
      recvTimes: recvT.map((e: any) => [Math.round((e.tick - spEnd) / SEC), Math.round(num(e.amount))]),
      sentTimes: sentTEv.map((e: any) => [Math.round((e.tick - spEnd) / SEC), Math.round(num(e.amount))]),
      firstSentSec: (() => {
        const f = [...sentTEv, ...sentGEv].sort((a: any, b: any) => a.tick - b.tick)[0];
        return f ? (f.tick - spEnd) / SEC : null;
      })(),
    };

    // ---- nukes
    const inc = nukeEvents.filter((e: any) => e.playerID === sid);
    const bombs = st.bombs ?? {};
    const sb = (i: number) => num(bombs.abomb?.[i]) + num(bombs.hbomb?.[i]) + num(bombs.mirv?.[i]);
    // first enemy silo (team: other team; FFA: anyone else)
    const enemySilo = silos.find((s) => s.owner !== sid && (!teamMode || teamOf.get(s.owner) !== m.team));
    const nukes = {
      received: inc.length,
      firstReceivedSec: inc[0] ? (inc[0].tick - spEnd) / SEC : null,
      rankWhenFirstNuked: inc[0] ? rankAt(sid, inc[0].tick) : null,
      launched: sb(0),
      landed: sb(1),
      intercepted: sb(2),
      firstEnemySiloSec: enemySilo ? (enemySilo.builtTick - spEnd) / SEC : null,
      samsAtFirstNuke: inc[0] ? myStructs.filter((s) => s.type === "SAM Launcher" && s.builtTick <= inc[0].tick && (s.endTick === undefined || s.endTick > inc[0].tick)).length : null,
    };

    // ---- coach output for this player as the focus
    let coach: any = null;
    try {
      const an = analyzeGame(rec, replay, { clientID: m.clientID });
      coach = {
        overall: an.overall.score,
        base: overallOf(an.categories),
        cats: Object.fromEntries(an.categories.map((c: any) => [c.key, c.score])),
        keyMetrics: Object.fromEntries(an.categories.flatMap((c: any) => c.metrics).map((x: any) => [x.key, x.value])),
        moments: an.moments.map((x: any) => ({ t: x.title, s: x.severity, k: x.kind, tick: x.tick, ev: x.evidence })),
        advice: an.economy?.advice ?? [],
        weaknesses: (an.weaknesses ?? []).map((w: any) => w.title ?? w),
        drills: (an.drills ?? []).map((d: any) => d.title ?? d),
        ledger: (() => {
          const out: Record<string, number> = {};
          for (const r of an.attacks ?? []) {
            if (r.targetType !== "Human" && r.targetType !== "Nation") continue;
            out[r.verdict] = (out[r.verdict] ?? 0) + 1;
            out.total = (out.total ?? 0) + 1;
          }
          return out;
        })(),
        econYou: an.economy?.you ?? null,
        cityWaits: (an.economy?.buildOrder ?? []).filter((b: any) => b.unit === "City" && !b.upgrade).map((b: any) => b.waitedSec),
        placements: (an.economy?.placements ?? []).map((p: any) => ({ type: p.type, verdict: p.verdict, issue: p.issue, fate: p.fate })),
        result: an.me.result,
      };
    } catch (e: any) {
      coach = { error: String(e?.message ?? e) };
    }

    rows.push({
      name: m.name,
      clientID: m.clientID,
      sid,
      team: m.team,
      isMe,
      won,
      alive: m.alive,
      lifeSec: m.lifeTicks / SEC,
      finalShare: m.finalLandShare,
      peakShare: m.peakLandShare,
      finalRank: finalRank.get(sid),
      peakRank: peakRank.get(sid),
      teamShareOfTeamFinal: m.team && teamFinal.get(m.team) ? m.finalTiles / teamFinal.get(m.team)! : null,
      teamShareOfTeamPeak: m.team && teamPeakSum.get(m.team) ? m.peakTiles / teamPeakSum.get(m.team)! : null,
      shares,
      ranks,
      firstExpDelay,
      spawnSec: m.spawnTick !== null ? m.spawnTick / SEC : null,
      troops: troopsOut,
      attackPool: pool,
      atk,
      sends,
      retreats: m.retreats,
      fullSends: m.fullSends,
      conquests: m.conquests,
      firstBuilt,
      built10,
      builtAll,
      lostFast,
      firstOrder,
      order10,
      spend10,
      upgrades,
      cityLevelsEnd,
      goldStats,
      goldEarned: m.goldEarned,
      windows,
      goldAt,
      avgGoldBanked: m.avgGoldBanked,
      floatMinutes: m.floatMinutes,
      peakGold: m.peakGold,
      goldOver15: goldN ? goldOver15 / goldN : null,
      donations,
      nukes,
      alliances: m.alliancesFormed,
      boatsSent: m.boatsSent,
      boatsLost: m.boatsLost,
      apm: m.actionsPerMinute,
      maxDrawdown: m.maxDrawdown,
      structuresLost: m.structuresLost,
      coach,
    });
  }
  fs.writeFileSync(`${OUT}/${id}.json`, JSON.stringify({ game, rows }));
  console.log(id, game.mode, game.commit, game.harness, "humans", rows.length, "ms", Date.now() - t0, "errors", rows.filter((r) => r.coach?.error).length);
}
