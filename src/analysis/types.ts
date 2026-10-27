export type Severity = "brilliant" | "good" | "info" | "inaccuracy" | "mistake" | "blunder";

export const SEVERITY_ORDER: Severity[] = ["blunder", "mistake", "inaccuracy", "info", "good", "brilliant"];

export interface JevVerdict {
  label: Severity;
  confidence: number;
  probabilities: Record<string, number>;
  agreedWithRules: boolean;
}

export interface KeyMoment {
  id: string;
  tick: number;
  kind:
    | "opening"
    | "attack"
    | "collapse"
    | "surge"
    | "economy"
    | "troops"
    | "diplomacy"
    | "nuke"
    | "naval"
    | "build"
    | "death"
    | "victory";
  severity: Severity;
  title: string;
  detail: string;
  suggestion?: string;
  /** Change in your share of the land over the following minute, in percentage points. */
  landShareDelta?: number;
  evidence: Record<string, string | number | boolean | null>;
  jev?: JevVerdict;
}

export interface MetricLine {
  key: string;
  label: string;
  value: number | null;
  display: string;
  /** Best human in this game, for context. */
  best?: number | null;
  bestDisplay?: string;
  /** Median human in this game. */
  median?: number | null;
  medianDisplay?: string;
  /** 0-100, where you rank among the humans in this game. */
  percentile?: number | null;
  higherIsBetter: boolean;
  hint?: string;
}

export interface CategoryScore {
  key: "expansion" | "economy" | "troops" | "combat" | "defense" | "diplomacy" | "naval" | "nuclear";
  label: string;
  score: number; // 0-100
  grade: string;
  summary: string;
  metrics: MetricLine[];
}

export interface AttackLedgerRow {
  tick: number;
  endTick: number;
  target: string;
  targetType: string;
  naval: boolean;
  sent: number;
  ratio: number | null;
  troopsUsed: number;
  tilesGained: number;
  tilesPer1kTroops: number | null;
  targetTroopsAtStart: number;
  retreated: boolean;
  verdict: Severity;
  note: string;
}

export interface BuildRow {
  tick: number;
  unit: string;
  cost: number;
  goldBefore: number;
  upgrade?: boolean;
}

export interface Drill {
  title: string;
  why: string;
  how: string;
  goal: string;
  metricKey?: string;
  target?: number;
}

export interface PlayerSummary {
  smallID: number;
  clientID: string | null;
  name: string;
  type: string;
  team: string | null;
  isMe: boolean;
  finalTiles: number;
  peakLandShare: number;
  alive: boolean;
  eliminatedTick: number | null;
  placement: number;
}

export interface Analysis {
  analysisVersion: number;
  gameId: string;
  analyzedAt: string;
  depth: "replay" | "stats";
  replayNote: string | null;
  game: {
    map: string;
    mapSize: string;
    mode: string;
    type: string;
    difficulty: string;
    durationTicks: number;
    startedAt: number;
    endedAt: number;
    gitCommit: string;
    humans: number;
    nations: number;
    bots: number;
    winner: string | null;
    teams: number | null;
  };
  me: {
    clientID: string;
    name: string;
    smallID: number | null;
    team: string | null;
    result: "victory" | "defeat" | "eliminated" | "survived" | "left";
    placement: number | null;
    placementOf: number;
    /** "teams" in team games: your team's rank. */
    placementUnit?: "players" | "teams";
    eliminatedTick: number | null;
    finalLandShare: number;
    peakLandShare: number;
  };
  headline: string;
  overall: { score: number; grade: string };
  categories: CategoryScore[];
  keyNumbers: MetricLine[];
  moments: KeyMoment[];
  attacks: AttackLedgerRow[];
  builds: BuildRow[];
  strengths: string[];
  weaknesses: string[];
  drills: Drill[];
  phases: { name: string; startTick: number; endTick: number; grade: string; note: string }[];
  timeline: {
    ticks: number[];
    me: { tiles: number[]; troops: number[]; maxTroops: number[]; gold: number[]; landShare: number[]; rank: number[] };
    rivals: { name: string; smallID: number; type: string; landShare: number[] }[];
    leaderLandShare: number[];
  } | null;
  leaderboard: PlayerSummary[];
  narrative: { text: string; provider: string; model: string } | null;
  ai: {
    jev: {
      used: boolean;
      model?: string;
      questions?: number;
      tokens?: number;
      error?: string;
      focus?: { area: string; confidence: number };
      decider?: { label: string; confidence: number };
      lessons?: Record<string, number>;
    };
    narrator: { used: boolean; provider?: string; error?: string };
  };
  /** Per-metric values for trend tracking across games. */
  trendMetrics: Record<string, number | null>;
}
