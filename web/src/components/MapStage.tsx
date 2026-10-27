import { useCallback, useEffect, useMemo, useRef, useState } from "react";

export interface DecodedMap {
  width: number;
  height: number;
  frameEvery: number;
  /** Game tiles per frame pixel. */
  frameScale: number;
  ticks: number;
  frameTicks: number[];
  frames: Uint16Array[];
  land: Uint8Array | null;
  me: number | null;
  players: Map<number, { smallID: number; name: string; type: string; team: string | null }>;
}

export type CameraMode = "follow" | "whole" | "free";

/** A building, suggestion or unit drawn over the map, in frame-pixel coordinates. */
export interface MapMarker {
  fx: number;
  fy: number;
  glyph: string;
  color: string;
  label?: string;
  selected?: boolean;
  /** A suggested spot: dashed outline instead of a filled badge. */
  ghost?: boolean;
  /** Range ring in frame pixels (Defense Post, SAM, rail range...). */
  ring?: number;
}

export interface MapPath {
  points: [number, number][];
  color: string;
}

interface Camera {
  x: number; // frame-pixel coordinates at the viewport centre
  y: number;
  z: number; // 1 = whole map fits
}

const WATER: [number, number, number] = [14, 27, 44];
const LAND: [number, number, number] = [40, 52, 68];
const YOU: [number, number, number] = [245, 184, 61];
const YOU_EDGE: [number, number, number] = [255, 238, 190];
const FOCUS_EDGE: [number, number, number] = [255, 99, 82];
const MAX_ZOOM = 16;

function hsl(h: number, s: number, l: number): [number, number, number] {
  s /= 100;
  l /= 100;
  const k = (n: number) => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  return [Math.round(f(0) * 255), Math.round(f(8) * 255), Math.round(f(4) * 255)];
}

function baseColor(p: { smallID: number; type: string }, focused: boolean, dim: boolean): [number, number, number] {
  const hue = (p.smallID * 137.508) % 360;
  if (focused) return hsl(hue, 62, 56);
  const c = p.type === "Bot" ? hsl(hue, 6, 30) : p.type === "Nation" ? hsl(hue, 18, 38) : hsl(hue, 30, 46);
  return dim ? [Math.round(c[0] * 0.62), Math.round(c[1] * 0.62), Math.round(c[2] * 0.62)] : c;
}

interface Region {
  id: number;
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
  cx: number;
  cy: number;
  n: number;
}

/** Bounding boxes and centroids for a few players in one frame. */
function regions(frame: Uint16Array, w: number, ids: number[]): Map<number, Region> {
  const want = new Set(ids);
  const acc = new Map<number, Region>();
  for (const id of ids) acc.set(id, { id, minX: Infinity, minY: Infinity, maxX: -1, maxY: -1, cx: 0, cy: 0, n: 0 });
  for (let i = 0; i < frame.length; i++) {
    const o = frame[i];
    if (!o || !want.has(o)) continue;
    const r = acc.get(o)!;
    const x = i % w;
    const y = (i / w) | 0;
    if (x < r.minX) r.minX = x;
    if (x > r.maxX) r.maxX = x;
    if (y < r.minY) r.minY = y;
    if (y > r.maxY) r.maxY = y;
    r.cx += x;
    r.cy += y;
    r.n++;
  }
  for (const r of acc.values()) {
    if (r.n) {
      r.cx /= r.n;
      r.cy /= r.n;
    }
  }
  return acc;
}

const reduceMotion = typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

export function MapStage({
  map,
  frameIndex,
  focus,
  mode,
  onModeChange,
  markers = [],
  paths = [],
  focusPoints,
  showLabels = true,
}: {
  map: DecodedMap;
  frameIndex: number;
  focus: number[];
  mode: CameraMode;
  onModeChange: (m: CameraMode) => void;
  markers?: MapMarker[];
  paths?: MapPath[];
  /** When set (and following), frame these points instead of your territory. */
  focusPoints?: [number, number][] | null;
  showLabels?: boolean;
}) {
  const wrap = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const off = useRef<HTMLCanvasElement | null>(null);
  const cam = useRef<Camera>({ x: map.width / 2, y: map.height / 2, z: 1 });
  const anim = useRef<number | null>(null);
  const [size, setSize] = useState({ w: 800, h: 480 });
  const [hover, setHover] = useState<{ x: number; y: number; text: string } | null>(null);
  const frame = map.frames[Math.min(frameIndex, map.frames.length - 1)];
  const focusKey = focus.join(",");
  const ids = useMemo(() => [...new Set([...(map.me ? [map.me] : []), ...focus])], [map.me, focusKey]); // eslint-disable-line react-hooks/exhaustive-deps
  const regs = useMemo(() => regions(frame, map.width, ids), [frame, map.width, ids]);

  // Fit the canvas to its container, keeping the map's aspect ratio.
  useEffect(() => {
    const el = wrap.current;
    if (!el) return;
    const ro = new ResizeObserver(() => {
      const w = el.clientWidth;
      const h = Math.min(Math.round((w * map.height) / map.width), Math.round(window.innerHeight * 0.68));
      setSize({ w, h: Math.max(240, h) });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [map.width, map.height]);

  const base = Math.min(size.w / map.width, size.h / map.height);

  const draw = useCallback(() => {
    const c = canvas.current;
    const img = off.current;
    if (!c || !img) return;
    const dpr = window.devicePixelRatio || 1;
    if (c.width !== Math.round(size.w * dpr) || c.height !== Math.round(size.h * dpr)) {
      c.width = Math.round(size.w * dpr);
      c.height = Math.round(size.h * dpr);
    }
    const ctx = c.getContext("2d")!;
    const { x, y, z } = cam.current;
    const s = base * z;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = `rgb(${WATER.join(",")})`;
    ctx.fillRect(0, 0, c.width, c.height);
    ctx.imageSmoothingEnabled = false;
    ctx.setTransform(dpr * s, 0, 0, dpr * s, dpr * (size.w / 2 - x * s), dpr * (size.h / 2 - y * s));
    ctx.drawImage(img, 0, 0);

    // Overlays in screen space: rings and name labels for you and the players in this moment.
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const toScreen = (fx: number, fy: number) => [(fx - x) * s + size.w / 2, (fy - y) * s + size.h / 2];
    ctx.font = "600 13px Barlow, system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    // Warship paths and building markers.
    for (const p of paths) {
      if (p.points.length < 2) continue;
      ctx.strokeStyle = p.color;
      ctx.lineWidth = 2;
      ctx.setLineDash([]);
      ctx.beginPath();
      p.points.forEach(([fx, fy], i) => {
        const [sx, sy] = toScreen(fx, fy);
        if (i === 0) ctx.moveTo(sx, sy);
        else ctx.lineTo(sx, sy);
      });
      ctx.stroke();
      const [ex, ey] = toScreen(...p.points[p.points.length - 1]);
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(ex, ey, 4, 0, Math.PI * 2);
      ctx.fill();
    }
    const ordered = [...markers].sort((a, b) => Number(!!a.selected) - Number(!!b.selected));
    for (const m of ordered) {
      const [sx, sy] = toScreen(m.fx + 0.5, m.fy + 0.5);
      if (m.ring && m.selected) {
        ctx.strokeStyle = m.color;
        ctx.globalAlpha = 0.6;
        ctx.setLineDash([5, 4]);
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(sx, sy, m.ring * s, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.globalAlpha = 1;
      }
      const r = m.selected ? 12 : 8;
      if (m.ghost) {
        ctx.strokeStyle = m.color;
        ctx.lineWidth = 2;
        ctx.setLineDash([4, 3]);
        ctx.beginPath();
        ctx.arc(sx, sy, r + 3, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
      } else {
        ctx.fillStyle = m.color;
        ctx.strokeStyle = m.selected ? "#e9e2cf" : "#0b1624";
        ctx.lineWidth = m.selected ? 2.5 : 1.5;
        ctx.beginPath();
        ctx.arc(sx, sy, r, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      }
      ctx.fillStyle = m.ghost ? m.color : "#0d1726";
      ctx.font = `700 ${m.selected ? 12 : 10}px Barlow Condensed, system-ui, sans-serif`;
      ctx.fillText(m.glyph, sx, sy + 1);
      if (m.label && (m.selected || m.ghost)) {
        ctx.font = "600 12px Barlow, system-ui, sans-serif";
        const tw = ctx.measureText(m.label).width + 12;
        ctx.fillStyle = "rgba(11, 22, 36, 0.88)";
        ctx.fillRect(sx - tw / 2, sy + r + 4, tw, 18);
        ctx.fillStyle = m.ghost ? m.color : "#e9e2cf";
        ctx.fillText(m.label, sx, sy + r + 14);
      }
    }
    ctx.font = "600 13px Barlow, system-ui, sans-serif";

    for (const id of showLabels ? ids : []) {
      const r = regs.get(id);
      if (!r?.n) continue;
      const isMe = id === map.me;
      const [sx0, sy0] = toScreen(r.minX, r.minY);
      const [sx1, sy1] = toScreen(r.maxX + 1, r.maxY + 1);
      const [cx, cy] = toScreen(r.cx + 0.5, r.cy + 0.5);
      const small = Math.max(sx1 - sx0, sy1 - sy0) < 28;
      const color = isMe ? "#f5b83d" : "#ff6352";
      if (small) {
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(cx, cy, 16, 0, Math.PI * 2);
        ctx.stroke();
      }
      const label = isMe ? "You" : map.players.get(id)?.name ?? `#${id}`;
      const ly = small ? cy - 26 : Math.max(sy0 - 12, 12);
      const tw = ctx.measureText(label).width + 12;
      ctx.fillStyle = "rgba(11, 22, 36, 0.86)";
      ctx.fillRect(cx - tw / 2, ly - 10, tw, 20);
      ctx.strokeStyle = color;
      ctx.lineWidth = 1;
      ctx.strokeRect(cx - tw / 2 + 0.5, ly - 9.5, tw - 1, 19);
      ctx.fillStyle = color;
      ctx.fillText(label, cx, ly + 1);
    }
  }, [base, ids, map.me, map.players, regs, size.h, size.w, markers, paths, showLabels]);

  // Render the frame into an offscreen image at native resolution.
  useEffect(() => {
    const W = map.width;
    const H = map.height;
    if (!off.current) off.current = document.createElement("canvas");
    const img = off.current;
    img.width = W;
    img.height = H;
    const ctx = img.getContext("2d")!;
    const data = ctx.createImageData(W, H);
    const focusSet = new Set(focus);
    const dim = focusSet.size > 0;
    const cache = new Map<number, [number, number, number]>();
    for (let i = 0; i < W * H; i++) {
      const o = frame[i];
      let rgb: [number, number, number];
      if (!o) rgb = map.land && map.land[i] ? LAND : WATER;
      else {
        const edge = (i % W > 0 && frame[i - 1] !== o) || (i % W < W - 1 && frame[i + 1] !== o) || (i >= W && frame[i - W] !== o) || (i + W < W * H && frame[i + W] !== o);
        if (o === map.me) rgb = edge ? YOU_EDGE : YOU;
        else if (focusSet.has(o) && edge) rgb = FOCUS_EDGE;
        else {
          let c = cache.get(o);
          if (!c) {
            const p = map.players.get(o) ?? { smallID: o, type: "Bot" };
            c = baseColor(p, focusSet.has(o), dim);
            cache.set(o, c);
          }
          rgb = c;
        }
      }
      data.data[i * 4] = rgb[0];
      data.data[i * 4 + 1] = rgb[1];
      data.data[i * 4 + 2] = rgb[2];
      data.data[i * 4 + 3] = 255;
    }
    ctx.putImageData(data, 0, 0);
    draw();
  }, [frame, focusKey, map]); // eslint-disable-line react-hooks/exhaustive-deps

  const clampCam = useCallback(
    (c: Camera): Camera => {
      const z = Math.min(MAX_ZOOM, Math.max(1, c.z));
      const halfW = size.w / (2 * base * z);
      const halfH = size.h / (2 * base * z);
      const clampAxis = (v: number, half: number, max: number) => (half * 2 >= max ? max / 2 : Math.min(max - half, Math.max(half, v)));
      return { z, x: clampAxis(c.x, halfW, map.width), y: clampAxis(c.y, halfH, map.height) };
    },
    [base, map.height, map.width, size.h, size.w],
  );

  const animateTo = useCallback(
    (target: Camera) => {
      const to = clampCam(target);
      if (anim.current) cancelAnimationFrame(anim.current);
      if (reduceMotion) {
        cam.current = to;
        draw();
        return;
      }
      const from = { ...cam.current };
      const start = performance.now();
      const dur = 450;
      const step = (now: number) => {
        const t = Math.min(1, (now - start) / dur);
        const e = 1 - Math.pow(1 - t, 3);
        // Interpolate zoom in log space so it feels even.
        const z = Math.exp(Math.log(from.z) + (Math.log(to.z) - Math.log(from.z)) * e);
        cam.current = { x: from.x + (to.x - from.x) * e, y: from.y + (to.y - from.y) * e, z };
        draw();
        anim.current = t < 1 ? requestAnimationFrame(step) : null;
      };
      anim.current = requestAnimationFrame(step);
    },
    [clampCam, draw],
  );

  // Follow: frame you (and anyone in the selected moment) whenever the frame or focus changes.
  useEffect(() => {
    if (mode === "whole") return void animateTo({ x: map.width / 2, y: map.height / 2, z: 1 });
    if (mode !== "follow") return void draw();
    if (focusPoints && focusPoints.length) {
      const xs = focusPoints.map((p) => p[0]);
      const ys = focusPoints.map((p) => p[1]);
      const minPX = Math.min(...xs);
      const maxPX = Math.max(...xs);
      const minPY = Math.min(...ys);
      const maxPY = Math.max(...ys);
      const bw = Math.max((maxPX - minPX) * 1.5, map.width / 9);
      const bh = Math.max((maxPY - minPY) * 1.5, map.height / 9);
      const z = Math.min(map.width / bw, (size.h / base) / bh);
      return void animateTo({ x: (minPX + maxPX) / 2, y: (minPY + maxPY) / 2, z });
    }
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -1;
    let maxY = -1;
    // Frame you and the moment's main player; others are labelled if in view.
    const fit = new Set([map.me, focus[0]].filter((x): x is number => typeof x === "number"));
    for (const r of regs.values()) {
      if (!r.n || !fit.has(r.id)) continue;
      minX = Math.min(minX, r.minX);
      minY = Math.min(minY, r.minY);
      maxX = Math.max(maxX, r.maxX);
      maxY = Math.max(maxY, r.maxY);
    }
    if (maxX < 0) return void animateTo({ x: map.width / 2, y: map.height / 2, z: 1 });
    const bw = Math.max((maxX - minX + 1) * 1.7, map.width / 12);
    const bh = Math.max((maxY - minY + 1) * 1.7, map.height / 12);
    const z = Math.min(map.width / bw, (size.h / base) / bh);
    animateTo({ x: (minX + maxX + 1) / 2, y: (minY + maxY + 1) / 2, z });
  }, [mode, regs, size.w, size.h, JSON.stringify(focusPoints ?? null)]); // eslint-disable-line react-hooks/exhaustive-deps

  // Wheel zoom around the cursor, drag to pan, double-click to zoom in.
  useEffect(() => {
    const c = canvas.current;
    if (!c) return;
    const at = (e: MouseEvent) => {
      const r = c.getBoundingClientRect();
      return { sx: e.clientX - r.left, sy: e.clientY - r.top };
    };
    const zoomAt = (sx: number, sy: number, factor: number) => {
      const { x, y, z } = cam.current;
      const s = base * z;
      const fx = x + (sx - size.w / 2) / s;
      const fy = y + (sy - size.h / 2) / s;
      const nz = Math.min(MAX_ZOOM, Math.max(1, z * factor));
      const ns = base * nz;
      cam.current = clampCam({ z: nz, x: fx - (sx - size.w / 2) / ns, y: fy - (sy - size.h / 2) / ns });
      onModeChange("free");
      draw();
    };
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      if (anim.current) cancelAnimationFrame(anim.current);
      const { sx, sy } = at(e);
      zoomAt(sx, sy, Math.exp(-e.deltaY * 0.0018));
    };
    let drag: { sx: number; sy: number; x: number; y: number } | null = null;
    const onDown = (e: PointerEvent) => {
      if (anim.current) cancelAnimationFrame(anim.current);
      drag = { sx: e.clientX, sy: e.clientY, x: cam.current.x, y: cam.current.y };
      c.setPointerCapture(e.pointerId);
    };
    const onMove = (e: PointerEvent) => {
      if (drag) {
        const s = base * cam.current.z;
        const dx = e.clientX - drag.sx;
        const dy = e.clientY - drag.sy;
        if (Math.abs(dx) + Math.abs(dy) > 3) onModeChange("free");
        cam.current = clampCam({ ...cam.current, x: drag.x - dx / s, y: drag.y - dy / s });
        draw();
        return;
      }
      const { sx, sy } = at(e);
      const { x, y, z } = cam.current;
      const s = base * z;
      const fx = Math.floor(x + (sx - size.w / 2) / s);
      const fy = Math.floor(y + (sy - size.h / 2) / s);
      const o = fx >= 0 && fy >= 0 && fx < map.width && fy < map.height ? frame[fy * map.width + fx] : 0;
      const p = o ? map.players.get(o) : null;
      setHover(
        p
          ? { x: sx, y: sy, text: o === map.me ? `${p.name} (you)` : `${p.name}, ${p.type === "Bot" ? "bot tribe" : p.type.toLowerCase()}${p.team ? `, team ${p.team}` : ""}` }
          : null,
      );
    };
    const onUp = () => {
      drag = null;
    };
    const onDbl = (e: MouseEvent) => {
      const { sx, sy } = at(e);
      zoomAt(sx, sy, 2);
    };
    const onLeave = () => setHover(null);
    c.addEventListener("wheel", onWheel, { passive: false });
    c.addEventListener("pointerdown", onDown);
    c.addEventListener("pointermove", onMove);
    c.addEventListener("pointerup", onUp);
    c.addEventListener("pointercancel", onUp);
    c.addEventListener("dblclick", onDbl);
    c.addEventListener("pointerleave", onLeave);
    return () => {
      c.removeEventListener("wheel", onWheel);
      c.removeEventListener("pointerdown", onDown);
      c.removeEventListener("pointermove", onMove);
      c.removeEventListener("pointerup", onUp);
      c.removeEventListener("pointercancel", onUp);
      c.removeEventListener("dblclick", onDbl);
      c.removeEventListener("pointerleave", onLeave);
    };
  }, [base, clampCam, draw, frame, map, onModeChange, size.h, size.w]);

  useEffect(() => draw(), [draw]);

  const zoomBy = (f: number) => {
    const { x, y, z } = cam.current;
    onModeChange("free");
    animateTo({ x, y, z: z * f });
  };

  return (
    <div ref={wrap} className="stage">
      <canvas ref={canvas} style={{ width: size.w, height: size.h }} aria-label="Territory map. Scroll to zoom, drag to pan." />
      <div className="stage-tools" role="toolbar" aria-label="Map view">
        <button className={`btn${mode === "follow" ? " on" : ""}`} onClick={() => onModeChange("follow")} aria-pressed={mode === "follow"}>
          Follow me
        </button>
        <button className={`btn${mode === "whole" ? " on" : ""}`} onClick={() => onModeChange("whole")} aria-pressed={mode === "whole"}>
          Whole map
        </button>
        <button className="btn" onClick={() => zoomBy(1 / 1.6)} aria-label="Zoom out">−</button>
        <button className="btn" onClick={() => zoomBy(1.6)} aria-label="Zoom in">+</button>
      </div>
      {hover && (
        <div className="stage-hover" style={{ left: Math.min(hover.x + 14, size.w - 220), top: Math.max(hover.y - 34, 4) }}>
          {hover.text}
        </div>
      )}
    </div>
  );
}
