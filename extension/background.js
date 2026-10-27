// OpenFront Coach background service worker.
//
// Records the games you play and forwards them to your local coach
// (http://127.0.0.1:5317). Notifies you only once a debrief is ready, which
// is necessarily after the game has ended and been archived by OpenFront.

const DEFAULT_COACH = "http://127.0.0.1:5317";

async function coachUrl() {
  const { coachUrl } = await chrome.storage.local.get("coachUrl");
  return coachUrl || DEFAULT_COACH;
}

async function getState() {
  const { games = {}, identity = {} } = await chrome.storage.local.get(["games", "identity"]);
  return { games, identity };
}

async function saveGames(games) {
  // Keep the 50 most recent.
  const entries = Object.entries(games).sort((a, b) => b[1].seenAt - a[1].seenAt).slice(0, 50);
  await chrome.storage.local.set({ games: Object.fromEntries(entries) });
}

async function rememberIdentity(id) {
  if (!id || (!id.username && !id.publicId)) return;
  const { identity } = await getState();
  const next = { ...identity, ...Object.fromEntries(Object.entries(id).filter(([, v]) => v)) };
  await chrome.storage.local.set({ identity: next });
}

async function track(gameId, info = {}) {
  const { games, identity } = await getState();
  const g = games[gameId] || { gameId, seenAt: Date.now(), status: "playing", sent: false };
  g.username = info.username || g.username || identity.username || null;
  g.publicId = info.publicId || g.publicId || identity.publicId || null;
  g.source = info.source || g.source || "extension";
  if (info.ended) g.endedAt = g.endedAt || Date.now();
  games[gameId] = g;
  await saveGames(games);
  await send(gameId);
}

async function send(gameId) {
  const { games } = await getState();
  const g = games[gameId];
  if (!g) return;
  try {
    const res = await fetch(`${await coachUrl()}/api/games/track`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ gameId, username: g.username, publicId: g.publicId, source: g.source }),
    });
    if (res.ok) {
      g.sent = true;
      g.coachError = null;
    } else {
      g.coachError = `coach replied ${res.status}`;
    }
  } catch {
    g.coachError = "coach not running";
  }
  games[gameId] = g;
  await saveGames(games);
}

chrome.runtime.onMessage.addListener((msg) => {
  if (!msg || typeof msg !== "object") return;
  const id = { username: msg.username || null, publicId: msg.publicId || null };
  if (msg.type === "identity") rememberIdentity(id);
  if (msg.type === "game-seen") {
    rememberIdentity(id);
    track(msg.gameId, { ...id, source: "extension" });
  }
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
      track(hb[1], { source: "singleplayer" });
      chrome.storage.local.set({ lastSingleplayer: hb[1] });
    }
    if (/\/archive_singleplayer_game/.test(details.url)) {
      chrome.storage.local.get("lastSingleplayer").then(({ lastSingleplayer }) => {
        if (lastSingleplayer) track(lastSingleplayer, { source: "singleplayer", ended: true });
      });
    }
  },
  { urls: ["*://*.openfront.io/*", "*://openfront.io/*"] },
);

// Every minute: resend anything the coach missed, and pick up finished debriefs.
chrome.alarms.create("poll", { periodInMinutes: 1 });
chrome.alarms.onAlarm.addListener(async (a) => {
  if (a.name !== "poll") return;
  await poll();
});

async function poll() {
  const { games } = await getState();
  const base = await coachUrl();
  for (const g of Object.values(games)) {
    if (!g.sent) await send(g.gameId);
    if (g.status === "done" || g.status === "error" || Date.now() - g.seenAt > 12 * 3600 * 1000) continue;
    try {
      const res = await fetch(`${base}/api/games/${g.gameId}`);
      if (!res.ok) continue;
      const { summary } = await res.json();
      if (summary.status !== g.status) {
        g.status = summary.status;
        g.grade = summary.grade;
        g.map = summary.map;
        g.headline = summary.headline;
        if (summary.status === "done") notifyReady(g);
      }
    } catch {
      // coach offline; try next minute
    }
  }
  await saveGames(games);
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
  chrome.tabs.create({ url: `${(await coachUrl()).replace("127.0.0.1", "localhost")}/game/${id.slice(8)}` });
});

chrome.runtime.onInstalled.addListener(() => poll());
chrome.runtime.onStartup.addListener(() => poll());
