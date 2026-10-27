import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { replayGame } from "../src/engine/replay";
import { importRecordFile } from "../src/openfront/api";
import { assertGameId, insideDir, isGameId } from "../src/openfront/ids";
import type { GameRecord } from "../src/openfront/types";

const evil = (gameID: string) =>
  ({ version: "v0.0.2", gitCommit: "14ba82badb1e945ef2e758999238339404fdb788", info: { gameID, config: { gameMap: "World" }, players: [], start: 0, end: 0, duration: 0, num_turns: 0 }, turns: [] }) as unknown as GameRecord;

describe("game ids and paths", () => {
  it("accepts only plain ids", () => {
    expect(isGameId("cVvdYSEELT")).toBe(true);
    for (const bad of ["../../x", "a/b", "..", "x".repeat(41), "", "a b"]) expect(isGameId(bad)).toBe(false);
    expect(() => assertGameId("../../etc")).toThrow();
  });
  it("keeps joined paths inside their directory", () => {
    expect(insideDir("/tmp/a", "b.json")).toBe(path.resolve("/tmp/a/b.json"));
    expect(() => insideDir("/tmp/a", "../b.json")).toThrow();
  });
  it("refuses imported records with a traversal game id", async () => {
    const f = path.join(fs.mkdtempSync(path.join(os.tmpdir(), "ofc-")), "r.json");
    fs.writeFileSync(f, JSON.stringify(evil("../../PROOF")));
    await expect(importRecordFile(f)).rejects.toThrow(/invalid game id/);
  });
  it("refuses to replay a record with a traversal game id", async () => {
    await expect(replayGame(evil("../../PROOF"))).rejects.toThrow(/invalid game id/);
  });
});
