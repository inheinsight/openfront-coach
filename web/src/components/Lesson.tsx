import { useEffect, useMemo, useState } from "react";
import { Bar, BarChart, CartesianGrid, Cell, ReferenceArea, ReferenceLine, ResponsiveContainer, Scatter, ScatterChart, Tooltip, XAxis, YAxis } from "recharts";
import { api, type Analysis, type AttackCard, type TrendRow, type TroopLesson, type TroopRule } from "../api";
import { clock, fmtNum, pct, SEV_COLOR } from "../format";
import { Link } from "../router";
import { TroopChart } from "./Timeline";

export const xs = (v: number) => `${v < 10 ? v.toFixed(2) : v.toFixed(0)}×`;

const STATUS: Record<TroopRule["status"], { label: string; color: string }> = {
  met: { label: "Met this game", color: "var(--good)" },
  close: { label: "Close", color: "var(--inaccuracy)" },
  missed: { label: "Missed", color: "var(--mistake)" },
  unscored: { label: "Not scored", color: "var(--contour)" },
};
const RULE_ORDER: TroopRule["key"][] = ["clicks", "stack", "floor", "feed"];

/** Stack ÷ their home army bands, matching the engine's loss clamp (0.6–2). */
export function stackColor(stack: number): string {
  if (stack >= 1.67) return SEV_COLOR.brilliant;
  if (stack >= 1) return SEV_COLOR.good;
  if (stack > 0.5) return SEV_COLOR.mistake;
  return SEV_COLOR.blunder;
}

function fmtTrend(format: TroopLesson["trend"]["format"], v: number) {
  return format === "x" ? xs(v) : format === "pct" ? pct(v) : String(Math.round(v));
}

/**
 * The troop curriculum for one game: four habits, the one to work on next,
 * this game's evidence for it, and how it has gone across recent games.
 */
export function LessonPanel({ analysis, onOpenCard, onOpenTroops }: { analysis: Analysis; onOpenCard: (id: string) => void; onOpenTroops: () => void }) {
  const t = analysis.troops;
  if (!t) return null;
  const lesson = t.lesson;
  const rules = RULE_ORDER.map((k) => t.rules.find((r) => r.key === k)).filter((r): r is TroopRule => !!r);
  const example = lesson?.exampleCardId ? t.cards.find((c) => c.id === lesson.exampleCardId) : undefined;
  const openRule = (r: TroopRule) => {
    if (r.key === "floor") onOpenTroops();
    else if (r.key === "stack" || r.key === "clicks") {
      const pick = r.key === "clicks" ? t.cards.filter((c) => c.clicks >= 3).sort((a, b) => b.share - a.share)[0] : t.cards.find((c) => c.featured);
      if (pick) onOpenCard(pick.id);
    }
  };

  return (
    <section className="lesson">
      <div className="rule-strip">
        {rules.map((r) => {
          const focus = lesson?.rule === r.key;
          const clickable = r.key !== "feed";
          return (
            <button key={r.key} className={`rule-card${focus ? " focus" : ""}`} onClick={() => clickable && openRule(r)} disabled={!clickable}>
              <span className="rule-head">
                <span>{r.key === "feed" ? "Team games" : "Troop habit"}</span>
                <span style={{ color: focus ? "var(--you)" : STATUS[r.status].color }}>{focus ? "This game's focus" : STATUS[r.status].label}</span>
              </span>
              <span className="rule-label">{r.label}</span>
              <span className="small rule-sum">{r.summary}</span>
            </button>
          );
        })}
      </div>

      {lesson ? (
        <div className="panel lesson-focus">
          <div className="lesson-top">
            <div>
              <span className="eyebrow" style={{ color: "var(--you)" }}>This game's lesson</span>
              <h2 className="lesson-title">{lesson.title}</h2>
              <p className="muted" style={{ marginBottom: 0 }}>{lesson.why}</p>
            </div>
            <div className="lesson-stat">
              <span className="num">{lesson.stat}</span>
              <span className="small muted">{lesson.statLabel}</span>
            </div>
          </div>
          <div className="stat-row">
            {lesson.benchmarks.map((b) => (
              <div key={b.label}>
                <span className="small muted">{b.label}</span>
                <b className="num" style={{ color: b.you ? "var(--you)" : undefined }}>{b.display}</b>
              </div>
            ))}
          </div>
          {lesson.rule === "stack" && <StackScatter cards={t.cards} onOpen={onOpenCard} />}
          {lesson.rule === "clicks" && <BurstList cards={t.cards} onOpen={onOpenCard} />}
          {lesson.rule === "floor" && <TroopChart analysis={analysis} selectedTick={null} floorUntil={analysis.phases.find((p) => p.name === "Opening")?.endTick ?? null} />}
          {example && (
            <button className="lesson-example" onClick={() => onOpenCard(example.id)}>
              <b style={{ color: "var(--you)" }}>
                {clock(example.tick)} · {xs(example.stack)} into {example.target}.
              </b>
              <span>
                {example.troopsUsed > 0 ? ` Lost ${fmtNum(example.troopsUsed)} troops for ${fmtNum(example.tilesGained)} tiles.` : ""}
                {example.window ? ` At ${clock(example.window.tick)} their home army fell to ${fmtNum(example.window.theirHome)}.` : ""} Open the decision card.
              </span>
            </button>
          )}
        </div>
      ) : (
        <div className="panel">
          <p style={{ margin: 0 }}>
            {rules.some((r) => r.status === "unscored" && r.key !== "feed")
              ? "Not enough attacks on players this game to pick a troop lesson."
              : "You met every troop habit this game. Keep doing it."}
          </p>
        </div>
      )}

      {lesson && (
        <div className="two-col lesson-next">
          <div className="panel">
            <span className="eyebrow">Next game</span>
            <h3 style={{ margin: "4px 0 6px" }}>{lesson.nextGoal}</h3>
            <p className="small" style={{ color: "var(--paper-dim)" }}>{lesson.how}</p>
            {t.drills.length > 0 && (
              <Link to={`/practice?game=${analysis.gameId}`} className="btn primary" style={{ textDecoration: "none", display: "inline-block" }}>
                Practise {t.drills.length} call{t.drills.length === 1 ? "" : "s"} from this game
              </Link>
            )}
          </div>
          <div className="panel">
            <TrendBars analysis={analysis} trend={lesson.trend} />
          </div>
        </div>
      )}
    </section>
  );
}

/** Every attack you started on a player: time against stack ÷ their home army. */
function StackScatter({ cards, onOpen }: { cards: AttackCard[]; onOpen: (id: string) => void }) {
  const data = cards.map((c) => ({ t: c.tick, s: Math.min(5, Math.max(0.05, c.stack)), card: c }));
  if (!data.length) return null;
  return (
    <div>
      <ResponsiveContainer width="100%" height={220}>
        <ScatterChart margin={{ top: 10, right: 54, bottom: 0, left: 0 }}>
          <CartesianGrid stroke="#24405f" strokeDasharray="2 4" vertical={false} />
          <XAxis dataKey="t" type="number" domain={["dataMin - 300", "dataMax + 300"]} tickFormatter={clock} stroke="#4b6280" tick={{ fill: "#7f95ae", fontSize: 12 }} />
          <YAxis dataKey="s" type="number" scale="log" domain={[0.05, 5]} ticks={[0.1, 0.25, 0.5, 1, 1.67, 4]} allowDataOverflow tickFormatter={(v) => xs(v)} stroke="#4b6280" tick={{ fill: "#7f95ae", fontSize: 12 }} width={50} />
          <ReferenceArea y1={1.67} y2={5} fill="#3fd0c9" fillOpacity={0.07} />
          <ReferenceArea y1={0.05} y2={0.5} fill="#e5534b" fillOpacity={0.07} />
          <ReferenceLine y={1} stroke="#7bc47f" strokeDasharray="4 4" label={{ value: "1×", position: "right", fill: "#7bc47f", fontSize: 12 }} />
          <ReferenceLine y={1.67} stroke="#3fd0c9" strokeOpacity={0.6} strokeDasharray="2 4" label={{ value: "cheapest", position: "right", fill: "#3fd0c9", fontSize: 12 }} />
          <ReferenceLine y={0.5} stroke="#e5534b" strokeOpacity={0.5} strokeDasharray="2 4" label={{ value: "2× losses", position: "right", fill: "#f27d75", fontSize: 12 }} />
          <Tooltip
            cursor={false}
            content={({ active, payload }) => {
              const c = active && payload?.[0] ? (payload[0].payload as { card: AttackCard }).card : null;
              return c ? (
                <div className="tt">
                  <div className="muted">{clock(c.tick)} · {c.target}</div>
                  <div>
                    {fmtNum(c.sent)} into {fmtNum(c.targetHome)} at home: <b>{xs(c.stack)}</b>
                  </div>
                  {c.clicks > 1 && <div className="muted">{c.clicks} clicks, {pct(c.share)} of your army</div>}
                </div>
              ) : null;
            }}
          />
          <Scatter data={data} isAnimationActive={false} onClick={(p) => onOpen((p as unknown as { card: AttackCard }).card.id)} style={{ cursor: "pointer" }}>
            {data.map((d) => (
              <Cell key={d.card.id} fill={stackColor(d.card.stack)} stroke="#0e1b2c" strokeWidth={1.5} />
            ))}
          </Scatter>
        </ScatterChart>
      </ResponsiveContainer>
      <p className="small muted" style={{ margin: "4px 0 0" }}>
        Each dot is an attack you started on a player; quick follow-up clicks count as part of it. Height is your stack divided by the troops they held at home. Select a dot to open its decision card.
      </p>
    </div>
  );
}

/** Bursts of quick clicks, each drawn as the share of your army it added up to. */
function BurstList({ cards, onOpen }: { cards: AttackCard[]; onOpen: (id: string) => void }) {
  const bursts = cards.filter((c) => c.clicks >= 3).sort((a, b) => b.share - a.share).slice(0, 6);
  if (!bursts.length) return null;
  return (
    <div className="burst-list">
      {bursts.map((c) => (
        <button key={c.id} className="burst-row" onClick={() => onOpen(c.id)}>
          <span>
            <b>{clock(c.tick)} → {c.target}</b>
            <span className="small muted"> {c.clicks} clicks in {((c.lastTick - c.tick) / 10).toFixed(1)} s</span>
          </span>
          <ClickBar shares={c.clickShares} />
          <span className="num" style={{ color: c.share > 0.5 ? "var(--blunder)" : undefined }}>{pct(c.share)}</span>
        </button>
      ))}
    </div>
  );
}

/** A burst's clicks as one bar: each tick is where a click took your total. */
export function ClickBar({ shares }: { shares: number[] }) {
  const end = shares[shares.length - 1] ?? 0;
  return (
    <span className="click-bar" role="img" aria-label={`${shares.length} clicks reaching ${pct(end)} of your army`}>
      <span className="click-fill" style={{ width: `${end * 100}%` }} />
      {shares.slice(0, -1).map((s, i) => (
        <span key={i} className="click-tick" style={{ left: `${s * 100}%` }} />
      ))}
    </span>
  );
}

/** The lesson's measure across your recent games of the same mode. */
function TrendBars({ analysis, trend }: { analysis: Analysis; trend: TroopLesson["trend"] }) {
  const [rows, setRows] = useState<TrendRow[] | null>(null);
  useEffect(() => {
    api.trends().then(setRows).catch(() => setRows([]));
  }, []);
  const data = useMemo(
    () =>
      (rows ?? [])
        .filter((r) => r.mode === analysis.game.mode && r.started_at <= analysis.game.startedAt && typeof r.metrics[trend.key] === "number")
        .slice(-9)
        .map((r) => ({ id: r.game_id, map: r.map, v: r.metrics[trend.key] as number })),
    [rows, analysis, trend.key],
  );
  return (
    <div>
      <span className="eyebrow">{trend.label}{data.length >= 2 ? `, your last ${data.length} ${analysis.game.mode} games` : ", across games"}</span>
      {rows && data.length < 2 ? (
        <p className="small muted" style={{ marginTop: 8 }}>This builds up as more games are analyzed. Older games need a re-analysis to count.</p>
      ) : (
        <ResponsiveContainer width="100%" height={150}>
          <BarChart data={data} margin={{ top: 16, right: 8, bottom: 0, left: 0 }}>
            <XAxis dataKey="map" stroke="#4b6280" tick={{ fill: "#7f95ae", fontSize: 11 }} interval={0} tickFormatter={(m: string) => (m.length > 9 ? `${m.slice(0, 8)}…` : m)} />
            <YAxis hide domain={[0, (max: number) => Math.max(max, trend.target ?? 0) * 1.15]} />
            {trend.target !== null && <ReferenceLine y={trend.target} stroke="#7bc47f" strokeDasharray="4 4" label={{ value: "goal", position: "insideTopRight", fill: "#7bc47f", fontSize: 11 }} />}
            <Tooltip cursor={{ fill: "rgba(27,52,82,0.5)" }} content={({ active, payload }) => (active && payload?.[0] ? <div className="tt">{(payload[0].payload as { map: string }).map}: {fmtTrend(trend.format, Number(payload[0].value))}</div> : null)} />
            <Bar dataKey="v" isAnimationActive={false} label={{ position: "top", fill: "#c9c2b0", fontSize: 11, formatter: (v: unknown) => fmtTrend(trend.format, Number(v)) }}>
              {data.map((d) => (
                <Cell key={d.id} fill={d.id === analysis.gameId ? "#f5b83d" : "#4b6280"} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
