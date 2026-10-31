const MARKETS = Object.freeze({
 player_pass_yds:'Passing yards',player_pass_tds:'Passing touchdowns',
 player_pass_completions:'Pass completions',player_pass_attempts:'Pass attempts',
 player_rush_yds:'Rushing yards',player_rush_attempts:'Rushing attempts',
 player_reception_yds:'Receiving yards',player_receptions:'Receptions'
});
const fail=(status,message)=>Object.assign(new Error(message),{status});
const INTERVAL=30*60*1000;
function createOddsService({store,apiKey=()=>process.env.ODDS_API_KEY,fetchImpl=fetch,now=Date.now}={}) {
 if(!store)throw new Error("Shared odds storage is required");
 const pending=new Map();
 async function cached(key,scope,loader){
  if(pending.has(key))return pending.get(key);
  const work=(async()=>{
   const old=await store.read(key);
   if(old&&now()-Date.parse(old.fetchedAt)<INTERVAL)return {...old,cached:true,stale:false};
   if(!apiKey())throw fail(503,'Odds are not configured. Set ODDS_API_KEY on the server.');
   const gate=await store.reserve(scope,INTERVAL);
   if(!gate.acquired){
    const latest=await store.read(key);
    if(latest)return {...latest,cached:true,stale:now()-Date.parse(latest.fetchedAt)>=INTERVAL,nextRefreshAt:gate.nextAllowedAt};
    return {available:false,rows:[],events:[],markets:MARKETS,nextRefreshAt:gate.nextAllowedAt,message:'The shared refresh is in progress or the 30-minute limit is active. No completed snapshot is available yet.'};
   }
   try{
    const value={...await loader(),available:true,nextRefreshAt:gate.nextAllowedAt};
    await store.write(key,value);return {...value,cached:false,stale:false};
   }catch(error){
    // A failed request may still cost credits. Never release the global gate early.
    if(old)return {...old,cached:true,stale:true,nextRefreshAt:gate.nextAllowedAt,message:'Refresh failed; showing the previous cached result.'};
    throw error;
   }
  })();
  pending.set(key,work);try{return await work;}finally{pending.delete(key);}
 }
 async function request(path,params={}){
  const token=apiKey();if(!token)throw fail(503,'Odds are not configured. Set ODDS_API_KEY on the server.');
  const url=new URL('https://api.the-odds-api.com/v4/sports/americanfootball_nfl/'+path);
  url.search=new URLSearchParams({...params,apiKey:token}).toString();
  let response;try{response=await fetchImpl(url,{signal:AbortSignal.timeout(12000)});}catch{throw fail(502,'Could not reach the odds provider. Try again later.');}
  if(!response.ok){
   const message=response.status===401?'The odds provider rejected the API key.':response.status===403?'The odds provider denied access. Check the account plan or remaining credits.':response.status===429?'The odds provider usage limit has been reached.':response.status===404?'This event is no longer available from the odds provider.':'The odds provider could not return data.';
   throw fail(response.status===404?404:503,message);
  }
  try{return await response.json();}catch{throw fail(502,'The odds provider returned an invalid response.');}
 }
 async function events(){return cached('events','events',async()=>{
  const raw=await request('events');if(!Array.isArray(raw))throw fail(502,'The odds provider returned an invalid event list.');
  return {fetchedAt:new Date(now()).toISOString(),markets:MARKETS,events:raw.filter(e=>typeof e.id==='string'&&e.home_team&&e.away_team&&Number.isFinite(Date.parse(e.commence_time))).map(e=>({id:e.id,homeTeam:e.home_team,awayTeam:e.away_team,commenceTime:e.commence_time})).sort((a,b)=>a.commenceTime.localeCompare(b.commenceTime))};
 });}
 function normalize(raw,eventId,market){
  const book=raw.bookmakers.find(b=>b.key==='fanduel');const m=book?.markets?.find(m=>m.key===market);
  const rows=(m?.outcomes||[]).filter(o=>typeof o.description==='string'&&['Over','Under'].includes(o.name)&&Number.isFinite(o.point)&&Number.isFinite(o.price)).map(o=>({player:o.description,side:o.name,line:o.point,price:o.price})).sort((a,b)=>a.player.localeCompare(b.player)||a.line-b.line||a.side.localeCompare(b.side));
  return {eventId,market,marketLabel:MARKETS[market],bookmaker:'FanDuel',source:'The Odds API',region:'US',nyVerified:false,fetchedAt:new Date(now()).toISOString(),updatedAt:m?.last_update||book?.last_update||null,cacheSeconds:INTERVAL/1000,rows};
 }
 async function odds(eventId,market){
  if(typeof eventId!=='string'||!/^[a-f0-9]{32}$/.test(eventId)||!Object.hasOwn(MARKETS,market))throw fail(400,'Choose a valid event and category.');
  const catalog=await events();if(catalog.available===false)return catalog;if(!catalog.events.some(e=>e.id===eventId))throw fail(404,'This event is no longer in the current NFL feed.');
  // All categories are requested together once per event; one atomic snapshot is
  // published only when the whole batch succeeds. Never activate a partial batch.
  const batch=await cached('batch-v1','paid-odds',async()=>{
   const selections={},unavailableEvents=[];
   for(const event of catalog.events){
    let raw;
    try{raw=await request('events/'+event.id+'/odds',{bookmakers:'fanduel',markets:Object.keys(MARKETS).join(','),oddsFormat:'american'});}
    catch(error){if(error.status===404){unavailableEvents.push(event.id);continue;}throw error;}
    if(!raw||raw.id!==event.id||!Array.isArray(raw.bookmakers))throw fail(502,'The odds provider returned an invalid event response.');
    for(const key of Object.keys(MARKETS))selections[event.id+':'+key]=normalize(raw,event.id,key);
   }
   return {fetchedAt:new Date(now()).toISOString(),eventCount:catalog.events.length,marketCount:Object.keys(MARKETS).length,selections,unavailableEvents};
  });
  if(batch.available===false)return batch;
  const selection=batch.selections[eventId+':'+market];
  if(!selection)return {available:false,rows:[],nextRefreshAt:batch.nextRefreshAt,message:batch.unavailableEvents.includes(eventId)?'The provider no longer has this event.':'This event is not in the current shared snapshot. It will be included in the next batch.'};
  return {...selection,available:true,cached:batch.cached,stale:batch.stale,message:batch.message,nextRefreshAt:batch.nextRefreshAt,batchFetchedAt:batch.fetchedAt,batchEventCount:batch.eventCount,batchMarketCount:batch.marketCount};
 }
 return {events,odds};
}
module.exports={createOddsService,MARKETS,INTERVAL};
