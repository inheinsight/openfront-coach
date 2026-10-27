// OpenFront Coach background service worker.
//
// Records the games you play and forwards them to your local coach
// (http://127.0.0.1:5317). Notifies you only once a debrief is ready, which
// is necessarily after the game has ended and been archived by OpenFront.

const DEFAULT_COACH = "http://127.0.0.1:5317";
const FINAL = new Set(["done", "error"]);

async function coachUrl() {
  const { coachUrl } = await chrome.storage.local.get("coachUrl");
  return coachUrl || DEFAULT_COACH;
}

// All changes to stored games go through one queue: events (page messages,
// heartbeats, alarms) arrive concurrently, and unserialized
// read-modify-write cycles would overwrite each other.
let queue = Promise.resolve();
function mutate(fn) {
  const run = queue.then(async () => {
    const { games = {}, identity = {} } = await chrome.storage.local.get(["games", "identity"]);
    const result = await fn(games, identity);
    const kept = Object.entries(games).sort((a, b) => b[1].seenAt - a[1].seenAt).slice(0, 50);
    await chrome.storage.local.set({ games: Object.fromEntries(kept), identity });
    return result;
  });
  queue = run.catch(() => {});
  return run;
}

async function snapshot() {
  await queue;
  const { games = {}, identity = {} } = await chrome.storage.local.get(["games", "identity"]);
  return { games, identity };
}

function rememberIdentity(id) {
  if (!id || (!id.username && !id.publicId)) return Promise.resolve();
  return mutate((_games, identity) => {
    for (const [k, v] of Object.entries(id)) if (v) identity[k] = v;
  });
}

async function track(gameId, info = {}) {
  const needsSend = await mutate((games, identity) => {
    const g = games[gameId] || { gameId, seenAt: Date.now(), status: "playing", sent: false };
    g.username = info.username || g.username || identity.username || null;
    g.publicId = info.publicId || g.publicId || identity.publicId || null;
    g.source = info.source || g.source || "extension";
    if (info.ended) g.endedAt = g.endedAt || Date.now();
    games[gameId] = g;
    return !g.sent;
  });
  if (needsSend) await send(gameId);
}

async function send(gameId) {
  const { games } = await snapshot();
  const g = games[gameId];
  if (!g || g.sent || FINAL.has(g.status)) return;
  let ok = false;
  let error = null;
  try {
    const res = await fetch(`${await coachUrl()}/api/games/track`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ gameId, username: g.username, publicId: g.publicId, source: g.source }),
    });
    ok = res.ok;
    if (!ok) error = `coach replied ${res.status}`;
  } catch {
    error = "coach not running";
  }
  await mutate((games2) => {
    const cur = games2[gameId];
    if (!cur) return;
    cur.sent = cur.sent || ok;
    cur.coachError = ok ? null : error;
  });
}

chrome.runtime.onMessage.addListener((msg) => {
  if (!msg || typeof msg !== "object") return;
  const id = { username: msg.username || null, publicId: msg.publicId || null };
  if (msg.type === "identity") rememberIdentity(id);
  if (msg.type === "game-seen") rememberIdentity(id).then(() => track(msg.gameId, { ...id, source: "extension" }));
  if (msg.type === "game-left") track(msg.gameId, { ...id, ended: true });
});

// Single-player games run entirely in the browser; OpenFront's client pings
// a heartbeat with the game ID while one runs and archives it at the end.
// Observing those request URLs (never their contents) tells us which
// single-player game you played and when it finished.
chrome.webRequest.onBeforeRequest.addListener(
  (details) => {
    const hb = details.url.match(/\/api\/singleplayer\/([A-Za-z0-9_-]{6,40})\/heartbeat/);
    if (hb) {
      chrome.storage.local.set({ lastSingleplayer: hb[1] });
      track(hb[1], { source: "singleplayer" });
    }
    if (/\/archive_singleplayer_game/.test(details.url)) {
      chrome.storage.local.get("lastSingleplayer").then(({ lastSingleplayer }) => {
        if (lastSingleplayer) track(lastSingleplayer, { source: "singleplayer", ended: true });
      });
    }
  },
  { urls: ["*://*.openfront.io/*", "*://openfront.io/*"] },
);

// Every minute: resend anything the coach missed, and pick up finished
// debriefs. Created only if missing: re-creating an alarm reschedules it,
// and the worker restarts often.
chrome.alarms.get("poll").then((a) => {
  if (!a) chrome.alarms.create("poll", { periodInMinutes: 1 });
});
chrome.alarms.onAlarm.addListener((a) => {
  if (a.name === "poll") return poll();
});

async function poll() {
  const { games } = await snapshot();
  const base = await coachUrl();
  for (const g of Object.values(games)) {
    if (FINAL.has(g.status) || Date.now() - g.seenAt > 12 * 3600 * 1000) continue;
    if (!g.sent) await send(g.gameId);
    let summary;
    try {
      const res = await fetch(`${base}/api/games/${encodeURIComponent(g.gameId)}`);
      if (!res.ok) continue;
      summary = (await res.json()).summary;
    } catch {
      continue; // coach offline; try next minute
    }
    const ready = await mutate((games2) => {
      const cur = games2[g.gameId];
      if (!cur || cur.status === summary.status) return false;
      const was = cur.status;
      Object.assign(cur, { status: summary.status, grade: summary.grade, map: summary.map, headline: summary.headline });
      return was !== "done" && summary.status === "done" ? { ...cur } : false;
    });
    if (ready) notifyReady(ready);
  }
}

function notifyReady(g) {
  chrome.notifications.create(`debrief:${g.gameId}`, {
    type: "basic",
    iconUrl: "icons/icon128.png",
    title: `Debrief ready: ${g.grade ?? ""} on ${g.map ?? "your last game"}`,
    message: g.headline ?? "Your coach has reviewed the game.",
    priority: 1,
  });
}

chrome.notifications.onClicked.addListener(async (id) => {
  if (!id.startsWith("debrief:")) return;
  chrome.tabs.create({ url: `${(await coachUrl()).replace("127.0.0.1", "localhost")}/game/${encodeURIComponent(id.slice(8))}` });
});

chrome.runtime.onInstalled.addListener(() => poll());
chrome.runtime.onStartup.addListener(() => poll());
