import { useEffect, useState } from "react";
import { api, type Health, type Settings as S } from "../api";

export function Settings({ health, onSaved }: { health: Health | null; onSaved: () => void }) {
  const [s, setS] = useState<S | null>(null);
  const [names, setNames] = useState("");
  const [saved, setSaved] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  useEffect(() => {
    api.settings().then((x) => {
      setS(x);
      setNames(x.usernames.join(", "));
    });
  }, []);
  if (!s) return <p className="muted">Loading…</p>;

  const save = async () => {
    setErr(null);
    try {
      const next = await api.saveSettings({ ...s, usernames: names.split(",").map((n) => n.trim()).filter(Boolean) });
      setS(next);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
      onSaved();
    } catch (e) {
      setErr((e as Error).message);
    }
  };

  return (
    <div className="two-col" style={{ gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1fr)" }}>
      <div className="panel">
        <h2>Who you are</h2>
        <div className="settings-form">
          <label>
            OpenFront usernames
            <input className="input" value={names} onChange={(e) => setNames(e.target.value)} placeholder="e.g. Rosi, [CLAN] Rosi" />
            <span className="small muted">Comma-separated. Used to find you in a game when the extension didn't record your player ID.</span>
          </label>
          <label>
            OpenFront public ID
            <input className="input" value={s.publicId ?? ""} onChange={(e) => setS({ ...s, publicId: e.target.value || null })} placeholder="8 characters, from your OpenFront profile" />
            <span className="small muted">With this, the coach imports your recent games from OpenFront's public API, even ones played without the extension.</span>
          </label>
          <label className="toggle">
            <input type="checkbox" checked={s.autoSync} onChange={(e) => setS({ ...s, autoSync: e.target.checked })} />
            Import my new games automatically
          </label>
          <h3 style={{ marginTop: 8 }}>AI coaching</h3>
          <label className="toggle">
            <input type="checkbox" checked={s.useJev} onChange={(e) => setS({ ...s, useJev: e.target.checked })} />
            Let Jev judge key moments {health && !health.jev && <span className="small muted">(add TYPESAFE_API_KEY to .env to enable)</span>}
          </label>
          <label className="toggle">
            <input type="checkbox" checked={s.useNarrator} onChange={(e) => setS({ ...s, useNarrator: e.target.checked })} />
            Write a debrief with Claude {health && !health.narrator && <span className="small muted">(Claude Code CLI not found; templates will be used)</span>}
          </label>
          <div className="row">
            <button className="btn primary" onClick={save}>Save settings</button>
            {saved && <span className="c-good small">Saved</span>}
            {err && <span className="err small">{err}</span>}
          </div>
        </div>
      </div>
      <div className="panel">
        <h2>Chrome extension</h2>
        <p>The extension notices when you join a game on openfront.io and tells this coach the game ID and your player identity. It shows nothing during a match. The coach starts analyzing once OpenFront archives the finished game.</p>
        <ol className="small" style={{ paddingLeft: 18 }}>
          <li>Open <code>chrome://extensions</code> and switch on Developer mode.</li>
          <li>Choose Load unpacked and select the <code>extension</code> folder inside this project.</li>
          <li>Play a game on openfront.io. When it ends, a notification links to your debrief.</li>
        </ol>
        <h3 style={{ marginTop: 18 }}>How analysis works</h3>
        <p className="small muted">
          OpenFront's engine is deterministic, so the coach downloads the exact engine build your game was played on from OpenFront's open-source repository, re-simulates the
          archived game in a sandbox, and checks every recorded checkpoint hash. Jev, TypeSafe's calibrated decision model, judges each key moment for about a tenth of a cent per game;
          your local Claude Code writes the debrief on your existing subscription.
        </p>
      </div>
    </div>
  );
}
