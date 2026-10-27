import type { Severity } from "./api";

export const TICKS = 10;

export function clock(tick: number): string {
  const s = Math.max(0, Math.round(tick / TICKS));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

export function fmtNum(n: number | null | undefined): string {
  if (n === null || n === undefined || !Number.isFinite(n)) return "—";
  const a = Math.abs(n);
  if (a >= 1e9) return `${(n / 1e9).toFixed(1)}B`;
  if (a >= 1e6) return `${(n / 1e6).toFixed(a >= 1e7 ? 0 : 1)}M`;
  if (a >= 1e3) return `${(n / 1e3).toFixed(a >= 1e4 ? 0 : 1)}k`;
  return `${Math.round(n)}`;
}

export function pct(x: number | null | undefined, digits = 0): string {
  if (x === null || x === undefined || !Number.isFinite(x)) return "—";
  return `${(x * 100).toFixed(digits)}%`;
}

export function when(ms: number | null): string {
  if (!ms) return "";
  const d = new Date(ms);
  const diff = Date.now() - ms;
  if (diff < 60_000) return "just now";
  if (diff < 3600_000) return `${Math.round(diff / 60_000)} min ago`;
  if (diff < 86_400_000) return `${Math.round(diff / 3600_000)} h ago`;
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

/** Chess annotation glyphs: the coach's severity language. */
export const GLYPH: Record<Severity, string> = {
  brilliant: "!!",
  good: "!",
  info: "i",
  inaccuracy: "?!",
  mistake: "?",
  blunder: "??",
};

export const SEV_LABEL: Record<Severity, string> = {
  brilliant: "Brilliant",
  good: "Good",
  info: "Note",
  inaccuracy: "Inaccuracy",
  mistake: "Mistake",
  blunder: "Blunder",
};

export const SEV_COLOR: Record<Severity, string> = {
  brilliant: "#3fd0c9",
  good: "#7bc47f",
  info: "#8fa3bb",
  inaccuracy: "#e8c45a",
  mistake: "#e8894a",
  blunder: "#e5534b",
};

export function gradeColor(grade: string | null | undefined): string {
  if (!grade) return "var(--contour)";
  if (grade.startsWith("A")) return "#7bc47f";
  if (grade.startsWith("B")) return "#a9c97a";
  if (grade.startsWith("C")) return "#e8c45a";
  if (grade.startsWith("D")) return "#e8894a";
  return "#e5534b";
}

export function scoreColor(score: number): string {
  if (score >= 85) return "#7bc47f";
  if (score >= 70) return "#a9c97a";
  if (score >= 55) return "#e8c45a";
  if (score >= 45) return "#e8894a";
  return "#e5534b";
}

export const RESULT_LABEL: Record<string, string> = {
  victory: "Victory",
  defeat: "Defeat",
  eliminated: "Eliminated",
  survived: "Survived",
  left: "Left early",
};

export const STATUS_LABEL: Record<string, string> = {
  queued: "Queued",
  waiting_archive: "Waiting for the game to end",
  replaying: "Replaying",
  analyzing: "Analyzing",
  done: "Ready",
  error: "Failed",
};
