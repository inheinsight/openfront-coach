// Exercises the real TypeSafe SDK against a local mock of POST /v1/systemone,
// checking the requests we build and how answers change the analysis.
import http from "node:http";
import type { AddressInfo } from "node:net";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { Analysis } from "../src/analysis/types";

type Q = { type: string; instructions: string; criteria?: Record<string, string> | string[] };
const requests: { model: string; state: unknown; questions: Record<string, Q>; auth?: string }[] = [];
let server: http.Server;

beforeAll(async () => {
  server = http.createServer((req, res) => {
    let body = "";
    req.on("data", (c) => (body += c));
    req.on("end", () => {
      const j = JSON.parse(body);
      requests.push({ ...j, auth: req.headers.authorization });
      const answers: Record<string, unknown> = {};
      for (const [name, q] of Object.entries(j.questions as Record<string, Q>)) {
        if (q.type === "noul") answers[name] = { type: "noul", noul: 0.82 };
        else if (q.type === "choice") {
          const keys = Object.keys(q.criteria as Record<string, string>);
          // Severity: call everything a blunder with high confidence; others: first option.
          const pick = name === "severity" ? "blunder" : keys[0];
          answers[name] = { type: "choice", choice: pick, confidence: 0.9, probabilities: Object.fromEntries(keys.map((k) => [k, k === pick ? 0.9 : 0.1 / (keys.length - 1)])) };
        }
      }
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify({ model: "jev-1.14.0", answers, usage: { input_tokens: 500, output_tokens: 0 } }));
    });
  });
  await new Promise<void>((r) => server.listen(0, "127.0.0.1", () => r()));
  process.env.TYPESAFE_API_KEY = "test-key";
  process.env.TYPESAFE_BASE_URL = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
});
afterAll(() => server.close());

function analysis(): Analysis {
  const m = (id: string, severity: Analysis["moments"][number]["severity"], title: string) => ({
    id,
    tick: 1200,
    kind: "attack" as const,
    severity,
    title,
    detail: "detail",
    evidence: { sent: 1000 },
  });
  return {
    analysisVersion: 1,
    gameId: "g",
    analyzedAt: "",
    depth: "replay",
    replayNote: null,
    game: { map: "Africa", mapSize: "Normal", mode: "Free For All", type: "Singleplayer", difficulty: "Easy", durationTicks: 3000, startedAt: 0, endedAt: 0, gitCommit: "x", humans: 1, nations: 44, bots: 400, winner: "Tunisia", teams: null },
    me: { clientID: "c", name: "Me", smallID: 1, team: null, result: "defeat", placement: 35, placementOf: 45, eliminatedTick: null, finalLandShare: 0.015, peakLandShare: 0.016 },
    headline: "",
    overall: { score: 60, grade: "C" },
    categories: [
      { key: "troops", label: "Troop management", score: 50, grade: "D", summary: "Weak", metrics: [] },
      { key: "expansion", label: "Expansion", score: 70, grade: "B", summary: "Solid", metrics: [] },
    ],
    keyNumbers: [],
    moments: [m("m1", "mistake", "Attack went badly"), m("m2", "good", "Big push")],
    attacks: [],
    builds: [],
    strengths: [],
    weaknesses: [],
    drills: [
      { title: "Faster opening", why: "", how: "", goal: "", metricKey: "share120" },
      { title: "Troop bar", why: "", how: "", goal: "", metricKey: "troopEff" },
    ],
    phases: [],
    timeline: null,
    leaderboard: [],
    narrative: null,
    ai: { jev: { used: false }, narrator: { used: false } },
    trendMetrics: {},
  };
}

describe("Jev judge", () => {
  it("sends typed questions per moment and gates overrides on confidence", async () => {
    const { judgeWithJev } = await import("../src/ai/jev");
    const a = analysis();
    const out = await judgeWithJev(a);
    expect(out.used).toBe(true);
    expect(out.model).toBe("jev-1.14.0");
    // One request per judged moment, plus one overall.
    expect(requests).toHaveLength(3);
    expect(requests[0].auth).toBe("Bearer test-key");
    const q = requests[0].questions;
    expect(q.severity.type).toBe("choice");
    expect(Object.keys(q.severity.criteria as object)).toEqual(["brilliant", "good", "inaccuracy", "mistake", "blunder"]);
    expect(q.avoidable.type).toBe("noul");
    expect(q.lesson.type).toBe("choice");
    // mistake -> blunder is one step and 90% confident: adopted.
    expect(a.moments[0].severity).toBe("blunder");
    expect(a.moments[0].jev?.label).toBe("blunder");
    expect(a.moments[0].evidence.jevAvoidable).toBe(0.82);
    // good -> blunder is four steps; 90% < 95% bar, so the rules' verdict stands.
    expect(a.moments[1].severity).toBe("good");
    expect(a.moments[1].jev?.agreedWithRules).toBe(false);
    // Focus picked "troops" (first option) with confidence: its drill moves first.
    expect(out.focus?.area).toBe("troops");
    expect(a.drills[0].metricKey).toBe("troopEff");
    expect(out.tokens).toBe(1500);
  });
});
