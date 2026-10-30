const test=require('node:test');const assert=require('node:assert/strict');
const math=import('../client/betMath.mjs');
test('over/under pushes are excluded; at-least includes equality and valid zeros',async()=>{
 const {hitRate}=await math,rows=[{pass_yds:100},{pass_yds:200},{pass_yds:300},{pass_yds:null}];
 assert.deepEqual(hitRate(rows,'pass_yds',200,'over'),{hits:1,misses:1,pushes:1,missing:1,samples:3,settled:2,rate:50});
 assert.equal(hitRate(rows,'pass_yds',200,'under').rate,50);
 assert.equal(hitRate(rows,'pass_yds',200,'atLeast').hits,2);
 assert.equal(hitRate([{rec:0}],'rec',0,'atLeast').rate,100);
 assert.equal(hitRate([{rec:0}],'rec',0,'over').rate,null);
});
test('invalid lines, unsupported markets, missing stats and empty histories do not become zero rates',async()=>{
 const {hitRate,metricValue}=await math;
 assert.equal(hitRate([],'rec',''),null);assert.equal(hitRate([],'rec',-1),null);
 assert.equal(hitRate([],'pressures',2),null);assert.equal(hitRate([],'rec',2).rate,null);
 assert.equal(metricValue({rush_yds:20,rec_yds:30},'rush_rec_yds'),50);
 assert.equal(metricValue({rush_yds:20},'rush_rec_yds'),null);
});
function fixture(){const row={game_id:'past',date:'2026-09-01',season_type:'REG',rec_yds:60,opp_name_abbr:'DAL',position:'WR'};
 return {seasonType:'REG',schedule:[{gameId:'target',date:'2026-09-10',homeTeam:'DAL',awayTeam:'PHI'}],
 players:[{id:'p',name:'Receiver',position:'WR',team:'PHI',games:[row,{...row,game_id:'future',date:'2026-09-15',rec_yds:99},{...row,game_id:'target',date:'2026-09-10',rec_yds:90}]}],
 opponentGameLogs:[row,{...row,game_id:'second',rec_yds:30},{...row,game_id:'other-position',position:'RB'},
 {...row,game_id:'other-opponent',opp_name_abbr:'NYG'},{...row,game_id:'target',date:'2026-09-10'},{...row,game_id:'post',season_type:'POST'}]};
}
test('opponent rates use the same position and line, excluding target, later games, and other phases',async()=>{
 const {evaluateLeg}=await math;const result=evaluateLeg(fixture(),{gameId:'target',playerId:'p',metric:'rec_yds',side:'over',line:49.5});
 assert.equal(result.opponent,'DAL');assert.equal(result.playerRate.rate,100);assert.equal(result.playerRate.samples,1);
 assert.equal(result.opponentRate.rate,50);assert.equal(result.opponentRate.samples,2);assert.equal(result.opponentGames,2);
 assert.deepEqual(result.opponentRows.map(r=>r.value),[60,30]);
 assert.ok(result.opponentRows.every(r=>r.position==='WR'&&r.opp_name_abbr==='DAL'&&r.date<'2026-09-10'));
 assert.equal(result.opponentRows.length,result.opponentRate.samples);
});
test('changing the line updates both rates and a moved player is rejected',async()=>{
 const {evaluateLeg}=await math;const d=fixture(),leg={gameId:'target',playerId:'p',metric:'rec_yds',side:'over',line:70};
 const result=evaluateLeg(d,leg);assert.equal(result.playerRate.rate,0);assert.equal(result.opponentRate.rate,0);
 d.players[0].team='NYG';assert.ok(evaluateLeg(d,leg).error);
});
test('invalid editable line retains player context so the draft control can recover',async()=>{
 const {evaluateLeg}=await math;const r=evaluateLeg(fixture(),{gameId:'target',playerId:'p',metric:'rec_yds',side:'over',line:''});
 assert.ok(r.error);assert.equal(r.player.id,'p');
});
