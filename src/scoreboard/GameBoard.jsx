import React from 'react';
import GoalCelebration from './GoalCelebration.jsx';
import PenaltyAnnouncement from './PenaltyAnnouncement.jsx';
import { penaltyReasonLabel } from './penalty-reasons.js';
import Icon from './Icon.jsx';
import {pauseWarning} from './pause-warning.js';
import { formatTime } from './clock.js';
import { clubLogo } from './teams.js';
import { teamDisplayName } from './youth.js';
import { translator } from './i18n.js';
import { isClockRunning } from './phases.js';
import { penaltyKind, penaltyKindLabel } from './penalty-rules.js';

export default function GameBoard({ game, actions, toolbar, hornFlash = '', disconnected = false, goal = null }) {
  const t = translator(game.settings.language);
  const active = game.auxiliary;
  const visibleGoal = !game.settings.noAnimations && !disconnected ? goal : null;
  const remainingMs = active?.remainingMs ?? game.remainingMs;
  const running = isClockRunning(game);
  const ended = remainingMs === 0;
  const pause = disconnected ? null : pauseWarning(game);
  const finalPeriod = game.period >= game.settings.periods;
  const periodLabel = game.period > game.settings.periods ? t('OT {n}', {n:game.period-game.settings.periods}) : `${t('Period')} ${game.period}/${game.settings.periods}`;
  const timerLabel = active?.kind === 'break' ? t('Break') : active?.kind === 'timeout' ? t('Timeout · {team}', {team:teamDisplayName(game.settings,active.team,t)}) : '';
  const iconButton=(label,icon,onClick,props={})=><button title={label} aria-label={label} onClick={onClick} {...props}><Icon name={icon}/></button>;
  function teamPanel(team) {
    const name=teamDisplayName(game.settings,team,t);
    const rows=game.penalties[team];
    const timeoutLabel=t(game.timeoutsUsed?.[team]?'Timeout used':'Timeout · 30 sec');
    return <section className={`team-panel ${team}`} aria-label={t('{team} team',{team:name})}>
      <div className="team-score-area">
        {clubLogo(game.settings,team)&&<img className="team-art" src={clubLogo(game.settings,team)} alt=""/>}
        <div className="team-content"><h2 title={name}>{name}</h2>
          <div className="score-line">
            {actions&&iconButton(t('Subtract goal for {team}',{team:name}),'minus',()=>actions.score(team,-1),{className:'score-step subtract',disabled:game.scores[team]===0})}
            <output className={`score ${game.scores[team]>=100?'three-digits':''}`} aria-live="polite" aria-label={t('{team} score {score}',{team:name,score:game.scores[team]})}>{game.scores[team]}</output>
            {actions&&iconButton(t('Goal · {team}',{team:name}),'plus',()=>actions.score(team,1),{className:'score-step add-goal',disabled:Boolean(active)||game.scores[team]>=999})}
          </div>
          <div className="score-timeout">
            {actions?<button className="timeout-button" aria-label={`${name} · ${timeoutLabel}`} disabled={Boolean(active)||game.timeoutsUsed?.[team]} onClick={()=>actions.timeout(team)}><Icon name={game.timeoutsUsed?.[team]?'check':'clock'}/>{timeoutLabel}</button>:<span className="timeout-status"><Icon name={game.timeoutsUsed?.[team]?'check':'clock'}/>{timeoutLabel}</span>}
          </div>
        </div>
      </div>
      <section className="team-penalties" aria-label={t('{team} penalties',{team:name})}>
        <div className="penalty-heading"><h3>{t('penalties')}</h3><div className="penalty-header-actions">
          {actions&&iconButton(t('Add penalty for {team}',{team:name}),'plus',()=>actions.addPenalty(team),{className:'add-penalty'})}
        </div></div>
        <div className="penalty-list" tabIndex={rows.length?0:undefined} aria-label={t('{team} penalties',{team:name})}>
          {!rows.length?<div className="penalty-empty" aria-label={t('No active penalties')}>—</div>:rows.map(row=>{
            const description=`${t(penaltyKindLabel(penaltyKind(row)))}${row.reason?` · ${t(penaltyReasonLabel(row.reason))}`:''}${row.coincidental?` · ${t('Coincidental')}`:''}${row.deferred?` · ${t('Waiting')}`:''}`;
            const action=t(row.deferred?'Start':row.remainingMs===0?'Clear':'Release');
            return <div className={`penalty-row ${row.remainingMs===0?'expired':''}`} key={row.id} title={description}><div><strong>{row.player?`#${row.player}`:t('TEAM')}</strong>{row.servedBy&&<span>{t('Served by')} #{row.servedBy}</span>}{(row.coincidental||row.deferred)&&<span>{t(row.deferred?'Waiting':'Coincidental')}</span>}{penaltyReasonLabel(row.reason)&&<span className="penalty-reason">{t(penaltyReasonLabel(row.reason))}</span>}<span className="visually-hidden">{description}</span></div><output>{row.remainingMs===0?t('SERVED'):formatTime(row.remainingMs)}</output>{actions&&<button className="penalty-action" aria-label={t('{action} penalty for {team}, player {player}',{action,team:name,player:row.player||t('TEAM')})} onClick={()=>row.deferred?actions.startPenalty(team,row):actions.release(team,row)}>{action}</button>}</div>;
          })}
        </div>
      </section>
    </section>;
  }
  return <div className={`scoreboard integrated-board compact-board ${game.settings.noAnimations?'animations-off':''} ${hornFlash?'horn-flash':''}`} style={game.settings.background?{backgroundImage:`linear-gradient(rgba(6,10,35,.78),rgba(6,10,35,.88)), url("${game.settings.background}")`}:undefined}>
    {toolbar&&<div className="board-admin-tools">{toolbar}</div>}
    {disconnected&&<div className="disconnect-warning" role="status">{t('Operator disconnected · clock frozen')}</div>}
    <div className="board-grid">{teamPanel('home')}<section className="clock-panel" aria-label={t('Game clock')}>
      <div className="clock-heading"><span className="period-label">{periodLabel}</span>{actions&&<button className="clock-edit" title={t('Edit clock & period')} aria-label={t('Edit clock & period')} onClick={actions.editClock}><Icon name="settings" size={16}/>{t('Edit')}</button>}</div>
      {(hornFlash||timerLabel)&&<span className="timer-phase">{t(hornFlash)||timerLabel}</span>}
      <output className={`game-clock ${remainingMs<=60000?'last-minute':''}`}>{formatTime(remainingMs)}</output>
      <div className="clock-status">{running&&!disconnected&&<div className="clock-live" role="status"><span className="live-dot" aria-hidden="true"/>{t('LIVE')}</div>}{pause&&<div className={`pause-warning pause-level-${pause.level}`} role="status" aria-live="off"><span aria-hidden="true" className="pause-warning-dot"/>{t(pause.seconds===1?'Clock paused for {seconds} second':'Clock paused for {seconds} seconds',{seconds:pause.seconds})}</div>}{ended&&<div className="period-ended" role="status">{t(active?'Countdown complete':finalPeriod?'GAME COMPLETE':'PERIOD COMPLETE')}</div>}</div>
      {active&&<div className="match-clock-kept">{t('Match clock · {time}',{time:formatTime(game.remainingMs)})}</div>}
      {game.settings.shiftEnabled&&<div className="board-shift" title={t('Horn every {seconds} seconds of game time',{seconds:game.settings.shiftSeconds})}><Icon name="horn"/><output aria-label={t('NEXT HORN')}>{formatTime(game.shiftRemainingMs)}</output>{actions&&<button className="shift-reset" title={t('Restart shift timer')} aria-label={t('Restart shift timer')} onClick={actions.restartShift}><Icon name="reset"/>{t('Restart')}</button>}</div>}
      <div className="board-announcement">{visibleGoal&&<GoalCelebration key={visibleGoal.id} goal={visibleGoal} settings={game.settings}/>}<PenaltyAnnouncement game={game} disconnected={disconnected} suspended={Boolean(visibleGoal)}/></div>
    </section>{teamPanel('away')}</div>
    {actions&&<div className="transport"><button className={`clock-toggle ${running?'pause':''}`} disabled={ended} onClick={actions.toggle} title={t('SPACE')}><Icon name={running?'pause':'play'}/>{t(running?'Pause game':'Resume')}</button><button className="board-button" onClick={actions.horn}><Icon name="horn"/>{t('Horn')}</button>{active?<button className="board-button" title={t('Back to game')} onClick={actions.endAuxiliary}><Icon name="arrow"/>{t('Back to game')}</button>:<><button className="board-button" onClick={actions.break}><Icon name="clock"/>{t('Break')}</button><button className="board-button" title={t(finalPeriod?'Overtime':'Next period')} onClick={actions.nextPeriod}>{t(finalPeriod?'Overtime':'Next period')}<Icon name="arrow"/></button></>}</div>}
  </div>;
}
