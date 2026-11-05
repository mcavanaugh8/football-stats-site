const test=require('node:test');const assert=require('node:assert/strict');
const {loadDataset,summarize,deviation}=require('../server/dataService');
function fixture(){
 const state={version:'v1',missing:false,fail:false,queries:[],reads:0};
 const metadata=()=>({season:2026,importId:state.version,playerCount:1,scheduledGames:2,opponentRows:2,schemaVersion:2});
 const player=()=>({id:state.version,name:'Player (IR)',position:'QB',team:'BUF',gameLogsByYear:{2026:[{season_type:'REG',pass_yds:200},{season_type:'POST',pass_yds:300}]}});
 const db={collection:name=>({
  findOne:async()=>{state.reads++;return metadata();},
  countDocuments:async filter=>{state.queries.push({name,op:'count',filter});return 1;},
  aggregate:(pipeline,options)=>{state.queries.push({name,op:'aggregate',pipeline,options});return {toArray:async()=>[{id:state.version,name:'Player (IR)',position:'QB',team:'BUF',g:1,totals:{pass_yds:200}}]};},
  find:(filter,options)=>{state.queries.push({name,op:'find',filter,options});return {toArray:async()=>{
   if(state.fail)throw Error('temporary');
   if(name==='playerSeasonStats')return [player()];
   if(name==='gameSchedules')return state.missing?[]:[{seasonType:'REG',week:1,date:'2026-09-01'},{seasonType:'POST',week:19,date:'2027-01-01'}];
   if(name==='opponentGameLogs')return [{seasonType:'REG'},{seasonType:'POST'}];
   return Array.from({length:32},()=>({teamCode:'BUF'}));
  }};}
 })};return {db,state};
}
test('season/phase filtering preserves January, actual yards and zero averages',()=>{
 const p={id:'p',name:'Player',position:'QB',gameLogsByYear:{2026:[{season_type:'REG',date:'2027-01-03',pass_yds:200},{season_type:'POST',date:'2027-01-10',pass_yds:300}]}};
 const result=summarize(p,'2026','REG');assert.equal(result.g,1);assert.equal(result.totals.pass_yds,200);assert.equal(result.totals.pass_target_yds,undefined);
 assert.deepEqual(deviation([{position:'QB',games:[{opp_name_abbr:'ATL',pass_td:0}],averages:{pass_td:0}}],'ATL','QB','pass_td'),{mean:0,median:0});
});
test('warm requests read the active pointer but do not reread dataset components; a new import invalidates immediately',async()=>{
 const {db,state}=fixture();const a=await loadDataset(db,2026,'REG','hits');const n=state.queries.length;
 await loadDataset(db,2026,'REG','hits');assert.equal(state.queries.length,n);assert.equal(state.reads,2);
 state.version='v2';const b=await loadDataset(db,2026,'REG','hits');assert.equal(a.players[0].id,'v1');assert.equal(b.players[0].id,'v2');
 assert.ok(state.queries.slice(n).every(q=>q.filter.importId==='v2'));
});
test('concurrent requests share component work and independent databases do not share a cache',async()=>{
 const {db,state}=fixture();await Promise.all(Array.from({length:8},()=>loadDataset(db,2026,'REG','hits')));
 assert.equal(state.queries.filter(q=>q.op==='find').length,1);
 const other=fixture();await loadDataset(other.db,2026,'REG','hits');assert.equal(other.state.queries.filter(q=>q.op==='find').length,1);
});
test('initial player view only loads summaries and counts; history views project only necessary player fields',async()=>{
 const {db,state}=fixture();const result=await loadDataset(db,2026,'REG','players');assert.equal(result.players[0].name,'Player');assert.equal(result.players[0].games,undefined);assert.equal(result.schedule,undefined);assert.equal(result.teamStats,undefined);
 assert.ok(state.queries.every(q=>q.name==='playerSeasonStats'));assert.ok(state.queries.some(q=>q.op==='aggregate'));
 await loadDataset(db,2026,'REG','hits');const q=state.queries.find(q=>q.op==='find');assert.deepEqual(q.filter.position,{$in:['QB','RB','FB','WR','TE']});assert.equal(q.options.projection.gameLogs,undefined);assert.equal(q.options.projection['gameLogsByYear.2026'],1);
});
test('matchups skip detailed schedule/opponent queries; builder skips team totals and shares loaded players',async()=>{
 const {db,state}=fixture();await loadDataset(db,2026,'REG','matchups');assert.ok(!state.queries.some(q=>q.name==='gameSchedules'||q.name==='opponentGameLogs'));
 const n=state.queries.length;const result=await loadDataset(db,2026,'REG','builder');assert.equal(result.schedule.length,1);assert.equal(result.opponentGameLogs.length,1);assert.equal(result.teamStats,undefined);
 assert.ok(state.queries.slice(n).every(q=>['gameSchedules','opponentGameLogs'].includes(q.name)));
});
test('incomplete imports and failed reads are not cached as successful results',async()=>{
 const {db,state}=fixture();state.missing=true;await assert.rejects(loadDataset(db,2026,'REG','builder'),/incomplete/);state.missing=false;assert.equal((await loadDataset(db,2026,'REG','builder')).schedule.length,1);
 const broken=fixture();broken.state.fail=true;await assert.rejects(loadDataset(broken.db,2026,'REG','hits'),/temporary/);broken.state.fail=false;assert.equal((await loadDataset(broken.db,2026,'REG','hits')).players.length,1);
});
test('invalid parameters and unpublished seasons fail explicitly',async()=>{
 await assert.rejects(loadDataset({},NaN),/Invalid/);await assert.rejects(loadDataset({},2026,'REG','unknown'),/Invalid/);
 await assert.rejects(loadDataset({collection:()=>({findOne:async()=>null})}),/No published/);
});
test('regular and postseason caches remain separate',async()=>{
 const {db}=fixture();const a=await loadDataset(db,2026,'REG','hits'),b=await loadDataset(db,2026,'POST','hits');assert.equal(a.players[0].totals.pass_yds,200);assert.equal(b.players[0].totals.pass_yds,300);
});
