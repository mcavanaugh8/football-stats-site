export const MARKETS = [
    {key:'pass_yds',label:'Passing yards',positions:['QB'],defaultLine:199.5},
    {key:'pass_td',label:'Passing touchdowns',positions:['QB'],defaultLine:1.5},
    {key:'pass_cmp',label:'Pass completions',positions:['QB'],defaultLine:19.5},
    {key:'pass_att',label:'Pass attempts',positions:['QB'],defaultLine:29.5},
    {key:'rush_yds',label:'Rushing yards',positions:['QB','RB','WR','TE'],defaultLine:49.5},
    {key:'rush_att',label:'Rushing attempts',positions:['QB','RB','WR','TE'],defaultLine:9.5},
    {key:'rush_td',label:'Rushing touchdowns',positions:['QB','RB','WR','TE'],defaultLine:0.5},
    {key:'rec_yds',label:'Receiving yards',positions:['RB','WR','TE'],defaultLine:49.5},
    {key:'rec',label:'Receptions',positions:['RB','WR','TE'],defaultLine:3.5},
    {key:'rec_td',label:'Receiving touchdowns',positions:['RB','WR','TE'],defaultLine:0.5},
    {key:'rush_rec_yds',label:'Rush + receiving yards',positions:['RB','WR','TE'],defaultLine:74.5},
    {key:'rush_rec_td',label:'Rush + receiving touchdowns',positions:['RB','WR','TE'],defaultLine:0.5},
];
export function metricValue(row,metric) {
    const fields=metric==='rush_rec_yds'?['rush_yds','rec_yds']:metric==='rush_rec_td'?['rush_td','rec_td']:[metric];
    const values=fields.map(k=>row[k]);
    return values.every(v=>typeof v==='number'&&Number.isFinite(v))?values.reduce((a,b)=>a+b,0):null;
}
export function hitRate(rows,metric,line,side='over') {
    if(!MARKETS.some(m=>m.key===metric)||!['over','under','atLeast'].includes(side)||line===''||line===null||!Number.isFinite(Number(line))||Number(line)<0)return null;
    const threshold=Number(line);let hits=0,misses=0,pushes=0,missing=0;
    for(const row of rows){const value=metricValue(row,metric);if(value===null){missing++;continue;}
        if(side!=='atLeast'&&value===threshold)pushes++;
        else if(side==='under'?value<threshold:side==='atLeast'?value>=threshold:value>threshold)hits++;
        else misses++;
    }
    const settled=hits+misses;
    return {hits,misses,pushes,missing,samples:settled+pushes,settled,rate:settled?100*hits/settled:null};
}
export function evaluateLeg(data,leg) {
    const game=data.schedule?.find(g=>g.gameId===leg.gameId),player=data.players.find(p=>p.id===leg.playerId);
    if(!game||!player||![game.homeTeam,game.awayTeam].includes(player.team))return {error:'This player or game is no longer available in the current roster snapshot.'};
    const market=MARKETS.find(m=>m.key===leg.metric&&m.positions.includes(player.position));
    if(!market)return {error:'Choose a supported market for this position.'};
    const opponent=player.team===game.homeTeam?game.awayTeam:game.homeTeam;
    const before=g=>g.date<game.date&&g.game_id!==game.gameId&&g.season_type===data.seasonType;
    const playerRows=player.games.filter(before);
    const opponentRows=(data.opponentGameLogs||[]).filter(g=>before(g)&&g.opp_name_abbr===opponent&&g.position===player.position);
    const playerRate=hitRate(playerRows,leg.metric,leg.line,leg.side),opponentRate=hitRate(opponentRows,leg.metric,leg.line,leg.side);
    if(!playerRate||!opponentRate)return {game,player,market,opponent,error:'Enter a valid nonnegative line.'};
    return {game,player,market,opponent,playerRate,opponentRate,opponentGames:new Set(opponentRows.map(g=>g.game_id)).size,
        opponentRows:opponentRows.map(g=>({...g,value:metricValue(g,leg.metric)})).sort((a,b)=>b.date.localeCompare(a.date)||String(a.playerName||a.gsis_id).localeCompare(String(b.playerName||b.gsis_id))),
        playerRows:playerRows.map(g=>({...g,value:metricValue(g,leg.metric)}))};
}
