const fs=require("fs");const OUT=__dirname+"/out";
const games=fs.readdirSync(OUT).filter(f=>f.endsWith(".json")).map(f=>JSON.parse(fs.readFileSync(OUT+"/"+f)));
const rows=games.flatMap(g=>g.rows.map(r=>({...r,G:g.game})));
const ofb=rows.flatMap(r=>r.coach.moments.filter(m=>/^Opening fell behind/.test(m.t)).map(m=>m.ev.avgOpeningRatio));
console.log("Opening fell behind moments",ofb.length,"with avgOpeningRatio<0.4 (=> 'open with bigger sends' advice):",ofb.filter(x=>x!==null&&x<0.4).length,"median ratio",ofb.sort((a,b)=>a-b)[ofb.length>>1]);
const cw=(pred)=>{const ms=rows.filter(pred).flatMap(r=>r.coach.moments.filter(m=>/^City bought/.test(m.t)).map(m=>({w:m.ev.waitedSec,tick:m.tick,sp:r.G.spEnd})));const ws=ms.map(m=>m.w).sort((a,b)=>a-b);const ts=ms.map(m=>(m.tick-m.sp)/10).sort((a,b)=>a-b);return `n${ms.length} wait median ${ws[ws.length>>1]}s, fired at game time median ${Math.round(ts[ts.length>>1])}s after spawn`;};
console.log("City bought Ns after affordable — TOP5:",cw(r=>r.peakRank<=5),"| REST:",cw(r=>r.peakRank>5));
const gp=(pred)=>{const ms=rows.filter(pred).flatMap(r=>r.coach.moments.filter(m=>/^Gold piled/.test(m.t)).map(m=>m.ev.peakGold)).sort((a,b)=>a-b);return ms.length+" moments, median peak gold "+(ms[ms.length>>1]/1e6).toFixed(1)+"M";};
console.log("Gold piled up — TOP5:",gp(r=>r.peakRank<=5),"| REST:",gp(r=>r.peakRank>5));
for (const mode of ["Team","Free For All"]) for (const [lab,pred] of [["TOP5",r=>r.peakRank<=5],["REST",r=>r.peakRank>5]]) {const ms=rows.filter(r=>r.G.mode===mode&&pred(r)).flatMap(r=>r.coach.moments.filter(m=>/^Army idle/.test(m.t)).map(m=>m.ev.seconds)).sort((a,b)=>a-b);console.log("Army idle at cap",mode,lab,"moments",ms.length,"median run",ms[ms.length>>1],"s");}
const gpm=rows.filter(r=>r.G.mode==="Team").map(r=>r.coach.keyMetrics?.goldPerMin).filter(x=>x!=null);console.log("Team players at/above 500k gold/min (top of coach's absolute curve):",(gpm.filter(x=>x>=5e5).length/gpm.length*100).toFixed(0)+"% of",gpm.length);
