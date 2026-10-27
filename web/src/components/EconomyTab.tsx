import { useMemo, useState } from "react";
import { Area, AreaChart, CartesianGrid, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { Analysis } from "../api";
import { clock, fmtNum, GLYPH, pct, SEV_COLOR, SEV_LABEL } from "../format";
import { MapStage, type CameraMode, type MapMarker, type MapPath } from "./MapStage";
import { frameAt, useDecodedMap } from "./useMap";

type Econ = NonNullable<Analysis["economy"]>;

const TYPE_GLYPH: Record<string, string> = {
  City: "C",
  Port: "P",
  Factory: "F",
  "Defense Post": "D",
  "SAM Launcher": "S",
  "Missile Silo": "M",
  Warship: "W",
};
/** Range rings, in game tiles: Defense Post protection, SAM cover (level 1), rail range. */
const RING: Record<string, number> = { "Defense Post": 30, "SAM Launcher": 70, Factory: 110 };
const SOURCE_COLORS = { base: "#4b6280", conquest: "#e8894a", trade: "#3fd0c9", trains: "#b48ae0" };

type Sel = { kind: "place"; id: number } | { kind: "ship"; id: number } | null;

export function EconomyTab({ analysis }: { analysis: Analysis }) {
  const econ = analysis.economy;
  if (!econ) {
    return (
      <div className="panel">
        <p className="muted">This analysis predates the economy review. Use Re-analyze on the left to add it.</p>
      </div>
    );
  }
  return <EconomyBody analysis={analysis} econ={econ} />;
}

function EconomyBody({ analysis, econ }: { analysis: Analysis; econ: Econ }) {
  const { map, err } = useDecodedMap(analysis.gameId);
  const [sel, setSel] = useState<Sel>(() => {
    const worst = econ.placements.find((p) => p.verdict === "mistake" || p.verdict === "blunder" || p.verdict === "inaccuracy") ?? econ.placements[0];
    return worst ? { kind: "place", id: worst.id } : null;
  });
  const [mode, setMode] = useState<CameraMode>("follow");
  const [idxOverride, setIdxOverride] = useState<number | null>(null);

  const place = sel?.kind === "place" ? econ.placements.find((p) => p.id === sel.id) ?? null : null;
  const ship = sel?.kind === "ship" ? econ.warships.reviews.find((w) => w.id === sel.id) ?? null : null;
  const selTick = place?.tick ?? ship?.tick ?? null;
  const idx = map ? idxOverride ?? (selTick !== null ? frameAt(map, selTick) : map.frames.length - 1) : 0;

  const scale = map?.frameScale ?? 1;
  const frameTick = map ? map.frameTicks[idx] ?? 0 : 0;
  const markers: MapMarker[] = useMemo(() => {
    // Buildings standing at the map's moment, plus the one you selected.
    const standing = econ.placements.filter((p) => p.id === place?.id || (p.tick <= frameTick && (p.endTick === null || p.endTick > frameTick)));
    const out: MapMarker[] = standing.map((p) => ({
      fx: p.x / scale,
      fy: p.y / scale,
      glyph: TYPE_GLYPH[p.type] ?? "?",
      color: p.fate === "kept" ? SEV_COLOR[p.verdict] : "#8fa3bb",
      label: `${p.type}, ${clock(p.tick)}`,
      selected: place?.id === p.id,
      ring: place?.id === p.id && RING[p.type] ? RING[p.type] / scale : undefined,
    }));
    if (place?.better) {
      out.push({ fx: place.better.x / scale, fy: place.better.y / scale, glyph: TYPE_GLYPH[place.type] ?? "?", color: "#3fd0c9", label: "Better spot", ghost: true });
    }
    return out;
  }, [econ.placements, place, scale, frameTick]);
  const paths: MapPath[] = useMemo(
    () => (ship ? [{ points: ship.path.map(([, x, y]) => [x / scale, y / scale] as [number, number]), color: "#e9e2cf" }] : []),
    [ship, scale],
  );
  const focusPoints = useMemo<[number, number][] | null>(() => {
    if (place) return [[place.x / scale, place.y / scale], ...(place.better ? [[place.better.x / scale, place.better.y / scale] as [number, number]] : [])];
    if (ship && ship.path.length) return ship.path.map(([, x, y]) => [x / scale, y / scale] as [number, number]);
    return null;
  }, [place, ship, scale]);

  const select = (s: Sel) => {
    setSel(s);
    setIdxOverride(null);
    setMode("follow");
  };

  return (
    <div className="econ">
      <IncomePanel econ={econ} />

      <div className="panel">
        <div className="chart-title">
          <h2 style={{ margin: 0 }}>Where you built</h2>
          <span className="legend">
            <span><i className="swatch" style={{ background: SEV_COLOR.good, height: 8 }} />Good spot</span>
            <span><i className="swatch" style={{ background: SEV_COLOR.inaccuracy, height: 8 }} />Could be better</span>
            <span><i className="swatch" style={{ background: SEV_COLOR.mistake, height: 8 }} />Poor spot</span>
            <span><i className="swatch" style={{ background: "#8fa3bb", height: 8 }} />Lost</span>
            <span><i className="swatch" style={{ background: "transparent", border: "1px dashed #3fd0c9", height: 8 }} />Better spot</span>
          </span>
        </div>
        <p className="muted small">C City, P Port, F Factory, D Defense Post, S SAM, M Missile Silo. Select a building to see the map when you placed it, its range, and a better spot when there was one.</p>
        {err && <p className="err">Map unavailable: {err}</p>}
        {map && (
          <>
            <MapStage map={map} frameIndex={idx} focus={place?.context?.frontEnemy ? [place.context.frontEnemy] : []} mode={mode} onModeChange={setMode} markers={markers} paths={paths} focusPoints={focusPoints} />
            <div className="scrub">
              <span className="small muted">Map at</span>
              <input type="range" min={0} max={map.frames.length - 1} value={idx} onChange={(e) => setIdxOverride(Number(e.target.value))} aria-label="Map time" />
              <span className="num" style={{ minWidth: 48, textAlign: "right" }}>{clock(map.frameTicks[idx] ?? 0)}</span>
            </div>
          </>
        )}
        <div className="place-list">
          {econ.placements.length === 0 && <p className="muted">You didn't place any buildings this game.</p>}
          {econ.placements.map((p) => (
            <button key={p.id} className={`place-row${place?.id === p.id ? " current" : ""}`} onClick={() => select({ kind: "place", id: p.id })}>
              <span className={`glyph sev-${p.verdict}`} title={SEV_LABEL[p.verdict]}>{GLYPH[p.verdict]}</span>
              <span className="num muted">{clock(p.tick)}</span>
              <span>
                <b>{p.type}</b>
                {p.level > 1 && <span className="muted small"> level {p.level}</span>}
                {p.fate !== "kept" && <span className="small c-mistake"> {p.fate}</span>}
                <span className="place-notes">{p.notes.join("; ")}.</span>
                {p.better && <span className="place-better">Better spot: {p.better.why}.</span>}
              </span>
            </button>
          ))}
        </div>
      </div>

      <div className="two-col">
        <BuildOrderPanel econ={econ} />
        <WarshipPanel econ={econ} selected={ship?.id ?? null} onSelect={(id) => select({ kind: "ship", id })} />
      </div>

      {econ.advice.length > 0 && (
        <div className="panel">
          <h2>How to build a stronger economy next game</h2>
          <ul className="advice">{econ.advice.map((a, i) => <li key={i}>{a}</li>)}</ul>
        </div>
      )}
    </div>
  );
}

function IncomePanel({ econ }: { econ: Econ }) {
  const data = econ.income.ticks.map((t, i) => ({ t, base: econ.income.base[i], conquest: econ.income.conquest[i], trade: econ.income.trade[i], trains: econ.income.trains[i] }));
  const t = econ.totals;
  const parts = [
    { k: "Base income", v: t.work, c: SOURCE_COLORS.base },
    { k: "Conquest", v: t.war, c: SOURCE_COLORS.conquest },
    { k: "Trade ships", v: t.trade, c: SOURCE_COLORS.trade },
    { k: "Trains", v: t.trains, c: SOURCE_COLORS.trains },
    { k: "Captured ships", v: t.piracy, c: "#e8c45a" },
    { k: "Donations", v: t.donations, c: "#7bc47f" },
  ].filter((x) => x.v > 0);
  return (
    <div className="panel">
      <div className="chart-title">
        <h2 style={{ margin: 0 }}>Where your gold came from</h2>
        <span className="legend">
          {Object.entries({ "Base income": SOURCE_COLORS.base, Conquest: SOURCE_COLORS.conquest, "Trade ships": SOURCE_COLORS.trade, Trains: SOURCE_COLORS.trains }).map(([k, c]) => (
            <span key={k}><i className="swatch" style={{ background: c, height: 8 }} />{k}</span>
          ))}
        </span>
      </div>
      <p className="muted small">Gold earned per minute, by source. Base income is a flat 60k a minute; everything above it you earned by conquering, trading or running trains.</p>
      <ResponsiveContainer width="100%" height={210}>
        <AreaChart data={data} margin={{ top: 8, right: 12, bottom: 0, left: 0 }}>
          <CartesianGrid stroke="#24405f" strokeDasharray="2 4" vertical={false} />
          <XAxis dataKey="t" type="number" domain={["dataMin", "dataMax"]} tickFormatter={clock} stroke="#4b6280" tick={{ fill: "#7f95ae", fontSize: 12 }} />
          <YAxis tickFormatter={fmtNum} stroke="#4b6280" tick={{ fill: "#7f95ae", fontSize: 12 }} width={46} />
          <Tooltip
            content={({ active, payload, label }) =>
              active && payload?.length ? (
                <div className="tt">
                  <div className="muted">{clock(Number(label))}</div>
                  {payload.map((p) => (
                    <div key={String(p.dataKey)} style={{ color: String(p.color) }}>{String(p.name)}: {fmtNum(Number(p.value))}/min</div>
                  ))}
                </div>
              ) : null
            }
          />
          <Area type="monotone" dataKey="base" name="Base" stackId="1" stroke={SOURCE_COLORS.base} fill={SOURCE_COLORS.base} fillOpacity={0.5} isAnimationActive={false} />
          <Area type="monotone" dataKey="conquest" name="Conquest" stackId="1" stroke={SOURCE_COLORS.conquest} fill={SOURCE_COLORS.conquest} fillOpacity={0.45} isAnimationActive={false} />
          <Area type="monotone" dataKey="trade" name="Trade" stackId="1" stroke={SOURCE_COLORS.trade} fill={SOURCE_COLORS.trade} fillOpacity={0.45} isAnimationActive={false} />
          <Area type="monotone" dataKey="trains" name="Trains" stackId="1" stroke={SOURCE_COLORS.trains} fill={SOURCE_COLORS.trains} fillOpacity={0.45} isAnimationActive={false} />
          {econ.buildOrder.filter((b) => b.unit === "Port" || b.unit === "Factory").map((b, i) => (
            <ReferenceLine key={i} x={b.tick} stroke={b.unit === "Port" ? SOURCE_COLORS.trade : SOURCE_COLORS.trains} strokeDasharray="3 3" strokeOpacity={0.7} />
          ))}
        </AreaChart>
      </ResponsiveContainer>
      <div className="two-col" style={{ marginTop: 12 }}>
        <table>
          <thead>
            <tr><th>Income per minute</th><th className="r">You</th><th className="r">Lobby median</th><th className="r">Best</th></tr>
          </thead>
          <tbody>
            {econ.incomeAt.map((x) => (
              <tr key={x.sec}>
                <td>{clock(x.sec * 10)} after spawn</td>
                <td className="r num">{x.you === null ? "—" : fmtNum(x.you)}</td>
                <td className="r muted">{x.median === null ? "—" : fmtNum(x.median)}</td>
                <td className="r muted">{x.best === null ? "—" : `${fmtNum(x.best)}${x.bestName ? ` (${x.bestName})` : ""}`}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div>
          <div className="small muted" style={{ marginBottom: 6 }}>Total earned: <b className="num">{fmtNum(t.total)}</b></div>
          <div className="source-bar">
            {parts.map((p) => (
              <div key={p.k} style={{ flex: p.v, background: p.c }} title={`${p.k}: ${fmtNum(p.v)}`} />
            ))}
          </div>
          <div className="legend" style={{ marginTop: 8 }}>
            {parts.map((p) => (
              <span key={p.k}><i className="swatch" style={{ background: p.c, height: 8 }} />{p.k} {pct(p.v / Math.max(1, t.total))}</span>
            ))}
          </div>
          <div className="small muted" style={{ marginTop: 10 }}>
            Spent: economy {fmtNum(econ.spending.economy)}, defense {fmtNum(econ.spending.defense)}, warships {fmtNum(econ.spending.military)}, nukes {fmtNum(econ.spending.nukes)}.
          </div>
        </div>
      </div>
    </div>
  );
}

function BuildOrderPanel({ econ }: { econ: Econ }) {
  const b = econ.benchmark;
  const y = econ.you;
  const types = ["City", "Port", "Factory", "Defense Post", "SAM Launcher", "Missile Silo", "Warship"];
  const t = (v: number | null) => (v === null ? "never" : clock(v * 10));
  return (
    <div className="panel">
      <h2>Build order</h2>
      {b && (
        <table style={{ marginBottom: 14 }}>
          <thead>
            <tr><th></th><th className="r">You</th><th className="r">{b.name}</th></tr>
          </thead>
          <tbody>
            <tr><td>First City</td><td className="r num">{t(y.firstCity)}</td><td className="r">{t(b.firstCity)}</td></tr>
            <tr><td>First Port</td><td className="r num">{t(y.firstPort)}</td><td className="r">{t(b.firstPort)}</td></tr>
            <tr><td>First Factory</td><td className="r num">{t(y.firstFactory)}</td><td className="r">{t(b.firstFactory)}</td></tr>
            <tr>
              <td>Buildings at 10:00</td>
              <td className="r small">{types.filter((k) => y.counts10[k]).map((k) => `${y.counts10[k]} ${TYPE_GLYPH[k]}`).join(" ") || "none"}</td>
              <td className="r small">{types.filter((k) => b.counts10[k]).map((k) => `${b.counts10[k]} ${TYPE_GLYPH[k]}`).join(" ") || "none"}</td>
            </tr>
            <tr><td>Gold from trade and trains</td><td className="r num">{pct(y.tradeShare)}</td><td className="r">{pct(b.tradeShare)}</td></tr>
          </tbody>
        </table>
      )}
      {b && <p className="small muted">{b.name} was the strongest other human in this lobby ({b.result}). Times are after the spawn phase.</p>}
      <table>
        <thead>
          <tr><th></th><th>Time</th><th>Bought</th><th className="r">Cost</th><th className="r">Gold waited</th><th className="r">Army</th></tr>
        </thead>
        <tbody>
          {econ.buildOrder.map((r, i) => (
            <tr key={i} title={r.note}>
              <td>{r.verdict !== "info" && <span className={`glyph sev-${r.verdict}`} style={{ minWidth: 24, height: 18, fontSize: "0.75rem" }}>{GLYPH[r.verdict]}</span>}</td>
              <td className="num">{clock(r.tick)}</td>
              <td>{r.upgrade ? "Upgrade " : ""}{r.unit}{r.note && r.note !== "warship" && <div className="small muted">{r.note}</div>}</td>
              <td className="r">{fmtNum(r.cost)}</td>
              <td className="r">{r.waitedSec === null ? "—" : `${r.waitedSec}s`}</td>
              <td className="r muted">{pct(r.troopRatio)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {!econ.buildOrder.length && <p className="muted">You didn't buy anything this game.</p>}
      <p className="small muted" style={{ marginTop: 8 }}>"Gold waited" is how long the price was already in your bank before you bought it. "Army" is your troops as a share of your cap at the time: a City pays off fastest when that is high.</p>
    </div>
  );
}

function WarshipPanel({ econ, selected, onSelect }: { econ: Econ; selected: number | null; onSelect: (id: number) => void }) {
  const w = econ.warships;
  return (
    <div className="panel">
      <h2>Warships and trade protection</h2>
      <div className="stat-row">
        <div><b className="num">{w.reviews.length}</b><span className="small muted">warships built</span></div>
        <div><b className="num">{w.reviews.filter((r) => r.fate !== "kept").length}</b><span className="small muted">lost</span></div>
        <div><b className="num">{w.tradeShipsLost}</b><span className="small muted">of your trade ships captured</span></div>
        <div><b className="num">{w.enemyTradeCaptured}</b><span className="small muted">enemy trade ships you took</span></div>
      </div>
      {w.tradeLostTo.length > 0 && <p className="small">Your trade ships were taken by {w.tradeLostTo.map((t) => `${t.name} (${t.count})`).join(", ")}.</p>}
      {w.reviews.map((r) => (
        <button key={r.id} className={`place-row${selected === r.id ? " current" : ""}`} onClick={() => onSelect(r.id)}>
          <span className={`glyph sev-${r.verdict}`}>{GLYPH[r.verdict]}</span>
          <span className="num muted">{clock(r.tick)}</span>
          <span>
            <b>Warship</b>
            {r.fate !== "kept" && <span className="small c-mistake"> {r.fate}{r.lostTo ? ` by ${r.lostTo}` : ""}</span>}
            <span className="place-notes">{r.note || "no patrol data"}. Select to see its route on the map above.</span>
          </span>
        </button>
      ))}
      {w.advice.length > 0 && <ul className="advice">{w.advice.map((a, i) => <li key={i}>{a}</li>)}</ul>}
      {!w.reviews.length && !w.advice.length && <p className="muted small">No warships, and no trade ships lost: nothing to coach here this game.</p>}
    </div>
  );
}
