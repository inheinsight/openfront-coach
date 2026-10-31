// Game rules the coach reasons with. Mirrors OpenFront's engine
// (packages/engine-lib/src/configuration/Config.ts and
// packages/engine/src/configuration/EngineConfig.ts, read 2026-10-26).
// Balance changes often, so every coaching claim that depends on a number
// lives here, in one place.

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

/**
 * Attack losses per tile scale with clamp(defender home troops ÷ your stack,
 * 0.6, 2) (v0.35 EngineConfig). "Home" means troops not out in attacks.
 */
export const LOSS_MULT_MIN = 0.6;
export const LOSS_MULT_MAX = 2;
export function attackLossMultiplier(stack: number): number {
  return Math.min(LOSS_MULT_MAX, Math.max(LOSS_MULT_MIN, 1 / Math.max(stack, 1e-6)));
}
/** The stack (÷ their home troops) where losses bottom out: 1 / 0.6 ≈ 1.67. */
export const CHEAPEST_STACK = 1 / LOSS_MULT_MIN;

/** Home-army floor with a neighbour in reach: 25% of the cap in the opening, 35% after. */
export const OPENING_SECONDS = 180;
export const OPENING_FLOOR = 0.25;
export const HOME_FLOOR = 0.35;

export const CITY_TROOP_CAP_BONUS = 250_000;
export const GOLD_PER_SECOND_HUMAN = 1_000; // 100 gold per tick
export const RETREAT_PENALTY = 0.25; // share of surviving troops lost when retreating from a player
export const TRAITOR_SECONDS = 30;
export const WIN_LAND_SHARE = 0.8;

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
  MIRV: "25M + 15M per MIRV already launched",
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
