import { useEffect, useState } from "react";
import { api } from "../api";
import type { DecodedMap } from "./MapStage";

async function gunzip(b64: string): Promise<ArrayBuffer> {
  const bin = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
  const stream = new Blob([bin]).stream().pipeThrough(new DecompressionStream("gzip"));
  return new Response(stream).arrayBuffer();
}

/** Loads and decodes a game's ownership frames once per game. */
const cache = new Map<string, Promise<DecodedMap>>();
export function loadMap(gameId: string): Promise<DecodedMap> {
  let p = cache.get(gameId);
  if (!p) {
    p = api.map(gameId).then(async (m) => {
      const frames = await Promise.all(m.frames.map(async (f) => new Uint16Array(await gunzip(f.data))));
      const land = m.terrain ? new Uint8Array(await gunzip(m.terrain)) : null;
      return {
        width: m.width,
        height: m.height,
        frameEvery: m.frameEvery ?? 300,
        frameScale: m.frameScale ?? 1,
        ticks: m.ticks ?? m.frames[m.frames.length - 1]?.tick ?? 0,
        frameTicks: m.frames.map((f) => f.tick),
        frames,
        land,
        me: m.me,
        players: new Map(m.players.map((p) => [p.smallID, p])),
      };
    });
    p.catch(() => cache.delete(gameId));
    cache.set(gameId, p);
  }
  return p;
}

export function useDecodedMap(gameId: string) {
  const [map, setMap] = useState<DecodedMap | null>(null);
  const [err, setErr] = useState<string | null>(null);
  useEffect(() => {
    let alive = true;
    setMap(null);
    loadMap(gameId)
      .then((m) => alive && setMap(m))
      .catch((e) => alive && setErr(String(e?.message ?? e)));
    return () => {
      alive = false;
    };
  }, [gameId]);
  return { map, err };
}

/** Index of the first frame at or after `tick`. */
export function frameAt(map: DecodedMap, tick: number) {
  const i = map.frameTicks.findIndex((t) => t >= tick);
  return i < 0 ? map.frameTicks.length - 1 : i;
}
