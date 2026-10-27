import { StrictMode, useCallback, useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { api, onGameEvents, type GameSummary, type Health } from "./api";
import { Game } from "./pages/Game";
import { Home } from "./pages/Home";
import { Settings } from "./pages/Settings";
import { Trends } from "./pages/Trends";
import { Link, usePath } from "./router";
import "./styles.css";

function App() {
  const path = usePath();
  const [games, setGames] = useState<GameSummary[]>([]);
  const [health, setHealth] = useState<Health | null>(null);
  const [offline, setOffline] = useState(false);

  const refresh = useCallback(() => {
    api.games().then(setGames).catch(() => setOffline(true));
    api.health().then((h) => {
      setHealth(h);
      setOffline(false);
    }).catch(() => setOffline(true));
  }, []);

  useEffect(() => {
    refresh();
    return onGameEvents((g) =>
      setGames((prev) => {
        const i = prev.findIndex((x) => x.game_id === g.game_id);
        if (i < 0) return [g, ...prev];
        const next = [...prev];
        next[i] = g;
        return next;
      }),
    );
  }, [refresh]);

  // Re-read the list when coming back to it (a game may have been removed).
  useEffect(() => {
    if (path === "/") refresh();
  }, [path, refresh]);

  const gameMatch = path.match(/^\/game\/([A-Za-z0-9_-]+)/);
  const nav = [
    { to: "/", label: "Games", active: path === "/" || !!gameMatch },
    { to: "/progress", label: "Progress", active: path === "/progress" },
    { to: "/settings", label: "Settings", active: path === "/settings" },
  ];

  return (
    <div className="shell">
      <header className="topbar">
        <Link to="/" className="brand" aria-label="OpenFront Coach home">
          <img src="/favicon.svg" className="brand-mark" alt="" />
          <span className="brand-name">OpenFront Coach</span>
        </Link>
        <nav className="nav">
          {nav.map((n) => (
            <Link key={n.to} to={n.to} className={n.active ? "active" : ""}>{n.label}</Link>
          ))}
        </nav>
        <div className="status">
          {offline ? (
            <span><i className="dot warn" />Coach server offline. Run npm start</span>
          ) : (
            <>
              <span title="TypeSafe Jev judges key moments"><i className={`dot ${health?.jev ? "on" : ""}`} />Jev {health?.jev ? "on" : "off"}</span>
              <span title="Claude Code writes the debrief"><i className={`dot ${health?.narrator ? "on" : ""}`} />Claude {health?.narrator ? "on" : "off"}</span>
            </>
          )}
        </div>
      </header>
      {gameMatch ? (
        <Game id={gameMatch[1]} live={games.find((g) => g.game_id === gameMatch[1])} />
      ) : path === "/progress" ? (
        <Trends />
      ) : path === "/settings" ? (
        <Settings health={health} onSaved={refresh} />
      ) : (
        <Home games={games} health={health} refresh={refresh} />
      )}
    </div>
  );
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
