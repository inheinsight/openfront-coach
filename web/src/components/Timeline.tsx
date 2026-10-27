import { useMemo, useState } from "react";
import {
  Area,
  CartesianGrid,
  ComposedChart,
  Line,
  ReferenceArea,
  ReferenceDot,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { Analysis } from "../api";
import { clock, fmtNum, GLYPH, pct, SEV_COLOR } from "../format";

const RIVAL_COLORS = ["#9db4cf", "#7f95ae", "#6b8fb8", "#5d7590"];

type Props = {
  analysis: Analysis;
  selectedTick: number | null;
  onSelectMoment: (id: string, tick: number) => void;
};

function Tip({ active, payload, label }: { active?: boolean; payload?: { name: string; value: number; color: string }[]; label?: number }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="tt">
      <div className="muted">{clock(label ?? 0)}</div>
      {payload.map((p) => (
        <div key={p.name} style={{ color: p.color }}>
          {p.name}: {p.name.includes("troop") || p.name.includes("Gold") ? fmtNum(p.value) : pct(p.value, 1)}
        </div>
      ))}
    </div>
  );
}

/** The front line: your share of the map against your top rivals, annotated with key moments. */
export function FrontLine({ analysis, selectedTick, onSelectMoment }: Props) {
  const tl = analysis.timeline!;
  const data = useMemo(
    () =>
      tl.ticks.map((t, i) => {
        const row: Record<string, number> = { t, you: tl.me.landShare[i], leader: tl.leaderLandShare[i] };
        tl.rivals.forEach((r, j) => (row[`r${j}`] = r.landShare[i]));
        return row;
      }),
    [tl],
  );
  const shareAt = (tick: number) => {
    let best = 0;
    for (let i = 0; i < tl.ticks.length; i++) if (tl.ticks[i] <= tick) best = i;
    return tl.me.landShare[best] ?? 0;
  };
  const myPeak = Math.max(0.005, ...tl.me.landShare);
  const fullY = Math.max(0.01, ...tl.leaderLandShare, ...tl.me.landShare);
  // Zoom to your own scale by default so a 5% game isn't flattened by a 75% winner.
  const canZoom = fullY > myPeak * 2.5;
  const [whole, setWhole] = useState(false);
  const maxY = canZoom && !whole ? Math.min(1, myPeak * 2.2) : fullY;

  return (
    <div>
      <div className="chart-title">
        <h2 style={{ margin: 0 }}>Your front line</h2>
        <div className="legend">
          <span><i className="swatch" style={{ background: "var(--you)" }} />You</span>
          {tl.rivals.map((r, j) => (
            <span key={r.smallID}><i className="swatch" style={{ background: RIVAL_COLORS[j] }} />{r.name}</span>
          ))}
          <span><i className="swatch" style={{ background: "transparent", borderTop: "2px dashed #4b6280" }} />Leader</span>
          {canZoom && (
            <button className="btn" style={{ padding: "1px 10px", fontSize: "0.8rem" }} onClick={() => setWhole(!whole)}>
              {whole ? "Zoom to you" : "Show the whole map"}
            </button>
          )}
        </div>
      </div>
      <p className="muted small">Share of the map you held, minute by minute. Each badge is a key moment; select one to jump the map there.</p>
      <ResponsiveContainer width="100%" height={300}>
        <ComposedChart data={data} margin={{ top: 18, right: 12, bottom: 0, left: 0 }}>
          <defs>
            <linearGradient id="youFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#f5b83d" stopOpacity={0.55} />
              <stop offset="100%" stopColor="#f5b83d" stopOpacity={0.05} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="#24405f" strokeDasharray="2 4" vertical={false} />
          <XAxis dataKey="t" type="number" domain={["dataMin", "dataMax"]} tickFormatter={clock} stroke="#4b6280" tick={{ fill: "#7f95ae", fontSize: 12 }} />
          <YAxis tickFormatter={(v) => pct(v, maxY < 0.05 ? 1 : 0)} stroke="#4b6280" tick={{ fill: "#7f95ae", fontSize: 12 }} width={46} domain={[0, Math.min(1, maxY * 1.15)]} allowDataOverflow />
          <Tooltip content={<Tip />} />
          <Line dataKey="leader" name="Leader" stroke="#4b6280" strokeDasharray="5 4" dot={false} strokeWidth={1.5} isAnimationActive={false} />
          {tl.rivals.map((r, j) => (
            <Line key={r.smallID} dataKey={`r${j}`} name={r.name} stroke={RIVAL_COLORS[j]} dot={false} strokeWidth={1.25} isAnimationActive={false} />
          ))}
          <Area dataKey="you" name="You" stroke="#f5b83d" strokeWidth={2.5} fill="url(#youFill)" isAnimationActive={false} />
          {selectedTick !== null && <ReferenceLine x={selectedTick} stroke="#e9e2cf" strokeOpacity={0.6} />}
          {analysis.moments.map((m) => (
            <ReferenceDot
              key={m.id}
              x={Math.min(Math.max(m.tick, tl.ticks[0]), tl.ticks[tl.ticks.length - 1])}
              y={shareAt(m.tick)}
              r={11}
              shape={(props: { cx?: number; cy?: number }) => (
                <g style={{ cursor: "pointer" }} onClick={() => onSelectMoment(m.id, m.tick)}>
                  <circle cx={props.cx} cy={props.cy} r={selectedTick === m.tick ? 12 : 10} fill={SEV_COLOR[m.severity]} stroke="#0e1b2c" strokeWidth={2} />
                  <text x={props.cx} y={(props.cy ?? 0) + 4} textAnchor="middle" fontSize={11} fontWeight={700} fill="#0d1726" fontFamily="Barlow Condensed, sans-serif">
                    {GLYPH[m.severity]}
                  </text>
                  <title>{`${clock(m.tick)} ${m.title}`}</title>
                </g>
              )}
            />
          ))}
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}

/** Troops as a share of the cap, with the regen sweet spot shaded. */
export function TroopChart({ analysis, selectedTick }: { analysis: Analysis; selectedTick: number | null }) {
  const tl = analysis.timeline!;
  const data = tl.ticks.map((t, i) => ({
    t,
    ratio: tl.me.maxTroops[i] > 0 ? tl.me.troops[i] / tl.me.maxTroops[i] : 0,
    troops: tl.me.troops[i],
    cap: tl.me.maxTroops[i],
  }));
  return (
    <div>
      <div className="chart-title">
        <h3>Troops as a share of your cap</h3>
        <span className="legend"><span><i className="swatch" style={{ background: "rgba(123,196,127,0.5)", height: 8 }} />Fastest growth (35–60%)</span></span>
      </div>
      <ResponsiveContainer width="100%" height={170}>
        <ComposedChart data={data} margin={{ top: 8, right: 12, bottom: 0, left: 0 }}>
          <CartesianGrid stroke="#24405f" strokeDasharray="2 4" vertical={false} />
          <XAxis dataKey="t" type="number" domain={["dataMin", "dataMax"]} tickFormatter={clock} stroke="#4b6280" tick={{ fill: "#7f95ae", fontSize: 12 }} />
          <YAxis domain={[0, 1]} tickFormatter={(v) => pct(v)} stroke="#4b6280" tick={{ fill: "#7f95ae", fontSize: 12 }} width={46} />
          <ReferenceArea y1={0.35} y2={0.6} fill="#7bc47f" fillOpacity={0.12} />
          <ReferenceLine y={0.42} stroke="#7bc47f" strokeOpacity={0.5} strokeDasharray="3 3" />
          {selectedTick !== null && <ReferenceLine x={selectedTick} stroke="#e9e2cf" strokeOpacity={0.6} />}
          <Tooltip
            content={({ active, payload, label }) =>
              active && payload?.length ? (
                <div className="tt">
                  <div className="muted">{clock(Number(label))}</div>
                  <div>{fmtNum(payload[0].payload.troops)} of {fmtNum(payload[0].payload.cap)} ({pct(payload[0].payload.ratio)})</div>
                </div>
              ) : null
            }
          />
          <Line dataKey="ratio" stroke="#f5b83d" dot={false} strokeWidth={1.75} isAnimationActive={false} />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}

export function GoldChart({ analysis, selectedTick }: { analysis: Analysis; selectedTick: number | null }) {
  const tl = analysis.timeline!;
  const data = tl.ticks.map((t, i) => ({ t, gold: tl.me.gold[i] }));
  const buys = analysis.builds;
  return (
    <div>
      <div className="chart-title">
        <h3>Gold in the bank</h3>
        <span className="legend"><span>Ticks mark each purchase</span></span>
      </div>
      <ResponsiveContainer width="100%" height={150}>
        <ComposedChart data={data} margin={{ top: 8, right: 12, bottom: 0, left: 0 }}>
          <CartesianGrid stroke="#24405f" strokeDasharray="2 4" vertical={false} />
          <XAxis dataKey="t" type="number" domain={["dataMin", "dataMax"]} tickFormatter={clock} stroke="#4b6280" tick={{ fill: "#7f95ae", fontSize: 12 }} />
          <YAxis tickFormatter={fmtNum} stroke="#4b6280" tick={{ fill: "#7f95ae", fontSize: 12 }} width={46} />
          <Tooltip content={({ active, payload, label }) => (active && payload?.length ? <div className="tt"><div className="muted">{clock(Number(label))}</div>{fmtNum(Number(payload[0].value))} gold</div> : null)} />
          {buys.map((b, i) => (
            <ReferenceLine key={i} x={b.tick} stroke="#e9e2cf" strokeOpacity={0.18} />
          ))}
          {selectedTick !== null && <ReferenceLine x={selectedTick} stroke="#e9e2cf" strokeOpacity={0.6} />}
          <Area dataKey="gold" stroke="#c9a54a" fill="#c9a54a" fillOpacity={0.15} strokeWidth={1.5} isAnimationActive={false} />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
