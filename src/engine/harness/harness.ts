/**
 * Replay harness. Bundled by esbuild against the exact OpenFront engine
 * source of the build that played a game (see ../manager.ts), then run in a
 * child process. It re-simulates the archived game record tick by tick and
 * writes a compact ReplayData JSON file the analyzer reads.
 *
 * This only ever runs on finished, archived games.
 *
 * Imports are resolved by the bundler: "@openfront/<pkg>/<path>" maps to
 * <engine>/packages/<pkg>/src/<path>. Everything engine-facing goes through
 * `any`: the harness must keep compiling across engine versions, so it reads
 * methods defensively instead of trusting one version's types.
 */
import { createGameRunner } from "@openfront/engine/GameRunner";
import { GameUpdateType } from "@openfront/engine-api/game/GameUpdates";
import { MessageType, PlayerType, UnitType } from "@openfront/engine-api/game/GameTypes";
import { GameStartInfoSchema } from "@openfront/engine-api/Schemas";
import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";

type Any = any; // eslint-disable-line @typescript-eslint/no-explicit-any

interface HarnessInput {
  recordPath: string;
  mapDir: string;
  outPath: string;
  engineCommit: string;
  /** Downsampled ownership frame every N ticks. */
  frameEvery?: number;
  /** Max width of the ownership frames. */
  frameMaxWidth?: number;
  /** Keep simulating after a hash mismatch (engine from another build). */
  allowDesync?: boolean;
}

const input: HarnessInput = JSON.parse(fs.readFileSync(process.argv[2], "utf8"));
const quiet = () => {};
// The simulation logs as it goes; none of it is ours.
console.log = console.info = console.debug = quiet;
const report = (msg: Record<string, unknown>) => {
  if (process.send) process.send(msg);
  else process.stderr.write(JSON.stringify(msg) + "\n");
};

const num = (v: unknown): number => (typeof v === "bigint" ? Number(v) : Number(v ?? 0));
function safe<T>(fn: () => T, fallback: T): T {
  try {
    const v = fn();
    return v === undefined ? fallback : v;
  } catch {
    return fallback;
  }
}
function jsonSafe(v: unknown): unknown {
  if (v === undefined) return undefined;
  const s = JSON.stringify(v, (_k, x) => (typeof x === "bigint" ? x.toString() : x));
  return s === undefined ? undefined : JSON.parse(s);
}
/** Enum member name for a value, for numeric and string enums alike. */
const enumName = (e: Any, v: unknown): string => {
  if (typeof v === "number") return e[v] ?? String(v);
  for (const k of Object.keys(e)) if (e[k] === v) return k;
  return String(v);
};

function decompressTurns(record: Any) {
  const turns: Any[] = [];
  let last = -1;
  for (const turn of record.turns) {
    while (last < turn.turnNumber - 1) {
      last++;
      turns.push({ turnNumber: last, intents: [] });
    }
    turns.push(turn);
    last = turn.turnNumber;
  }
  for (let i = turns.length; i < record.info.num_turns; i++) turns.push({ turnNumber: i, intents: [] });
  return turns;
}

/** The GameStartInfo the live clients received (mirrors upstream wireGameStartInfo). */
function gameStartInfo(record: Any) {
  const info = GameStartInfoSchema.parse(record.info) as Any;
  const cfg = info.config;
  if (cfg.gameType === "Singleplayer") return info;
  const blankClan = (cfg.disableClanTags ?? false) || (cfg.anonymizeNames ?? false);
  const blankFriends = cfg.anonymizeNames ?? false;
  if (!blankClan && !blankFriends) return info;
  return {
    ...info,
    players: info.players.map((p: Any) => ({
      ...p,
      clanTag: blankClan ? null : p.clanTag,
      friends: blankFriends ? undefined : p.friends,
    })),
  };
}

function readMapFiles(gameMap: string, mapSize: string) {
  const read = (f: string) => {
    const p = path.join(input.mapDir, f);
    return fs.existsSync(p) ? new Uint8Array(fs.readFileSync(p)) : undefined;
  };
  const manifest = JSON.parse(fs.readFileSync(path.join(input.mapDir, "manifest.json"), "utf8"));
  if (mapSize === "Normal") {
    return { map: gameMap, mapSize, manifest, mapBin: read("map.bin"), map4xBin: read("map4x.bin") };
  }
  return { map: gameMap, mapSize, manifest, map4xBin: read("map4x.bin"), map16xBin: read("map16x.bin") };
}

const UNIT_TYPES: string[] = Object.values(UnitType as Any).filter((v) => typeof v === "string") as string[];
const STRUCTURES = ["City", "Port", "Defense Post", "Missile Silo", "SAM Launcher", "Factory"];
const MILITARY_UNITS = ["Warship", "Atom Bomb", "Hydrogen Bomb", "MIRV", "Transport"];

async function main() {
  const t0 = Date.now();
  const record = JSON.parse(fs.readFileSync(input.recordPath, "utf8"));
  const turns = decompressTurns(record);
  const gameStart = gameStartInfo(record);
  const map = readMapFiles(gameStart.config.gameMap, gameStart.config.gameMapSize ?? "Normal");

  let lastError: Any = null;
  const pending: Any[] = [];
  const runner: Any = await createGameRunner(gameStart, undefined, map as Any, (gu: Any) => {
    if (gu && "errMsg" in gu) {
      lastError = gu;
      return;
    }
    pending.push(gu);
  });
  const game: Any = runner.game;

  const recordedHashes = new Map<number, number>();
  for (const t of turns) if (t.hash !== null && t.hash !== undefined) recordedHashes.set(t.turnNumber, t.hash);
  let hashesChecked = 0;
  let desync: Any = null;

  const W = game.width();
  const H = game.height();
  const totalLand = safe(() => game.numLandTiles(), 0);

  // --- exact tile transfers ------------------------------------------------
  // The engine reports every tile whose state changed as (tile, state) pairs;
  // the owner is the low 12 bits. Tracking owners lets us credit each
  // captured tile to the attack that took it.
  const owners = new Uint16Array(W * H);
  for (let i = 0; i < W * H; i++) owners[i] = game.ownerID(i);
  let tickTransfers = new Map<string, number>(); // "to:from" -> tiles, this tick
  const transferLog = new Map<string, number>(); // "bucket:to:from" -> tiles, humans involved
  const TRANSFER_BUCKET = 50; // 5 s
  function applyTileUpdates(tick: number, packed: Uint32Array | undefined, humanIds: Set<number>) {
    if (!packed) return;
    for (let i = 0; i + 1 < packed.length; i += 2) {
      const tile = packed[i];
      const owner = packed[i + 1] & 0xfff;
      const prev = owners[tile];
      if (prev === owner) continue;
      owners[tile] = owner;
      const k = `${owner}:${prev}`;
      tickTransfers.set(k, (tickTransfers.get(k) ?? 0) + 1);
      if (humanIds.has(owner) || humanIds.has(prev)) {
        const bk = `${Math.floor(tick / TRANSFER_BUCKET) * TRANSFER_BUCKET}:${k}`;
        transferLog.set(bk, (transferLog.get(bk) ?? 0) + 1);
      }
    }
  }

  // --- players -----------------------------------------------------------
  const humanByClient = new Map<string, Any>();
  for (const p of record.info.players) humanByClient.set(p.clientID, p);

  const playerMeta = new Map<number, Any>();
  const describe = (p: Any) => {
    const sid = p.smallID();
    if (!playerMeta.has(sid)) {
      playerMeta.set(sid, {
        smallID: sid,
        id: safe(() => p.id(), null),
        clientID: safe(() => p.clientID(), null),
        name: safe(() => p.displayName?.() ?? p.name(), "?"),
        type: enumName(PlayerType, safe(() => p.type(), "?")),
        team: safe(() => p.team(), null),
      });
    }
    return playerMeta.get(sid);
  };
  const typeName = (p: Any) => enumName(PlayerType, safe(() => p.type(), ""));
  const isTracked = (p: Any) => {
    const t = typeName(p);
    return t === "Human" || t === "Nation" || t === "FakeHuman";
  };
  const humans = () => game.players().filter((p: Any) => typeName(p) === "Human");

  // --- sampling ------------------------------------------------------------
  const numTicks = turns.length;
  const sampleEvery = Math.max(10, Math.ceil(numTicks / 700 / 10) * 10);
  const frameEvery = input.frameEvery ?? 300;
  const frameScale = Math.max(1, Math.ceil(W / (input.frameMaxWidth ?? 360)));
  const FW = Math.ceil(W / frameScale);
  const FH = Math.ceil(H / frameScale);

  const sampleTicks: number[] = [];
  const series = new Map<number, Any>();
  const botAgg: Any = { alive: [], tiles: [] };
  const ensureSeries = (sid: number) => {
    if (!series.has(sid))
      series.set(sid, {
        from: sampleTicks.length - 1,
        tiles: [],
        troops: [],
        maxTroops: [],
        gold: [],
        goldEarned: [],
        alive: [],
        allies: [],
        attacksOut: [],
        attacksIn: [],
        units: {},
        unitLevels: {},
      });
    return series.get(sid);
  };

  function sample(tick: number) {
    sampleTicks.push(tick);
    let botsAlive = 0;
    let botTiles = 0;
    for (const p of game.allPlayers ? game.allPlayers() : game.players()) {
      if (!isTracked(p)) {
        if (safe(() => p.isAlive(), false)) {
          botsAlive++;
          botTiles += safe(() => p.numTilesOwned(), 0);
        }
        continue;
      }
      if (!safe(() => p.hasSpawned?.() ?? true, true) && !safe(() => p.isAlive(), false)) continue;
      describe(p);
      const s = ensureSeries(p.smallID());
      // pad if the player appeared late
      while (s.tiles.length < sampleTicks.length - 1 - s.from) {
        for (const k of ["tiles", "troops", "maxTroops", "gold", "goldEarned", "alive", "allies", "attacksOut", "attacksIn"]) s[k].push(0);
      }
      s.tiles.push(safe(() => p.numTilesOwned(), 0));
      s.troops.push(Math.round(safe(() => p.troops(), 0)));
      s.maxTroops.push(Math.round(safe(() => game.config().maxTroops(p), 0)));
      s.gold.push(num(safe(() => p.gold(), 0)));
      s.goldEarned.push(num(safe(() => p.goldEarned?.(), 0)));
      s.alive.push(safe(() => p.isAlive(), false) ? 1 : 0);
      s.allies.push(safe(() => p.allies().length, 0));
      s.attacksOut.push(Math.round(safe(() => p.outgoingAttacks().reduce((a: number, x: Any) => a + x.troops(), 0), 0)));
      s.attacksIn.push(Math.round(safe(() => p.incomingAttacks().reduce((a: number, x: Any) => a + x.troops(), 0), 0)));
      const idx = s.tiles.length - 1;
      for (const u of safe(() => p.units(), [] as Any[])) {
        const t = String(u.type());
        if (!STRUCTURES.includes(t) && t !== "Warship") continue;
        (s.units[t] ??= [])[idx] = ((s.units[t][idx] as number) ?? 0) + 1;
        const lvl = safe(() => u.level(), 1);
        (s.unitLevels[t] ??= [])[idx] = ((s.unitLevels[t][idx] as number) ?? 0) + lvl;
      }
    }
    botAgg.alive.push(botsAlive);
    botAgg.tiles.push(botTiles);
  }

  // --- frames ----------------------------------------------------------------
  const frames: Any[] = [];
  function terrainFrame() {
    const land = new Uint8Array(FW * FH);
    for (let fy = 0; fy < FH; fy++)
      for (let fx = 0; fx < FW; fx++) {
        const x = Math.min(W - 1, fx * frameScale + (frameScale >> 1));
        const y = Math.min(H - 1, fy * frameScale + (frameScale >> 1));
        land[fy * FW + fx] = game.isLand(game.ref(x, y)) ? 1 : 0;
      }
    return zlib.gzipSync(land).toString("base64");
  }
  function ownershipFrame(tick: number) {
    const own = new Uint16Array(FW * FH);
    for (let fy = 0; fy < FH; fy++)
      for (let fx = 0; fx < FW; fx++) {
        const x = Math.min(W - 1, fx * frameScale + (frameScale >> 1));
        const y = Math.min(H - 1, fy * frameScale + (frameScale >> 1));
        own[fy * FW + fx] = game.ownerID(game.ref(x, y));
      }
    frames.push({ tick, data: zlib.gzipSync(Buffer.from(own.buffer)).toString("base64") });
  }
  const terrain = safe(() => terrainFrame(), null);

  // --- events ----------------------------------------------------------------
  const events: Any[] = [];
  const humanSmallIDs = () => new Set(humans().map((p: Any) => p.smallID()));
  const keepUpdate = new Set(
    [
      "AllianceRequestReply",
      "BrokeAlliance",
      "AllianceExpired",
      "AllianceExtension",
      "ConquestEvent",
      "EmbargoEvent",
      "DonateEvent",
      "UnitIncoming",
      "TargetPlayer",
      "Win",
      "SpawnPhaseEnd",
    ].filter((n) => (GameUpdateType as Any)[n] !== undefined),
  );
  const keepMessages = new Set(
    [
      "ATTACK_FAILED",
      "ATTACK_CANCELLED",
      "CONQUERED_PLAYER",
      "MIRV_INBOUND",
      "NUKE_INBOUND",
      "HYDROGEN_BOMB_INBOUND",
      "NAVAL_INVASION_INBOUND",
      "SAM_MISS",
      "SAM_HIT",
      "CAPTURED_ENEMY_UNIT",
      "UNIT_DESTROYED",
      "ALLIANCE_BROKEN",
    ].filter((n) => (MessageType as Any)[n] !== undefined),
  );
  function collectUpdates(tick: number, gu: Any) {
    const ups = gu?.updates;
    if (!ups) return;
    for (const name of keepUpdate) {
      const list = ups[(GameUpdateType as Any)[name]];
      if (!Array.isArray(list)) continue;
      for (const u of list) {
        if (!u || typeof u !== "object") continue;
        if (name === "EmbargoEvent") {
          const hs = humanSmallIDs();
          if (!hs.has(u.playerID) && !hs.has(u.embargoedID)) continue;
        }
        events.push({ tick, kind: name, ...(jsonSafe(u) as object), type: undefined });
      }
    }
    const disp = ups[(GameUpdateType as Any).DisplayEvent];
    if (Array.isArray(disp) && disp.length) {
      const hs = humanSmallIDs();
      for (const m of disp) {
        const mt = enumName(MessageType, m.messageType);
        if (!keepMessages.has(mt)) continue;
        if (m.playerID !== null && m.playerID !== undefined && !hs.has(m.playerID)) continue;
        events.push({
          tick,
          kind: "Message",
          messageType: mt,
          message: m.message,
          playerID: m.playerID,
          params: jsonSafe(m.params),
          goldAmount: m.goldAmount !== undefined ? String(m.goldAmount) : undefined,
        });
      }
    }
    for (const hu of ups[(GameUpdateType as Any).Hash] ?? []) {
      const rec = recordedHashes.get(hu.tick);
      if (rec !== undefined) {
        hashesChecked++;
        if (rec !== hu.hash && desync === null) desync = { tick: hu.tick, recorded: rec, computed: hu.hash };
      }
    }
  }

  // --- attacks (any attack a human sends or receives) -------------------------
  const openAttacks = new Map<string, Any>();
  const attacks: Any[] = [];
  function trackAttacks(tick: number) {
    const seen = new Set<string>();
    for (const h of humans()) {
      const involving = [
        ...safe(() => h.outgoingAttacks(), [] as Any[]),
        ...safe(() => h.incomingAttacks(), [] as Any[]),
      ];
      for (const a of involving) {
        const id = a.id();
        if (seen.has(id)) continue;
        seen.add(id);
        const p = a.attacker();
        let rec = openAttacks.get(id);
        if (!rec) {
          describe(p);
          const target = a.target();
          const tIsPlayer = safe(() => target.isPlayer(), false);
          rec = {
            id,
            attacker: p.smallID(),
            startTick: tick,
            target: tIsPlayer ? target.smallID() : 0,
            targetType: tIsPlayer ? enumName(PlayerType, target.type()) : "TerraNullius",
            naval: a.sourceTile() !== null && a.sourceTile() !== undefined,
            troops: Math.round(a.troops()),
            attackerTroopsAfterLaunch: Math.round(p.troops()),
            attackerTilesStart: p.numTilesOwned(),
            targetTilesStart: tIsPlayer ? target.numTilesOwned() : 0,
            targetTroopsStart: tIsPlayer ? Math.round(target.troops()) : 0,
            minTroops: Math.round(a.troops()),
            retreated: false,
            tilesCaptured: 0,
          };
          openAttacks.set(id, rec);
          if (tIsPlayer) describe(target);
        }
        rec.lastTick = tick;
        rec.lastTroops = Math.round(a.troops());
        rec.minTroops = Math.min(rec.minTroops, rec.lastTroops);
        if (safe(() => a.retreating(), false)) rec.retreated = true;
      }
    }
    // Credit this tick's captures to the open attacks, split evenly when one
    // attacker has several attacks on the same target.
    const byPair = new Map<string, Any[]>();
    for (const rec of openAttacks.values()) {
      const k = `${rec.attacker}:${rec.target}`;
      byPair.set(k, [...(byPair.get(k) ?? []), rec]);
    }
    for (const [k, recs] of byPair) {
      const n = tickTransfers.get(k);
      if (!n) continue;
      for (const rec of recs) rec.tilesCaptured = (rec.tilesCaptured ?? 0) + n / recs.length;
    }
    tickTransfers = new Map();
    for (const [id, rec] of openAttacks) {
      if (seen.has(id)) continue;
      openAttacks.delete(id);
      const attacker = game.playerBySmallID(rec.attacker);
      rec.endTick = tick;
      rec.tilesCaptured = Math.round(rec.tilesCaptured ?? 0);
      rec.attackerTilesEnd = safe(() => attacker.numTilesOwned(), 0);
      if (rec.target) {
        const t = game.playerBySmallID(rec.target);
        rec.targetTilesEnd = safe(() => t.numTilesOwned(), 0);
        rec.targetAliveEnd = safe(() => t.isAlive(), false);
      }
      attacks.push(rec);
    }
  }

  // --- action context (humans' intents) --------------------------------------
  const actions: Any[] = [];
  function unitCost(type: string, p: Any): number {
    return safe(() => num(game.unitInfo(type).cost(game, p)), 0);
  }
  function contextFor(intent: Any, tick: number) {
    const p = intent.clientID ? safe(() => game.playerByClientID(intent.clientID), null) : null;
    if (!p) return null;
    const ctx: Any = {
      tick,
      clientID: intent.clientID,
      smallID: p.smallID(),
      type: intent.type,
      troops: Math.round(safe(() => p.troops(), 0)),
      maxTroops: Math.round(safe(() => game.config().maxTroops(p), 0)),
      gold: num(safe(() => p.gold(), 0)),
      tiles: safe(() => p.numTilesOwned(), 0),
      allies: safe(() => p.allies().length, 0),
      inSpawnPhase: safe(() => game.inSpawnPhase(), false),
    };
    const describeTarget = (target: Any) => {
      if (!target || !safe(() => target.isPlayer(), false)) return { targetType: "TerraNullius" };
      describe(target);
      return {
        target: target.smallID(),
        targetType: enumName(PlayerType, target.type()),
        targetTroops: Math.round(safe(() => target.troops(), 0)),
        targetTiles: safe(() => target.numTilesOwned(), 0),
        targetAllied: safe(() => p.isAlliedWith(target), false),
        targetIsTraitor: safe(() => target.isTraitor(), false),
        targetAttacksOut: safe(() => target.outgoingAttacks().length, 0),
        targetAllies: safe(() => target.allies().length, 0),
        sharesBorder: safe(() => p.sharesBorderWith(target), false),
      };
    };
    switch (intent.type) {
      case "attack": {
        const target = intent.targetID ? safe(() => game.player(intent.targetID), null) : null;
        Object.assign(ctx, { sent: Math.round(num(intent.troops)) }, describeTarget(target));
        break;
      }
      case "boat": {
        const dst = intent.dst ?? intent.dstTile;
        const owner = dst !== undefined ? safe(() => game.owner(dst), null) : null;
        Object.assign(ctx, { sent: Math.round(num(intent.troops)), x: safe(() => game.x(dst), null), y: safe(() => game.y(dst), null) }, describeTarget(owner));
        break;
      }
      case "build_unit": {
        const t = String(intent.unit);
        Object.assign(ctx, {
          unit: t,
          cost: unitCost(t, p),
          x: safe(() => game.x(intent.tile), null),
          y: safe(() => game.y(intent.tile), null),
          owned: safe(() => p.unitCount(t), 0),
        });
        if (["Atom Bomb", "Hydrogen Bomb", "MIRV"].includes(t)) {
          Object.assign(ctx, describeTarget(safe(() => game.owner(intent.tile), null)));
        }
        break;
      }
      case "upgrade_structure": {
        const u = safe(() => game.unit(intent.unitId), null);
        Object.assign(ctx, { unit: String(intent.unit ?? safe(() => u.type(), "?")), level: safe(() => u.level(), null), cost: unitCost(String(intent.unit), p) });
        break;
      }
      case "allianceRequest":
      case "breakAlliance":
      case "allianceExtension":
      case "allianceReject":
      case "donate_gold":
      case "donate_troops":
      case "embargo":
      case "targetPlayer":
      case "emoji": {
        const id = intent.recipient ?? intent.targetID ?? intent.target ?? intent.requestor;
        const target = id && id !== "AllPlayers" ? safe(() => game.player(id), null) : null;
        Object.assign(ctx, describeTarget(target), { amount: intent.gold ?? intent.troops ?? undefined, action: intent.action });
        break;
      }
      case "spawn": {
        Object.assign(ctx, { x: safe(() => game.x(intent.tile), null), y: safe(() => game.y(intent.tile), null) });
        break;
      }
      default:
        break;
    }
    return ctx;
  }

  // --- run ---------------------------------------------------------------
  report({ type: "start", totalTicks: numTicks, width: W, height: H });
  let lastProgress = 0;
  let stoppedEarly: string | null = null;
  for (let i = 0; i < turns.length; i++) {
    const turn = turns[i];
    const tick = safe(() => game.ticks(), i);
    for (const intent of turn.intents) {
      if (!intent.clientID || !humanByClient.has(intent.clientID)) continue;
      if (intent.type === "mark_disconnected" || intent.type === "quick_chat") {
        actions.push({ tick, clientID: intent.clientID, type: intent.type, isDisconnected: intent.isDisconnected });
        continue;
      }
      const ctx = safe(() => contextFor(intent, tick), null);
      if (ctx) actions.push(ctx);
    }
    runner.addTurn(turn);
    const ok = runner.executeNextTick();
    if (ok === false) {
      stoppedEarly = `simulation failed at turn ${turn.turnNumber}: ${lastError?.errMsg ?? "unknown"}`;
      break;
    }
    const after = safe(() => game.ticks(), i + 1);
    const hs = humanSmallIDs();
    for (const gu of pending.splice(0)) {
      safe(() => applyTileUpdates(after, gu?.packedTileUpdates, hs), undefined);
      safe(() => collectUpdates(after, gu), undefined);
    }
    if (desync && !input.allowDesync) {
      stoppedEarly = `desync at tick ${desync.tick}`;
      break;
    }
    trackAttacks(after);
    if (after % sampleEvery === 0) sample(after);
    if (after % frameEvery === 0) safe(() => ownershipFrame(after), undefined);
    const pct = Math.floor(((i + 1) / turns.length) * 100);
    if (pct >= lastProgress + 2) {
      lastProgress = pct;
      report({ type: "progress", percent: pct, tick: after });
    }
  }
  const finalTick = safe(() => game.ticks(), turns.length);
  sample(finalTick);
  safe(() => ownershipFrame(finalTick), undefined);
  trackAttacks(finalTick + 1_000_000); // close any still-open attacks
  for (const p of game.players()) if (isTracked(p)) describe(p);

  // final per-player state
  const finalState: Any[] = [];
  for (const p of game.players()) {
    if (!isTracked(p)) continue;
    finalState.push({
      smallID: p.smallID(),
      alive: safe(() => p.isAlive(), false),
      tiles: safe(() => p.numTilesOwned(), 0),
      troops: Math.round(safe(() => p.troops(), 0)),
      gold: num(safe(() => p.gold(), 0)),
      betrayals: safe(() => p.betrayals(), 0),
      isTraitor: safe(() => p.isTraitor(), false),
      spawnTile: safe(() => {
        const t = p.spawnTile();
        return t === undefined ? null : { x: game.x(t), y: game.y(t) };
      }, null),
      unitsConstructed: Object.fromEntries(UNIT_TYPES.map((t) => [t, safe(() => p.unitsConstructed(t), 0)])),
    });
  }

  const winner = safe(() => {
    const w = game.getWinner();
    if (!w) return null;
    if (typeof w === "string") return { team: w };
    return { smallID: w.smallID(), name: w.name() };
  }, null);

  const out = {
    formatVersion: 1,
    meta: {
      gameId: record.info.gameID,
      gitCommit: record.gitCommit,
      engineCommit: input.engineCommit,
      map: gameStart.config.gameMap,
      mapSize: gameStart.config.gameMapSize,
      width: W,
      height: H,
      numLandTiles: totalLand,
      ticks: finalTick,
      recordTurns: turns.length,
      sampleEvery,
      frameEvery,
      frameScale,
      frameWidth: FW,
      frameHeight: FH,
      hashesChecked,
      desync,
      stoppedEarly,
      elapsedMs: Date.now() - t0,
      winner,
    },
    players: [...playerMeta.values()],
    samples: {
      ticks: sampleTicks,
      series: Object.fromEntries(series),
      bots: botAgg,
    },
    finalState,
    attacks,
    actions,
    events,
    transfers: [...transferLog.entries()].map(([k, tiles]) => {
      const [tick, to, from] = k.split(":").map(Number);
      return { tick, to, from, tiles };
    }),
    terrain,
    frames,
    militaryUnits: MILITARY_UNITS,
  };
  // The sandbox only allows writing this one file; its directory already exists.
  fs.writeFileSync(input.outPath, zlib.gzipSync(JSON.stringify(out)));
  report({ type: "done", outPath: input.outPath, elapsedMs: Date.now() - t0, stoppedEarly });
}

main().then(
  () => process.exit(0),
  (e) => {
    report({ type: "error", error: e instanceof Error ? `${e.message}\n${e.stack}` : String(e) });
    process.exit(1);
  },
);
