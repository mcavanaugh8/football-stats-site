const test=require('node:test'),assert=require('node:assert/strict');
const {createOddsService,INTERVAL,MARKETS}=require('../server/oddsService');
const id='a'.repeat(32),event={id,home_team:'Home',away_team:'Away',commence_time:'2026-11-01T18:00:00Z'};
const detail={id,bookmakers:[{key:'fanduel',markets:[{key:'player_pass_yds',last_update:'2026-10-31T10:00:00Z',outcomes:[{description:'Player',name:'Over',point:249.5,price:-110,link:'private'},{description:'Player',name:'Under',point:249.5,price:100}]}]}]};
function fixture(){let clock=0,paid=0,free=0,broken=false;const values=new Map(),gates=new Map();
 const store={read:async k=>values.get(k),write:async(k,v)=>values.set(k,v),reserve:async(k,ms)=>{const until=gates.get(k)||0;if(until>clock)return {acquired:false,nextAllowedAt:new Date(until).toISOString()};gates.set(k,clock+ms);return {acquired:true,nextAllowedAt:new Date(clock+ms).toISOString()};}};
 const fetchImpl=async url=>{const isPaid=url.pathname.endsWith('/odds');if(isPaid){paid++;assert.equal(url.searchParams.get('markets'),Object.keys(MARKETS).join(','));if(broken)throw Error('secret-in-url');}else free++;return {ok:true,json:async()=>isPaid?{...detail,id:url.pathname.split('/').at(-2)}:[event,{...event,id:'c'.repeat(32)}]};};
 const service=()=>createOddsService({store,apiKey:()=> 'secret',now:()=>clock,fetchImpl});
 return {store,service,advance:n=>clock+=n,break:()=>broken=true,paid:()=>paid,free:()=>free};
}
test('concurrent instances and different categories share one all-event batch per 30 minutes',async()=>{
 const f=fixture(),a=f.service(),b=f.service();await a.events();
 const responses=await Promise.all([a.odds(id,'player_pass_yds'),b.odds(id,'player_receptions')]);
 assert.equal(f.paid(),2);assert.equal(responses.filter(r=>r.available).length,1);
 const hit=await b.odds(id,'player_pass_yds');assert.equal(hit.cached,true);assert.equal(hit.rows.length,2);assert.equal(hit.nyVerified,false);assert.equal(hit.rows[0].link,undefined);
 assert.equal(JSON.stringify(hit).includes('secret'),false);
 const other=await b.odds('c'.repeat(32),'player_receptions');assert.equal(other.available,true);assert.deepEqual(other.rows,[]);
 const restarted=f.service();await restarted.odds(id,'player_pass_yds');assert.equal(f.paid(),2);
 f.advance(INTERVAL-1);assert.equal((await restarted.odds(id,'player_receptions')).available,true);assert.equal(f.paid(),2);
 f.advance(1);await restarted.odds(id,'player_pass_yds');assert.equal(f.paid(),4);
});
test('failed refresh retains older data and does not reopen the paid gate',async()=>{
 const f=fixture(),s=f.service();await s.odds(id,'player_pass_yds');f.advance(INTERVAL);f.break();
 const old=await s.odds(id,'player_pass_yds');assert.equal(old.stale,true);assert.equal(old.rows.length,2);assert.equal(f.paid(),3);
 assert.equal((await f.service().odds(id,'player_receptions')).available,true);assert.equal(f.paid(),3);
});
test('initial provider error is sanitized and reserves the full interval',async()=>{
 const f=fixture(),s=f.service();f.break();await assert.rejects(s.odds(id,'player_pass_yds'),e=>e.status===502&&!e.message.includes('secret'));
 const retry=await f.service().odds(id,'player_pass_yds');assert.equal(retry.available,false);assert.equal(f.paid(),1);
});
test('invalid requests and missing key cannot consume paid requests',async()=>{
 const f=fixture(),s=f.service();await assert.rejects(s.odds(id,'invalid'),{status:400});assert.equal(f.free(),0);
 await assert.rejects(s.odds('b'.repeat(32),'player_pass_yds'),{status:404});assert.equal(f.paid(),0);
 const absent=createOddsService({store:f.store,apiKey:()=>''});await assert.rejects(absent.odds(id,'player_pass_yds'),{status:503});
});
test('cache database failure fails closed without hitting the provider',async()=>{
 let calls=0;const service=createOddsService({store:{read:async()=>{throw Error('Database unavailable');}},apiKey:()=> 'key',fetchImpl:async()=>calls++});
 await assert.rejects(service.events(),/Database unavailable/);assert.equal(calls,0);
});

test('an error after an event succeeds cannot publish a partial batch',async()=>{
 const f=fixture();let paid=0;const s=createOddsService({store:f.store,apiKey:()=> 'key',now:()=>0,fetchImpl:async url=>{
  if(!url.pathname.endsWith('/odds'))return {ok:true,json:async()=>[event,{...event,id:'c'.repeat(32)}]};
  if(++paid===2)throw Error('Network failed');return {ok:true,json:async()=>detail};
 }});
 await assert.rejects(s.odds(id,'player_pass_yds'),{status:502});assert.equal(paid,2);
 assert.equal(await f.store.read('batch-v1'),undefined);
 assert.equal((await s.odds(id,'player_pass_yds')).available,false);assert.equal(paid,2);
});
