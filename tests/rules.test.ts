import { describe, expect, it } from "vitest";
import { playModeOf } from "../src/analysis/mode";
import { baseTroopCap, CHEAPEST_STACK_RATIO, clock, lossMultiplier, OPTIMAL_TROOP_RATIO, peakRegenPerTick, tradeShipGold, troopRegenPerTick } from "../src/analysis/rules";
import { parseGameId } from "../src/openfront/ids";
import type { GameRecord } from "../src/openfront/types";

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

describe("attack losses", () => {
  it("double at half the defender's home troops or less", () => {
    expect(lossMultiplier(50_000, 100_000)).toBe(2);
    expect(lossMultiplier(20_000, 100_000)).toBe(2);
    expect(lossMultiplier(60_000, 100_000)).toBeCloseTo(1.67, 2);
  });
  it("are cheapest from about 1.67× their home troops", () => {
    expect(CHEAPEST_STACK_RATIO).toBeCloseTo(1.667, 3);
    expect(lossMultiplier(167_000, 100_000)).toBeCloseTo(0.6, 2);
    expect(lossMultiplier(300_000, 100_000)).toBe(0.6);
  });
});

describe("trade ship gold", () => {
  it("follows the v0.35 sigmoid, paid to both ends", () => {
    expect(Math.round(tradeShipGold(100) / 100) * 100).toBe(5200);
    expect(Math.round(tradeShipGold(200) / 100) * 100).toBe(13_600);
    expect(Math.round(tradeShipGold(300) / 100) * 100).toBe(52_500);
    expect(Math.round(tradeShipGold(500) / 1000) * 1000).toBe(100_000);
  });
});

describe("game modes", () => {
  const rec = (config: Record<string, unknown>) => ({ info: { config: { gameMap: "Luna", difficulty: "Medium", gameType: "Public", ...config } } }) as unknown as GameRecord;
  it("treats FFA as individual play with overtime", () => {
    const m = playModeOf(rec({ gameMode: "Free For All", nations: "default", overtime: { enabled: true } }));
    expect(m).toMatchObject({ label: "FFA", teammates: false, bigTeams: false, nations: true, overtime: true });
  });
  it("treats 2 teams as team play without nations", () => {
    const m = playModeOf(rec({ gameMode: "Team", playerTeams: 2, nations: "disabled", donateTroops: true, donateGold: true }));
    expect(m).toMatchObject({ label: "2-team", teammates: true, bigTeams: true, nations: false, donations: true });
  });
  it("treats Trios and 5 teams as smaller teams", () => {
    expect(playModeOf(rec({ gameMode: "Team", playerTeams: "Trios", nations: "disabled" }))).toMatchObject({ teammates: true, bigTeams: false });
    expect(playModeOf(rec({ gameMode: "Team", playerTeams: 5, nations: "disabled" }))).toMatchObject({ teammates: true, bigTeams: false, teams: 5 });
  });
  it("treats Humans vs Nations as one big team with nations", () => {
    expect(playModeOf(rec({ gameMode: "Team", playerTeams: "Humans Vs Nations", nations: "default" }))).toMatchObject({ bigTeams: true, nations: true });
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
