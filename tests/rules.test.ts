import { describe, expect, it } from "vitest";
import { baseTroopCap, clock, OPTIMAL_TROOP_RATIO, peakRegenPerTick, troopRegenPerTick } from "../src/analysis/rules";
import { parseGameId } from "../src/openfront/ids";

describe("troop growth model", () => {
  it("peaks near 42% of the cap", () => {
    const max = 500_000;
    let best = 0;
    let bestT = 0;
    for (let t = 0; t <= max; t += 500) {
      const r = troopRegenPerTick(t, max);
      if (r > best) {
        best = r;
        bestT = t;
      }
    }
    expect(bestT / max).toBeGreaterThan(0.38);
    expect(bestT / max).toBeLessThan(0.46);
    expect(OPTIMAL_TROOP_RATIO).toBeCloseTo(0.422, 3);
    expect(peakRegenPerTick(max)).toBeCloseTo(best, -1);
  });

  it("stops at the cap", () => {
    expect(troopRegenPerTick(100_000, 100_000)).toBe(0);
  });

  it("matches the engine's base cap formula", () => {
    expect(baseTroopCap(0)).toBe(100_000);
    expect(Math.round(baseTroopCap(10_000))).toBe(Math.round(2 * (Math.pow(10_000, 0.6) * 1000 + 50_000)));
  });
});

describe("formatting", () => {
  it("renders game clock from ticks", () => {
    expect(clock(0)).toBe("0:00");
    expect(clock(615)).toBe("1:02");
    expect(clock(7052)).toBe("11:45");
  });
});

describe("parseGameId", () => {
  it("accepts bare IDs and openfront links", () => {
    expect(parseGameId("cVvdYSEELT")).toBe("cVvdYSEELT");
    expect(parseGameId("https://openfront.io/w16/game/c8LVKn4b?live")).toBe("c8LVKn4b");
    expect(parseGameId("https://openfront.io/#replay-viewer=ABSgwin6")).toBe("ABSgwin6");
    expect(parseGameId("https://replay.openfront.io/dqKzit4cWu")).toBe("dqKzit4cWu");
  });
  it("rejects junk", () => {
    expect(parseGameId("hello world")).toBeNull();
    expect(parseGameId("../../etc/passwd")).toBeNull();
  });
});
