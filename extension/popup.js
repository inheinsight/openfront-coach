const STATUS = {
  playing: "In progress — the debrief starts when the game ends",
  queued: "Queued",
  waiting_archive: "Waiting for OpenFront to archive the game",
  replaying: "Replaying the game",
  analyzing: "Analyzing",
  done: "Debrief ready",
  error: "Couldn't analyze",
};

async function coachUrl() {
  const { coachUrl } = await chrome.storage.local.get("coachUrl");
  return coachUrl || "http://127.0.0.1:5317";
}

async function render() {
  const base = await coachUrl();
  const dash = base.replace("127.0.0.1", "localhost");
  document.getElementById("url").value = base;
  document.getElementById("open").onclick = (e) => {
    e.preventDefault();
    chrome.tabs.create({ url: dash });
  };
  const conn = document.getElementById("conn");
  try {
    const h = await (await fetch(`${base}/api/health`)).json();
    conn.textContent = "Coach running";
    conn.className = "conn ok";
    void h;
  } catch {
    conn.textContent = "Coach offline";
    conn.className = "conn bad";
  }
  const { games = {}, identity = {} } = await chrome.storage.local.get(["games", "identity"]);
  document.getElementById("who").textContent = identity.username
    ? `Playing as ${identity.username}${identity.publicId ? ` (${identity.publicId})` : ""}`
    : "Play a game on openfront.io and it will show up here.";
  const list = document.getElementById("games");
  list.textContent = "";
  for (const g of Object.values(games).sort((a, b) => b.seenAt - a.seenAt).slice(0, 8)) {
    const a = document.createElement("a");
    a.className = "game";
    a.href = "#";
    a.onclick = (e) => {
      e.preventDefault();
      chrome.tabs.create({ url: `${dash}/game/${g.gameId}` });
    };
    const grade = document.createElement("div");
    grade.className = "grade";
    grade.textContent = g.status === "done" ? g.grade ?? "" : "…";
    const body = document.createElement("div");
    const t = document.createElement("div");
    t.className = "title";
    t.textContent = g.map || g.gameId;
    const s = document.createElement("div");
    s.className = "sub";
    s.textContent = g.coachError && !g.sent ? `Not sent yet: ${g.coachError}` : STATUS[g.status] || g.status;
    body.append(t, s);
    a.append(grade, body);
    list.append(a);
  }
}

document.getElementById("save").onclick = async () => {
  const v = document.getElementById("url").value.trim().replace(/\/$/, "");
  await chrome.storage.local.set({ coachUrl: v || "http://127.0.0.1:5317" });
  render();
};
render();
