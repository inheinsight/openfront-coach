const fs=require("fs");const OUT=__dirname+"/out";
const games=fs.readdirSync(OUT).filter(f=>f.endsWith(".json")).map(f=>JSON.parse(fs.readFileSync(OUT+"/"+f))).sort((a,b)=>a.game.start.localeCompare(b.game.start));
const fin=x=>typeof x==="number"&&Number.isFinite(x);
const med=xs=>{const v=xs.filter(fin).sort((a,b)=>a-b);if(!v.length)return null;const m=v.length>>1;return v.length%2?v[m]:(v[m-1]+v[m])/2};
const pc=(x,d=1)=>fin(x)?(x*100).toFixed(d):"—";
const mm=s=>fin(s)?`${Math.floor(s/60)}:${String(Math.round(s%60)).padStart(2,"0")}`:"—";
const k=x=>fin(x)?(x>=1e6?(x/1e6).toFixed(1)+"M":(x/1e3).toFixed(0)+"k"):"—";
const act=r=>(r.sends?.nAttackIntents??0)>=5&&r.lifeSec>=120;
const tpk=r=>{const a=r.atk;const u=a.reduce((s,x)=>s+x[3],0);return u?a.reduce((s,x)=>s+x[4],0)/u*1000:null};
console.log("| Game | Build | Mode/teams | Map | Humans | Len | Share@2:00 % (T5 / med / me) | Share@5:00 % (T5 / med / me) | First City (T5 / med / me) | Avg troops/cap % (T5 / med / me) | Tiles per 1k troops vs players (T5 / med / me) | Income/min 5–10m (T5 / med / me) | Me: peak rank, result |");
console.log("|---|---|---|---|---|---|---|---|---|---|---|---|---|");
for(const g of games){const G=g.game;const rows=g.rows;const T5=rows.filter(r=>r.peakRank<=5);const A=rows.filter(act);const me=rows.find(r=>r.isMe);
const fc=r=>G.hasStructs?r.firstBuilt.City:r.firstOrder.City;
const inc=r=>r.windows?.[1]?.perMin;
const three=(f,fmt)=>`${fmt(med(T5.map(f)))} / ${fmt(med(A.map(f)))} / ${me?fmt(f(me)):"—"}`;
console.log(`| ${G.id} | ${G.commit} (${G.harness.match(/h\d+/)[0]}) | ${G.mode==="Team"?"Team "+G.teams:"FFA"} | ${G.map} | ${rows.length} | ${mm(G.durationSec)} | ${three(r=>r.shares["120"],x=>pc(x,2))} | ${three(r=>r.shares["300"],x=>pc(x,2))} | ${three(fc,mm)} | ${three(r=>r.troops.avgRatio,x=>pc(x,0))} | ${three(tpk,x=>fin(x)?x.toFixed(1):"—")} | ${G.hasStructs?three(inc,k):"n/a"} | ${me?`${me.peakRank}/${rows.length}, ${me.won?"team won":"lost"}${me.alive?"":" (eliminated "+mm(me.lifeSec)+")"}`:"not in game / did not spawn"} |`);}
