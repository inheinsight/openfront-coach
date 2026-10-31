import { useEffect, useMemo, useState } from "react";
import { CartesianGrid, Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { api, type TrendRow } from "../api";
import { clock, fmtNum, gradeColor, pct } from "../format";
import { Link } from "../router";

interface MetricSpec {
  key: string;
  label: string;
  fmt: (v: number) => string;
  target?: number;
  higherIsBetter: boolean;
  why: string;
}

const METRICS: MetricSpec[] = [
  { key: "share300", label: "Land at 5:00 vs typical player", fmt: (v) => `${v.toFixed(2)}×`, target: 1, higherIsBetter: true, why: "The strongest early predictor of where you finish." },
  { key: "stackRatio", label: "Attack stack vs the defender's home troops", fmt: (v) => `${v.toFixed(2)}×`, target: 1, higherIsBetter: true, why: "Losses double at 0.5× and are cheapest from about 1.67×." },
  { key: "income5to10", label: "Income per minute, 5:00–10:00", fmt: (v) => fmtNum(v), higherIsBetter: true, why: "Trade ships and trains: where winners pull ahead." },
  { key: "firstIncome", label: "First Port or Factory after spawn", fmt: (v) => (v >= 9999 ? "never" : clock(v * 10)), target: 180, higherIsBetter: false, why: "Have something earning by 3:00." },
  { key: "troopEff", label: "Troop growth efficiency", fmt: (v) => pct(v), target: 0.8, higherIsBetter: true, why: "Regen peaks with troops around 42% of the cap." },
  { key: "drawdown", label: "Worst territory collapse", fmt: (v) => pct(v), target: 0.25, higherIsBetter: false, why: "How much ground one bad stretch cost you." },
];

export function Trends() {
  const [rows, setRows] = useState<TrendRow[] | null>(null);
  useEffect(() => {
    api.trends().then(setRows).catch(() => setRows([]));
  }, []);
  const data = useMemo(() => (rows ?? []).map((r, i) => ({ n: i + 1, ...r.metrics, label: `${r.map}, ${new Date(r.started_at).toLocaleDateString()}`, id: r.game_id, grade: r.grade, result: r.result })), [rows]);

  if (!rows) return <p className="muted">Loading…</p>;
  if (rows.length < 2)
    return (
      <div className="panel" style={{ maxWidth: 640 }}>
        <h2>Progress needs a few games</h2>
        <p>Trends appear once two or more games are analyzed. {rows.length === 1 ? "One down." : ""} <Link to="/">Analyze another game</Link>.</p>
      </div>
    );

  const last5 = rows.slice(-5);
  const avg = (k: string, rs: TrendRow[]) => {
    const v = rs.map((r) => r.metrics[k]).filter((x): x is number => typeof x === "number");
    return v.length ? v.reduce((a, b) => a + b, 0) / v.length : null;
  };
  const wins = rows.filter((r) => r.result === "victory").length;

  return (
    <div>
      <h1 style={{ marginBottom: 6 }}>Your progress</h1>
      <p className="muted">
        {rows.length} games analyzed, {wins} win{wins === 1 ? "" : "s"}. Average score over your last five: {Math.round(avg("overall", last5) ?? 0)}.
      </p>
      <div className="panel">
        <h2>Overall score</h2>
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={data} margin={{ top: 8, right: 12, bottom: 0, left: 0 }}>
            <CartesianGrid stroke="#24405f" strokeDasharray="2 4" vertical={false} />
            <XAxis dataKey="n" stroke="#4b6280" tick={{ fill: "#7f95ae", fontSize: 12 }} />
            <YAxis domain={[0, 100]} stroke="#4b6280" tick={{ fill: "#7f95ae", fontSize: 12 }} width={36} />
            <Tooltip content={({ active, payload }) => (active && payload?.length ? <div className="tt"><div>{String(payload[0].payload.label)}</div><div style={{ color: gradeColor(String(payload[0].payload.grade)) }}>{String(payload[0].payload.grade)} ({String(payload[0].value)})</div></div> : null)} />
            <Line dataKey="overall" stroke="#f5b83d" strokeWidth={2.5} dot={{ r: 3, fill: "#f5b83d" }} isAnimationActive={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <div className="two-col" style={{ marginTop: 20 }}>
        {METRICS.map((m) => {
          const recent = avg(m.key, last5);
          const met = recent !== null && m.target !== undefined && (m.higherIsBetter ? recent >= m.target : recent <= m.target);
          return (
            <div key={m.key} className="panel" style={{ marginTop: 0 }}>
              <div className="chart-title">
                <h3>{m.label}</h3>
                <span className={`small ${met ? "c-good" : "muted"}`}>
                  Last 5: {recent === null ? "—" : m.fmt(recent)}
                  {m.target !== undefined && `, goal ${m.fmt(m.target)}${met ? ", reached" : ""}`}
                </span>
              </div>
              <p className="muted small">{m.why}</p>
              <ResponsiveContainer width="100%" height={140}>
                <LineChart data={data} margin={{ top: 6, right: 8, bottom: 0, left: 0 }}>
                  <CartesianGrid stroke="#24405f" strokeDasharray="2 4" vertical={false} />
                  <XAxis dataKey="n" stroke="#4b6280" tick={{ fill: "#7f95ae", fontSize: 11 }} />
                  <YAxis stroke="#4b6280" tick={{ fill: "#7f95ae", fontSize: 11 }} width={44} tickFormatter={(v) => m.fmt(Number(v))} />
                  {m.target !== undefined && <ReferenceLine y={m.target} stroke="#7bc47f" strokeDasharray="4 4" strokeOpacity={0.7} />}
                  <Tooltip content={({ active, payload }) => (active && payload?.length && payload[0].value !== null ? <div className="tt">{String(payload[0].payload.label)}: {m.fmt(Number(payload[0].value))}</div> : null)} />
                  <Line dataKey={m.key} stroke="#e9e2cf" strokeWidth={1.75} dot={{ r: 2.5, fill: "#e9e2cf" }} connectNulls isAnimationActive={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          );
        })}
      </div>
    </div>
  );
}
