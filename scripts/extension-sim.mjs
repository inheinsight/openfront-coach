// Runs the real extension code (content.js + background.js) in a Node VM
// with a simulated Chrome API, so it can be exercised against the real
// coach without loading it into a browser.
//
// Usage: node scripts/extension-sim.mjs <openfront game URL> <username> [publicId]
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";

export function makeChrome({ fetchImpl = fetch } = {}) {
  const store = {};
  const listeners = { message: [], webRequest: [], alarm: [], notifClick: [], installed: [], startup: [] };
  const notifications = [];
  const posted = [];
  const chrome = {
    storage: {
      local: {
        get: async (keys) => {
          const ks = typeof keys === "string" ? [keys] : Array.isArray(keys) ? keys : Object.keys(store);
          return Object.fromEntries(ks.filter((k) => k in store).map((k) => [k, structuredClone(store[k])]));
        },
        set: async (obj) => Object.assign(store, structuredClone(obj)),
      },
    },
    runtime: {
      sendMessage: async (msg) => {
        for (const l of listeners.message) l(msg);
      },
      onMessage: { addListener: (f) => listeners.message.push(f) },
      onInstalled: { addListener: (f) => listeners.installed.push(f) },
      onStartup: { addListener: (f) => listeners.startup.push(f) },
    },
    webRequest: { onBeforeRequest: { addListener: (f) => listeners.webRequest.push(f) } },
    alarms: { create: () => {}, onAlarm: { addListener: (f) => listeners.alarm.push(f) } },
    notifications: {
      create: (id, opts) => notifications.push({ id, ...opts }),
      onClicked: { addListener: (f) => listeners.notifClick.push(f) },
    },
    tabs: { create: () => {} },
  };
  const trackingFetch = async (url, init) => {
    if (init?.method === "POST") posted.push({ url, body: JSON.parse(init.body) });
    return fetchImpl(url, init);
  };
  return { chrome, store, listeners, notifications, posted, fetch: trackingFetch };
}

export function loadExtension({ url, localStorage = {}, fetchImpl } = {}) {
  const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), "../extension");
  const sim = makeChrome({ fetchImpl });
  const loc = new URL(url);
  const timers = [];
  const ls = {
    getItem: (k) => (k in localStorage ? localStorage[k] : null),
    key: (i) => Object.keys(localStorage)[i] ?? null,
    get length() {
      return Object.keys(localStorage).length;
    },
  };
  const bgCtx = vm.createContext({ chrome: sim.chrome, fetch: sim.fetch, console, URL, setTimeout, structuredClone });
  vm.runInContext(fs.readFileSync(path.join(root, "background.js"), "utf8"), bgCtx);
  const pageCtx = vm.createContext({
    chrome: sim.chrome,
    location: { pathname: loc.pathname, hostname: loc.hostname, hash: loc.hash, search: loc.search, href: loc.href },
    localStorage: ls,
    window: { addEventListener: () => {} },
    setInterval: (f, ms) => timers.push(setInterval(f, ms)),
    console,
  });
  vm.runInContext(fs.readFileSync(path.join(root, "content.js"), "utf8"), pageCtx);
  return {
    ...sim,
    navigate(nextUrl) {
      const u = new URL(nextUrl);
      Object.assign(pageCtx.location, { pathname: u.pathname, hostname: u.hostname, hash: u.hash, search: u.search, href: u.href });
    },
    request(requestUrl) {
      for (const l of sim.listeners.webRequest) l({ url: requestUrl });
    },
    async alarm() {
      for (const l of sim.listeners.alarm) await l({ name: "poll" });
    },
    stop() {
      timers.forEach(clearInterval);
    },
  };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const [url, username, publicId] = process.argv.slice(2);
  if (!url) throw new Error("usage: extension-sim <game url> <username> [publicId]");
  const localStorage = { username };
  if (publicId) localStorage["cached_public_id_00000000-0000-0000-0000-000000000000"] = publicId;
  const ext = loadExtension({ url, localStorage });
  await new Promise((r) => setTimeout(r, 1500));
  ext.navigate("https://openfront.io/"); // you leave the game
  await new Promise((r) => setTimeout(r, 2500));
  console.log("Extension posted to the coach:");
  for (const p of ext.posted) console.log(" ", p.url, JSON.stringify(p.body));
  console.log("Extension storage:", JSON.stringify(ext.store.games));
  ext.stop();
}
