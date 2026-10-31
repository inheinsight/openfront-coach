const fs=require("fs"),zlib=require("zlib"),path=require("path");
const D="/Users/justinhein/Development/openFrontCoach/data";
const reps=fs.readdirSync(D+"/replays");
const ids=fs.readdirSync(D+"/records").map(f=>f.replace(".json",""));
for(const id of ids){
  const cands=reps.filter(f=>f.startsWith(id+".")).map(f=>({f,v:(f.match(/\.h(\d+)\./)||[0,0])[1]*1})).sort((a,b)=>b.v-a.v);
  if(!cands.length){console.log(id,"no replay");continue;}
  const r=JSON.parse(zlib.gunzipSync(fs.readFileSync(D+"/replays/"+cands[0].f)));
  const rec=JSON.parse(fs.readFileSync(D+"/records/"+id+".json"));
  const m=r.meta;
  const ek={};for(const e of r.events){ek[e.kind]=(ek[e.kind]||0)+1;}
  const ak={};for(const a of r.actions){ak[a.type]=(ak[a.type]||0)+1;}
  const humans=r.players.filter(p=>p.type==="Human").length, nations=r.players.filter(p=>p.type==="Nation").length;
  console.log(id,cands[0].f,"fmt",r.formatVersion,"commit",(m.engineCommit||m.gitCommit||"").slice(0,8),"ticks",m.ticks,"turns",rec.info.num_turns,"sampleEvery",m.sampleEvery,"desync",JSON.stringify(m.desync),"stopped",m.stoppedEarly,"humans",humans,"nations",nations,"structs",(r.structures||[]).length,"transfers",!!r.transfers, "winner",JSON.stringify(m.winner));
  console.log("   events",JSON.stringify(ek));
  console.log("   actions",JSON.stringify(ak));
}
