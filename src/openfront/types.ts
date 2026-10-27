// Loose types for OpenFront's archived game records (api.openfront.io/public/game/:id).
// The engine's own zod schemas are authoritative; these only describe the
// fields the coach reads, so a new optional field upstream never breaks us.

export type BigIntString = string;

export interface Intent {
  type: string;
  clientID?: string;
  [key: string]: unknown;
}

export interface Turn {
  turnNumber: number;
  intents: Intent[];
  hash?: number | null;
}

export interface PlayerStats {
  attacks?: BigIntString[];
  betrayals?: BigIntString;
  killedAt?: BigIntString;
  killedBy?: string | null;
  deathPosition?: number;
  finalTiles?: BigIntString;
  kills?: { victim: string; tick: BigIntString }[];
  conquests?: BigIntString[];
  boats?: Partial<Record<"trade" | "trans", BigIntString[]>>;
  bombs?: Partial<Record<"abomb" | "hbomb" | "mirv" | "mirvw", BigIntString[]>>;
  gold?: BigIntString[];
  units?: Partial<Record<"city" | "defp" | "port" | "wshp" | "silo" | "saml" | "fact", BigIntString[]>>;
  tiles?: BigIntString[];
  alliances?: BigIntString[];
  peakTroops?: BigIntString;
  donations?: BigIntString[];
  spawnTile?: number;
}

export interface PlayerRecord {
  clientID: string;
  username: string;
  clanTag?: string | null;
  publicID?: string | null;
  persistentID?: string | null;
  isLobbyCreator?: boolean;
  teamIndex?: number | null;
  friends?: string[];
  stats?: PlayerStats;
  cosmetics?: unknown;
}

export interface GameConfig {
  gameMap: string;
  gameMapSize?: string;
  difficulty: string;
  gameType: "Singleplayer" | "Public" | "Private" | string;
  gameMode: "Free For All" | "Team" | string;
  bots?: number;
  nations?: unknown;
  playerTeams?: number | string;
  disabledUnits?: string[];
  infiniteGold?: boolean;
  infiniteTroops?: boolean;
  instantBuild?: boolean;
  randomSpawn?: boolean;
  [key: string]: unknown;
}

export interface GameRecord {
  version: string;
  gitCommit: string;
  info: {
    gameID: string;
    config: GameConfig;
    players: PlayerRecord[];
    lobbyCreatedAt?: number;
    start: number;
    end: number;
    duration: number;
    num_turns: number;
    winner?: [string, ...string[]] | null;
    lobbyFillTime?: number;
    [key: string]: unknown;
  };
  turns: Turn[];
}

export interface GameListing {
  game: string;
  start: string;
  end: string;
  type: string;
  mode: string;
  difficulty: string;
  numPlayers: number;
  maxPlayers: number | null;
  playerTeams: string | null;
  rankedType?: string;
}

export interface PlayerSession {
  gameId: string;
  gameStart: string;
  gameEnd: string;
  gameType: string;
  gameMode: string;
  gameRankedType?: string;
  clientId: string;
  username: string;
  clanTag?: string | null;
  hasWon: boolean;
}

/** One tick is 100 ms of game time. */
export const TICKS_PER_SECOND = 10;
