import { CartesianGrid, ComposedChart, Line, ReferenceDot, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { Analysis, AttackCard } from "../api";
import { clock, fmtNum, GLYPH, pct, SEV_LABEL } from "../format";
import { ClickBar, stackColor, xs } from "./Lesson";

/** Log position of a stack on the 0.05×–5× gauge, as a percentage. */
const gx = (s: number) => ((Math.log10(Math.min(5, Math.max(0.05, s))) - Math.log10(0.05)) / 2) * 100;

/** Your stack against the engine's loss bands: 2× losses at ≤0.5×, cheapest from 1.67×. */
function StackGauge({ card }: { card: AttackCard }) {
  const full = card.homeBefore / Math.max(1, card.targetHome);
  const marks: { s: number; label: string; color: string; hollow?: boolean }[] = [{ s: card.stack, label: `you sent ${xs(card.stack)}`, color: "var(--you)" }];
  if (card.window) marks.push({ s: card.window.stack, label: `held until ${clock(card.window.tick)}: ${xs(card.window.stack)}`, color: "var(--brilliant)", hollow: true });
  else if (full > card.stack * 1.15 && !card.counter) marks.push({ s: full, label: `your whole army: ${xs(full)}`, color: "var(--paper-dim)", hollow: true });
  return (
    <div className="gauge" role="img" aria-label={marks.map((m) => m.label).join("; ")}>
      <div className="gauge-bands">
        <span style={{ width: `${gx(0.5)}%`, background: "rgba(229,83,75,0.45)" }}>you pay double per tile</span>
        <span style={{ width: `${gx(1) - gx(0.5)}%`, background: "rgba(232,137,74,0.45)" }}>1–2×</span>
        <span style={{ width: `${gx(1.67) - gx(1)}%`, background: "rgba(123,196,127,0.45)" }}>0.6–1×</span>
        <span style={{ flex: 1, background: "rgba(63,208,201,0.4)" }}>cheapest</span>
      </div>
      <div className="gauge-ticks">
        {[0.1, 0.25, 0.5, 1, 1.67, 4].map((s) => (
          <span key={s} style={{ left: `${gx(s)}%` }}>{xs(s).replace(".00", "")}</span>
        ))}
      </div>
      {marks.map((m) => (
        <span key={m.label} className={`gauge-mark${m.hollow ? " hollow" : ""}`} style={{ left: `${gx(m.s)}%`, color: m.color }}>
          {m.label}
        </span>
      ))}
    </div>
  );
}

/** Their home army around the attack, with your army and the line it had to beat. */
function WindowChart({ card }: { card: AttackCard }) {
  const data = card.series.map((p) => ({ t: p.tick, theirs: p.theirs, yours: p.yours }));
  const showHeld = !card.counter && card.stack < 1;
  return (
    <ResponsiveContainer width="100%" height={220}>
      <ComposedChart data={data} margin={{ top: 10, right: 12, bottom: 0, left: 0 }}>
        <CartesianGrid stroke="#24405f" strokeDasharray="2 4" vertical={false} />
        <XAxis dataKey="t" type="number" domain={["dataMin", "dataMax"]} tickFormatter={clock} stroke="#4b6280" tick={{ fill: "#7f95ae", fontSize: 12 }} />
        <YAxis tickFormatter={fmtNum} stroke="#4b6280" tick={{ fill: "#7f95ae", fontSize: 12 }} width={46} />
        <Tooltip
          content={({ active, payload, label }) =>
            active && payload?.length ? (
              <div className="tt">
                <div className="muted">{clock(Number(label))}</div>
                {payload.map((p) => (p.value === null || p.value === undefined ? null : <div key={String(p.dataKey)} style={{ color: p.color }}>{p.name}: {fmtNum(Number(p.value))}</div>))}
              </div>
            ) : null
          }
        />
        <ReferenceLine x={card.tick} stroke="#e9e2cf" strokeOpacity={0.5} label={{ value: "you clicked", position: "insideTopLeft", fill: "#c9c2b0", fontSize: 11 }} />
        {showHeld && <ReferenceLine y={card.homeBefore} stroke="#f5b83d" strokeDasharray="6 4" label={{ value: `your ${fmtNum(card.homeBefore)}, held`, position: "insideTopRight", fill: "#f5b83d", fontSize: 11 }} />}
        {showHeld && <ReferenceLine y={card.homeBefore / 1.67} stroke="#3fd0c9" strokeOpacity={0.7} strokeDasharray="2 3" label={{ value: "1.67× below this", position: "insideBottomRight", fill: "#3fd0c9", fontSize: 11 }} />}
        <Line dataKey="theirs" name={`${card.target} at home`} stroke="#9db4cf" strokeWidth={2} dot={false} connectNulls isAnimationActive={false} />
        <Line dataKey="yours" name="You at home" stroke="#f5b83d" strokeWidth={1.5} strokeOpacity={0.6} dot={false} connectNulls isAnimationActive={false} />
        {card.window && <ReferenceDot x={card.window.tick} y={card.window.theirHome} r={6} fill="#3fd0c9" stroke="#0e1b2c" strokeWidth={2} />}
      </ComposedChart>
    </ResponsiveContainer>
  );
}

export function AttackCardView({ card }: { card: AttackCard }) {
  return (
    <div className="attack-card">
      <div className="row" style={{ justifyContent: "space-between" }}>
        <div className="row">
          <span className={`glyph sev-${card.severity}`}>{GLYPH[card.severity]}</span>
          <h2 style={{ margin: 0 }}>
            {clock(card.tick)} · {card.counter ? "Counter-attack on" : "Attack on"} {card.target}
          </h2>
          <span className={`small c-${card.severity}`}>{SEV_LABEL[card.severity]}</span>
        </div>
        <div className="row small muted">
          {card.clicks > 1 && <span className="chip">{card.clicks} clicks in {((card.lastTick - card.tick) / 10).toFixed(1)} s</span>}
          {card.counter && <span className="chip">after their {fmtNum(card.counter.incoming)} push</span>}
        </div>
      </div>

      <div className="card-section">
        <span className="eyebrow">Your stack ÷ their home army</span>
        <StackGauge card={card} />
        <p className="small muted" style={{ margin: "6px 0 0" }}>
          The engine multiplies your losses per tile by their home troops ÷ your stack, kept between 0.6 and 2. At {xs(card.stack)} you paid {card.loss.toFixed(1)}× the base rate.
        </p>
      </div>

      <div className="two-col card-cols">
        <div>
          <span className="eyebrow">What you did</span>
          {card.clicks > 1 && (
            <div className="row" style={{ margin: "8px 0", flexWrap: "nowrap" }}>
              <ClickBar shares={card.clickShares} />
              <span className="num" style={{ color: stackColor(card.stack) }}>{pct(card.share)}</span>
            </div>
          )}
          <ul className="did">
            {card.did.map((d) => (
              <li key={d}>{d}</li>
            ))}
          </ul>
        </div>
        <div className="call">
          <span className="eyebrow" style={{ color: "var(--brilliant)" }}>What would have worked</span>
          <p style={{ margin: "6px 0 0" }}>{card.call}</p>
        </div>
      </div>

      <div className="card-section">
        <div className="chart-title">
          <span className="eyebrow">{card.target}'s home army around your attack</span>
          <span className="legend">
            <span><i className="swatch" style={{ background: "#9db4cf" }} />{card.target} at home</span>
            <span><i className="swatch" style={{ background: "rgba(245,184,61,0.6)" }} />You at home</span>
            {card.window && <span><i className="swatch" style={{ background: "#3fd0c9", height: 8, width: 8, borderRadius: 4 }} />The window</span>}
          </span>
        </div>
        <WindowChart card={card} />
      </div>
    </div>
  );
}

/** The worst attacks of the game as decision cards, plus whichever one you opened. */
export function AttackCards({ analysis, selectedId, onSelect }: { analysis: Analysis; selectedId: string | null; onSelect: (id: string) => void }) {
  const cards = analysis.troops?.cards ?? [];
  const featured = cards.filter((c) => c.featured);
  const selected = cards.find((c) => c.id === selectedId) ?? featured[0] ?? null;
  if (!selected) return null;
  const tabs = [...featured, ...(featured.includes(selected) ? [] : [selected])].sort((a, b) => a.tick - b.tick);
  return (
    <div className="panel">
      <div className="row" style={{ justifyContent: "space-between", marginBottom: 12 }}>
        <span className="eyebrow">Decision cards · {featured.length} attack{featured.length === 1 ? "" : "s"} that cost you most</span>
        <div className="row">
          {tabs.map((c) => (
            <button key={c.id} className={`btn${c.id === selected.id ? " on" : ""}`} onClick={() => onSelect(c.id)}>
              {clock(c.tick)} {c.target.length > 14 ? `${c.target.slice(0, 13)}…` : c.target}
            </button>
          ))}
        </div>
      </div>
      <AttackCardView card={selected} />
    </div>
  );
}
