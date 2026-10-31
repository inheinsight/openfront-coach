import { describe, expect, it } from "vitest";
import type { ActionContext, ReplayData } from "../src/engine/replayTypes";
import { ReplayView } from "../src/analysis/replayView";
import { attackLossMultiplier, CHEAPEST_STACK } from "../src/analysis/rules";
import { gradeDrill, sendsOf } from "../src/analysis/troops";
import type { DrillSpot } from "../src/analysis/types";

function view(actions: Partial<ActionContext>[]): ReplayView {
  const data = {
    players: [
      { smallID: 1, id: "a", clientID: "me", name: "Me", type: "Human", team: "Red" },
      { smallID: 2, id: "b", clientID: "foe", name: "Foe", type: "Human", team: "Blue" },
      { smallID: 3, id: "c", clientID: "mate", name: "Mate", type: "Human", team: "Red" },
    ],
    actions: actions.map((a) => ({ clientID: "me", type: "attack", targetType: "Human", ...a })),
  } as unknown as ReplayData;
  return new ReplayView(data);
}

describe("attack losses", () => {
  it("clamps between 0.6 and 2 of the defender's home troops per your stack", () => {
    expect(attackLossMultiplier(0.25)).toBe(2);
    expect(attackLossMultiplier(0.5)).toBe(2);
    expect(attackLossMultiplier(1)).toBe(1);
    expect(attackLossMultiplier(3)).toBe(0.6);
    expect(CHEAPEST_STACK).toBeCloseTo(1.667, 3);
  });
});

describe("sends", () => {
  it("folds quick clicks on one player into a single decision", () => {
    const v = view([
      { tick: 100, target: 2, sent: 20_000, troops: 100_000, maxTroops: 300_000, targetTroops: 80_000 },
      { tick: 110, target: 2, sent: 16_000, troops: 80_000, targetTroops: 80_000 },
      { tick: 125, target: 2, sent: 12_800, troops: 64_000, targetTroops: 80_000 },
      { tick: 400, target: 2, sent: 10_000, troops: 90_000, targetTroops: 50_000 },
    ]);
    const s = sendsOf(v, "me", "Red");
    expect(s).toHaveLength(2);
    expect(s[0].clicks).toBe(3);
    expect(s[0].sent).toBe(48_800);
    expect(s[0].share).toBeCloseTo(0.488, 3);
    expect(s[0].clickShares.map((x) => +x.toFixed(2))).toEqual([0.2, 0.36, 0.49]);
    expect(s[0].stack).toBeCloseTo(0.61, 2);
    expect(s[1].clicks).toBe(1);
  });

  it("leaves out teammates, allies and unclaimed land", () => {
    const v = view([
      { tick: 100, target: 3, sent: 50_000, troops: 100_000, targetTroops: 10 },
      { tick: 200, target: 2, sent: 50_000, troops: 100_000, targetTroops: 10, targetAllied: true },
      { tick: 300, targetType: "TerraNullius", sent: 50_000, troops: 100_000 },
    ]);
    expect(sendsOf(v, "me", "Red")).toHaveLength(0);
  });
});

describe("drill grading", () => {
  const facts = { yourHome: 100_000, cap: 400_000, theirHome: 200_000, incoming: null, yourTiles: 1, theirTiles: 1 };
  const attack: DrillSpot = { id: "attack-1", kind: "attack", rule: "stack", tick: 1, question: "", target: "Foe", targetId: 2, facts, floor: null, youDid: { share: 1, clicks: 1, text: "" }, call: "" };
  const defend: DrillSpot = { ...attack, id: "defend-1", kind: "defend", rule: "floor", facts: { ...facts, incoming: 70_000 }, floor: 100_000 };

  it("rewards holding when even the whole army is short of their home army", () => {
    expect(gradeDrill(attack, 0).correct).toBe(true);
    expect(gradeDrill(attack, 100).severity).toBe("blunder");
  });

  it("rewards a send once it matches their home army", () => {
    const strong: DrillSpot = { ...attack, facts: { ...facts, theirHome: 50_000 } };
    expect(gradeDrill(strong, 20).correct).toBe(false);
    expect(gradeDrill(strong, 60).correct).toBe(true);
    expect(gradeDrill(strong, 0).severity).toBe("inaccuracy");
  });

  it("wants a small counter, or none, when you are attacked", () => {
    expect(gradeDrill(defend, 10).correct).toBe(true);
    expect(gradeDrill(defend, 30).severity).toBe("inaccuracy");
    expect(gradeDrill(defend, 90).severity).toBe("blunder");
  });
});
