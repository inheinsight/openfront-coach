import { useState } from "react";
import { api, type GameSummary, type Health } from "../api";
import { gradeColor, RESULT_LABEL, STATUS_LABEL, when } from "../format";
import { Link, navigate } from "../router";

export function Home({ games, health, refresh }: { games: GameSummary[]; health: Health | null; refresh: () => void }) {
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const submit = async () => {
    if (!input.trim()) return;
    setBusy(true);
    setErr(null);
    try {
      const r = await api.importGame(input.trim());
      setInput("");
      refresh();
      navigate(`/game/${r.gameId}`);
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const sync = async () => {
    setBusy(true);
    setErr(null);
    try {
      const r = await api.sync();
      setMsg(r.added.length ? `Queued ${r.added.length} game${r.added.length > 1 ? "s" : ""} from your OpenFront history.` : "No new games in your OpenFront history.");
      refresh();
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const onFile = async (f: File | undefined) => {
    if (!f) return;
    setBusy(true);
    setErr(null);
    try {
      const record = JSON.parse(await f.text());
      const r = await api.importRecord(record);
      refresh();
      navigate(`/game/${r.gameId}`);
    } catch (e) {
      setErr(`That file isn't an OpenFront game record: ${(e as Error).message}`);
    } finally {
      setBusy(false);
    }
  };

  const settings = health?.settings;
  return (
    <div className="home-grid">
      <div>
        <div className="intro">
          <h1>Every game you finish, reviewed like a replay with a coach.</h1>
          <p>
            Play on openfront.io as usual. When a game ends, the coach replays it with the exact engine build it was played on,
            finds the moments that decided it, and tells you what to do differently next time.
          </p>
        </div>
        <div className="log">
          {games.length === 0 && (
            <div className="empty">
              <h3>No games yet</h3>
              <p>Install the Chrome extension and play a game, or paste a game link on the right to analyze one now.</p>
            </div>
          )}
          {games.map((g) => (
            <Link key={g.game_id} to={`/game/${g.game_id}`} className="log-row">
              <div className="log-grade" style={{ color: gradeColor(g.grade) }}>{g.status === "done" ? g.grade : "…"}</div>
              <div style={{ minWidth: 0 }}>
                <div className="log-map">
                  {g.map ?? g.game_id}
                  <span className="muted small" style={{ marginLeft: 10, fontFamily: "var(--body)", fontWeight: 400 }}>
                    {[g.mode, g.game_type].filter(Boolean).join(", ")}
                  </span>
                </div>
                {g.status === "done" ? (
                  <div className="log-head">{g.headline}</div>
                ) : g.status === "error" ? (
                  <div className="log-head err">{g.error}</div>
                ) : (
                  <div className="log-head">
                    {STATUS_LABEL[g.status]}
                    {g.stage && g.stage !== STATUS_LABEL[g.status] ? `: ${g.stage}` : ""}
                    {g.status === "replaying" && (
                      <div className="progress">
                        <div style={{ width: `${g.progress ?? 0}%` }} />
                      </div>
                    )}
                  </div>
                )}
              </div>
              <div className="log-meta spark">
                {g.result && <div className={`result-${g.result}`}>{RESULT_LABEL[g.result] ?? g.result}</div>}
                {g.placement && <div>#{g.placement} of {g.placement_of}</div>}
              </div>
              <div className="log-meta">{when(g.started_at ?? g.created_at)}</div>
            </Link>
          ))}
        </div>
      </div>

      <aside className="side">
        <div className="panel">
          <h3>Analyze a game</h3>
          <p>Paste a game ID, or a link from openfront.io (a game or replay URL).</p>
          <div className="row">
            <input className="input" style={{ flex: 1 }} placeholder="e.g. cVvdYSEELT" value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && submit()} aria-label="Game ID or link" />
            <button className="btn primary" disabled={busy || !input.trim()} onClick={submit}>Analyze</button>
          </div>
          <p className="small muted" style={{ marginTop: 12 }}>
            Or load a saved record:{" "}
            <label style={{ textDecoration: "underline", cursor: "pointer" }}>
              choose a .json file
              <input type="file" accept=".json,application/json" hidden onChange={(e) => onFile(e.target.files?.[0])} />
            </label>
          </p>
          {err && <p className="err small">{err}</p>}
          {msg && <p className="small">{msg}</p>}
        </div>
        <div className="panel">
          <h3>Your OpenFront history</h3>
          {settings?.publicId ? (
            <>
              <p>Signed in as public ID <code>{settings.publicId}</code>. New games are imported every 10 minutes{settings.autoSync ? "" : " (paused in Settings)"}.</p>
              <button className="btn" disabled={busy} onClick={sync}>Import recent games now</button>
            </>
          ) : (
            <p>
              The extension picks up your public ID the first time you play. You can also enter it in <Link to="/settings">Settings</Link> to import past games.
            </p>
          )}
        </div>
        <div className="panel">
          <h3>Fair play</h3>
          <p>
            OpenFront's terms forbid real-time assistance. The coach never reads or shows anything during a match: it only works from
            OpenFront's public archive, which publishes a game after it ends.
          </p>
        </div>
      </aside>
    </div>
  );
}
