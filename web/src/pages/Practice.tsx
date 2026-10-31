import { useEffect, useMemo, useState } from "react";
import { api, type DrillVerdict, type PracticeItem } from "../api";
import { MapStage, type CameraMode } from "../components/MapStage";
import { frameAt, useDecodedMap } from "../components/useMap";
import { clock, fmtNum, GLYPH, pct } from "../format";
import { Link } from "../router";

/** A drill is learned once it has been answered right this many times. */
const LEARNED = 2;
const keyOf = (i: PracticeItem) => `${i.gameId}/${i.drill.id}`;

/**
 * Your call: decisions from your own games, asked before you see what you
 * did. Missed drills stay in the queue until you get them right twice.
 */
export function Practice() {
  const [items, setItems] = useState<PracticeItem[] | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [current, setCurrent] = useState<string | null>(null);
  const [showLearned, setShowLearned] = useState(false);
  const firstGame = new URLSearchParams(window.location.search).get("game");

  useEffect(() => {
    api
      .practice()
      .then((list) => {
        // This game's drills first when you came from its debrief, then newest games first.
        const sorted = [...list].sort((a, b) => Number(b.gameId === firstGame) - Number(a.gameId === firstGame) || b.startedAt - a.startedAt || a.drill.tick - b.drill.tick);
        setItems(sorted);
        const first = sorted.find((i) => i.correct < LEARNED) ?? sorted[0];
        setCurrent(first ? keyOf(first) : null);
      })
      .catch((e) => setErr(e.message));
  }, [firstGame]);

  const queue = useMemo(() => (items ?? []).filter((i) => showLearned || i.correct < LEARNED || keyOf(i) === current), [items, showLearned, current]);
  const item = items?.find((i) => keyOf(i) === current) ?? null;
  const learned = (items ?? []).filter((i) => i.correct >= LEARNED).length;

  if (err) return <p className="err">{err}</p>;
  if (!items) return <p className="muted">Loading…</p>;
  if (!items.length)
    return (
      <div className="panel" style={{ maxWidth: 680 }}>
        <h2>No drills yet</h2>
        <p>Drills come from attacks and defences in your analyzed games. Analyze a game where you fought another player, or re-analyze older games, and they show up here.</p>
        <Link to="/">Back to your games</Link>
      </div>
    );

  const next = () => {
    const i = queue.findIndex((q) => keyOf(q) === current);
    const after = [...queue.slice(i + 1), ...queue.slice(0, i)].find((q) => q.correct < LEARNED);
    if (after) setCurrent(keyOf(after));
  };

  return (
    <div className="practice">
      <div className="row" style={{ justifyContent: "space-between", alignItems: "flex-end", marginBottom: 16 }}>
        <div>
          <h1 style={{ marginBottom: 4 }}>Your call</h1>
          <p className="muted" style={{ margin: 0 }}>Decisions from your own games. Answer before you see what you did. A drill comes back until you get it right {LEARNED} times.</p>
        </div>
        <span className="small muted">
          {learned} of {items.length} learned
        </span>
      </div>

      {item && <Drill key={keyOf(item)} item={item} onAnswered={(a) => setItems((prev) => prev!.map((p) => (keyOf(p) === keyOf(item) ? { ...p, ...a } : p)))} onNext={next} />}

      <div className="drill-queue">
        <span className="eyebrow">Queue</span>
        {queue.map((q) => (
          <button key={keyOf(q)} className={`chip${keyOf(q) === current ? " you" : ""}`} onClick={() => setCurrent(keyOf(q))}>
            {q.correct >= LEARNED ? "✓ " : ""}
            {q.map} {clock(q.drill.tick)} · {q.drill.kind === "attack" ? "attack" : "under attack"}
          </button>
        ))}
        {learned > 0 && (
          <button className="btn" onClick={() => setShowLearned(!showLearned)}>
            {showLearned ? "Hide learned" : `Show ${learned} learned`}
          </button>
        )}
      </div>
    </div>
  );
}

function Drill({ item, onAnswered, onNext }: { item: PracticeItem; onAnswered: (p: { attempts: number; correct: number }) => void; onNext: () => void }) {
  const d = item.drill;
  const f = d.facts;
  const [pctSent, setPctSent] = useState(20);
  const [result, setResult] = useState<DrillVerdict | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const sent = Math.round((f.yourHome * pctSent) / 100);
  const left = f.yourHome - sent;

  const lockIn = async () => {
    setBusy(true);
    setErr(null);
    try {
      const r = await api.answerDrill(item.gameId, d.id, pctSent);
      setResult(r.verdict);
      onAnswered({ attempts: r.attempts, correct: r.correct });
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  // Attack drills measure what you send against their home army; defence drills what you keep.
  const scale = Math.max(f.yourHome, d.kind === "attack" ? f.theirHome : Math.max(f.incoming ?? 0, d.floor ?? 0)) * 1.1;
  const at = (v: number) => `${Math.min(100, (v / scale) * 100)}%`;

  return (
    <div className="drill-grid">
      <section className="panel drill-ask">
        <span className="eyebrow" style={{ color: "var(--you)" }}>
          {item.map} · {item.mode} · {clock(d.tick)}
        </span>
        <h2 style={{ margin: "4px 0 12px" }}>{d.question}</h2>
        <DrillMap gameId={item.gameId} tick={d.tick} focus={d.targetId} />
        <div className="stat-row" style={{ marginTop: 12 }}>
          <div>
            <span className="small muted">Your home army</span>
            <b className="num" style={{ color: "var(--you)" }}>{fmtNum(f.yourHome)}</b>
            <span className="small muted">{pct(f.yourHome / Math.max(1, f.cap))} of your cap</span>
          </div>
          {f.incoming !== null && (
            <div>
              <span className="small muted">Attacking you</span>
              <b className="num c-blunder">{fmtNum(f.incoming)}</b>
            </div>
          )}
          <div>
            <span className="small muted">{d.target} at home</span>
            <b className="num">{fmtNum(f.theirHome)}</b>
          </div>
          <div>
            <span className="small muted">Land</span>
            <b className="num">{fmtNum(f.yourTiles)}</b>
            <span className="small muted">vs their {fmtNum(f.theirTiles)}</span>
          </div>
        </div>
        <label className="drill-slider">
          <span className="row" style={{ justifyContent: "space-between" }}>
            <span>Send at {d.target}</span>
            <b className="num" style={{ fontSize: "1.3rem" }}>
              {pctSent}% · {fmtNum(sent)}
            </b>
          </span>
          <input type="range" min={0} max={100} step={5} value={pctSent} disabled={!!result} onChange={(e) => setPctSent(Number(e.target.value))} aria-label="Share of your home army to send" />
        </label>
        <div className="drill-bar" aria-hidden="true">
          <span className="drill-fill" style={{ width: at(d.kind === "attack" ? sent : left) }} />
          {d.kind === "attack" ? (
            <span className="drill-line" style={{ left: at(f.theirHome), background: "var(--good)" }} />
          ) : (
            <>
              {d.floor !== null && <span className="drill-line" style={{ left: at(d.floor), background: "var(--blunder)" }} />}
              {f.incoming !== null && <span className="drill-line" style={{ left: at(f.incoming), background: "var(--paper-dim)" }} />}
            </>
          )}
        </div>
        <div className="row small muted" style={{ justifyContent: "space-between" }}>
          {d.kind === "attack" ? (
            <>
              <span>Sending: <b style={{ color: "var(--paper)" }}>{fmtNum(sent)}</b> · left at home {fmtNum(left)}</span>
              <span style={{ color: "var(--good)" }}>| their home army ({fmtNum(f.theirHome)})</span>
            </>
          ) : (
            <>
              <span>Left at home: <b style={{ color: "var(--paper)" }}>{fmtNum(left)}</b></span>
              <span>
                {f.incoming !== null && <span>| {fmtNum(f.incoming)} attacking</span>}
                {d.floor !== null && <span style={{ color: "var(--blunder)" }}> · | floor {fmtNum(d.floor)}</span>}
              </span>
            </>
          )}
        </div>
        {!result ? (
          <button className="btn primary drill-lock" onClick={lockIn} disabled={busy}>
            {busy ? "Checking…" : `Lock in ${pctSent}%`}
          </button>
        ) : (
          <button className="btn drill-lock" onClick={() => setResult(null)}>
            Try another amount
          </button>
        )}
        {err && <p className="err small">{err}</p>}
      </section>

      <section className="panel drill-answer">
        {!result ? (
          <>
            <span className="eyebrow">The coach's call</span>
            <p style={{ color: "var(--paper-dim)" }}>Set how much you would send, then lock it in. You'll see the coach's call, the rule behind it, and what you actually did.</p>
            <p className="small muted">Sending 0% is an answer too.</p>
          </>
        ) : (
          <>
            <div className="row">
              <span className={`glyph sev-${result.severity}`}>{GLYPH[result.severity]}</span>
              <h2 style={{ margin: 0 }}>{result.title}</h2>
            </div>
            <p style={{ marginTop: 10 }}>{result.body}</p>
            <div className="drill-box call">
              <span className="eyebrow" style={{ color: "var(--brilliant)" }}>The coach's call</span>
              <p style={{ margin: "4px 0 0" }}>{d.call}</p>
            </div>
            <div className="drill-box">
              <span className="eyebrow" style={{ color: "var(--blunder)" }}>What you did</span>
              <p style={{ margin: "4px 0 0" }}>{d.youDid.text}</p>
            </div>
            <div className="row">
              <button className="btn primary" onClick={onNext}>Next drill</button>
              <Link to={`/game/${item.gameId}`} className="small">Open the debrief</Link>
              <span className="small muted">
                Right {item.correct} of {item.attempts} time{item.attempts === 1 ? "" : "s"}
              </span>
            </div>
          </>
        )}
      </section>
    </div>
  );
}

/** The map at the moment of the drill, with the other player outlined. */
function DrillMap({ gameId, tick, focus }: { gameId: string; tick: number; focus: number }) {
  const { map, err } = useDecodedMap(gameId);
  const [mode, setMode] = useState<CameraMode>("follow");
  if (err) return <p className="small muted">Map unavailable: {err}</p>;
  if (!map) return <div className="drill-map-wait muted small">Loading the map…</div>;
  return <MapStage map={map} frameIndex={frameAt(map, tick)} focus={[focus]} mode={mode} onModeChange={setMode} />;
}
