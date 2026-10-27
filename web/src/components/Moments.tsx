import type { Analysis, Severity } from "../api";
import { clock, GLYPH, pct, SEV_LABEL } from "../format";

const ORDER: Severity[] = ["brilliant", "good", "inaccuracy", "mistake", "blunder"];

export function SeverityCounts({ analysis }: { analysis: Analysis }) {
  const counts = Object.fromEntries(ORDER.map((s) => [s, analysis.moments.filter((m) => m.severity === s).length]));
  return (
    <div className="sev-counts">
      {ORDER.map((s) => (
        <span key={s} className={`c-${s}`}>
          <span className={`glyph sev-${s}`} style={{ minWidth: 26, height: 20, fontSize: "0.8rem" }}>{GLYPH[s]}</span> {counts[s]} {SEV_LABEL[s].toLowerCase()}
          {counts[s] === 1 || s === "good" || s === "brilliant" ? "" : "s"}
        </span>
      ))}
    </div>
  );
}

export function Moments({ analysis, selected, onSelect }: { analysis: Analysis; selected: string | null; onSelect: (id: string, tick: number) => void }) {
  if (!analysis.moments.length) return <p className="muted">No standout moments in this game.</p>;
  return (
    <div>
      {analysis.moments.map((m) => (
        <div
          key={m.id}
          id={`moment-${m.id}`}
          className={`moment${selected === m.id ? " selected" : ""}`}
          onClick={() => onSelect(m.id, m.tick)}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && onSelect(m.id, m.tick)}
        >
          <span className={`glyph sev-${m.severity}`} title={SEV_LABEL[m.severity]}>{GLYPH[m.severity]}</span>
          <span className="moment-time">{clock(m.tick)}</span>
          <div>
            <div className="moment-title">
              {m.title}
              {m.landShareDelta !== undefined && m.landShareDelta !== null && Math.abs(m.landShareDelta) >= 0.05 && (
                <span className={`small ${m.landShareDelta >= 0 ? "c-good" : "c-mistake"}`} style={{ marginLeft: 8 }}>
                  {m.landShareDelta >= 0 ? "+" : ""}
                  {m.landShareDelta.toFixed(1)} pts of map
                </span>
              )}
            </div>
            <div className="moment-detail">{m.detail}</div>
            {m.suggestion && <div className="moment-advice">{m.suggestion}</div>}
            {m.jev && (
              <div className="jev">
                Jev: {SEV_LABEL[m.jev.label].toLowerCase()} ({pct(m.jev.confidence)} confident)
                {typeof m.evidence.jevAvoidable === "number" && `, ${pct(m.evidence.jevAvoidable as number)} likely avoidable`}
                {!m.jev.agreedWithRules && " — differs from the rule engine"}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
