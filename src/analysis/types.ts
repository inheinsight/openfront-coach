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
  /** Other players involved (small IDs), highlighted on the map. */
  focus?: number[];
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
  key: "expansion" | "economy" | "buildings" | "troops" | "combat" | "defense" | "teamwork" | "diplomacy" | "naval" | "nuclear";
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

/** One of the four troop habits the coach teaches, judged for this game. */
export interface TroopRule {
  key: "stack" | "floor" | "clicks" | "feed";
  label: string;
  status: "met" | "close" | "missed" | "unscored";
  summary: string;
  passed: number | null;
  total: number | null;
}

/** The one troop habit to work on next game, with this game's evidence. */
export interface TroopLesson {
  rule: TroopRule["key"];
  title: string;
  why: string;
  stat: string;
  statLabel: string;
  benchmarks: { label: string; display: string; you?: boolean }[];
  nextGoal: string;
  how: string;
  /** trendMetrics key to chart across games, and the line to beat. */
  trend: { key: string; label: string; target: number | null; format: "x" | "pct" | "count" };
  /** The attack card that shows this game's clearest example. */
  exampleCardId: string | null;
}

/** One decision to attack a player: a single click or a burst of quick clicks. */
export interface AttackCard {
  id: string;
  tick: number;
  lastTick: number;
  target: string;
  targetId: number;
  severity: Severity;
  clicks: number;
  /** Share of your home army sent after each click. */
  clickShares: number[];
  sent: number;
  share: number;
  homeBefore: number;
  cap: number;
  /** Troops the target held at home (not in attacks) at your first click. */
  targetHome: number;
  /** sent ÷ targetHome. */
  stack: number;
  /** The engine's loss multiplier per tile at this stack. */
  loss: number;
  troopsUsed: number;
  tilesGained: number;
  homeAfter: number | null;
  /** Their home army (and yours) from 20 s before to 60 s after. */
  series: { tick: number; theirs: number | null; yours: number | null }[];
  /** When holding your army would have given a far better stack. */
  window: { tick: number; theirHome: number; stack: number } | null;
  /** Set when this was an answer to their attack on you. */
  counter: { tick: number; incoming: number } | null;
  teammates: string[];
  did: string[];
  call: string;
  featured: boolean;
}

/** A decision from your own game, replayed as a question. */
export interface DrillSpot {
  id: string;
  kind: "attack" | "defend";
  rule: "stack" | "floor";
  tick: number;
  question: string;
  target: string;
  targetId: number;
  facts: { yourHome: number; cap: number; theirHome: number; incoming: number | null; yourTiles: number; theirTiles: number };
  /** Troops to keep at home (defend drills). */
  floor: number | null;
  youDid: { share: number; clicks: number; text: string };
  call: string;
}

export interface TroopReport {
  rules: TroopRule[];
  lesson: TroopLesson | null;
  cards: AttackCard[];
  drills: DrillSpot[];
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
  /** Economy, building placement and warship review (replay analyses only). */
  economy?: import("./economy.js").EconomyReport;
  /** Troop habits: this game's lesson, attack cards and drills (replay analyses only). */
  troops?: TroopReport;
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
