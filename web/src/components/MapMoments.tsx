import { useEffect, useMemo, useRef, useState } from "react";
import type { Analysis } from "../api";
import { clock, GLYPH, pct, SEV_LABEL } from "../format";
import { MapStage, type CameraMode } from "./MapStage";
import { frameAt as frameIndexAt, useDecodedMap } from "./useMap";

/**
 * The map replay with your key moments laid along its timeline: the map
 * follows you, the moment card below advances as the replay plays, and
 * selecting a moment jumps there and outlines the players involved.
 */
export function MapMoments({
  analysis,
  selectedId,
  onSelect,
}: {
  analysis: Analysis;
  selectedId: string | null;
  onSelect: (id: string, tick: number) => void;
}) {
  const { map, err } = useDecodedMap(analysis.gameId);
  const [idx, setIdx] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [mode, setMode] = useState<CameraMode>("follow");
  const [cardId, setCardId] = useState<string | null>(selectedId);
  const moments = analysis.moments;

  const frameAt = (tick: number) => (map ? frameIndexAt(map, tick) : 0);

  // Jump to a moment chosen outside (front-line chart) or here.
  useEffect(() => {
    if (!map || !selectedId) return;
    const m = moments.find((x) => x.id === selectedId);
    if (!m) return;
    setCardId(m.id);
    setIdx(frameAt(m.tick));
    setPlaying(false);
    setMode("follow");
  }, [selectedId, map]); // eslint-disable-line react-hooks/exhaustive-deps

  // Start on your first moment, or the end of the game.
  useEffect(() => {
    if (!map || selectedId) return;
    if (moments[0]) {
      setCardId(moments[0].id);
      setIdx(frameAt(moments[0].tick));
    } else setIdx(map.frames.length - 1);
  }, [map]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!playing || !map) return;
    const t = setInterval(() => {
      setIdx((i) => {
        if (i >= map.frames.length - 1) {
          setPlaying(false);
          return i;
        }
        const next = i + 1;
        // The card follows the replay: show the latest moment reached.
        const reached = [...moments].reverse().find((m) => m.tick <= map.frameTicks[next]);
        if (reached) setCardId(reached.id);
        return next;
      });
    }, 550);
    return () => clearInterval(t);
  }, [playing, map, moments]);

  // Lay the timeline glyphs out in rows so close moments don't overlap.
  const marksRef = useRef<HTMLDivElement>(null);
  const [trackW, setTrackW] = useState(600);
  useEffect(() => {
    const el = marksRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setTrackW(el.clientWidth));
    ro.observe(el);
    return () => ro.disconnect();
  }, [map]);

  const card = moments.find((m) => m.id === cardId) ?? null;
  const focus = useMemo(() => card?.focus ?? [], [card]);
  const lastTick = map ? map.frameTicks[map.frameTicks.length - 1] || 1 : analysis.game.durationTicks || 1;
  const rows = useMemo(() => {
    const ends: number[] = [];
    const out = new Map<string, number>();
    for (const m of [...moments].sort((a, b) => a.tick - b.tick)) {
      const x = Math.min(1, m.tick / lastTick) * trackW;
      let r = ends.findIndex((end) => x - end >= 34);
      if (r < 0) r = ends.length;
      ends[r] = x;
      out.set(m.id, r);
    }
    return { of: out, count: Math.max(1, ends.length) };
  }, [moments, lastTick, trackW]);

  const go = (i: number) => {
    const m = moments[i];
    if (!m) return;
    onSelect(m.id, m.tick);
  };
  const cardIndex = card ? moments.indexOf(card) : -1;

  if (err) return <p className="err">Map unavailable: {err}</p>;
  if (!map) return <p className="muted">Loading the map…</p>;

  const scrub = (i: number) => {
    setIdx(i);
    setPlaying(false);
    const reached = [...moments].reverse().find((m) => m.tick <= map.frameTicks[i]);
    setCardId(reached?.id ?? null);
  };

  return (
    <div className="mapmoments">
      <div className="panel stage-panel">
        <MapStage map={map} frameIndex={idx} focus={focus} mode={mode} onModeChange={setMode} />
        <div className="timeline">
          <button
            className="btn"
            onClick={() => {
              if (idx >= map.frames.length - 1) setIdx(0);
              setPlaying(!playing);
            }}
          >
            {playing ? "Pause" : "Play"}
          </button>
          <div className="tl-track">
            <div className="tl-marks" ref={marksRef} style={{ height: 8 + rows.count * 26 }}>
              {moments.map((m) => (
                <button
                  key={m.id}
                  className={`tl-mark sev-${m.severity}${m.id === cardId ? " current" : ""}`}
                  style={{ left: `${Math.min(100, (m.tick / lastTick) * 100)}%`, bottom: 4 + (rows.of.get(m.id) ?? 0) * 26 }}
                  onClick={() => onSelect(m.id, m.tick)}
                  title={`${clock(m.tick)} ${m.title}`}
                  aria-label={`${SEV_LABEL[m.severity]} at ${clock(m.tick)}: ${m.title}`}
                >
                  {GLYPH[m.severity]}
                </button>
              ))}
            </div>
            <input
              type="range"
              min={0}
              max={map.frames.length - 1}
              value={idx}
              onChange={(e) => scrub(Number(e.target.value))}
              aria-label="Game time"
            />
          </div>
          <span className="num tl-time">{clock(map.frameTicks[idx] ?? 0)}</span>
        </div>
        <p className="small muted" style={{ margin: "6px 0 0" }}>
          You are gold. Players involved in the current moment are outlined in red and labelled. Scroll to zoom, drag to pan; Follow me re-centres on you.
        </p>
      </div>

      <div className="mm-below">
        <div className="panel moment-card">
          {card ? (
            <>
              <div className="row" style={{ justifyContent: "space-between" }}>
                <div className="row">
                  <span className={`glyph sev-${card.severity}`}>{GLYPH[card.severity]}</span>
                  <span className="moment-time">{clock(card.tick)}</span>
                  <span className={`small c-${card.severity}`}>{SEV_LABEL[card.severity]}</span>
                </div>
                <div className="row">
                  <button className="btn" disabled={cardIndex <= 0} onClick={() => go(cardIndex - 1)}>Previous moment</button>
                  <button className="btn" disabled={cardIndex < 0 || cardIndex >= moments.length - 1} onClick={() => go(cardIndex + 1)}>Next moment</button>
                </div>
              </div>
              <h2 style={{ margin: "12px 0 6px" }}>
                {card.title}
                {card.landShareDelta !== undefined && card.landShareDelta !== null && Math.abs(card.landShareDelta) >= 0.05 && (
                  <span className={`small ${card.landShareDelta >= 0 ? "c-good" : "c-mistake"}`} style={{ marginLeft: 10, fontFamily: "var(--body)" }}>
                    {card.landShareDelta >= 0 ? "+" : ""}
                    {card.landShareDelta.toFixed(1)} pts of map
                  </span>
                )}
              </h2>
              <p>{card.detail}</p>
              {card.suggestion && <p className="moment-advice">{card.suggestion}</p>}
              {card.focus && card.focus.length > 0 && (
                <p className="small muted">On the map: {card.focus.map((id) => map.players.get(id)?.name ?? `#${id}`).join(", ")}.</p>
              )}
              {card.jev && (
                <p className="jev">
                  Jev: {SEV_LABEL[card.jev.label].toLowerCase()} ({pct(card.jev.confidence)} confident)
                  {typeof card.evidence.jevAvoidable === "number" && `, ${pct(card.evidence.jevAvoidable as number)} likely avoidable`}
                </p>
              )}
            </>
          ) : (
            <p className="muted">No key moment yet at this point in the game. Press Play or pick a moment.</p>
          )}
        </div>
        <div className="panel mm-list">
          <h3 style={{ marginBottom: 6 }}>All key moments</h3>
          {moments.map((m) => (
            <button key={m.id} className={`mm-row${m.id === cardId ? " current" : ""}`} onClick={() => onSelect(m.id, m.tick)}>
              <span className={`glyph sev-${m.severity}`} style={{ minWidth: 26, height: 20, fontSize: "0.8rem" }}>{GLYPH[m.severity]}</span>
              <span className="num muted">{clock(m.tick)}</span>
              <span>{m.title}</span>
            </button>
          ))}
          {!moments.length && <p className="muted">No standout moments in this game.</p>}
        </div>
      </div>
    </div>
  );
}
