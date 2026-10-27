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
  terrain: string | null;
  frames: { tick: number; data: string }[];
  militaryUnits: string[];
}
