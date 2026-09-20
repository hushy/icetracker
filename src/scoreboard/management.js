import { penaltyReasonLabel } from './penalty-reasons.js';
import { pauseClocks } from './phases.js';
import { formatTime, createGame, restoreGame } from './clock.js';
import { translator } from './i18n.js';
import { teamDisplayName } from './youth.js';
export const PRESETS_KEY='icetracker-presets-v1';
const presetKeys=['periodMinutes','periods','shiftEnabled','shiftSeconds','endHorn','breakMinutes','autoPauseOnGoalPenalty','noAnimations','resetScoresEachPeriod'];
export const presetSettings=settings=>Object.fromEntries(presetKeys.map(key=>[key,settings[key]]));
export function newMatch(game, settings = game.settings) {
  const fresh=restoreGame(JSON.stringify(createGame(settings)));
  if(!fresh)return null;
  return {...fresh,displayRevision:crypto.randomUUID(),matchInfo:{...fresh.matchInfo,venue:game.matchInfo?.venue||'',competition:game.matchInfo?.competition||''}};
}
export function readPresets() {
  try {
    const rows=JSON.parse(localStorage.getItem(PRESETS_KEY)||'[]');
    return Array.isArray(rows)?rows.filter(row=>row&&typeof row.id==='string'&&typeof row.name==='string'&&row.settings&&typeof row.settings==='object'):[];
  } catch { return []; }
}
export function undoGame(snapshot){return {...pauseClocks(structuredClone(snapshot)),pauseStartedAt:Date.now()};}
export function editMatchEvent(game,id,patch){
 const old=game.events.find(event=>event.id===id);if(!old)return game;
 const {history:_,...previous}=old;
 const edited={...old,...patch,id:old.id,type:old.type,enteredAt:old.enteredAt??old.occurredAt,editedAt:Date.now(),history:[...(old.history||[]),{at:Date.now(),previous}]};
 const legacy=game.goals.filter(goal=>goal.team===old.team&&goal.period===old.period&&goal.remainingMs===old.remainingMs&&goal.scorer===(old.scorer||''));
 const goalId=old.goalId||(game.goals.some(goal=>goal.id===old.id)?old.id:legacy.length===1?legacy[0].id:null);
 return {...game,events:game.events.map(event=>event.id===id?edited:event),goals:game.goals.map(goal=>old.type==='Goal'&&goal.id===goalId?{...goal,scorer:edited.scorer||'',assists:edited.assists||[],assistsConfirmed:edited.assistsConfirmed,period:edited.period,remainingMs:edited.remainingMs,elapsedMs:edited.elapsedMs,occurredAt:edited.occurredAt}:goal)};
}
export function matchCsv(game){
 const t=translator(game.settings.language);
 const safe=value=>{let s=String(value??'');if(/^[\s]*[=+@-]/.test(s))s="'"+s;return '"'+s.replaceAll('"','""')+'"';};
 const headers=['Period','Event','Team / players','Scorer','Assists','Player number (optional)','Elapsed clock','Remaining clock','Local time','Penalty length','Penalty reason (optional)','Note','Entered at'];
 const rows=game.events.map(e=>[e.period,t(e.type),e.team?teamDisplayName(game.settings,e.team,t):'',e.scorer||'',(e.assists||[]).join(' / '),e.player||'',e.elapsedMs==null?'':formatTime(Math.floor(e.elapsedMs/1000)*1000),formatTime(e.remainingMs),e.occurredAt==null?'':new Date(e.occurredAt).toLocaleString(game.settings.language==='fr'?'fr-FR':'en-GB',{hour12:false}),e.label||'',t(penaltyReasonLabel(e.reason)),e.note||'',e.enteredAt==null?'':new Date(e.enteredAt).toLocaleString(game.settings.language==='fr'?'fr-FR':'en-GB',{hour12:false})]);
 return '\uFEFF'+[[t('Scoreboard'),teamDisplayName(game.settings,'home',t),game.scores.home,teamDisplayName(game.settings,'away',t),game.scores.away],[],headers.map(t),...rows].map(row=>row.map(safe).join(';')).join('\r\n');
}
export function downloadCsv(game){const url=URL.createObjectURL(new Blob([matchCsv(game)],{type:'text/csv;charset=utf-8'}));const a=document.createElement('a');a.href=url;a.download='icetracker-match.csv';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
