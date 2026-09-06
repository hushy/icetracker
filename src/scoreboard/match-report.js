import { formatTime, parseTime, restoreGame } from './clock.js';
import {penaltyReasonLabel as reasonLabel} from './penalty-reasons.js';

export const elapsedTime = ms => ms == null ? '—' : formatTime(Math.floor(ms / 1000) * 1000);
export function periodLength(game, period) {
  const known = game.periodLengths?.[period];
  if (Number.isFinite(known)) return known;
  const event = game.events.find(e => e.period === period && e.elapsedMs != null);
  return event ? event.elapsedMs + event.remainingMs : null;
}
// FFHG sheets read time inside the period next to the period number. Adding the
// periods together is what the paper sheet never does.
export const periodElapsed = event => event?.elapsedMs ?? null;
export function eventClock(game, now = Date.now()) {
  return { period: game.period, remainingMs: game.remainingMs, elapsedMs: game.periodElapsedMs, occurredAt: now };
}
export function reportModel(game, selectedPeriod = '') {
  const inPeriod = e => !selectedPeriod || e.period === Number(selectedPeriod);
  const removed = new Set(game.events.filter(e => e.type === 'Goal removed').map(e => e.goalId).filter(Boolean));
  const goals = game.events.filter(e => e.type === 'Goal' && !e.voided && !removed.has(e.goalId || e.id) &&
    (!e.goalId || game.goals.some(g => g.id === e.goalId)));
  const penalties = game.events.filter(e => e.type === 'Penalty added' && !e.voided).map(e => {
    const related = game.events.filter(item => item.penaltyId && item.penaltyId === e.penaltyId && !item.voided);
    const start = e.deferred ? related.find(item => item.type === 'Penalty started') : e.startedClock || e;
    const end = related.find(item => ['Penalty served', 'Penalty ended'].includes(item.type));
    return { ...e, start, end, startMs: e.startOverrideMs ?? periodElapsed(start), endMs: e.endOverrideMs ?? periodElapsed(end),
      startPeriod: start?.period ?? e.period, endPeriod: end?.period ?? e.period, durationMs: parseTime(e.label || '') };
  });
  const periods = [...new Set([game.period, ...game.events.map(e => e.period)])].sort((a,b) => a-b);
  const totals = periods.filter(p => !selectedPeriod || p === Number(selectedPeriod)).map(period => ({
    period, ...Object.fromEntries(['home','away'].map(team => [team, {
      goals: goals.filter(e => e.period === period && e.team === team).length,
      penaltyMs: penalties.filter(e => e.period === period && e.team === team).reduce((sum,e) => sum + (e.durationMs || 0), 0),
    }])),
    start: game.events.find(e => e.period === period && e.type === 'Clock resumed'),
    end: game.events.find(e => e.period === period && e.type === 'Period complete'),
  }));
  return { goals: goals.filter(inPeriod).sort(order), penalties: penalties.filter(inPeriod).sort(order), totals,
    periods, timeouts: game.events.filter(e => e.type === 'Timeout started' && !e.voided && inPeriod(e)) };
}
function order(a,b) { return a.period-b.period || (a.elapsedMs ?? 0)-(b.elapsedMs ?? 0) || (a.occurredAt ?? 0)-(b.occurredAt ?? 0); }
export function reviewIssues(game) {
  const report = reportModel(game);
  const issues = [];
  const push = (event, message) => issues.push({ id: `${event?.id || message}-${message}`, event, message });
  for (const e of report.goals) {
    if (!e.scorer) push(e, 'Scorer missing');
    if (!e.assists?.length && !e.assistsConfirmed) push(e, 'Assists to confirm');
  }
  for (const e of report.penalties) {
    if (!e.player && e.kind !== 'bench') push(e, 'Player missing');
    if (!e.reason) push(e, 'Penalty reason missing');
    if (e.durationMs == null) push(e, 'Penalty duration missing');
    if (e.endMs == null && !game.penalties[e.team]?.some(row=>row.id===e.penaltyId&&row.remainingMs>0)) push(e,'Penalty end to check');
    if (e.endMs!=null&&e.startMs!=null&&e.endPeriod===e.startPeriod&&e.endMs<e.startMs) push(e,'Penalty end to check');
  }
  const entries = [...report.goals, ...report.penalties];
  for (const e of entries) {
    if (periodElapsed(e) == null) push(e, 'Event time to check');
    const length = periodLength(game,e.period);
    if (length != null && e.elapsedMs != null && Math.abs(length-e.elapsedMs-e.remainingMs)>1000) push(e,'Event time to check');
    const duplicate = entries.find(other => other.id !== e.id && other.type === e.type && other.team === e.team && other.period === e.period && other.remainingMs === e.remainingMs && (other.scorer || other.player || '') === (e.scorer || e.player || '') && (other.label || '') === (e.label || ''));
    if (duplicate && !e.duplicateChecked) push(e, 'Possible duplicate');
  }
  const scored = team => report.goals.filter(e => e.team === team &&
    (!game.settings.resetScoresEachPeriod || e.period === game.period)).length;
  for (const team of ['home','away']) if (scored(team) !== game.scores[team]) {
    issues.push({ id:`score-${team}`,team,message:'Score and recorded goals differ' });
  }
  return issues;
}
export function addMatchNote(game, text, clock = eventClock(game)) {
  if (!text.trim()) return game;
  return { ...game, events: [...game.events, { ...clock, id:crypto.randomUUID(), type:'Match note', note:text.trim().slice(0,1000), enteredAt:Date.now() }] };
}
export function backupText(game) {
  return JSON.stringify({ format:'icetracker-match', version:1, exportedAt:new Date().toISOString(), game }, null, 2);
}
export function readBackup(raw) {
  try {
    const data=JSON.parse(raw);
    if (data.format !== 'icetracker-match' || data.version !== 1) return null;
    const game=restoreGame(JSON.stringify(data.game));
    if (!game || !Array.isArray(data.game.events) || !Array.isArray(data.game.goals) || game.events.length !== data.game.events.length || game.goals.length !== data.game.goals.length) return null;
    const text = value => value == null || typeof value === 'string';
    const safeClock = e => Number.isInteger(e.period) && e.period > 0 && e.period <= 99 && Number.isFinite(e.remainingMs) && e.remainingMs >= 0 && (e.elapsedMs == null || Number.isFinite(e.elapsedMs) && e.elapsedMs >= 0) && (e.occurredAt == null || Number.isFinite(e.occurredAt) && Math.abs(e.occurredAt)<8640000000000000);
    if (game.events.some(e=>!safeClock(e)||!['home','away',undefined,null].includes(e.team)||!['scorer','player','servedBy','reason','label','note'].every(k=>text(e[k]))||(e.assists!=null&&(!Array.isArray(e.assists)||e.assists.some(a=>typeof a!=='string'))))) return null;
    const safeEvent=e=>e&&safeClock(e)&&['scorer','player','servedBy','reason','label','note'].every(k=>text(e[k]))&&(!e.assists||Array.isArray(e.assists)&&e.assists.every(text));
    if (game.events.some(e=>['startOverrideMs','endOverrideMs'].some(k=>e[k]!=null&&(!Number.isFinite(e[k])||e[k]<0||e[k]>59999000)))) return null;
    if (game.events.some(e=>(e.enteredAt!=null&&(!Number.isFinite(e.enteredAt)||Math.abs(e.enteredAt)>=8640000000000000))||(e.startedClock!=null&&!safeClock(e.startedClock))||(e.history!=null&&(!Array.isArray(e.history)||e.history.some(h=>!h||!Number.isFinite(h.at)||Math.abs(h.at)>=8640000000000000||!safeEvent(h.previous)))))) return null;
    if (Object.values(game.penalties).flat().some(p=>!text(p.servedBy)||!text(p.reason))) return null;
    if (new Set(game.events.map(e=>e.id)).size !== game.events.length) return null;
    if (game.matchInfo && !Object.values(game.matchInfo).every(text)) return null;
    if (game.periodLengths && Object.entries(game.periodLengths).some(([p,ms])=>!/^\d+$/.test(p)||Number(p)<1||Number(p)>99||!Number.isFinite(ms)||ms<=0||ms>59999000)) return null;
    return game;
  } catch { return null; }
}
export function downloadFile(text, filename, type='application/json') {
  const url=URL.createObjectURL(new Blob([text],{type}));
  const a=document.createElement('a');a.href=url;a.download=filename;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
}
export function reportCsv(game, selectedPeriod, t, teamName) {
  const report=reportModel(game,selectedPeriod);
  const rows=[[t('Match transcription aid')],[teamName('home'),game.scores.home,teamName('away'),game.scores.away],[t('Period'),selectedPeriod||t('All periods')],
    [t('Date'),game.matchInfo?.date||'',t('Scheduled time'),game.matchInfo?.scheduledTime||'',t('Venue'),game.matchInfo?.venue||'',t('Competition'),game.matchInfo?.competition||'',t('Match number'),game.matchInfo?.number||'']];
  for (const team of ['home','away']) {
    rows.push([], [teamName(team),t('Goals')],['#',t('Period'),t('Period elapsed'),t('Scorer'),t('Assists')]);
    for (const e of report.goals.filter(e=>e.team===team)) rows.push([reportModel(game).goals.filter(g=>g.team===team).findIndex(g=>g.id===e.id)+1,e.period,elapsedTime(periodElapsed(e)),e.scorer||'',(e.assists||[]).join(' / ')]);
    rows.push([], [teamName(team),t('Penalties')],[t('Period'),t('Period elapsed'),t('Player'),t('Assessed minutes'),t('Reason'),t('Start time'),t('End'),t('Served by (optional)')]);
    for (const e of report.penalties.filter(e=>e.team===team)) rows.push([e.period,elapsedTime(periodElapsed(e)),e.kind==='bench'?'E':e.player||'',e.durationMs==null?'':e.durationMs/60000,t(reasonLabel(e.reason)),e.startMs==null?'':elapsedTime(e.startMs),e.endMs==null?'':elapsedTime(e.endMs),e.servedBy||'']);
  }
  rows.push([], [t('Period'),teamName('home')+' '+t('Goals'),teamName('away')+' '+t('Goals'),teamName('home')+' '+t('Assessed minutes'),teamName('away')+' '+t('Assessed minutes'),t('Start time'),t('End')]);
  for (const row of report.totals) rows.push([row.period,row.home.goals,row.away.goals,row.home.penaltyMs/60000,row.away.penaltyMs/60000,localTime(row.start,game),localTime(row.end,game)]);
  rows.push([], [t('Timeout'),t('Period'),t('Period elapsed')]);
  for (const e of report.timeouts) rows.push([teamName(e.team),e.period,elapsedTime(periodElapsed(e))]);
  rows.push([], [t('Pre-filled aid. Complete and check against the official sheet.')]);
  const safe=value=>{let s=String(value??'');if(/^\s*[=+@-]/.test(s))s="'"+s;return '"'+s.replaceAll('"','""')+'"';};
  return '\uFEFF'+rows.map(row=>row.map(safe).join(';')).join('\r\n');
}
export function localTime(event,game) {
  return event?.occurredAt==null?'—':new Date(event.occurredAt).toLocaleTimeString(game.settings.language==='fr'?'fr-FR':'en-GB',{hour12:false});
}
