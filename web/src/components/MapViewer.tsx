import { useEffect, useMemo, useRef, useState } from "react";
import { api, type MapData } from "../api";
import { clock } from "../format";

async function gunzip(b64: string): Promise<ArrayBuffer> {
  const bin = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
  const stream = new Blob([bin]).stream().pipeThrough(new DecompressionStream("gzip"));
  return new Response(stream).arrayBuffer();
}

function hsl(h: number, s: number, l: number): [number, number, number] {
  s /= 100;
  l /= 100;
  const k = (n: number) => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  return [Math.round(f(0) * 255), Math.round(f(8) * 255), Math.round(f(4) * 255)];
}

/** Stable, muted colours for everyone except you; you are marigold. */
function palette(map: MapData) {
  const colors = new Map<number, [number, number, number]>();
  for (const p of map.players) {
    const hue = (p.smallID * 137.508) % 360;
    if (p.smallID === map.me) colors.set(p.smallID, [245, 184, 61]);
    else if (p.type === "Bot") colors.set(p.smallID, hsl(hue, 6, 30));
    else if (p.type === "Nation") colors.set(p.smallID, hsl(hue, 18, 38));
    else colors.set(p.smallID, hsl(hue, 34, 50));
  }
  return colors;
}

export function MapViewer({ gameId, tick, onTick }: { gameId: string; tick: number | null; onTick?: (t: number) => void }) {
  const [map, setMap] = useState<MapData | null>(null);
  const [frames, setFrames] = useState<Uint16Array[] | null>(null);
  const [land, setLand] = useState<Uint8Array | null>(null);
  const [idx, setIdx] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [hover, setHover] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const canvas = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    let alive = true;
    api
      .map(gameId)
      .then(async (m) => {
        const decoded = await Promise.all(m.frames.map(async (f) => new Uint16Array(await gunzip(f.data))));
        const terrain = m.terrain ? new Uint8Array(await gunzip(m.terrain)) : null;
        if (!alive) return;
        setMap(m);
        setFrames(decoded);
        setLand(terrain);
        setIdx(decoded.length - 1);
      })
      .catch((e) => setErr(String(e.message ?? e)));
    return () => {
      alive = false;
    };
  }, [gameId]);

  // Follow the selected moment.
  useEffect(() => {
    if (!map || tick === null) return;
    // First frame at or after the moment: show what it led to.
    let best = map.frames.findIndex((f) => f.tick >= tick);
    if (best < 0) best = map.frames.length - 1;
    setIdx(best);
    setPlaying(false);
  }, [tick, map]);

  useEffect(() => {
    if (!playing || !frames) return;
    const t = setInterval(() => {
      setIdx((i) => {
        if (i >= frames.length - 1) {
          setPlaying(false);
          return i;
        }
        return i + 1;
      });
    }, 450);
    return () => clearInterval(t);
  }, [playing, frames]);

  const colors = useMemo(() => (map ? palette(map) : null), [map]);
  const names = useMemo(() => new Map(map?.players.map((p) => [p.smallID, p]) ?? []), [map]);

  useEffect(() => {
    if (!map || !frames || !colors || !canvas.current) return;
    const { width: w, height: h } = map;
    const c = canvas.current;
    c.width = w;
    c.height = h;
    const ctx = c.getContext("2d")!;
    const img = ctx.createImageData(w, h);
    const own = frames[idx];
    for (let i = 0; i < w * h; i++) {
      const o = own[i];
      let rgb: [number, number, number];
      if (o) rgb = colors.get(o) ?? [120, 120, 120];
      else if (land && land[i]) rgb = [42, 55, 72];
      else rgb = [14, 27, 44];
      // Darken your border a touch so your shape reads as a front line.
      if (o === map.me && map.me !== null) {
        const x = i % w;
        const edge = (x > 0 && own[i - 1] !== o) || (x < w - 1 && own[i + 1] !== o) || own[i - w] !== o || own[i + w] !== o;
        if (edge) rgb = [255, 236, 180];
      }
      img.data[i * 4] = rgb[0];
      img.data[i * 4 + 1] = rgb[1];
      img.data[i * 4 + 2] = rgb[2];
      img.data[i * 4 + 3] = 255;
    }
    ctx.putImageData(img, 0, 0);
  }, [map, frames, idx, colors, land]);

  if (err) return <p className="err">Map unavailable: {err}</p>;
  if (!map || !frames) return <p className="muted">Loading the map…</p>;

  const onMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    const x = Math.floor(((e.clientX - r.left) / r.width) * map.width);
    const y = Math.floor(((e.clientY - r.top) / r.height) * map.height);
    const o = frames[idx][y * map.width + x];
    const p = o ? names.get(o) : null;
    setHover(p ? `${p.name}${p.smallID === map.me ? " (you)" : `, ${p.type.toLowerCase()}`}` : null);
  };

  return (
    <div>
      <div className="map-wrap">
        <canvas ref={canvas} onMouseMove={onMove} onMouseLeave={() => setHover(null)} aria-label={`Territory map at ${clock(map.frames[idx]?.tick ?? 0)}`} />
        {hover && <div className="map-hover">{hover}</div>}
      </div>
      <div className="scrub">
        <button className="btn" onClick={() => (idx >= frames.length - 1 ? (setIdx(0), setPlaying(true)) : setPlaying(!playing))}>
          {playing ? "Pause" : "Play"}
        </button>
        <input
          type="range"
          min={0}
          max={frames.length - 1}
          value={idx}
          onChange={(e) => {
            setIdx(Number(e.target.value));
            setPlaying(false);
            onTick?.(map.frames[Number(e.target.value)].tick);
          }}
          aria-label="Game time"
        />
        <span className="num" style={{ minWidth: 48, textAlign: "right" }}>{clock(map.frames[idx]?.tick ?? 0)}</span>
      </div>
    </div>
  );
}
