import zlib from "node:zlib";
import type { PlayerSeries, ReplayData, ReplayPlayer } from "../engine/replayTypes.js";

/** Convenience accessors over the harness output. */
export class ReplayView {
  readonly bySmallID = new Map<number, ReplayPlayer>();
  readonly byId = new Map<string, ReplayPlayer>();
  readonly byClientID = new Map<string, ReplayPlayer>();
  private frameCache = new Map<number, Uint16Array>();

  constructor(readonly data: ReplayData) {
    for (const p of data.players) {
      this.bySmallID.set(p.smallID, p);
      if (p.id) this.byId.set(p.id, p);
      if (p.clientID) this.byClientID.set(p.clientID, p);
    }
  }

  get ticks() {
    return this.data.samples.ticks;
  }

  get landTiles() {
    return Math.max(1, this.data.meta.numLandTiles);
  }

  series(smallID: number): PlayerSeries | undefined {
    return this.data.samples.series[String(smallID)];
  }

  name(smallID: number | null | undefined): string {
    if (!smallID) return "unclaimed land";
    return this.bySmallID.get(smallID)?.name ?? `player ${smallID}`;
  }

  type(smallID: number | null | undefined): string {
    if (!smallID) return "TerraNullius";
    return this.bySmallID.get(smallID)?.type ?? "?";
  }

  /** Sample index (into ticks) at or before `tick`. */
  sampleIndex(tick: number): number {
    const t = this.ticks;
    let lo = 0;
    let hi = t.length - 1;
    if (hi < 0 || tick < t[0]) return -1;
    while (lo < hi) {
      const mid = (lo + hi + 1) >> 1;
      if (t[mid] <= tick) lo = mid;
      else hi = mid - 1;
    }
    return lo;
  }

  /** Value of a series metric at a tick (0 before the player appears). */
  valueAt(smallID: number, key: keyof Pick<PlayerSeries, "tiles" | "troops" | "maxTroops" | "gold" | "goldEarned" | "alive" | "allies" | "attacksOut" | "attacksIn">, tick: number): number {
    const s = this.series(smallID);
    if (!s) return 0;
    const i = this.sampleIndex(tick) - s.from;
    if (i < 0) return 0;
    const arr = s[key];
    return arr[Math.min(i, arr.length - 1)] ?? 0;
  }

  /** Full-length array aligned with `ticks` (zeros before the player appears). */
  aligned(smallID: number, key: "tiles" | "troops" | "maxTroops" | "gold" | "goldEarned" | "alive" | "allies" | "attacksOut" | "attacksIn"): number[] {
    const s = this.series(smallID);
    const out = new Array(this.ticks.length).fill(0);
    if (!s) return out;
    const arr = s[key];
    for (let i = 0; i < arr.length && s.from + i < out.length; i++) out[s.from + i] = arr[i] ?? 0;
    return out;
  }

  unitCountAt(smallID: number, unit: string, tick: number): number {
    const s = this.series(smallID);
    if (!s?.units[unit]) return 0;
    const i = this.sampleIndex(tick) - s.from;
    if (i < 0) return 0;
    return (s.units[unit][i] as number | null) ?? 0;
  }

  /** Players tracked with series: humans and nations. */
  trackedPlayers(): ReplayPlayer[] {
    return this.data.players.filter((p) => this.series(p.smallID) !== undefined);
  }

  humans(): ReplayPlayer[] {
    return this.data.players.filter((p) => p.type === "Human");
  }

  frame(index: number): Uint16Array | null {
    if (this.frameCache.has(index)) return this.frameCache.get(index)!;
    const f = this.data.frames[index];
    if (!f) return null;
    const buf = zlib.gunzipSync(Buffer.from(f.data, "base64"));
    const arr = new Uint16Array(buf.buffer, buf.byteOffset, buf.byteLength / 2);
    this.frameCache.set(index, arr);
    return arr;
  }

  frameIndexAt(tick: number): number {
    let best = -1;
    this.data.frames.forEach((f, i) => {
      if (f.tick <= tick) best = i;
    });
    return best;
  }

  /** Who took tiles from `smallID` in a window: exact when the harness logged transfers, else from frames. */
  takenFrom(smallID: number, fromTick: number, toTick: number): { to: number; cells: number }[] {
    const log = this.data.transfers;
    if (!log) return this.tileTransfers(smallID, fromTick, toTick + 300);
    const counts = new Map<number, number>();
    for (const t of log) {
      if (t.from !== smallID || t.tick < fromTick - 50 || t.tick > toTick) continue;
      counts.set(t.to, (counts.get(t.to) ?? 0) + t.tiles);
    }
    return [...counts.entries()].map(([to, cells]) => ({ to, cells })).sort((x, y) => y.cells - x.cells);
  }

  /** Who took tiles from `smallID` between two frames (approximate, from downsampled frames). */
  tileTransfers(smallID: number, fromTick: number, toTick: number): { to: number; cells: number }[] {
    const a = this.frame(Math.max(0, this.frameIndexAt(fromTick)));
    const bi = this.frameIndexAt(toTick);
    const b = this.frame(bi < 0 ? this.data.frames.length - 1 : bi);
    if (!a || !b) return [];
    const counts = new Map<number, number>();
    for (let i = 0; i < a.length; i++) {
      if (a[i] === smallID && b[i] !== smallID) counts.set(b[i], (counts.get(b[i]) ?? 0) + 1);
    }
    return [...counts.entries()].map(([to, cells]) => ({ to, cells })).sort((x, y) => y.cells - x.cells);
  }
}
