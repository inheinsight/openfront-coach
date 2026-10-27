import { afterEach, describe, expect, it } from "vitest";
// @ts-expect-error plain JS helper
import { loadExtension } from "../scripts/extension-sim.mjs";

type Ext = ReturnType<typeof loadExtension>;
const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

function fakeCoach(status = "waiting_archive") {
  const calls: { url: string; body?: unknown }[] = [];
  const impl = async (url: string, init?: { method?: string; body?: string }) => {
    calls.push({ url, body: init?.body ? JSON.parse(init.body) : undefined });
    if (url.endsWith("/api/games/track")) return new Response(JSON.stringify({ status: "waiting_archive" }), { status: 200 });
    const m = url.match(/\/api\/games\/([^/]+)$/);
    if (m) return new Response(JSON.stringify({ summary: { game_id: m[1], status, grade: "B+", map: "Africa", headline: "Survived." } }), { status: 200 });
    return new Response("{}", { status: 404 });
  };
  return { calls, impl };
}

let ext: Ext | null = null;
afterEach(() => ext?.stop());

describe("extension", () => {
  it("reports the game in the URL with your public identity", async () => {
    const coach = fakeCoach();
    ext = loadExtension({
      url: "https://openfront.io/w16/game/c8LVKn4b?live",
      localStorage: { username: "AnonLinen5", "cached_public_id_abc": "lQgamKr9", player_persistent_id: "SECRET" },
      fetchImpl: coach.impl,
    });
    await wait(200);
    const track = coach.calls.find((c) => c.url.endsWith("/api/games/track"));
    expect(track?.body).toMatchObject({ gameId: "c8LVKn4b", username: "AnonLinen5", publicId: "lQgamKr9" });
    // Never leaks the private persistent ID.
    expect(JSON.stringify(coach.calls)).not.toContain("SECRET");
  });

  it("ignores replays", async () => {
    const coach = fakeCoach();
    ext = loadExtension({ url: "https://replay.openfront.io/game/abcdef12", localStorage: {}, fetchImpl: coach.impl });
    await wait(200);
    expect(coach.calls.filter((c) => c.url.endsWith("/track"))).toHaveLength(0);
  });

  it("picks up single-player games from the heartbeat request", async () => {
    const coach = fakeCoach();
    ext = loadExtension({ url: "https://openfront.io/", localStorage: { username: "Me" }, fetchImpl: coach.impl });
    ext.request("https://openfront.io/w3/api/singleplayer/SPgame01/heartbeat");
    await wait(200);
    expect(coach.calls.some((c) => (c.body as { gameId?: string })?.gameId === "SPgame01")).toBe(true);
  });

  it("notifies only once the debrief is ready", async () => {
    const coach = fakeCoach("done");
    ext = loadExtension({ url: "https://openfront.io/game/Done1234", localStorage: { username: "Me" }, fetchImpl: coach.impl });
    await wait(200);
    await ext.alarm();
    expect(ext.notifications).toHaveLength(1);
    expect(ext.notifications[0].title).toContain("B+");
    await ext.alarm();
    expect(ext.notifications).toHaveLength(1);
  });
});
