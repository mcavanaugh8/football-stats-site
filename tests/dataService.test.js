const test=require('node:test');const assert=require('node:assert/strict');
const {loadDataset,summarize,deviation}=require('../server/dataService');
test('season and phase filtering includes January; actual yards and zero averages remain valid',()=>{
 const p={id:'p',name:'Player',position:'QB',gameLogsByYear:{'2026':[{season_type:'REG',date:'2027-01-03',pass_yds:200,opp_name_abbr:'ATL'},{season_type:'POST',date:'2027-01-10',pass_yds:300,opp_name_abbr:'ATL'}]}};
 const result=summarize(p,'2026','REG');assert.equal(result.g,1);assert.equal(result.totals.pass_yds,200);assert.equal(result.totals.pass_target_yds,undefined);
 assert.deepEqual(deviation([{position:'QB',games:[{opp_name_abbr:'ATL',pass_td:0}],averages:{pass_td:0}}],'ATL','QB','pass_td'),{mean:0,median:0});
});
test('each load checks active import and all collection queries pin the same version',async()=>{
 let version='old';const queries=[];
 const db={collection:name=>({findOne:async()=>({season:2026,importId:version,playerCount:1}),find:filter=>{queries.push({name,...filter});return {toArray:async()=>name==='playerSeasonStats'?[{id:version,position:'QB',gameLogsByYear:{2026:[]}}]:Array.from({length:32},()=>({importId:filter.importId}))};}})};
 const a=await loadDataset(db,2026);version='new';const b=await loadDataset(db,2026);
 assert.equal(a.players[0].id,'old');assert.equal(b.players[0].id,'new');assert.ok(queries.slice(0,3).every(q=>q.importId==='old'));assert.ok(queries.slice(3).every(q=>q.importId==='new'));
});
test('unpublished/invalid seasons and missing collections fail explicitly',async()=>{
 await assert.rejects(loadDataset({},NaN),/Invalid/);
 await assert.rejects(loadDataset({collection:()=>({findOne:async()=>null})}),/No published/);
 const db={collection:()=>({findOne:async()=>({importId:'x',playerCount:1}),find:()=>({toArray:async()=>[]})})};
 await assert.rejects(loadDataset(db),/incomplete/);
});
