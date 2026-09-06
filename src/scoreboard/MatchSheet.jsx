import React from 'react';
import { penaltyReasonLabel } from './penalty-reasons.js';
import { downloadCsv } from './management.js';
import Icon from './Icon.jsx';
import { translator } from './i18n.js';
import { formatTime } from './clock.js';
import { teamDisplayName } from './youth.js';
import { penaltyKind, penaltyKindLabel } from './penalty-rules.js';
export default function MatchSheet({game,toolbar,toggleClock,editEvent}) {
  const t=translator(game.settings.language);
  const events=game.events || [];
  return <section className="scoreboard match-sheet"><div className="board-admin-tools">{toolbar}</div>
    <div className="sheet-heading"><div><h1>{t('Match sheet')}</h1><h2 className="sheet-score">{teamDisplayName(game.settings,'home',t)} {game.scores.home} — {game.scores.away} {teamDisplayName(game.settings,'away',t)}</h2><p>{t('Elapsed and remaining time refer to the current period. Local time is recorded when the event occurs.')}</p></div><div className="sheet-actions"><button className="board-button" onClick={()=>downloadCsv(game)}>CSV</button><button className="board-button" onClick={()=>window.print()}>{t('Print / PDF')}</button><button className="board-button" onClick={toggleClock}><Icon name={(game.auxiliary?.running ?? game.running)?'pause':'play'}/>{t((game.auxiliary?.running ?? game.running)?'Pause game':'Resume / start')}</button></div></div>
    {!events.length?<p className="sheet-empty">{t('No match events yet.')}</p>:<div className="sheet-scroll"><table><thead><tr>{['Period','Event','Team / players','Elapsed clock','Remaining clock','Local time'].map(label=><th key={label} scope="col">{t(label)}</th>)}<th className="no-print" scope="col">{t('Edit')}</th></tr></thead><tbody>{events.map(event=><tr key={event.id}><td>{event.period}</td><td><strong>{t(event.type)}</strong>{penaltyReasonLabel(event.reason)&&<small>{t(penaltyReasonLabel(event.reason))}</small>}{event.label&&<small>{t(penaltyKindLabel(penaltyKind(event)))} · {event.label}</small>}{event.penaltyRemainingMs!=null&&<small>{formatTime(event.penaltyRemainingMs)}</small>}</td><td>{event.team&&<strong>{teamDisplayName(game.settings,event.team,t)}</strong>}{event.player&&<small>#{event.player}</small>}{event.scorer&&<small>{t('Scorer')} #{event.scorer}</small>}{event.assists?.length>0&&<small>{t('Assists')} : {event.assists.map(player=>`#${player}`).join(' · ')}</small>}</td><td>{event.elapsedMs==null?'—':formatTime(Math.floor(event.elapsedMs/1000)*1000)}</td><td>{formatTime(event.remainingMs)}</td><td>{event.occurredAt==null?'—':new Date(event.occurredAt).toLocaleTimeString(game.settings.language==='fr'?'fr-FR':'en-GB',{hour12:false})}</td><td className="no-print"><button className="board-button" aria-label={t('Edit event')} onClick={()=>editEvent(event)}><Icon name="settings"/>{t('Edit')}</button></td></tr>)}</tbody></table></div>}
  </section>;
}
