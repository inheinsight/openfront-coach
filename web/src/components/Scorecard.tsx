import type { Analysis } from "../api";
import { gradeColor } from "../format";

export function Scorecard({ analysis }: { analysis: Analysis }) {
  const multi = analysis.game.humans >= 4;
  return (
    <div>
      {analysis.categories.map((c) => (
        <section key={c.key} className="score-cat">
          <div className="score-cat-head">
            <span className="g" style={{ color: gradeColor(c.grade) }}>{c.grade}</span>
            <h3>{c.label}</h3>
            <span className="muted small">{c.score}/100</span>
          </div>
          <p className="muted small">{c.summary}</p>
          <table>
            <thead>
              <tr>
                <th>Measure</th>
                <th className="r">You</th>
                {multi && <th className="r">Lobby median</th>}
                {multi && <th className="r">Best human</th>}
                {multi && <th>Where you rank</th>}
              </tr>
            </thead>
            <tbody>
              {c.metrics.map((m) => (
                <tr key={m.key} title={m.hint}>
                  <td>
                    {m.label}
                    {m.hint && <div className="muted small">{m.hint}</div>}
                  </td>
                  <td className="r num">{m.display}</td>
                  {multi && <td className="r muted">{m.medianDisplay ?? "—"}</td>}
                  {multi && <td className="r muted">{m.bestDisplay ?? "—"}</td>}
                  {multi && (
                    <td style={{ verticalAlign: "middle" }}>
                      {m.percentile !== null && m.percentile !== undefined ? (
                        <div className="pctile" title={`Better than ${m.percentile}% of the other humans`}>
                          <span style={{ left: `${m.percentile}%` }} />
                        </div>
                      ) : (
                        <span className="muted small">—</span>
                      )}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      ))}
    </div>
  );
}
