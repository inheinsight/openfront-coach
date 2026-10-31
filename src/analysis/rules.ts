// Game rules the coach reasons with. Mirrors OpenFront's engine on the live
// release branch, v0.35.9 (commit 7ee96860, read 2026-10-30):
// packages/engine-lib/src/configuration/Config.ts and
// packages/engine/src/configuration/EngineConfig.ts. Public games run the
// release branch, not main, so re-check these against the commit in a new
// game record. Balance changes often, so every coaching claim that depends on
// a number lives here, in one place.

export const TICKS_PER_SECOND = 10;

/** Troops gained per tick: (10 + troops^0.73 / 4) * (1 - troops / max). */
export function troopRegenPerTick(troops: number, max: number): number {
  if (max <= 0) return 0;
  const t = Math.max(0, Math.min(troops, max));
  return (10 + Math.pow(t, 0.73) / 4) * (1 - t / max);
}

/** Regen peaks where d/dt[t^0.73 (1 - t/M)] = 0, i.e. t/M = 0.73 / 1.73. */
export const OPTIMAL_TROOP_RATIO = 0.73 / 1.73; // ≈ 0.42

export function peakRegenPerTick(max: number): number {
  return troopRegenPerTick(OPTIMAL_TROOP_RATIO * max, max);
}

/** Human troop cap without cities: 2 * (tiles^0.6 * 1000 + 50000). */
export function baseTroopCap(tiles: number): number {
  return 2 * (Math.pow(Math.max(0, tiles), 0.6) * 1000 + 50_000);
}

export const CITY_TROOP_CAP_BONUS = 250_000;
export const GOLD_PER_SECOND_HUMAN = 1_000; // 100 gold per tick
export const RETREAT_PENALTY = 0.25; // share of surviving troops lost when retreating from a player
export const TRAITOR_SECONDS = 30;
export const WIN_LAND_SHARE = 0.8;
/** FFA Overtime: from minute 30 the win bar drops this much per minute. */
export const OVERTIME_START_MINUTES = 30;
export const OVERTIME_DROP_PER_MINUTE = 0.02;
/** Leaving a team game while alive keeps the win only if your team already held this share of the land. */
export const TEAM_LEAVE_CREDIT_SHARE = 0.7;
export const DONATION_COOLDOWN_SECONDS = 10;
/** You lose only this share of the usual troops per tile when attacking a bot. */
export const BOT_ATTACKER_LOSS = 0.7;
/** Expansion into plains stops speeding up once an attack holds this many troops. */
export const UNCLAIMED_SPEED_CAP_TROOPS = 6_600;
export const SAM_RANGE_LEVEL1 = 70;
export const SAM_BUILD_SECONDS = 30;

/**
 * Attack losses per tile scale with clamp(defender's home troops / your
 * stack, 0.6, 2) (plus a term for how densely the defender packs troops).
 * So you pay double at half their home troops or less, and losses bottom out
 * once your stack is 1/0.6 ≈ 1.67× theirs.
 */
export function lossMultiplier(stack: number, defenderHomeTroops: number): number {
  if (stack <= 0) return 2;
  return Math.max(0.6, Math.min(2, defenderHomeTroops / stack));
}
export const DOUBLE_LOSS_STACK_RATIO = 0.5;
export const CHEAPEST_STACK_RATIO = 1 / 0.6;
/** Stack size the coach asks for against players: past the cheapest-loss point, with a margin. */
export const GOOD_STACK_RATIO = 1.7;

/** Gold a trade ship pays each port owner (both ends) for a route of `dist` tiles. */
export function tradeShipGold(dist: number): number {
  return 75_000 / (1 + Math.exp(-0.03 * (dist - 300))) + 50 * dist;
}

/** Gold per train stop, paid to the train owner and the station owner. */
export const TRAIN_STOP_GOLD = { own: 10_000, teammateOrOther: 25_000, ally: 35_000 };

export const UNIT_COSTS: Record<string, string> = {
  City: "125k × 2^n (max 1M); +250k troop cap per level",
  Port: "125k × 2^(ports+factories) (max 1M)",
  Factory: "125k × 2^(ports+factories) (max 1M)",
  "Defense Post": "50k × (n+1) (max 250k)",
  Warship: "250k × (n+1) (max 1M)",
  "Missile Silo": "1M",
  "SAM Launcher": "1.5M, then 3M",
  "Atom Bomb": "750k",
  "Hydrogen Bomb": "5M",
  MIRV: "25M + 15M per MIRV anyone in the lobby has launched",
};

export const NUKE_UNITS = ["Atom Bomb", "Hydrogen Bomb", "MIRV"];
export const ECONOMY_STRUCTURES = ["City", "Port", "Factory"];
export const DEFENSE_STRUCTURES = ["Defense Post", "SAM Launcher"];

/** mm:ss for a tick count. */
export function clock(tick: number): string {
  const s = Math.max(0, Math.round(tick / TICKS_PER_SECOND));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

export function fmtNum(n: number): string {
  const a = Math.abs(n);
  if (a >= 1e9) return `${(n / 1e9).toFixed(1)}B`;
  if (a >= 1e6) return `${(n / 1e6).toFixed(a >= 1e7 ? 0 : 1)}M`;
  if (a >= 1e3) return `${(n / 1e3).toFixed(a >= 1e4 ? 0 : 1)}k`;
  return `${Math.round(n)}`;
}

export function pct(x: number, digits = 0): string {
  return `${(x * 100).toFixed(digits)}%`;
}
