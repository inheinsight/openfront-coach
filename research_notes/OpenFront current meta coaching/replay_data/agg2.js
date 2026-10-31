// Targeted tests: attack buckets, send ratio habits, donations timing, coach rule rates, opening sequences.
const fs = require("fs");
const OUT = __dirname + "/out";
const games = fs.readdirSync(OUT).filter((f) => f.endsWith(".json")).map((f) => JSON.parse(fs.readFileSync(OUT + "/" + f)));
const fin = (x) => typeof x === "number" && Number.isFinite(x);
const q = (xs, p) => { const v = xs.filter(fin).sort((a, b) => a - b); if (!v.length) return null; const i = (v.length - 1) * p, lo = Math.floor(i), hi = Math.ceil(i); return v[lo] + (v[hi] - v[lo]) * (i - lo); };
const med = (xs) => q(xs, 0.5);
const pc = (x, d = 0) => (x === null || !fin(x) ? "—" : (x * 100).toFixed(d) + "%");
const f1 = (x, d = 1) => (x === null || !fin(x) ? "—" : x.toFixed(d));
const isActive = (r) => (r.sends?.nAttackIntents ?? 0) >= 5 && r.lifeSec >= 120;
function auc(A, B) { A = A.filter(fin); B = B.filter(fin); if (!A.length || !B.length) return null; let s = 0; for (const a of A) for (const b of B) s += a > b ? 1 : a === b ? 0.5 : 0; return s / (A.length * B.length); }
const scopes = {
  "TEAM(22)": games.filter((g) => g.game.mode === "Team"),
  "FFA(6)": games.filter((g) => g.game.mode !== "Team"),
};
const rowsOf = (gs) => gs.flatMap((g) => g.rows.map((r) => ({ ...r, G: g.game })));

console.log("==== A. Attack outcome by stack size relative to defender's army (all human attacks on players, excl. merged) ====");
for (const [name, gs] of Object.entries(scopes)) {
  const rows = rowsOf(gs);
  const buckets = [[0, 0.3], [0.3, 0.6], [0.6, 1.0], [1.0, 1.7], [1.7, 3], [3, 1e9]];
  console.log(`\n-- ${name}: bucket | n attacks | pooled tiles/1k used | median tiles/1k | share that eliminated target | share taking ≥10% of target tiles(approx) | share by TOP5 attackers`);
  const all = rows.flatMap((r) => r.atk.map((a) => ({ a, top5: r.peakRank <= 5 })));
  for (const [lo, hi] of buckets) {
    const xs = all.filter(({ a }) => fin(a[1]) && a[1] >= lo && a[1] < hi);
    const used = xs.reduce((s, { a }) => s + a[3], 0), tiles = xs.reduce((s, { a }) => s + a[4], 0);
    const eff = xs.map(({ a }) => (a[3] > 0 ? (a[4] / a[3]) * 1000 : null));
    console.log(`${lo}–${hi >= 1e9 ? "∞" : hi}× | ${xs.length} | ${f1(used ? (tiles / used) * 1000 : null)} | ${f1(med(eff))} | ${pc(xs.length ? xs.filter(({ a }) => a[8]).length / xs.length : null)} | — | ${pc(xs.length ? xs.filter((x) => x.top5).length / xs.length : null)}`);
  }
  // same, top5 only vs rest
  for (const [lab, pred] of [["TOP5 attackers", (x) => x.top5], ["other attackers", (x) => !x.top5]]) {
    const line = buckets.map(([lo, hi]) => {
      const xs = all.filter((x) => pred(x) && fin(x.a[1]) && x.a[1] >= lo && x.a[1] < hi);
      const used = xs.reduce((s, { a }) => s + a[3], 0), tiles = xs.reduce((s, { a }) => s + a[4], 0);
      return `${lo}-${hi >= 1e9 ? "inf" : hi}: ${f1(used ? (tiles / used) * 1000 : null)} (n${xs.length})`;
    });
    console.log(`  pooled tiles/1k by bucket, ${lab}: ${line.join("; ")}`);
  }
  // naval vs land
  const nav = all.filter(({ a }) => a[5]), land = all.filter(({ a }) => !a[5]);
  const pooled = (xs) => { const u = xs.reduce((s, { a }) => s + a[3], 0); return u ? (xs.reduce((s, { a }) => s + a[4], 0) / u) * 1000 : null; };
  console.log(`  naval attacks n${nav.length} pooled ${f1(pooled(nav))} tiles/1k; land n${land.length} pooled ${f1(pooled(land))}`);
}

console.log("\n==== B. Send-ratio habits (attack/boat intents after the first minute) ====");
for (const [name, gs] of Object.entries(scopes)) {
  const rows = rowsOf(gs).filter(isActive);
  const grp = { TOP5: rows.filter((r) => r.peakRank <= 5), TOP1: rows.filter((r) => r.peakRank === 1), REST: rows.filter((r) => r.peakRank > 5), ME: rows.filter((r) => r.isMe) };
  console.log(`\n-- ${name}`);
  for (const [g, rs] of Object.entries(grp)) {
    const h = rs.map((r) => r.sends.ratioHist).filter((h) => h && h.n > 0);
    const n = h.reduce((s, x) => s + x.n, 0);
    const per = (k) => med(h.map((x) => x[k] / x.n));
    console.log(`${g} (players ${rs.length}, intents ${n}): pooled share at 18–22% ${pc(h.reduce((s, x) => s + x.def20, 0) / n)}, ≥50% ${pc(h.reduce((s, x) => s + x.ge50, 0) / n)}, ≥60% ${pc(h.reduce((s, x) => s + x.ge60, 0) / n)}, ≤12% ${pc(h.reduce((s, x) => s + x.le12, 0) / n)}; per-player median share at default ${pc(per("def20"))}, players with any ≥60% send ${pc(h.filter((x) => x.ge60 > 0).length / Math.max(1, h.length))}; opening: intents in first 15s median ${f1(med(rs.map((r) => r.sends.opening15?.n)), 0)}, troops committed in first 15s (sum of sends / troops at first send) median ${pc(med(rs.map((r) => r.sends.opening15?.sentShare)))}, intents in first 60s median ${f1(med(rs.map((r) => r.sends.opening60n)), 0)}`);
  }
}

console.log("\n==== C. Coach attack ledger verdicts per attack (attacks on players) ====");
for (const [name, gs] of Object.entries(scopes)) {
  const rows = rowsOf(gs).filter(isActive);
  const grp = { TOP5: rows.filter((r) => r.peakRank <= 5), TOP1: rows.filter((r) => r.peakRank === 1), REST: rows.filter((r) => r.peakRank > 5), ME: rows.filter((r) => r.isMe) };
  console.log(`\n-- ${name}`);
  for (const [g, rs] of Object.entries(grp)) {
    const L = rs.map((r) => r.coach.ledger ?? {});
    const tot = L.reduce((s, x) => s + (x.total ?? 0), 0);
    const c = (k) => L.reduce((s, x) => s + (x[k] ?? 0), 0);
    console.log(`${g}: attacks ${tot}; blunder ${pc(c("blunder") / tot, 1)}, mistake ${pc(c("mistake") / tot, 1)}, inaccuracy ${pc(c("inaccuracy") / tot, 1)}, good ${pc(c("good") / tot, 1)}; per-player median bad share ${pc(med(L.filter((x) => x.total).map((x) => ((x.blunder ?? 0) + (x.mistake ?? 0) + (x.inaccuracy ?? 0)) / x.total)))}`);
  }
}

console.log("\n==== D. Donations in team games: timing vs leadership ====");
{
  const rows = rowsOf(scopes["TEAM(22)"]);
  const grp = { TOP1: rows.filter((r) => r.peakRank === 1), TOP5: rows.filter((r) => r.peakRank <= 5), REST_ACTIVE: rows.filter((r) => r.peakRank > 5 && isActive(r)), WIN: rows.filter((r) => r.won), ME: rows.filter((r) => r.isMe) };
  const sumUpTo = (list, s) => (list ?? []).filter(([t]) => t <= s).reduce((a, [, v]) => a + v, 0);
  for (const [g, rs] of Object.entries(grp)) {
    console.log(`${g} (n${rs.length}): troops received by 3:00 median ${f1(med(rs.map((r) => sumUpTo(r.donations.recvTimes, 180) / 1000)), 0)}k, by 5:00 ${f1(med(rs.map((r) => sumUpTo(r.donations.recvTimes, 300) / 1000)), 0)}k, by 10:00 ${f1(med(rs.map((r) => sumUpTo(r.donations.recvTimes, 600) / 1000)), 0)}k, total ${f1(med(rs.map((r) => r.donations.troopsRecv / 1000)), 0)}k; first receipt median ${f1(med(rs.map((r) => r.donations.recvTimes?.[0]?.[0])), 0)}s; troops sent median ${f1(med(rs.map((r) => r.donations.troopsSent / 1000)), 0)}k; first send median ${f1(med(rs.map((r) => r.donations.sentTimes?.[0]?.[0])), 0)}s; share receiving >1M by 5:00 ${pc(rs.filter((r) => sumUpTo(r.donations.recvTimes, 300) > 1e6).length / Math.max(1, rs.length))}`);
  }
  // Was the eventual #1 already the land leader on their team at 5:00 when donations started flowing?
  let lead5 = 0, n = 0;
  for (const g of scopes["TEAM(22)"]) {
    const t1 = g.rows.find((r) => r.peakRank === 1);
    if (!t1 || !t1.team) continue;
    const mates = g.rows.filter((r) => r.team === t1.team && Number.isFinite(r.shares["300"]));
    const leader = mates.sort((a, b) => b.shares["300"] - a.shares["300"])[0];
    n++;
    if (leader && leader.sid === t1.sid) lead5++;
  }
  console.log(`eventual peak #1 was already their team's land leader at 5:00 in ${lead5}/${n} team games`);
  // donation share of peak troops for TOP1
  console.log(`TOP1 troops received / own peak troops: median ${pc(med(grp.TOP1.map((r) => r.donations.troopsRecv / Math.max(1, r.troops.peakTroops))))}`);
  // within winning teams: AUC of troopsRecv for top-2 of team vs rest of team
  const wt = rows.filter((r) => r.won);
  console.log(`AUC(peak share) winners vs losers among active team players: ${f1(auc(rows.filter((r) => r.won && isActive(r)).map((r) => r.peakShare), rows.filter((r) => !r.won && isActive(r)).map((r) => r.peakShare)), 2)}`);
  for (const nt of [2, 3, 4, 5, 6, 7, "Trios", "Quads"]) {
    const rs = rows.filter((r) => String(r.G.teams) === String(nt) && isActive(r));
    if (!rs.length) continue;
    console.log(`  teams=${nt}: games ${new Set(rs.map((r) => r.G.id)).size}, AUC(peak share) win vs lose ${f1(auc(rs.filter((r) => r.won).map((r) => r.peakShare), rs.filter((r) => !r.won).map((r) => r.peakShare)), 2)}, AUC(share@5:00) ${f1(auc(rs.filter((r) => r.won).map((r) => r.shares["300"]), rs.filter((r) => !r.won).map((r) => r.shares["300"])), 2)}`);
  }
  // winning team land concentration: top player's share of team peak sum
  const conc = scopes["TEAM(22)"].map((g) => {
    const w = g.rows.filter((r) => r.won).sort((a, b) => b.peakShare - a.peakShare);
    const sum = w.reduce((s, r) => s + r.peakShare, 0);
    return { id: g.game.id, teams: g.game.teams, top1: w[0] ? w[0].peakShare / sum : null, top2: w[1] ? (w[0].peakShare + w[1].peakShare) / sum : null, size: w.length };
  });
  console.log(`winning team: biggest member's share of the team's summed peak land, median ${pc(med(conc.map((c) => c.top1)))} [${conc.map((c) => `${c.teams}:${pc(c.top1)}`).join(", ")}]`);
}

console.log("\n==== E. Coach rule firing per minute alive and detail of the City-wait rule ====");
for (const [name, gs] of Object.entries(scopes)) {
  const rows = rowsOf(gs).filter(isActive);
  const grp = { TOP5: rows.filter((r) => r.peakRank <= 5), REST: rows.filter((r) => r.peakRank > 5), WIN: rows.filter((r) => r.won), LOSE: rows.filter((r) => !r.won) };
  console.log(`\n-- ${name}`);
  for (const [g, rs] of Object.entries(grp)) {
    const waits = rs.flatMap((r) => (r.coach.cityWaits ?? []).slice(0, 1)).filter(fin);
    const anyWait = rs.flatMap((r) => r.coach.cityWaits ?? []).filter(fin);
    const idle = rs.map((r) => r.coach.moments.filter((m) => /^Army idle/.test(m.t)).reduce((s, m) => s + (m.ev?.seconds ?? 0), 0));
    console.log(`${g} n${rs.length}: first-City wait (s) median ${f1(med(waits), 0)} p75 ${f1(q(waits, 0.75), 0)}; all new-City waits median ${f1(med(anyWait), 0)}, share >60s ${pc(anyWait.filter((w) => w > 60).length / Math.max(1, anyWait.length))}; idle-at-cap seconds flagged (top 2 runs) median ${f1(med(idle), 0)}; 'Slow first expansion' delay median ${f1(med(rs.map((r) => r.firstExpDelay)), 1)}s, share >3s ${pc(rs.filter((r) => r.firstExpDelay > 3).length / rs.length)}`);
  }
}

console.log("\n==== F. Opening build sequences (first 3 build orders) ====");
for (const [name, gs] of [["TEAM h10", games.filter((g) => g.game.mode === "Team" && g.game.hasStructs)], ["FFA h10", games.filter((g) => g.game.mode !== "Team" && g.game.hasStructs)]]) {
  const rows = rowsOf(gs).filter(isActive);
  for (const [g, rs] of [["TOP5", rows.filter((r) => r.peakRank <= 5)], ["REST", rows.filter((r) => r.peakRank > 5)]]) {
    const c = {};
    for (const r of rs) {
      const k = r.order10.slice(0, 3).join(" > ") || "(none)";
      c[k] = (c[k] ?? 0) + 1;
    }
    const top = Object.entries(c).sort((a, b) => b[1] - a[1]).slice(0, 6);
    console.log(`${name} ${g} (n${rs.length}): ${top.map(([k, v]) => `${k} ${pc(v / rs.length)}`).join(" | ")}`);
    const first = {};
    for (const r of rs) { const k = r.order10[0] ?? "(none)"; first[k] = (first[k] ?? 0) + 1; }
    console.log(`   first build: ${Object.entries(first).sort((a, b) => b[1] - a[1]).map(([k, v]) => `${k} ${pc(v / rs.length)}`).join(", ")}`);
  }
}

console.log("\n==== G. Nukes: share of all nukes aimed at humans that hit the top-5 (by peak) / top-1, and rank at first hit ====");
for (const [name, gs] of Object.entries(scopes)) {
  const rows = rowsOf(gs);
  const tot = rows.reduce((s, r) => s + r.nukes.received, 0);
  const t5 = rows.filter((r) => r.peakRank <= 5).reduce((s, r) => s + r.nukes.received, 0);
  const t1 = rows.filter((r) => r.peakRank === 1).reduce((s, r) => s + r.nukes.received, 0);
  const humans = rows.length;
  console.log(`${name}: nukes at humans ${tot}; top-5 ${pc(t5 / tot)} (they are ${pc((5 * gs.length) / humans)} of humans); top-1 ${pc(t1 / tot)}; nuked players' land rank at first hit: median ${f1(med(rows.map((r) => r.nukes.rankWhenFirstNuked)), 0)}`);
  // SAM before first enemy silo + 120 s?
  const W = rows.filter((r) => r.peakRank <= 5 && r.G.hasStructs);
  const lead = W.map((r) => (fin(r.firstBuilt["SAM Launcher"]) && fin(r.nukes.firstEnemySiloSec) ? r.firstBuilt["SAM Launcher"] - r.nukes.firstEnemySiloSec : null)).filter(fin);
  console.log(`   TOP5 (h10): first SAM minus first enemy silo: median ${f1(med(lead), 0)}s, share SAM within 2 min of enemy silo ${pc(lead.filter((x) => x <= 120).length / Math.max(1, W.length))}, never built SAM ${pc(W.filter((r) => !fin(r.firstBuilt["SAM Launcher"])).length / Math.max(1, W.length))}`);
}

console.log("\n==== H. Directional AUC of coach key metrics (TOP5 vs REST_ACTIVE; >0.5 = top players score better by the coach's own direction) ====");
const lowerBetter = new Set(["firstCity", "float", "atCap", "overextended", "fullSends", "retreats", "drawdown", "structuresLost", "betrayedBy", "nukesTaken", "placeBad", "lostEarly"]);
for (const [name, gs] of [["TEAM h10", games.filter((g) => g.game.mode === "Team" && g.game.hasStructs)], ["FFA h10", games.filter((g) => g.game.mode !== "Team" && g.game.hasStructs)], ["TEAM all", scopes["TEAM(22)"]]]) {
  const rows = rowsOf(gs);
  const T5 = rows.filter((r) => r.peakRank <= 5), R = rows.filter((r) => r.peakRank > 5 && isActive(r));
  const W = rows.filter((r) => r.won && isActive(r)), L = rows.filter((r) => !r.won && isActive(r));
  const keys = [...new Set(rows.flatMap((r) => Object.keys(r.coach.keyMetrics ?? {})))];
  console.log(`\n-- ${name}`);
  for (const k of keys) {
    const get = (r) => r.coach.keyMetrics?.[k];
    let a = auc(T5.map(get), R.map(get)), w = auc(W.map(get), L.map(get));
    if (lowerBetter.has(k)) { a = a === null ? null : 1 - a; w = w === null ? null : 1 - w; }
    console.log(`${k}: AUC top5 ${f1(a, 2)} | AUC team-win ${f1(w, 2)}`);
  }
}
