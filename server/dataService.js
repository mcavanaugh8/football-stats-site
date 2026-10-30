const SUPPORTED = ['pass_cmp','pass_att','pass_yds','pass_td','pass_int','rush_att','rush_yds','rush_td','rush_first_down','targets','rec','rec_yds','rec_td'];
function summarize(player, season, seasonType) {
    const games=(player.gameLogsByYear?.[season]||[]).filter(g=>g.season_type===seasonType);
    const totals=Object.fromEntries(SUPPORTED.map(k=>[k,games.reduce((sum,g)=>sum+Number(g[k]||0),0)]));
    const averages=Object.fromEntries(SUPPORTED.map(k=>[k,games.length?totals[k]/games.length:null]));
    return {id:player.id,name:player.name,position:player.position,team:player.team,g:games.length,games,totals,averages};
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
async function loadDataset(db,season=2026,seasonType='REG') {
    if(!Number.isInteger(season)||season<1999||season>2100||!['REG','POST'].includes(seasonType)) {
        const error=new Error('Invalid season or season type');error.status=400;throw error;
    }
    // No process player cache. Resolve the active version on each request, then pin all queries to it.
    const metadata=await db.collection('datasetImports').findOne({season},{projection:{_id:0}});
    if(!metadata){const error=new Error(`No published data for ${season}. Run pushToDB.js --year=${season}.`);error.status=503;throw error;}
    const filter={season,importId:metadata.importId};
    const [documents,teamStats,teamStatsByPosition]=await Promise.all([
        db.collection('playerSeasonStats').find(filter,{projection:{_id:0}}).toArray(),
        db.collection('teamStats').find({...filter,seasonType},{projection:{_id:0}}).toArray(),
        db.collection('teamStatsByPosition').find({...filter,seasonType},{projection:{_id:0}}).toArray(),
    ]);
    if(documents.length!==metadata.playerCount||teamStats.length!==32||teamStatsByPosition.length!==32) {
        const error=new Error('Published dataset is incomplete');error.status=503;throw error;
    }
    const players=documents.filter(p=>['QB','RB','FB','WR','TE'].includes(p.position)).map(p=>summarize(p,String(season),seasonType));
    return {metadata,seasonType,players,teamStats,teamStatsByPosition,supportedStats:SUPPORTED};
}
module.exports={loadDataset,summarize,deviation,SUPPORTED};
