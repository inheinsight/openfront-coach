import express, { type NextFunction, type Request, type Response } from "express";
import fs from "node:fs";
import path from "node:path";
import { config } from "../config.js";
import { deleteGame, getGame, getSettings, learnIdentity, listGames, loadAnalysis, trends, updateSettings, type Identity } from "../db/db.js";
import { bus, enqueue, startWorker, syncFromPublicId } from "../jobs/pipeline.js";
import { loadCachedReplay } from "../engine/replay.js";
import { importRecordFile } from "../openfront/api.js";
import { jevAvailable } from "../ai/jev.js";
import { askCoach } from "../ai/narrator.js";
import { execFileSync } from "node:child_process";

const app = express();
app.disable("x-powered-by");
app.use(express.json({ limit: "64mb" }));

// Only this dashboard (same origin) and the coach's Chrome extension may call
// the API from a browser. Any other web page gets no CORS headers, so it
// can't read responses or send JSON requests to your local coach.
app.use((req: Request, res: Response, next: NextFunction) => {
  const origin = req.headers.origin;
  if (origin && origin.startsWith("chrome-extension://")) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");
    if (req.method === "OPTIONS") return void res.sendStatus(204);
  } else if (origin && !origin.startsWith(`http://localhost:${config.port}`) && !origin.startsWith(`http://127.0.0.1:${config.port}`)) {
    if (req.method !== "GET") return void res.status(403).json({ error: "origin not allowed" });
  }
  next();
});

const GAME_ID = /^[A-Za-z0-9_-]{4,40}$/;
function parseGameId(input: string): string | null {
  const s = input.trim();
  const m = s.match(/(?:game|replay-viewer=|join=|replay\.[^/]+\/)\/?([A-Za-z0-9_-]{6,40})/) ?? s.match(/^([A-Za-z0-9_-]{6,40})$/);
  return m && GAME_ID.test(m[1]) ? m[1] : null;
}

let claudeAvailable: boolean | null = null;
function hasClaude() {
  if (claudeAvailable === null) {
    try {
      execFileSync(config.claudeBin, ["--version"], { stdio: "ignore", timeout: 10_000 });
      claudeAvailable = true;
    } catch {
      claudeAvailable = false;
    }
  }
  return claudeAvailable;
}

app.get("/api/health", (_req, res) => {
  res.json({
    ok: true,
    app: "openfront-coach",
    version: "0.1.0",
    jev: jevAvailable(),
    narrator: config.narrator !== "off" && hasClaude(),
    settings: getSettings(),
  });
});

app.get("/api/settings", (_req, res) => res.json(getSettings()));
app.put("/api/settings", (req, res) => {
  const b = req.body ?? {};
  const patch: Record<string, unknown> = {};
  if (Array.isArray(b.usernames)) patch.usernames = b.usernames.map(String).map((s: string) => s.trim()).filter(Boolean).slice(0, 12);
  if (typeof b.publicId === "string" || b.publicId === null) patch.publicId = b.publicId ? String(b.publicId).trim() : null;
  for (const k of ["autoSync", "useJev", "useNarrator"]) if (typeof b[k] === "boolean") patch[k] = b[k];
  res.json(updateSettings(patch));
});

/** Called by the Chrome extension when you join a game and again when it ends. */
app.post("/api/games/track", (req, res) => {
  const b = req.body ?? {};
  const gameId = typeof b.gameId === "string" ? parseGameId(b.gameId) : null;
  if (!gameId) return void res.status(400).json({ error: "gameId required" });
  const identity: Identity = {
    clientID: typeof b.clientId === "string" ? b.clientId : null,
    publicId: typeof b.publicId === "string" ? b.publicId : null,
    username: typeof b.username === "string" ? b.username.slice(0, 40) : null,
  };
  learnIdentity(identity);
  const row = enqueue(gameId, typeof b.source === "string" ? b.source.slice(0, 20) : "extension", identity, { waitForArchive: true });
  res.json({ gameId, status: row.status });
});

app.post("/api/games/import", (req, res) => {
  const b = req.body ?? {};
  if (b.record && typeof b.record === "object") {
    const tmp = path.join(config.dataDir, `import-${Date.now()}.json`);
    fs.mkdirSync(config.dataDir, { recursive: true });
    fs.writeFileSync(tmp, JSON.stringify(b.record));
    importRecordFile(tmp)
      .then((r) => {
        fs.rmSync(tmp, { force: true });
        const row = enqueue(r.info.gameID, "import", { username: b.username ?? null }, { force: true });
        res.json({ gameId: row.game_id, status: row.status });
      })
      .catch((e) => res.status(400).json({ error: String(e?.message ?? e) }));
    return;
  }
  const gameId = typeof b.game === "string" ? parseGameId(b.game) : null;
  if (!gameId) return void res.status(400).json({ error: "Paste a game ID or an openfront.io game/replay link." });
  const row = enqueue(gameId, "manual", { username: typeof b.username === "string" ? b.username : null }, { force: !!b.force });
  res.json({ gameId, status: row.status });
});

app.post("/api/games/:id/reanalyze", (req, res) => {
  const row = getGame(req.params.id);
  if (!row) return void res.status(404).json({ error: "unknown game" });
  const r = enqueue(row.game_id, row.source, JSON.parse(row.identity_json || "{}"), { force: true });
  res.json({ gameId: r.game_id, status: r.status });
});

app.post("/api/sync", (_req, res) => {
  syncFromPublicId(15)
    .then((r) => res.json(r))
    .catch((e) => res.status(502).json({ error: String(e?.message ?? e) }));
});

app.get("/api/games", (_req, res) => res.json(listGames()));

app.get("/api/games/:id", (req, res) => {
  const row = getGame(req.params.id);
  if (!row) return void res.status(404).json({ error: "unknown game" });
  const { analysis_gz: _a, trend_json: _t, ...summary } = row;
  res.json({ summary, analysis: loadAnalysis(row.game_id) });
});

app.delete("/api/games/:id", (req, res) => {
  deleteGame(req.params.id);
  res.json({ ok: true });
});

/** Ownership frames for the map viewer. */
app.get("/api/games/:id/map", (req, res) => {
  const replay = loadCachedReplay(req.params.id);
  const analysis = loadAnalysis(req.params.id);
  if (!replay) return void res.status(404).json({ error: "no replay for this game" });
  const tracked = new Set(Object.keys(replay.samples.series).map(Number));
  res.json({
    width: replay.meta.frameWidth,
    height: replay.meta.frameHeight,
    terrain: replay.terrain,
    frames: replay.frames,
    me: analysis?.me.smallID ?? null,
    players: replay.players.filter((p) => tracked.has(p.smallID) || p.type === "Bot").map((p) => ({ smallID: p.smallID, name: p.name, type: p.type, team: p.team })),
  });
});

app.post("/api/games/:id/ask", (req, res) => {
  const a = loadAnalysis(req.params.id);
  const q = typeof req.body?.question === "string" ? req.body.question.trim() : "";
  if (!a) return void res.status(404).json({ error: "not analyzed yet" });
  if (!q) return void res.status(400).json({ error: "question required" });
  if (!hasClaude()) return void res.status(503).json({ error: "Claude Code CLI not found; install it to ask follow-up questions." });
  askCoach(a, q)
    .then((answer) => res.json({ answer }))
    .catch((e) => res.status(502).json({ error: String(e?.message ?? e) }));
});

app.get("/api/trends", (_req, res) => {
  res.json(trends().map((t) => ({ ...t, trend_json: undefined, metrics: JSON.parse(t.trend_json) })));
});

app.get("/api/events", (req, res) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders();
  const send = (g: unknown) => res.write(`event: game\ndata: ${JSON.stringify(g)}\n\n`);
  bus.on("game", send);
  const ping = setInterval(() => res.write(": ping\n\n"), 25_000);
  req.on("close", () => {
    clearInterval(ping);
    bus.off("game", send);
  });
});

// Dashboard
if (fs.existsSync(config.webDistDir)) {
  app.use(express.static(config.webDistDir, { index: false, maxAge: "1h" }));
  app.get(/^\/(?!api\/).*/, (_req, res) => res.sendFile(path.join(config.webDistDir, "index.html")));
} else {
  app.get("/", (_req, res) => res.type("text").send("Dashboard not built yet. Run: npm run build:web"));
}

app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  res.status(500).json({ error: err.message });
});

startWorker();
app.listen(config.port, "127.0.0.1", () => {
  console.log(`OpenFront Coach running at http://localhost:${config.port}`);
  console.log(`  Jev judge: ${jevAvailable() ? "on" : "off (set TYPESAFE_API_KEY in .env)"}`);
  console.log(`  Narrator: ${config.narrator === "off" ? "templates" : hasClaude() ? "claude -p (your Claude subscription)" : "templates (Claude Code CLI not found)"}`);
});
