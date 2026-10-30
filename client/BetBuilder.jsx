import React,{useState} from 'react';
import {MARKETS,evaluateLeg} from './betMath.mjs';
import './betBuilder.css';

const POSITIONS=['QB','RB','WR','TE'];
const percent=value=>value==null?'—':`${value.toFixed(1)}%`;
const displayDate=date=>new Date(`${date}T12:00:00`).toLocaleDateString(undefined,{month:'short',day:'numeric'});
const sideLabel={over:'Over',under:'Under',atLeast:'At least'};

function Rate({title,result,detail}) {
    return <section className="rate-card"><span>{title}</span><strong>{percent(result.rate)}</strong>
        <div>{result.hits}/{result.settled} hits{result.pushes>0&&` · ${result.pushes} push${result.pushes===1?'':'es'}`}</div>
        <small>{detail}{result.missing>0&&` · ${result.missing} missing excluded`}</small>
    </section>;
}
function Evidence({result}) {
    if(result.error)return <p className="note" role="status">{result.error}</p>;
    return <div className="rate-grid" aria-live="polite">
        <Rate title="Player hit rate" result={result.playerRate} detail={`${result.playerRate.samples} recorded player-games`}/>
        <Rate title={`${result.opponent} allowed · ${result.player.position}`} result={result.opponentRate} detail={`${result.opponentRate.samples} same-position player-games across ${result.opponentGames} opponent games`}/>
    </div>;
}

export default function BetBuilder({data}) {
    const [week,setWeek]=useState(''),[gameId,setGameId]=useState(''),[playerId,setPlayerId]=useState('');
    const [metric,setMetric]=useState('pass_yds'),[line,setLine]=useState('199.5'),[side,setSide]=useState('over');
    const [legs,setLegs]=useState([]),[playerSearch,setPlayerSearch]=useState(''),[feedback,setFeedback]=useState('');
    const schedule=data.schedule||[];
    const today=new Date().toLocaleDateString('en-CA');
    const upcoming=schedule.find(g=>!g.completed&&g.date>=today);
    const defaultWeek=upcoming?.week||schedule.at(-1)?.week;
    const selectedWeek=week||String(defaultWeek||'');
    const games=schedule.filter(g=>String(g.week)===selectedWeek);
    const game=games.find(g=>g.gameId===gameId);
    const eligible=data.players.filter(p=>game&&[game.homeTeam,game.awayTeam].includes(p.team)&&POSITIONS.includes(p.position));
    const player=eligible.find(p=>p.id===playerId);
    const current={gameId:game?.gameId,playerId:player?.id,metric,line,side};
    const result=player?evaluateLeg(data,current):null;
    const markets=MARKETS.filter(m=>player&&m.positions.includes(player.position));
    function choosePlayer(p){setPlayerId(p.id);const m=MARKETS.find(m=>m.positions.includes(p.position));setMetric(m.key);setLine(String(m.defaultLine));setFeedback('');}
    function addLeg(){if(!result||result.error)return;const leg={...current,line:Number(line)};
        if(legs.some(l=>l.gameId===leg.gameId&&l.playerId===leg.playerId&&l.metric===leg.metric&&l.side===leg.side&&l.line===leg.line)){setFeedback('That selection is already in your draft.');return;}
        setLegs(previous=>[...previous,{...leg,id:crypto.randomUUID()}]);setFeedback('Added to your draft.');
    }
    if(!schedule.length)return <p className="empty">No schedule is published for this season phase. Publish the updated data to enable the builder.</p>;
    return <div className="builder"><div className="builder-intro"><span className="beta">BETA</span><p>Build a prop draft with player history and the opposing defense side by side.</p></div>
        <div className="builder-layout"><div className="builder-workspace">
            <section className="builder-panel"><div className="step-heading"><h2><span>01</span> Choose a game</h2><label>Week<select value={selectedWeek} onChange={e=>{setWeek(e.target.value);setGameId('');setPlayerId('');setFeedback('');}}>{[...new Set(schedule.map(g=>g.week))].sort((a,b)=>a-b).map(w=><option key={w} value={w}>Week {w}</option>)}</select></label></div>
                <div className="game-grid">{games.map(g=><button key={g.gameId} aria-pressed={g.gameId===game?.gameId} className={`game-tile ${g.gameId===game?.gameId?'selected':''}`} onClick={()=>{setGameId(g.gameId);setPlayerId('');setFeedback('');}}><small>{displayDate(g.date)} · {g.completed?'Completed':'Scheduled'}</small><strong>{g.awayTeam} <span>at</span> {g.homeTeam}</strong></button>)}</div>
            </section>
            {game&&<section className="builder-panel"><div className="step-heading"><h2><span>02</span> Choose a player</h2><label>Find player<input value={playerSearch} onChange={e=>setPlayerSearch(e.target.value)} placeholder="Search both teams"/></label></div>
                <div className="position-groups">{POSITIONS.map(pos=><div className="position-group" key={pos}><h3>{pos}</h3>{[game.awayTeam,game.homeTeam].map(team=><div key={team}><h4>{team}</h4>{eligible.filter(p=>p.position===pos&&p.team===team&&p.name.toLowerCase().includes(playerSearch.toLowerCase())).map(p=><button key={p.id} aria-pressed={p.id===player?.id} className={p.id===player?.id?'selected':''} onClick={()=>choosePlayer(p)}>{p.name}</button>)}</div>)}</div>)}</div>
                <p className="note">Players reflect the published roster snapshot, not a live injury or game-day availability feed.</p>
            </section>}
            {player&&<section className="builder-panel"><h2><span>03</span> Set your line</h2><p className="selected-player">{player.name} <small>{player.team} · {player.position} vs {result?.opponent}</small></p>
                <div className="line-controls"><label>Bet category<select value={metric} onChange={e=>{setMetric(e.target.value);setLine(String(MARKETS.find(m=>m.key===e.target.value).defaultLine));}}>{markets.map(m=><option key={m.key} value={m.key}>{m.label}</option>)}</select></label><label>Direction<select value={side} onChange={e=>setSide(e.target.value)}><option value="over">Over</option><option value="under">Under</option><option value="atLeast">At least</option></select></label><label>Line<input type="number" min="0" step="0.5" value={line} onChange={e=>setLine(e.target.value)}/></label></div>
                <Evidence result={result}/><p className="note">History before {displayDate(game.date)} only. {data.seasonType==='REG'?'Regular-season':'Postseason'} samples in {data.metadata.season}. Over/under pushes are excluded from the rate; “at least” includes equality.</p>
                <button className="add-leg" disabled={Boolean(result.error)} onClick={addLeg}>Add to draft +</button><span className="feedback" role="status">{feedback}</span>
                {!result.error&&<details><summary>View player sample ({result.playerRows.length} games)</summary><div className="sample-list">{result.playerRows.map(g=><div key={g.game_id}><span>{displayDate(g.date)} · vs {g.opp_name_abbr}</span><b>{g.value??'Unavailable'}</b></div>)}</div></details>}
                {!result.error&&<details><summary>View defense samples ({result.opponentRows.length} player-games)</summary>
                    <p className="note">All {player.position} performances against {result.opponent} in this sample · {result.market.label}. Zero results are included; unavailable values are excluded from the hit rate.</p>
                    {result.opponentRows.length?<div className="defense-samples"><table><thead><tr><th scope="col">Player</th><th scope="col">Date</th><th scope="col">{result.market.label}</th></tr></thead><tbody>
                        {result.opponentRows.map(g=><tr key={g.game_id+'-'+g.gsis_id}><td>{g.playerName||g.gsis_id||'Unknown player'}</td><td>{displayDate(g.date)}</td><td>{g.value??'Unavailable'}</td></tr>)}
                    </tbody></table></div>:<p className="note">No defense samples before this game.</p>}
                </details>}
            </section>}
        </div><aside className="bet-slip builder-panel"><div className="step-heading"><h2>Your draft</h2><span className="draft-count">{legs.length}</span></div>
            {!legs.length?<p className="empty">Choose a game and a player to start your first selection.</p>:legs.map(leg=>{const assessment=evaluateLeg(data,leg);return <article className="draft-leg" key={leg.id}><button className="remove-leg" aria-label={`Remove ${assessment.player?.name||'selection'}`} onClick={()=>setLegs(legs.filter(l=>l.id!==leg.id))}>×</button>{!assessment.player?<p>{assessment.error}</p>:<><small>Week {assessment.game.week} · {assessment.game.awayTeam} at {assessment.game.homeTeam}</small><h3>{assessment.player.name}</h3><p>{assessment.market.label}</p><div className="draft-controls"><label>Direction<select value={leg.side} onChange={e=>setLegs(legs.map(l=>l.id===leg.id?{...l,side:e.target.value}:l))}>{Object.entries(sideLabel).map(([value,label])=><option key={value} value={value}>{label}</option>)}</select></label><label>Line<input type="number" min="0" step="0.5" value={leg.line} onChange={e=>setLegs(legs.map(l=>l.id===leg.id?{...l,line:e.target.value}:l))}/></label></div><Evidence result={assessment}/></>}</article>;})}
            {legs.length>0&&<button className="clear-draft" onClick={()=>setLegs([])}>Clear draft</button>}
            <p className="note">Historical hit rates describe these samples, not the probability of winning. No combined parlay probability is calculated. This draft does not place bets.</p>
        </aside></div>
    </div>;
}
