// Full pipeline against a real archived game: fetch the record from
// OpenFront's API, check out the engine build that played it, replay it in
// the sandbox, and analyze. Needs network and ~1 minute, so it only runs
// with OPENFRONT_INTEGRATION=1.
import { describe, expect, it } from "vitest";
import { analyzeGame } from "../src/analysis/analyze";
import { replayGame } from "../src/engine/replay";
import { fetchGameRecord } from "../src/openfront/api";

const run = process.env.OPENFRONT_INTEGRATION === "1";

describe.skipIf(!run)("real game", () => {
  it(
    "replays a 25-player public game bit-exactly and coaches an eliminated player",
    async () => {
      const record = await fetchGameRecord("cVvdYSEELT");
      const { data, exactBuild } = await replayGame(record);
      expect(exactBuild).toBe(true);
      expect(data.meta.desync).toBeNull();
      expect(data.meta.hashesChecked).toBeGreaterThan(500);
      expect(data.meta.winner?.name).toBe("Perfect");

      const a = analyzeGame(record, data, { username: "Rosi" });
      expect(a.depth).toBe("replay");
      expect(a.me.result).toBe("eliminated");
      expect(a.moments.some((m) => m.kind === "collapse" && m.severity === "blunder")).toBe(true);
      expect(a.categories.length).toBeGreaterThanOrEqual(6);

      const w = analyzeGame(record, data, { username: "Perfect" });
      expect(w.me.result).toBe("victory");
      expect(w.overall.score).toBeGreaterThan(a.overall.score);
    },
    600_000,
  );
});
