const SUPPORTED = ['pass_cmp','pass_att','pass_yds','pass_td','pass_int','rush_att','rush_yds','rush_td','rush_first_down','targets','rec','rec_yds','rec_td'];
function summarize(player, season, seasonType) {
    const games=(player.gameLogsByYear?.[season]||[]).filter(g=>g.season_type===seasonType);
    const totals=Object.fromEntries(SUPPORTED.map(k=>[k,games.reduce((sum,g)=>sum+Number(g[k]||0),0)]));
    const averages=Object.fromEntries(SUPPORTED.map(k=>[k,games.length?totals[k]/games.length:null]));
    return {id:player.id,name:String(player.name||'').replace(/\s*\((?:IR|IRD|PUP|NFI|SUS|NON|PRA[_ ]*)\)\s*$/i,'').trim(),position:player.position,team:player.team,g:games.length,games,totals,averages};
}
function deviation(players, opponent, position, stat) {
    const values=[];
    for(const p of players) {
        if(position!=='ALL' && p.position!==position) continue;
        for(const game of p.games) if(game.opp_name_abbr===opponent && Number.isFinite(game[stat]) && Number.isFinite(p.averages[stat])) values.push(game[stat]-p.averages[stat]);
    }
    if(!values.length)return {mean:null,median:null};
    values.sort((a,b)=>a-b);const mid=Math.floor(values.length/2);
    return {mean:values.reduce((a,b)=>a+b,0)/values.length,median:values.length%2?values[mid]:(values[mid-1]+values[mid])/2};
}
const POSITIONS=['QB','RB','FB','WR','TE'];
const caches=new WeakMap();
const invalid=message=>Object.assign(new Error(message),{status:503});
function remember(db,key,loader){
 let cache=caches.get(db);if(!cache){cache=new Map();caches.set(db,cache);}
 if(cache.has(key))return cache.get(key);
 // Bound memory while keeping concurrent requests for the same import together.
 const promise=Promise.resolve().then(loader);cache.set(key,promise);
 promise.catch(()=>{if(cache.get(key)===promise)cache.delete(key);});
 if(cache.size>24)cache.delete(cache.keys().next().value);
 return promise;
}
async function loadDataset(db,season=2026,seasonType='REG',view='all') {
 if(!Number.isInteger(season)||season<1999||season>2100||!['REG','POST'].includes(seasonType)||!['all','players','hits','matchups','builder'].includes(view))throw Object.assign(new Error('Invalid season, season type or view'),{status:400});
 // Always resolve the active pointer, even for a warm cache. Uploads become visible
 // immediately; every component in this response stays pinned to this import.
 const metadata=await db.collection('datasetImports').findOne({season},{projection:{_id:0},maxTimeMS:10000});
 if(!metadata)throw invalid('No published data for '+season+'. Run pushToDB.js --year='+season+'.');
 const filter={season,importId:metadata.importId};
 const key=JSON.stringify([season,seasonType,metadata.importId]);
 const options={maxTimeMS:20000};
 const countPlayers=()=>remember(db,JSON.stringify([season,metadata.importId,'count']),async()=>{
  const count=await db.collection('playerSeasonStats').countDocuments(filter,options);
  if(count!==metadata.playerCount)throw invalid('Published dataset is incomplete');return count;
 });
 const players=()=>remember(db,key+':players',async()=>{
  const [documents]=await Promise.all([
   db.collection('playerSeasonStats').find({...filter,position:{$in:POSITIONS}},{...options,projection:{_id:0,id:1,name:1,position:1,team:1,['gameLogsByYear.'+season]:1}}).toArray(),countPlayers()
  ]);
  return documents.map(p=>summarize(p,String(season),seasonType));
 });
 const summaries=()=>remember(db,key+':summaries',async()=>{
  // Compute the initial table in MongoDB; don't transfer thousands of game logs
  // just to sum them and discard them in the browser.
  const [documents]=await Promise.all([
   db.collection('playerSeasonStats').aggregate([
    {$match:{...filter,position:{$in:POSITIONS}}},
    {$project:{_id:0,id:1,name:1,position:1,team:1,games:{$filter:{input:{$ifNull:['$gameLogsByYear.'+season,[]]},as:'game',cond:{$eq:['$$game.season_type',seasonType]}}}}},
    {$project:{id:1,name:1,position:1,team:1,g:{$size:'$games'},totals:Object.fromEntries(SUPPORTED.map(k=>[k,{$sum:'$games.'+k}]))}}
   ],options).toArray(),countPlayers()
  ]);
  return documents.map(p=>({...p,name:String(p.name||'').replace(/\s*\((?:IR|IRD|PUP|NFI|SUS|NON|PRA[_ ]*)\)\s*$/i,'').trim()}));
 });
 const teams=()=>remember(db,key+':teams',async()=>{
  const [teamStats,teamStatsByPosition]=await Promise.all(['teamStats','teamStatsByPosition'].map(name=>db.collection(name).find({...filter,seasonType},{...options,projection:{_id:0}}).toArray()));
  if(teamStats.length!==32||teamStatsByPosition.length!==32)throw invalid('Published dataset is incomplete');
  return {teamStats,teamStatsByPosition};
 });
 const extra=()=>remember(db,key+':details',async()=>{
  if(!(metadata.schemaVersion>=2))return {schedule:[],opponentGameLogs:[]};
  const [allGames,allRows]=await Promise.all([
   db.collection('gameSchedules').find(filter,{...options,projection:{_id:0,season:0,importId:0,updatedAt:0}}).toArray(),
   db.collection('opponentGameLogs').find(filter,{...options,projection:{_id:0,importId:0,updatedAt:0}}).toArray()
  ]);
  if(allGames.length!==metadata.scheduledGames||allRows.length!==metadata.opponentRows)throw invalid('Published bet-builder data is incomplete');
  return {schedule:allGames.filter(g=>g.seasonType===seasonType).sort((a,b)=>a.week-b.week||a.date.localeCompare(b.date)),opponentGameLogs:allRows.filter(g=>g.seasonType===seasonType)};
 });
 const [playerData,teamData,details]=await Promise.all([
  view==='players'?summaries():players(),
  ['all','matchups'].includes(view)?teams():{},
  ['all','builder'].includes(view)?extra():{}
 ]);
 return {metadata,seasonType,view,players:playerData,...teamData,...details,supportedStats:SUPPORTED};
}
module.exports={loadDataset,summarize,deviation,SUPPORTED};
