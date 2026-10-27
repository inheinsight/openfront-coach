import { useEffect, useState } from "react";
import { api, type Analysis, type GameSummary } from "../api";
import { Markdown } from "../components/Markdown";
import { MapMoments } from "../components/MapMoments";
import { SeverityCounts } from "../components/Moments";
import { Scorecard } from "../components/Scorecard";
import { FrontLine, GoldChart, TroopChart } from "../components/Timeline";
import { clock, fmtNum, gradeColor, GLYPH, pct, RESULT_LABEL, scoreColor, STATUS_LABEL } from "../format";
import { Link, navigate } from "../router";

type Tab = "debrief" | "moments" | "scorecard" | "attacks" | "economy" | "ask";
const TABS: { key: Tab; label: string }[] = [
  { key: "debrief", label: "Debrief" },
  { key: "moments", label: "Map & key moments" },
  { key: "scorecard", label: "Scorecard" },
  { key: "attacks", label: "Attack ledger" },
  { key: "economy", label: "Troops & economy" },
  { key: "ask", label: "Ask the coach" },
];

export function Game({ id, live }: { id: string; live: GameSummary | undefined }) {
  const [data, setData] = useState<{ summary: GameSummary; analysis: Analysis | null } | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>("debrief");
  const [selected, setSelected] = useState<{ id: string | null; tick: number | null }>({ id: null, tick: null });

  useEffect(() => {
    api.game(id).then(setData).catch((e) => setErr(e.message));
  }, [id, live?.status]);

  if (err) return <p className="err">{err}</p>;
  if (!data) return <p className="muted">Loading…</p>;
  const summary = live ?? data.summary;
  const a = data.analysis;

  if (!a || summary.status !== "done") {
    return (
      <div className="panel" style={{ maxWidth: 680 }}>
        <h2>{summary.status === "error" ? "This game couldn't be analyzed" : STATUS_LABEL[summary.status]}</h2>
        {summary.status === "error" ? (
          <>
            <p className="err">{summary.error}</p>
            <div className="row">
              <button className="btn primary" onClick={() => api.reanalyze(id).then(() => window.location.reload())}>Try again</button>
              <Link to="/settings">Check your usernames in Settings</Link>
            </div>
          </>
        ) : (
          <>
            <p>{summary.stage ?? "Queued."}</p>
            {summary.status === "waiting_archive" && (
              <p className="muted">OpenFront publishes a game to its archive only after it ends. The coach checks every minute and starts the moment it's there.</p>
            )}
            <div className="progress"><div style={{ width: `${summary.progress ?? 0}%` }} /></div>
          </>
        )}
        <p className="small muted" style={{ marginTop: 16 }}>Game {id}</p>
      </div>
    );
  }

  const select = (mid: string, tick: number) => {
    setSelected({ id: mid, tick });
    if (tab !== "moments") setTab("moments");
  };
  const durationMin = Math.round(a.game.durationTicks / 600);

  return (
    <div className="debrief">
      <aside className="dossier">
        <div className="panel">
          <div className="grade-block">
            <span className="grade-letter" style={{ color: gradeColor(a.overall.grade) }}>{a.overall.grade}</span>
            <span className="grade-score">{a.overall.score}/100</span>
          </div>
          <div className={`num result-${a.me.result}`} style={{ fontSize: "1.4rem", marginTop: 6 }}>
            {RESULT_LABEL[a.me.result]}
            {a.me.placement ? <span className="muted"> #{a.me.placement} of {a.me.placementOf}{a.me.placementUnit === "teams" ? " teams" : ""}</span> : null}
          </div>
          <dl style={{ marginTop: 14 }}>
            <dt>Player</dt><dd className="c-you" style={{ color: "var(--you)" }}>{a.me.name}</dd>
            <dt>Map</dt><dd>{a.game.map}</dd>
            <dt>Mode</dt><dd>{a.game.mode}, {a.game.type.toLowerCase()}</dd>
            <dt>Length</dt><dd>{durationMin} min</dd>
            <dt>Players</dt><dd>{a.game.humans} human{a.game.humans === 1 ? "" : "s"}, {a.game.nations} nations, {a.game.bots} bots</dd>
            <dt>Peak</dt><dd>{pct(a.me.peakLandShare, 1)} of the map</dd>
            {a.game.winner && <><dt>Winner</dt><dd>{a.game.winner}</dd></>}
          </dl>
          <p className="small muted" style={{ marginTop: 12, marginBottom: 0 }}>
            {a.depth === "replay" ? (a.replayNote ? a.replayNote : "Replayed tick by tick on this game's own engine build, every checkpoint matched.") : `Stats-only analysis. ${a.replayNote ?? ""}`}
          </p>
        </div>

        {a.phases.length > 0 && (
          <div className="panel">
            <h3 style={{ marginBottom: 10 }}>Phases</h3>
            <div className="phase-strip">
              {a.phases.map((p) => (
                <div key={p.name} className="phase">
                  <span className="muted">{p.name}</span>
                  <b style={{ color: gradeColor(p.grade) }}>{p.grade}</b>
                  <span className="small">{p.note}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="panel">
          <h3 style={{ marginBottom: 10 }}>Skills</h3>
          <div className="cat-list">
            {a.categories.map((c) => (
              <div key={c.key} className="cat">
                <div>
                  {c.label}
                  <div className="bar"><div style={{ width: `${c.score}%`, background: scoreColor(c.score) }} /></div>
                </div>
                <b className="num" style={{ color: gradeColor(c.grade), textAlign: "right" }}>{c.grade}</b>
              </div>
            ))}
          </div>
        </div>

        <div className="row small">
          <a href={`https://openfront.io/#replay-viewer=${a.gameId}`} target="_blank" rel="noreferrer">Watch the replay on OpenFront</a>
          <button className="btn" onClick={() => api.reanalyze(a.gameId).then(() => navigate(`/game/${a.gameId}`))}>Re-analyze</button>
          <button
            className="btn"
            onClick={() => {
              if (window.confirm("Remove this game from your history?")) api.remove(a.gameId).then(() => navigate("/"));
            }}
          >
            Remove
          </button>
        </div>
      </aside>

      <main>
        <div className="headline">{a.headline}</div>
        {a.timeline && (
          <div className="panel">
            <FrontLine analysis={a} selectedTick={selected.tick} onSelectMoment={select} />
            <SeverityCounts analysis={a} />
          </div>
        )}

        <div className="tabs" role="tablist">
          {TABS.filter((t) => a.timeline || (t.key !== "economy" && t.key !== "attacks")).map((t) => (
            <button key={t.key} role="tab" aria-selected={tab === t.key} className={tab === t.key ? "active" : ""} onClick={() => setTab(t.key)}>
              {t.label}
            </button>
          ))}
        </div>

        {tab === "debrief" && <DebriefTab a={a} onSelect={select} />}
        {tab === "moments" &&
          (a.timeline ? (
            <MapMoments analysis={a} selectedId={selected.id} onSelect={(mid, tick) => setSelected({ id: mid, tick })} />
          ) : (
            <div className="panel">
              <p className="muted">This game has no replay, so there's no map. Its key moments are listed in the debrief.</p>
            </div>
          ))}
        {tab === "scorecard" && <div className="panel"><Scorecard analysis={a} /></div>}
        {tab === "attacks" && <AttackTab a={a} />}
        {tab === "economy" && (
          <div className="panel">
            <TroopChart analysis={a} selectedTick={selected.tick} />
            <div style={{ height: 18 }} />
            <GoldChart analysis={a} selectedTick={selected.tick} />
            <h3 style={{ margin: "22px 0 8px" }}>Build order</h3>
            <BuildTable a={a} />
          </div>
        )}
        {tab === "ask" && <AskTab a={a} />}
      </main>
    </div>
  );
}

function DebriefTab({ a, onSelect }: { a: Analysis; onSelect: (id: string, tick: number) => void }) {
  const worst = a.moments.filter((m) => m.severity === "blunder" || m.severity === "mistake").slice(0, 3);
  return (
    <div className="two-col" style={{ gridTemplateColumns: "minmax(0, 1.4fr) minmax(0, 1fr)" }}>
      <div className="panel">
        {a.narrative ? (
          <>
            <Markdown text={a.narrative.text} />
            <p className="small muted" style={{ marginTop: 16, marginBottom: 0 }}>
              {a.narrative.provider === "claude-cli" ? `Written by Claude (${a.narrative.model}) from the analysis.` : "Written from the analysis by the rule engine."}
              {a.ai.jev.used && ` Key moments judged by ${a.ai.jev.model ?? "Jev"}.`}
            </p>
          </>
        ) : (
          <p className="muted">No written debrief for this game.</p>
        )}
      </div>
      <div>
        <div className="panel">
          <h2>Next game</h2>
          {a.drills.map((d) => (
            <div key={d.title} className="drill">
              <h3>{d.title}</h3>
              <p className="small" style={{ marginBottom: 4 }}>{d.why}</p>
              <p className="small muted" style={{ marginBottom: 4 }}>{d.how}</p>
              <div className="goal">Goal: {d.goal}</div>
            </div>
          ))}
        </div>
        {worst.length > 0 && (
          <div className="panel">
            <h3 style={{ marginBottom: 8 }}>Turning points</h3>
            {worst.map((m) => (
              <p key={m.id} className="small" style={{ cursor: "pointer" }} onClick={() => onSelect(m.id, m.tick)}>
                <span className={`glyph sev-${m.severity}`} style={{ minWidth: 26, height: 20, fontSize: "0.8rem", marginRight: 8 }}>{GLYPH[m.severity]}</span>
                <b>{clock(m.tick)}</b> {m.title}
              </p>
            ))}
          </div>
        )}
        <div className="panel">
          <h3 style={{ marginBottom: 8 }}>Key numbers</h3>
          <table>
            <tbody>
              {a.keyNumbers.map((k) => (
                <tr key={k.key} title={k.hint}>
                  <td>{k.label}</td>
                  <td className="r num">{k.display}</td>
                  <td className="r muted small">{k.medianDisplay ? `lobby ${k.medianDisplay}` : ""}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {(a.strengths.length > 0 || a.weaknesses.length > 0) && (
          <div className="panel">
            {a.strengths.length > 0 && (
              <>
                <h3 style={{ marginBottom: 6 }}>What worked</h3>
                <ul className="small" style={{ paddingLeft: 18, marginTop: 0 }}>{a.strengths.map((s) => <li key={s}>{s}</li>)}</ul>
              </>
            )}
            {a.weaknesses.length > 0 && (
              <>
                <h3 style={{ marginBottom: 6 }}>What cost you</h3>
                <ul className="small" style={{ paddingLeft: 18, marginTop: 0 }}>{a.weaknesses.map((s) => <li key={s}>{s}</li>)}</ul>
              </>
            )}
          </div>
        )}
        <div className="panel">
          <h3 style={{ marginBottom: 8 }}>Final standings</h3>
          <table>
            <tbody>
              {a.leaderboard.map((l) => (
                <tr key={l.smallID} className={l.isMe ? "me" : ""}>
                  <td className="muted">{l.placement}</td>
                  <td>{l.name}<span className="muted small"> {l.type === "Human" ? "" : l.type.toLowerCase()}</span></td>
                  <td className="r">{pct(l.peakLandShare, 1)} peak</td>
                  <td className="r muted small">{l.alive ? "alive" : `out ${clock(l.eliminatedTick ?? 0)}`}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function AttackTab({ a }: { a: Analysis }) {
  const [filter, setFilter] = useState<"players" | "all">("players");
  const rows = a.attacks.filter((r) => filter === "all" || r.targetType === "Human" || r.targetType === "Nation");
  return (
    <div className="panel" style={{ overflowX: "auto" }}>
      <div className="row" style={{ justifyContent: "space-between", marginBottom: 10 }}>
        <p className="small muted" style={{ margin: 0 }}>
          Every attack you launched. "Per 1k" is tiles taken for each 1,000 troops the attack used up; it is compared with every human attack in this lobby.
        </p>
        <select className="input" value={filter} onChange={(e) => setFilter(e.target.value as "players" | "all")} aria-label="Filter attacks">
          <option value="players">Attacks on players</option>
          <option value="all">All attacks</option>
        </select>
      </div>
      <table>
        <thead>
          <tr>
            <th></th>
            <th>Time</th>
            <th>Target</th>
            <th className="r">Sent</th>
            <th className="r">Share of army</th>
            <th className="r">Their army</th>
            <th className="r">Used</th>
            <th className="r">Tiles</th>
            <th className="r">Per 1k</th>
            <th>Note</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i}>
              <td>{r.verdict !== "info" && <span className={`glyph sev-${r.verdict}`} style={{ minWidth: 24, height: 18, fontSize: "0.75rem" }}>{GLYPH[r.verdict]}</span>}</td>
              <td className="num">{clock(r.tick)}</td>
              <td>{r.target}{r.naval && <span className="muted small"> by sea</span>}</td>
              <td className="r">{fmtNum(r.sent)}</td>
              <td className="r">{pct(r.ratio)}</td>
              <td className="r muted">{r.targetType === "TerraNullius" ? "—" : fmtNum(r.targetTroopsAtStart)}</td>
              <td className="r">{fmtNum(r.troopsUsed)}</td>
              <td className="r">{fmtNum(r.tilesGained)}</td>
              <td className="r">{r.tilesPer1kTroops === null ? "—" : r.tilesPer1kTroops.toFixed(1)}</td>
              <td className="small muted">{r.note}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {!rows.length && <p className="muted">No attacks in this view.</p>}
    </div>
  );
}

function BuildTable({ a }: { a: Analysis }) {
  if (!a.builds.length) return <p className="muted">You didn't build anything this game.</p>;
  return (
    <table>
      <thead>
        <tr><th>Time</th><th>Structure</th><th className="r">Cost</th><th className="r">Gold before</th></tr>
      </thead>
      <tbody>
        {a.builds.map((b, i) => (
          <tr key={i}>
            <td className="num">{clock(b.tick)}</td>
            <td>{b.unit}{b.upgrade && <span className="muted small"> upgrade</span>}</td>
            <td className="r">{fmtNum(b.cost)}</td>
            <td className="r muted">{fmtNum(b.goldBefore)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function AskTab({ a }: { a: Analysis }) {
  const [q, setQ] = useState("");
  const [busy, setBusy] = useState(false);
  const [history, setHistory] = useState<{ q: string; a: string }[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const suggestions = ["Why did I lose so much land in my worst collapse?", "What should my first three minutes look like on this map?", "Was my attack ratio too high?"];
  const ask = async (question: string) => {
    if (!question.trim()) return;
    setBusy(true);
    setErr(null);
    try {
      const r = await api.ask(a.gameId, question);
      setHistory((h) => [...h, { q: question, a: r.answer }]);
      setQ("");
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="panel">
      <h2>Ask about this game</h2>
      <p className="muted small">Answers come from this game's analysis, written by your local Claude Code.</p>
      <div className="row small">
        {suggestions.map((s) => (
          <button key={s} className="btn" onClick={() => ask(s)} disabled={busy}>{s}</button>
        ))}
      </div>
      <div className="ask">
        <input className="input" placeholder="Ask anything about this game" value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={(e) => e.key === "Enter" && ask(q)} aria-label="Your question" />
        <button className="btn primary" onClick={() => ask(q)} disabled={busy || !q.trim()}>{busy ? "Thinking…" : "Ask"}</button>
      </div>
      {err && <p className="err small">{err}</p>}
      {history.map((h, i) => (
        <div key={i} className="answer">
          <p className="small muted" style={{ marginBottom: 4 }}>{h.q}</p>
          <Markdown text={h.a} />
        </div>
      ))}
    </div>
  );
}
