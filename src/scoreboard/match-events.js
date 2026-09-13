import {trackPause} from './pause-warning.js';
// Append only transitions, never timer ticks or synchronization heartbeats.
export function recordMatchEvents(before, after, now = Date.now(), ticking = false) {
  after = trackPause(before, after, now);
  const reset = !after.discardedPenaltyIds?.length && after.events !== before.events && after.events?.length === 0;
  const events = reset ? [] : [...(after.events || [])];
  const additions = [];
  const add = (type, details = {}, clock = after, occurredAt = now) => additions.push({
    type, period: clock.period, remainingMs: clock.remainingMs,
    elapsedMs: clock.periodElapsedMs ?? null, occurredAt, enteredAt: now, ...details,
  });
  // A penalty removed as an entry error never happened: it leaves no event behind.
  const discarded = new Set(after.discardedPenaltyIds || []);
  if (reset) add('New game');
  else {
    for (const goal of after.goals || []) if (!(before.goals || []).some(old => old.id === goal.id)) add('Goal', {goalId:goal.id,team:goal.team,scorer:goal.scorer,assists:goal.assists,assistsConfirmed:goal.assistsConfirmed,...(goal.occurredAt != null ? {period:goal.period,remainingMs:goal.remainingMs,elapsedMs:goal.elapsedMs,occurredAt:goal.occurredAt} : {})});
    for (const goal of before.goals || []) if (!(after.goals || []).some(next => next.id === goal.id)) add('Goal removed', {goalId:goal.id,team:goal.team,scorer:goal.scorer,assists:goal.assists});
    for (const team of ['home','away']) {
      for (const row of after.penalties[team]) {
        if (discarded.has(row.id)) continue;
        const old = before.penalties[team].find(item => item.id === row.id);
        const details = {team,penaltyId:row.id,player:row.player,kind:row.kind,label:row.label,reason:row.reason||'',deferred:Boolean(row.deferred),servedBy:row.servedBy||''};
        if (!old) add('Penalty added',{...details,...row.assessedClock,startedClock:row.deferred?null:{period:after.period,remainingMs:after.remainingMs,elapsedMs:after.periodElapsedMs,occurredAt:now}});
        else if (old.deferred && !row.deferred) add('Penalty started',details);
        else if (old.remainingMs > 0 && row.remainingMs === 0) {
          if (ticking && !before.auxiliary) {
            const delta = before.remainingMs - after.remainingMs;
            add('Penalty served',details,{...before,remainingMs:before.remainingMs-old.remainingMs,periodElapsedMs:(before.periodElapsedMs||0)+old.remainingMs},now-Math.max(0,delta-old.remainingMs));
          } else add('Penalty ended',details);
        } else if (!ticking && row.remainingMs < old.remainingMs) add('Penalty reduced',{...details,penaltyRemainingMs:row.remainingMs});
      }
      for (const old of before.penalties[team]) if (!discarded.has(old.id) && !after.penalties[team].some(row=>row.id===old.id) && old.remainingMs>0) add('Penalty ended',{team,penaltyId:old.id,player:old.player,kind:old.kind,label:old.label,reason:old.reason||''});
    }
    if (before.period !== after.period) add('Period changed', after.settings.resetScoresEachPeriod ? {scoresReset:true} : {});
    else if (!ticking && before.remainingMs !== after.remainingMs) add('Clock corrected');
    if (!before.auxiliary && after.auxiliary) add(after.auxiliary.kind==='break'?'Break started':'Timeout started',{team:after.auxiliary.team});
    else if (before.auxiliary && !after.auxiliary) add('Back to game');
    else if (after.auxiliary && before.auxiliary) {
      if (before.auxiliary.remainingMs>0 && after.auxiliary.remainingMs===0) add('Countdown complete');
      else if (before.auxiliary.running!==after.auxiliary.running) add(after.auxiliary.running?'Countdown resumed':'Countdown paused');
    } else if (before.remainingMs>0 && after.remainingMs===0 && ticking) add('Period complete',{},after,now);
    else if (before.running!==after.running && before.period===after.period) add(after.running?'Clock resumed':'Clock paused');
  }
  if (discarded.size) { const {discardedPenaltyIds:_ignored, ...rest} = after; after = rest; }
  if (!additions.length) return after;
  return {...after,events:[...events,...additions.map((event,index)=>({...event,id:`${now}-${events.length+index}`}))]};
}
