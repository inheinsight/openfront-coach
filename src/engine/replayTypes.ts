// Shape of the JSON the replay harness writes (src/engine/harness/harness.ts).

export interface ReplayPlayer {
  smallID: number;
  id: string | null;
  clientID: string | null;
  name: string;
  type: "Human" | "Nation" | "Bot" | string;
  team: string | null;
}

export interface PlayerSeries {
  /** Index into samples.ticks of this series' first value. */
  from: number;
  tiles: number[];
  troops: number[];
  maxTroops: number[];
  gold: number[];
  goldEarned: number[];
  /** Cumulative gold from trade ships, trains and captured ships (may be absent in older replays). */
  tradeGold?: number[];
  trainGold?: number[];
  piracyGold?: number[];
  alive: number[];
  allies: number[];
  attacksOut: number[];
  attacksIn: number[];
  /** Per structure type, count at each sample (sparse arrays; missing = 0). */
  units: Record<string, (number | null)[]>;
  unitLevels: Record<string, (number | null)[]>;
}

export interface AttackRecord {
  id: string;
  attacker: number;
  startTick: number;
  endTick: number;
  lastTick: number;
  target: number; // 0 = terra nullius
  targetType: string;
  naval: boolean;
  troops: number;
  attackerTroopsAfterLaunch: number;
  attackerTilesStart: number;
  attackerTilesEnd: number;
  targetTilesStart: number;
  targetTilesEnd?: number;
  targetTroopsStart: number;
  targetAliveEnd?: boolean;
  lastTroops: number;
  minTroops: number;
  retreated: boolean;
  /** Tiles this attack took from its target (exact, from the engine's tile updates). */
  tilesCaptured?: number;
}

export interface ActionContext {
  tick: number;
  clientID: string;
  smallID?: number;
  type: string;
  troops?: number;
  maxTroops?: number;
  gold?: number;
  tiles?: number;
  allies?: number;
  inSpawnPhase?: boolean;
  sent?: number;
  unit?: string;
  cost?: number;
  owned?: number;
  level?: number | null;
  x?: number | null;
  y?: number | null;
  target?: number;
  targetType?: string;
  targetTroops?: number;
  targetTiles?: number;
  targetAllied?: boolean;
  targetIsTraitor?: boolean;
  targetAttacksOut?: number;
  targetAllies?: number;
  sharesBorder?: boolean;
  amount?: unknown;
  action?: string;
  isDisconnected?: boolean;
}

export interface TradeValue {
  partners: number;
  expGold: number;
  medianDist: number | null;
  shortShare: number;
}

export interface PlacementContext {
  x: number;
  y: number;
  depth: number;
  distFront: number | null;
  frontEnemy: number | null;
  frontEnemyTroops: number | null;
  frontEnemyAllied: boolean | null;
  myTroops: number;
  myCap: number;
  gold: number;
  tiles: number;
  sameTypeOwned: number;
  nearestSame: number | null;
  railLinks: number;
  samCovers?: number;
  underSam: boolean;
  trade?: TradeValue;
  betterSpot?: { x: number; y: number; trade?: TradeValue; distFront?: number; enemy?: number };
}

export interface StructureRecord {
  id: number;
  type: string;
  owner: number;
  builtTick: number;
  levels: [number, number][];
  context: PlacementContext | null;
  endTick?: number;
  fate?: "destroyed" | "captured";
  destroyedBy?: number | null;
  capturedBy?: number;
  /** Warships only: [tick, x, y] positions. */
  path?: [number, number, number][];
}

export interface ReplayEvent {
  tick: number;
  kind: string;
  [key: string]: unknown;
}

export interface FinalPlayerState {
  smallID: number;
  alive: boolean;
  tiles: number;
  troops: number;
  gold: number;
  betrayals: number;
  isTraitor: boolean;
  spawnTile: { x: number; y: number } | null;
  unitsConstructed: Record<string, number>;
}

export interface ReplayData {
  formatVersion: number;
  meta: {
    gameId: string;
    gitCommit: string;
    engineCommit: string;
    map: string;
    mapSize: string;
    width: number;
    height: number;
    numLandTiles: number;
    ticks: number;
    recordTurns: number;
    sampleEvery: number;
    frameEvery: number;
    frameScale: number;
    frameWidth: number;
    frameHeight: number;
    hashesChecked: number;
    desync: { tick: number; recorded: number; computed: number } | null;
    stoppedEarly: string | null;
    elapsedMs: number;
    winner: { smallID?: number; name?: string; team?: string } | null;
  };
  players: ReplayPlayer[];
  samples: {
    ticks: number[];
    series: Record<string, PlayerSeries>;
    bots: { alive: number[]; tiles: number[] };
  };
  finalState: FinalPlayerState[];
  attacks: AttackRecord[];
  actions: ActionContext[];
  events: ReplayEvent[];
  structures?: StructureRecord[];
  /** Tiles changing hands where a human is involved, in 5-second buckets. */
  transfers?: { tick: number; to: number; from: number; tiles: number }[];
  terrain: string | null;
  frames: { tick: number; data: string }[];
  militaryUnits: string[];
}
