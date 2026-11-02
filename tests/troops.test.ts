import { describe, expect, it } from "vitest";
import type { ActionContext, ReplayData } from "../src/engine/replayTypes";
import { ReplayView } from "../src/analysis/replayView";
import { attackRange, gradeDrill, sendsOf } from "../src/analysis/troops";
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

describe("attack range", () => {
  it("runs from their home army up to what sits above your floor", () => {
    expect(attackRange(100_000, 35_000, 50_000)).toEqual({ lo: 50, hi: 65, aim: 65 });
    expect(attackRange(100_000, 25_000, 40_000)).toEqual({ lo: 40, hi: 75, aim: 68 });
  });

  it("says hold when matching them would break your floor", () => {
    // Scandinavia 3:53: your whole army beat theirs, but not with the floor kept.
    expect(attackRange(762_979, 364_736, 746_225)).toEqual({ lo: 0, hi: 0, aim: 0 });
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

  it("rewards holding when only an empty home beats their home army", () => {
    const close: DrillSpot = { ...attack, facts: { ...facts, yourHome: 762_979, cap: 1_042_104, theirHome: 746_225 }, floor: 364_736 };
    expect(gradeDrill(close, 0)).toMatchObject({ correct: true, severity: "good", range: { lo: 0, hi: 0 } });
    expect(gradeDrill(close, 100)).toMatchObject({ correct: false, title: "Below your floor" });
  });

  it("rewards a send that matches their home army and keeps the floor", () => {
    const strong: DrillSpot = { ...attack, facts: { ...facts, cap: 100_000, theirHome: 50_000 }, floor: 35_000 };
    expect(gradeDrill(strong, 20).correct).toBe(false);
    expect(gradeDrill(strong, 60).correct).toBe(true);
    expect(gradeDrill(strong, 65).correct).toBe(true);
    expect(gradeDrill(strong, 0).severity).toBe("inaccuracy");
    expect(gradeDrill(strong, 100)).toMatchObject({ correct: false, severity: "mistake", title: "Below your floor" });
  });

  it("wants a small counter, or none, when you are attacked", () => {
    expect(gradeDrill(defend, 10).correct).toBe(true);
    expect(gradeDrill(defend, 30).severity).toBe("inaccuracy");
    expect(gradeDrill(defend, 90).severity).toBe("blunder");
    const big: DrillSpot = { ...defend, floor: 20_000 };
    expect(gradeDrill(big, 40)).toMatchObject({ correct: false, title: "Bigger than it needs to be" });
  });

  it("only ever marks right what the range allows", () => {
    for (const d of [attack, defend, { ...attack, facts: { ...facts, theirHome: 30_000 }, floor: 10_000 }]) {
      const { lo, hi } = gradeDrill(d, 0).range;
      for (let p = 0; p <= 100; p++) expect(gradeDrill(d, p).correct).toBe(p >= lo && p <= hi);
    }
  });
});
