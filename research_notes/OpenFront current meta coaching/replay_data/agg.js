// Aggregate the per-game extractions into research tables.
const fs = require("fs");
const OUT = __dirname + "/out";
const games = fs.readdirSync(OUT).filter((f) => f.endsWith(".json")).map((f) => JSON.parse(fs.readFileSync(OUT + "/" + f)));

const fin = (x) => typeof x === "number" && Number.isFinite(x);
const q = (xs, p) => {
  const v = xs.filter(fin).sort((a, b) => a - b);
  if (!v.length) return null;
  const i = (v.length - 1) * p;
  const lo = Math.floor(i), hi = Math.ceil(i);
  return v[lo] + (v[hi] - v[lo]) * (i - lo);
};
const med = (xs) => q(xs, 0.5);
const mean = (xs) => {
  const v = xs.filter(fin);
  return v.length ? v.reduce((a, b) => a + b, 0) / v.length : null;
};
const cnt = (xs) => xs.filter(fin).length;
// AUC: P(a > b) for a in A, b in B (ties 0.5)
function auc(A, B) {
  A = A.filter(fin); B = B.filter(fin);
  if (!A.length || !B.length) return null;
  let s = 0;
  for (const a of A) for (const b of B) s += a > b ? 1 : a === b ? 0.5 : 0;
  return s / (A.length * B.length);
}
function rankArr(v) {
  const idx = v.map((x, i) => [x, i]).sort((a, b) => a[0] - b[0]);
  const r = new Array(v.length);
  for (let i = 0; i < idx.length; ) {
    let j = i;
    while (j + 1 < idx.length && idx[j + 1][0] === idx[i][0]) j++;
    for (let k = i; k <= j; k++) r[idx[k][1]] = (i + j) / 2 + 1;
    i = j + 1;
  }
  return r;
}
function spearman(x, y) {
  const pairs = x.map((a, i) => [a, y[i]]).filter(([a, b]) => fin(a) && fin(b));
  if (pairs.length < 5) return null;
  const rx = rankArr(pairs.map((p) => p[0])), ry = rankArr(pairs.map((p) => p[1]));
  const mx = mean(rx), my = mean(ry);
  let num = 0, dx = 0, dy = 0;
  for (let i = 0; i < rx.length; i++) {
    num += (rx[i] - mx) * (ry[i] - my);
    dx += (rx[i] - mx) ** 2;
    dy += (ry[i] - my) ** 2;
  }
  return num / Math.sqrt(dx * dy);
}
const f1 = (x, d = 1) => (x === null || x === undefined || !fin(x) ? "—" : x.toFixed(d));
const pc = (x, d = 0) => (x === null || x === undefined || !fin(x) ? "—" : (x * 100).toFixed(d) + "%");
const k = (x) => (x === null || !fin(x) ? "—" : Math.abs(x) >= 1e6 ? (x / 1e6).toFixed(2) + "M" : Math.abs(x) >= 1e3 ? (x / 1e3).toFixed(0) + "k" : x.toFixed(0));
const mmss = (s) => (s === null || !fin(s) ? "—" : `${Math.floor(s / 60)}:${String(Math.round(s % 60)).padStart(2, "0")}`);

const userGames = games.filter((g) => g.rows.some((r) => r.isMe));
const otherGames = games.filter((g) => !g.rows.some((r) => r.isMe));
const section = (t) => console.log("\n==== " + t + " ====");

// ---------------------------------------------------------------- inventory
section("INVENTORY");
for (const g of [...games].sort((a, b) => a.game.start.localeCompare(b.game.start))) {
  const G = g.game;
  const me = g.rows.find((r) => r.isMe);
  console.log(
    [G.id, G.start.slice(0, 16), G.commit, G.harness.replace(G.id + ".", "").replace(".json.gz", ""), G.mode, "teams=" + G.teams, G.map, "humans=" + G.humansSpawned, "nations=" + G.nations, "dur=" + mmss(G.durationSec),
      me ? `ME team=${me.team} won=${me.won} peakRank=${me.peakRank}/${g.rows.length} peak=${pc(me.peakShare, 1)} final=${pc(me.finalShare, 1)} life=${mmss(me.lifeSec)}` : "(no user)"].join(" | "),
  );
}

// group helpers
const isActive = (r) => (r.sends?.nAttackIntents ?? 0) >= 5 && r.lifeSec >= 120;
function groups(gs) {
  const rows = gs.flatMap((g) => g.rows.map((r) => ({ ...r, G: g.game })));
  const team = rows.filter((r) => r.G.mode === "Team");
  return {
    rows,
    W: rows.filter((r) => r.won),
    L: rows.filter((r) => !r.won),
    T5: rows.filter((r) => r.peakRank <= 5),
    T1: rows.filter((r) => r.peakRank === 1),
    REST: rows.filter((r) => r.peakRank > 5),
    RESTA: rows.filter((r) => r.peakRank > 5 && isActive(r)),
    ALLA: rows.filter(isActive),
    ME: rows.filter((r) => r.isMe),
    teamRows: team,
  };
}
function table(title, gsets, metrics) {
  console.log("\n-- " + title);
  const names = Object.keys(gsets);
  console.log(["metric", ...names.map((n) => `${n}(n=${gsets[n].length})`)].join(" | "));
  for (const [label, get, fmt] of metrics) {
    console.log([label, ...names.map((n) => {
      const vals = gsets[n].map(get);
      const c = cnt(vals);
      return `${fmt(med(vals))} [${fmt(q(vals, 0.25))}–${fmt(q(vals, 0.75))}] n${c}`;
    })].join(" | "));
  }
}
function share(title, gsets, preds) {
  console.log("\n-- " + title);
  const names = Object.keys(gsets);
  console.log(["share", ...names.map((n) => `${n}(n=${gsets[n].length})`)].join(" | "));
  for (const [label, pred] of preds) {
    console.log([label, ...names.map((n) => {
      const rows = gsets[n];
      const hit = rows.filter(pred).length;
      return `${pc(rows.length ? hit / rows.length : null)} (${hit})`;
    })].join(" | "));
  }
}

for (const [scopeName, gs] of [
  ["TEAM, h10 replays (structures+income series)", games.filter((g) => g.game.mode === "Team" && g.game.hasStructs)],
  ["FFA, h10 replays", games.filter((g) => g.game.mode !== "Team" && g.game.hasStructs)],
  ["TEAM, older h6/h7 replays (orders only, no income series)", games.filter((g) => g.game.mode === "Team" && !g.game.hasStructs)],
  ["FFA, older h6/h8 replays", games.filter((g) => g.game.mode !== "Team" && !g.game.hasStructs)],
]) {
  if (!gs.length) continue;
  section(scopeName + ` (${gs.length} games)`);
  const S = groups(gs);
  const sets = { WIN: S.W, TOP5: S.T5, TOP1: S.T1, REST_ACTIVE: S.RESTA, ALL: S.rows, ME: S.ME };
  table("Outcome", sets, [
    ["peak share", (r) => r.peakShare, (x) => pc(x, 1)],
    ["final share", (r) => r.finalShare, (x) => pc(x, 1)],
    ["life min", (r) => r.lifeSec / 60, (x) => f1(x)],
    ["APM", (r) => r.apm, (x) => f1(x)],
  ]);
  table("Expansion: land share after spawn", sets, [
    ["share 0:30", (r) => r.shares["30"], (x) => pc(x, 2)],
    ["share 1:00", (r) => r.shares["60"], (x) => pc(x, 2)],
    ["share 2:00", (r) => r.shares["120"], (x) => pc(x, 2)],
    ["share 5:00", (r) => r.shares["300"], (x) => pc(x, 2)],
    ["share 10:00", (r) => r.shares["600"], (x) => pc(x, 2)],
    ["rank 1:00", (r) => r.ranks["60"], (x) => f1(x, 0)],
    ["rank 2:00", (r) => r.ranks["120"], (x) => f1(x, 0)],
    ["rank 5:00", (r) => r.ranks["300"], (x) => f1(x, 0)],
    ["rank 10:00", (r) => r.ranks["600"], (x) => f1(x, 0)],
    ["first expansion delay s", (r) => r.firstExpDelay, (x) => f1(x, 1)],
    ["spawn pick s", (r) => r.spawnSec, (x) => f1(x, 1)],
  ]);
  table("Troops (share of life after spawn)", sets, [
    ["avg troops/cap", (r) => r.troops.avgRatio, (x) => pc(x)],
    ["coach regen eff", (r) => r.troops.eff, (x) => pc(x)],
    ["near regen peak 30–55%", (r) => r.troops.nearPeak, (x) => pc(x)],
    ["55–88%", (r) => r.troops.mid55_88, (x) => pc(x)],
    ["≥88% (near cap)", (r) => r.troops.cap88, (x) => pc(x)],
    ["<30%", (r) => r.troops.below30, (x) => pc(x)],
    ["<15%", (r) => r.troops.low15, (x) => pc(x)],
    ["idle at cap (≥88%, no attack) s", (r) => r.troops.idleCapSec, (x) => f1(x, 0)],
    ["early(0-5m) avg ratio", (r) => r.troops.phases.early?.avg, (x) => pc(x)],
    ["mid(5-15m) avg ratio", (r) => r.troops.phases.mid?.avg, (x) => pc(x)],
    ["late(15m+) avg ratio", (r) => r.troops.phases.late?.avg, (x) => pc(x)],
    ["mid(5-15m) ≥88%", (r) => r.troops.phases.mid?.cap88, (x) => pc(x)],
    ["peak troops", (r) => r.troops.peakTroops, k],
  ]);
  const atkStat = (r, fn) => fn(r.atk.filter((a) => a[9] === 0)); // exclude attacks on teammates (should not exist)
  table("Attacks on players (records, excl. merged)", sets, [
    ["# attacks", (r) => atkStat(r, (a) => a.length), (x) => f1(x, 0)],
    ["median stack/defender army", (r) => atkStat(r, (a) => med(a.map((x) => x[1]))), (x) => f1(x, 2)],
    ["median send ratio (sent/(sent+left))", (r) => atkStat(r, (a) => med(a.map((x) => x[2]))), (x) => pc(x)],
    ["share stacks <0.6× defender", (r) => atkStat(r, (a) => (a.length ? a.filter((x) => fin(x[1]) && x[1] < 0.6).length / a.length : null)), (x) => pc(x)],
    ["share stacks ≥1.7× defender", (r) => atkStat(r, (a) => (a.length ? a.filter((x) => fin(x[1]) && x[1] >= 1.7).length / a.length : null)), (x) => pc(x)],
    ["pooled tiles per 1k troops used", (r) => atkStat(r, (a) => { const u = a.reduce((s, x) => s + x[3], 0); return u > 0 ? (a.reduce((s, x) => s + x[4], 0) / u) * 1000 : null; }), (x) => f1(x, 1)],
    ["naval share", (r) => atkStat(r, (a) => (a.length ? a.filter((x) => x[5]).length / a.length : null)), (x) => pc(x)],
    ["retreats", (r) => r.retreats, (x) => f1(x, 0)],
    ["eliminations (conquests)", (r) => r.conquests, (x) => f1(x, 0)],
    ["tiles/1k vs bots", (r) => (r.attackPool.Bot?.used ? (r.attackPool.Bot.tiles / r.attackPool.Bot.used) * 1000 : null), (x) => f1(x, 1)],
    ["tiles/1k vs unclaimed", (r) => (r.attackPool.TerraNullius?.used ? (r.attackPool.TerraNullius.tiles / r.attackPool.TerraNullius.used) * 1000 : null), (x) => f1(x, 1)],
    ["troops used vs bots / total used", (r) => { const t = Object.values(r.attackPool).reduce((s, p) => s + p.used, 0); return t ? (r.attackPool.Bot?.used ?? 0) / t : null; }, (x) => pc(x)],
  ]);
  table("Send ratios (intents: sent / troops at click)", sets, [
    ["first send", (r) => r.sends.firstSend, (x) => pc(x)],
    ["opening (≤2:00) unclaimed", (r) => r.sends.openingTN, (x) => pc(x)],
    ["vs players ≤5:00", (r) => r.sends.playersEarly, (x) => pc(x)],
    ["vs players 5–15", (r) => r.sends.playersMid, (x) => pc(x)],
    ["vs players 15+", (r) => r.sends.playersLate, (x) => pc(x)],
    ["vs bots", (r) => r.sends.bots, (x) => pc(x)],
    ["attack intents/min", (r) => r.sends.nAttackIntents / Math.max(1, r.lifeSec / 60), (x) => f1(x, 1)],
  ]);
  const hasS = S.rows.some((r) => r.G.hasStructs);
  const fb = (T) => (r) => (r.G.hasStructs ? r.firstBuilt[T] : r.firstOrder[T]);
  table(`First build (s after spawn; ${hasS ? "structures" : "orders"}; only builders)`, sets, [
    ["City", fb("City"), mmss],
    ["Port", fb("Port"), mmss],
    ["Factory", fb("Factory"), mmss],
    ["Defense Post", fb("Defense Post"), mmss],
    ["Missile Silo", fb("Missile Silo"), mmss],
    ["SAM Launcher", fb("SAM Launcher"), mmss],
    ["Warship", fb("Warship"), mmss],
    ["first order: Atom Bomb", (r) => r.firstOrder["Atom Bomb"], mmss],
  ]);
  share("Ever built / built within 10 min (structures)", sets, [
    ["City ≤10m", (r) => fin(fb("City")(r)) && fb("City")(r) <= 600],
    ["Port ≤10m", (r) => fin(fb("Port")(r)) && fb("Port")(r) <= 600],
    ["Factory ≤10m", (r) => fin(fb("Factory")(r)) && fb("Factory")(r) <= 600],
    ["Defense Post ≤10m", (r) => fin(fb("Defense Post")(r)) && fb("Defense Post")(r) <= 600],
    ["Silo ever", (r) => fin(fb("Missile Silo")(r))],
    ["SAM ever", (r) => fin(fb("SAM Launcher")(r))],
    ["Warship ever", (r) => fin(fb("Warship")(r))],
    ["City ≤2:30", (r) => fin(fb("City")(r)) && fb("City")(r) <= 150],
  ]);
  table("Build composition, first 10 min (orders incl. upgrades)", sets, [
    ["# orders", (r) => r.order10.length, (x) => f1(x, 1)],
    ["City new", (r) => r.order10.filter((x) => x === "City").length, (x) => f1(x, 1)],
    ["City upgrades", (r) => r.order10.filter((x) => x === "^City").length, (x) => f1(x, 1)],
    ["Port", (r) => r.order10.filter((x) => x === "Port").length, (x) => f1(x, 1)],
    ["Factory", (r) => r.order10.filter((x) => x === "Factory").length, (x) => f1(x, 1)],
    ["Factory/Port upgrades", (r) => r.order10.filter((x) => x === "^Factory" || x === "^Port").length, (x) => f1(x, 1)],
    ["Defense Post", (r) => r.order10.filter((x) => x === "Defense Post").length, (x) => f1(x, 1)],
    ["Silo+SAM", (r) => r.order10.filter((x) => x === "Missile Silo" || x === "SAM Launcher").length, (x) => f1(x, 1)],
    ["Warship", (r) => r.order10.filter((x) => x === "Warship").length, (x) => f1(x, 1)],
    ["gold spent ≤10m", (r) => Object.values(r.spend10).reduce((a, b) => a + b, 0), k],
    ["share of ≤10m spend on Factory+Port", (r) => { const t = Object.values(r.spend10).reduce((a, b) => a + b, 0); return t ? Object.entries(r.spend10).filter(([u]) => /Factory|Port/.test(u)).reduce((a, [, v]) => a + v, 0) / t : null; }, (x) => pc(x)],
    ["share of ≤10m spend on City(+up)", (r) => { const t = Object.values(r.spend10).reduce((a, b) => a + b, 0); return t ? Object.entries(r.spend10).filter(([u]) => /City/.test(u)).reduce((a, [, v]) => a + v, 0) / t : null; }, (x) => pc(x)],
    ["upgrades whole game", (r) => Object.values(r.upgrades).reduce((a, b) => a + b, 0), (x) => f1(x, 0)],
  ]);
  const tot = (r) => Object.values(r.goldStats).reduce((a, b) => a + b, 0);
  table("Gold by source (record stats, whole life)", sets, [
    ["total earned", tot, k],
    ["per min alive", (r) => tot(r) / Math.max(1, r.lifeSec / 60), k],
    ["workers share", (r) => (tot(r) ? r.goldStats.work / tot(r) : null), (x) => pc(x)],
    ["conquest share", (r) => (tot(r) ? r.goldStats.war / tot(r) : null), (x) => pc(x)],
    ["trade ships share", (r) => (tot(r) ? r.goldStats.trade / tot(r) : null), (x) => pc(x)],
    ["trains share", (r) => (tot(r) ? (r.goldStats.trainSelf + r.goldStats.trainOther) / tot(r) : null), (x) => pc(x)],
    ["piracy share", (r) => (tot(r) ? r.goldStats.steal / tot(r) : null), (x) => pc(x)],
    ["donations recv share", (r) => (tot(r) ? r.goldStats.donRecv / tot(r) : null), (x) => pc(x)],
    ["workers per min", (r) => r.goldStats.work / Math.max(1, r.lifeSec / 60), k],
  ]);
  if (hasS) {
    for (const w of [0, 1, 2, 3]) {
      table(`Income window ${w * 5}-${w * 5 + 5} min (per minute)`, sets, [
        ["total/min", (r) => r.windows[w]?.perMin, k],
        ["trade/min", (r) => r.windows[w]?.trade, k],
        ["train/min", (r) => r.windows[w]?.train, k],
        ["other(workers+conquest+don)/min", (r) => r.windows[w]?.other, k],
        ["trade+train share", (r) => (r.windows[w]?.perMin ? (r.windows[w].trade + r.windows[w].train) / r.windows[w].perMin : null), (x) => pc(x)],
      ]);
    }
  }
  table("Gold float", sets, [
    ["avg gold banked", (r) => r.avgGoldBanked, k],
    ["coach float (min of income)", (r) => r.floatMinutes, (x) => f1(x, 2)],
    ["gold at 2:00", (r) => r.goldAt["120"], k],
    ["gold at 5:00", (r) => r.goldAt["300"], k],
    ["gold at 10:00", (r) => r.goldAt["600"], k],
    ["gold at 15:00", (r) => r.goldAt["900"], k],
    ["peak gold", (r) => r.peakGold, k],
    ["share of life >1.5M banked", (r) => r.goldOver15, (x) => pc(x)],
  ]);
  table("Donations", sets, [
    ["troop donations sent (n)", (r) => r.donations.troopsSentN, (x) => f1(x, 0)],
    ["troops sent", (r) => r.donations.troopsSent, k],
    ["troop donations recv (n)", (r) => r.donations.troopsRecvN, (x) => f1(x, 0)],
    ["troops recv", (r) => r.donations.troopsRecv, k],
    ["gold sent", (r) => r.donations.goldSent, k],
    ["gold recv", (r) => r.donations.goldRecv, k],
    ["net troops (recv-sent) / peak troops", (r) => (r.troops.peakTroops ? (r.donations.troopsRecv - r.donations.troopsSent) / r.troops.peakTroops : null), (x) => pc(x)],
  ]);
  share("Donation behaviour", sets, [
    ["sent any troops", (r) => r.donations.troopsSentN > 0],
    ["received any troops", (r) => r.donations.troopsRecvN > 0],
    ["sent any gold", (r) => r.donations.goldSentN > 0],
    ["received any gold", (r) => r.donations.goldRecvN > 0],
  ]);
  table("Nukes", sets, [
    ["nukes received", (r) => r.nukes.received, (x) => f1(x, 0)],
    ["nukes launched", (r) => r.nukes.launched, (x) => f1(x, 0)],
    ["first enemy silo s", (r) => r.nukes.firstEnemySiloSec, mmss],
    ["own first SAM s", fb("SAM Launcher"), mmss],
    ["own first SAM − first enemy silo s", (r) => (fin(fb("SAM Launcher")(r)) && fin(r.nukes.firstEnemySiloSec) ? fb("SAM Launcher")(r) - r.nukes.firstEnemySiloSec : null), (x) => f1(x, 0)],
    ["first nuke received s", (r) => r.nukes.firstReceivedSec, mmss],
    ["land rank when first nuked", (r) => r.nukes.rankWhenFirstNuked, (x) => f1(x, 0)],
  ]);
  share("Nuke exposure", sets, [
    ["received ≥1 nuke", (r) => r.nukes.received > 0],
    ["received ≥5 nukes", (r) => r.nukes.received >= 5],
    ["launched ≥1", (r) => r.nukes.launched > 0],
    ["had SAM when first nuked", (r) => r.nukes.received > 0 && r.nukes.samsAtFirstNuke > 0],
  ]);
}

// --------------------------------------------------------- coach rule tests
function cat(t) {
  const rules = [
    [/^Slow first expansion/, "Slow first expansion"],
    [/^Opening fell behind/, "Opening fell behind"],
    [/^Excellent opening/, "Excellent opening (good)"],
    [/^Army idle at the troop cap/, "Army idle at the troop cap"],
    [/^Caught with an empty army/, "Caught with an empty army"],
    [/went badly$/, "Attack(s) went badly"],
    [/^Strong attack/, "Strong attack (good)"],
    [/^Lost \d+% of your territory/, "Lost N% of territory in a minute"],
    [/^Big push/, "Big push (good)"],
    [/^Never built a City/, "Never built a City"],
    [/^Late first City/, "Late first City"],
    [/^City bought/, "City bought Ns after affordable"],
    [/^Gold piled up unspent/, "Gold piled up unspent"],
    [/^Died with/, "Died with gold in the bank"],
    [/^You betrayed/, "You betrayed"],
    [/broke your alliance$/, "Ally broke alliance"],
    [/nukes launched at you with no SAM/, "Nukes at you with no SAM"],
    [/nukes were shot down/, "Your nukes shot down"],
    [/transport boats lost/, "Transport boats lost"],
    [/trade ships captured/, "Trade ships captured"],
    [/^Port lost \d+s after/, "Port lost Ns after built"],
    [/^City lost \d+s after/, "City lost Ns after built"],
    [/^Factory lost \d+s after/, "Factory lost Ns after built"],
    [/^Defense Post lost \d+s after/, "Defense Post lost Ns after built"],
    [/ lost \d+s after you built it/, "Other structure lost Ns after built"],
    [/nuked/, "Structure nuked (no SAM)"],
    [/tiles from .*'s border$/, "Structure near enemy border"],
    [/Factory with almost no rail links/, "Factory with almost no rail links"],
    [/Port with no trade partners/, "Port with no trade partners"],
    [/Port on a weaker stretch/, "Port on weaker coast"],
    [/^Defense Post/, "Defense Post placement"],
    [/^SAM/, "SAM placement"],
    [/^Eliminated/, "Eliminated (info)"],
  ];
  for (const [re, name] of rules) if (re.test(t)) return name;
  return "OTHER: " + t.replace(/\d+/g, "N").slice(0, 50);
}
function adviceCat(a) {
  const rules = [
    [/^Trade was paying/, "ADV: no Port while lobby traded"],
    [/^Your first City came at/, "ADV: first City after 2:30"],
    [/^You never built a City/, "ADV: never built City"],
    [/Cities but no Factory/, "ADV: 3+ Cities, no Factory"],
    [/of your spending went to the economy/, "ADV: <40% spend on economy"],
    [/minutes of income on average/, "ADV: float >3 min"],
    [/of their gold from trade and trains; you made/, "ADV: benchmark trade share gap"],
    [/^Port order/, "ADV: ports lost early"],
    [/^City placement/, "ADV: cities lost early"],
  ];
  for (const [re, n] of rules) if (re.test(a)) return n;
  if (/Better:/.test(a)) return "ADV: better spot";
  return "ADV OTHER: " + a.slice(0, 40);
}
for (const [scopeName, gs] of [
  ["COACH RULES — TEAM h10", games.filter((g) => g.game.mode === "Team" && g.game.hasStructs)],
  ["COACH RULES — FFA h10", games.filter((g) => g.game.mode !== "Team" && g.game.hasStructs)],
  ["COACH RULES — TEAM all harness", games.filter((g) => g.game.mode === "Team")],
  ["COACH RULES — FFA all harness", games.filter((g) => g.game.mode !== "Team")],
  ["COACH RULES — ALL PUBLIC GAMES (team+ffa, all harness)", games],
]) {
  section(scopeName + ` (${gs.length} games)`);
  const S = groups(gs);
  const sets = { WIN: S.W, TOP5: S.T5, TOP1: S.T1, WIN_TOP2: S.W.filter((r) => r.peakRank <= 2 || true).filter((r) => { const tm = S.rows.filter((x) => x.G.id === r.G.id && x.team === r.team).sort((a, b) => b.peakShare - a.peakShare); return tm.indexOf(tm.find((x) => x.sid === r.sid)) < 2; }), REST_ACTIVE: S.RESTA, LOSE_ACTIVE: S.L.filter(isActive), ME: S.ME };
  const names = Object.keys(sets);
  const fired = new Map();
  for (const n of names) for (const r of sets[n]) {
    const cats = new Set([...(r.coach.moments ?? []).map((m) => cat(m.t)), ...(r.coach.advice ?? []).map(adviceCat)]);
    for (const c of cats) {
      if (!fired.has(c)) fired.set(c, Object.fromEntries(names.map((x) => [x, 0])));
      fired.get(c)[n]++;
    }
  }
  console.log(["rule (share of players it fires on ≥1×)", ...names.map((n) => `${n}(n=${sets[n].length})`)].join(" | "));
  const list = [...fired.entries()].sort((a, b) => b[1].TOP5 / Math.max(1, sets.TOP5.length) - a[1].TOP5 / Math.max(1, sets.TOP5.length));
  for (const [c, v] of list) {
    const tot = names.reduce((a, n) => a + v[n], 0);
    if (tot < 2) continue;
    console.log([c, ...names.map((n) => `${pc(v[n] / Math.max(1, sets[n].length))}`)].join(" | "));
  }
  // coach scores separate winners?
  console.log("\n-- coach scores (base = weighted categories, no result bonus): median TOP5 vs REST_ACTIVE, AUC(TOP5>REST_ACTIVE), AUC(WIN>LOSE_ACTIVE)");
  const keys = ["base", "expansion", "economy", "buildings", "troops", "combat", "defense", "diplomacy", "naval", "nuclear"];
  for (const key of keys) {
    const get = (r) => (key === "base" ? r.coach.base : r.coach.cats?.[key]);
    console.log(`${key} | TOP5 ${f1(med(S.T5.map(get)), 0)} | REST_ACTIVE ${f1(med(S.RESTA.map(get)), 0)} | AUC top5 ${f1(auc(S.T5.map(get), S.RESTA.map(get)), 2)} | WIN ${f1(med(S.W.map(get)), 0)} LOSE_ACTIVE ${f1(med(S.L.filter(isActive).map(get)), 0)} AUC win ${f1(auc(S.W.map(get), S.L.filter(isActive).map(get)), 2)} | ME ${f1(med(S.ME.map(get)), 0)}`);
  }
  console.log("\n-- coach key metrics: AUC(TOP5 > REST_ACTIVE) (0.5 = no signal; <0.5 = top players score LOWER)");
  const mk = new Set(S.rows.flatMap((r) => Object.keys(r.coach.keyMetrics ?? {})));
  for (const m of mk) {
    const get = (r) => r.coach.keyMetrics?.[m];
    console.log(`${m} | TOP5 med ${f1(med(S.T5.map(get)), 3)} | REST_ACTIVE med ${f1(med(S.RESTA.map(get)), 3)} | ME med ${f1(med(S.ME.map(get)), 3)} | AUC ${f1(auc(S.T5.map(get), S.RESTA.map(get)), 2)}`);
  }
}

// ------------------------------------------- per-game correlations with outcome
section("PER-GAME SPEARMAN: feature vs peak land rank (positive = higher feature, better rank) — median across games");
const feats = {
  "share 0:30": (r) => r.shares["30"],
  "share 1:00": (r) => r.shares["60"],
  "share 2:00": (r) => r.shares["120"],
  "share 5:00": (r) => r.shares["300"],
  "share 10:00": (r) => r.shares["600"],
  "first expansion delay (s)": (r) => r.firstExpDelay,
  "first send ratio": (r) => r.sends.firstSend,
  "avg troop ratio": (r) => r.troops.avgRatio,
  "time near regen peak": (r) => r.troops.nearPeak,
  "time ≥88%": (r) => r.troops.cap88,
  "coach troop eff": (r) => r.troops.eff,
  "APM": (r) => r.apm,
  "first City s": (r) => (r.G.hasStructs ? r.firstBuilt.City : r.firstOrder.City),
  "float min": (r) => r.floatMinutes,
  "avg gold banked": (r) => r.avgGoldBanked,
  "troops recv by donation": (r) => r.donations.troopsRecv,
  "troops sent by donation": (r) => r.donations.troopsSent,
  "median stack/defender": (r) => med(r.atk.map((x) => x[1])),
  "median send ratio vs players": (r) => med(r.atk.map((x) => x[2])),
};
for (const [scopeName, gs] of [["Team all", games.filter((g) => g.game.mode === "Team")], ["FFA all", games.filter((g) => g.game.mode !== "Team")]]) {
  console.log(`\n-- ${scopeName} (${gs.length} games), active humans only`);
  for (const [name, get] of Object.entries(feats)) {
    const rhos = gs.map((g) => {
      const rows = g.rows.filter(isActive).map((r) => ({ ...r, G: g.game }));
      return spearman(rows.map(get), rows.map((r) => -r.peakRank));
    }).filter(fin);
    console.log(`${name}: median rho ${f1(med(rhos), 2)} [${f1(q(rhos, 0.25), 2)}..${f1(q(rhos, 0.75), 2)}] games ${rhos.length}`);
  }
}

// ---------------------------------------------- team: individual land vs team win
section("TEAM GAMES: does the biggest player's team win? individual share vs team result");
for (const [scopeName, gs] of [["Team all", games.filter((g) => g.game.mode === "Team")]]) {
  let top1Win = 0, top1Win5 = 0, topTeamSum5Win = 0, n = 0;
  const lines = [];
  for (const g of gs) {
    const rows = g.rows;
    const t1 = rows.find((r) => r.peakRank === 1);
    if (t1?.won) top1Win++;
    // leader at 5:00 / 10:00
    const lead5 = [...rows].filter((r) => fin(r.shares["300"])).sort((a, b) => b.shares["300"] - a.shares["300"])[0];
    if (lead5?.won) top1Win5++;
    // team with largest summed land at 5:00
    const tsum = {};
    for (const r of rows) if (r.team && fin(r.shares["300"])) tsum[r.team] = (tsum[r.team] ?? 0) + r.shares["300"];
    const bestT = Object.entries(tsum).sort((a, b) => b[1] - a[1])[0]?.[0];
    if (bestT === g.game.winTeam) topTeamSum5Win++;
    n++;
    const W = rows.filter((r) => r.won);
    const top5 = rows.filter((r) => r.peakRank <= 5);
    lines.push(`${g.game.id} ${g.game.map} teams=${g.game.teams} humans=${rows.length}: winners=${W.length}; top5 on winning team=${top5.filter((r) => r.won).length}/5; peak#1 ${t1?.name} won=${t1?.won}; leader@5m won=${lead5?.won}; best team-sum@5m won=${bestT === g.game.winTeam}; winners' median peak ${pc(med(W.map((r) => r.peakShare)), 1)} vs losers ${pc(med(rows.filter((r) => !r.won).map((r) => r.peakShare)), 1)}`);
  }
  console.log(`\n-- ${scopeName}: games ${n}; peak#1 human on winning team ${top1Win}/${n}; land leader at 5:00 on winning team ${top1Win5}/${n}; team with most summed land at 5:00 won ${topTeamSum5Win}/${n}`);
  lines.forEach((l) => console.log(l));
}

// ------------------------------------------------- nukes: who gets nuked
section("NUKES: per game");
for (const g of games) {
  const G = g.game;
  if (!G.nukesTotal) continue;
  const rows = g.rows;
  const W = rows.filter((r) => r.won);
  const wSam = W.map((r) => (G.hasStructs ? r.firstBuilt["SAM Launcher"] : r.firstOrder["SAM Launcher"])).filter(fin);
  const top5n = rows.filter((r) => r.peakRank <= 5).reduce((a, r) => a + r.nukes.received, 0);
  const alln = rows.reduce((a, r) => a + r.nukes.received, 0);
  const firstNuked = rows.filter((r) => fin(r.nukes.firstReceivedSec)).sort((a, b) => a.nukes.firstReceivedSec - b.nukes.firstReceivedSec)[0];
  console.log(`${G.id} ${G.mode} ${G.map}: first silo ${mmss(G.firstSiloSec)} (orders-only if no structs), first SAM ${mmss(G.firstSamSec)}, first nuke ${mmss(G.firstNukeSec)}, nukes at humans ${alln} (types ${JSON.stringify(G.nukesByType)}); share at top-5-by-peak ${pc(alln ? top5n / alln : null)}; winners' first SAM median ${mmss(med(wSam))} (${wSam.length}/${W.length} winners built one); first nuked: ${firstNuked?.name} rank ${firstNuked?.nukes.rankWhenFirstNuked} won=${firstNuked?.won}`);
}

// ------------------------------------------------------------ the user, per game
section("USER PER GAME");
for (const g of [...userGames].sort((a, b) => a.game.start.localeCompare(b.game.start))) {
  const r = g.rows.find((x) => x.isMe);
  const G = g.game;
  const t5 = g.rows.filter((x) => x.peakRank <= 5);
  const act = g.rows.filter(isActive);
  console.log(
    `${G.id} ${G.commit} ${G.mode} ${G.map}: ME won=${r.won} peakRank ${r.peakRank}/${g.rows.length} peak ${pc(r.peakShare, 2)} (top5 med ${pc(med(t5.map((x) => x.peakShare)), 2)}, active med ${pc(med(act.map((x) => x.peakShare)), 2)}); share@2m ${pc(r.shares["120"], 2)} vs top5 ${pc(med(t5.map((x) => x.shares["120"])), 2)} vs active ${pc(med(act.map((x) => x.shares["120"])), 2)}; @5m ${pc(r.shares["300"], 2)} vs top5 ${pc(med(t5.map((x) => x.shares["300"])), 2)}; firstCity ${mmss(r.firstBuilt.City)} vs top5 ${mmss(med(t5.map((x) => x.firstBuilt.City)))}; firstFactory ${mmss(r.firstBuilt.Factory)} vs top5 ${mmss(med(t5.map((x) => x.firstBuilt.Factory)))}; avgRatio ${pc(r.troops.avgRatio)} vs top5 ${pc(med(t5.map((x) => x.troops.avgRatio)))}; life ${mmss(r.lifeSec)}; donations sent ${r.donations.troopsSentN}/recv ${r.donations.troopsRecvN}; coach base ${r.coach.base} moments: ${r.coach.moments.map((m) => cat(m.t)).join("; ")}`,
  );
}
