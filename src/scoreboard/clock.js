import { DEFAULT_HORN, normalizeHorn } from './horn-options.js';
import { normalizeCategory } from './youth.js';
export const STORAGE_KEY = 'icetracker-scoreboard-v1';
export const defaultSettings = {
  home: 'HOME', away: 'AWAY', homeLogo: '', awayLogo: '', background: '',
  periodMinutes: 20, periods: 3, shiftEnabled: false, shiftSeconds: 60,
  keepAwake: true, keepAwakePreferenceSet: false, autoPauseOnGoalPenalty: false, endHorn: true, volume: 70, language: 'en', theme: 'volants', hornSound: DEFAULT_HORN, homeClub: '', awayClub: '', homeCategory: '', awayCategory: '', breakMinutes: 5,
};
export function createGame(settings = defaultSettings) {
  return { settings: { ...settings }, remainingMs: settings.periodMinutes * 60000,
    running: false, period: 1, periodElapsedMs: 0, events: [], scores: { home: 0, away: 0 },
    penalties: { home: [], away: [] }, auxiliary: null, timeoutsUsed: {home:false,away:false}, goals: [], shiftRemainingMs: settings.shiftSeconds * 1000 };
}
export function formatTime(ms) {
  const seconds = Math.ceil(Math.max(0, ms) / 1000);
  return `${Math.floor(seconds / 60).toString().padStart(2, '0')}:${(seconds % 60).toString().padStart(2, '0')}`;
}
// One elapsed-time delta advances every clock. Delayed browser ticks do not slow the game.
export function advanceGame(game, elapsedMs) {
  if (game.auxiliary) {
    if (!game.auxiliary.running || elapsedMs <= 0) return {game, horn:null};
    const remainingMs=Math.max(0,game.auxiliary.remainingMs-elapsedMs);
    return {game:{...game,running:false,auxiliary:{...game.auxiliary,remainingMs,running:remainingMs>0}},horn:remainingMs===0&&game.settings.endHorn?'end':null};
  }
  if (!game.running || elapsedMs <= 0) return { game, horn: null };
  const delta = Math.min(elapsedMs, game.remainingMs);
  const remainingMs = Math.max(0, game.remainingMs - delta);
  const penalties = Object.fromEntries(Object.entries(game.penalties).map(([team, rows]) =>
    [team, rows.map(row => ({ ...row, remainingMs: row.deferred ? row.remainingMs : Math.max(0, row.remainingMs - delta) }))]));
  let shiftRemainingMs = game.shiftRemainingMs;
  let horn = null;
  if (game.settings.shiftEnabled) {
    shiftRemainingMs -= delta;
    if (shiftRemainingMs <= 0) {
      const interval = game.settings.shiftSeconds * 1000;
      shiftRemainingMs = ((shiftRemainingMs % interval) + interval) % interval || interval;
      horn = 'shift'; // Never replay a burst of missed horns after browser suspension.
    }
  }
  if (remainingMs === 0) horn = game.settings.endHorn ? 'end' : null;
  return { game: { ...game, remainingMs, periodElapsedMs: (game.periodElapsedMs || 0) + delta, penalties, shiftRemainingMs, running: remainingMs > 0 }, horn };
}
export function nextPeriod(game) {
  return { ...game, period: game.period + 1, periodElapsedMs: 0, remainingMs: game.settings.periodMinutes * 60000,
    running: false, auxiliary: null, shiftRemainingMs: game.settings.shiftSeconds * 1000 };
}
export function parseTime(value) {
  const match = /^(\d{1,3}):([0-5]\d)$/.exec(value.trim());
  return match ? (Number(match[1]) * 60 + Number(match[2])) * 1000 : null;
}
export function restoreGame(raw) {
  try {
    const data = JSON.parse(raw);
    if (!data || !data.settings) return null;
    const settings = { ...defaultSettings, ...data.settings };
    settings.keepAwake = settings.keepAwakePreferenceSet === true ? settings.keepAwake !== false : true;
    if (data.settings.breakMinutes == null && Number.isFinite(data.settings.warmupMinutes)) settings.breakMinutes=data.settings.warmupMinutes;
    if(data.auxiliary?.kind==='warmup')data.auxiliary.kind='break';
    settings.autoPauseOnGoalPenalty = settings.autoPauseOnGoalPenalty === true;
    settings.language = settings.language === 'fr' ? 'fr' : 'en';
    settings.theme = settings.theme === 'neutral' ? 'neutral' : 'volants';
    settings.hornSound = normalizeHorn(settings.hornSound);
    settings.breakMinutes = Number.isFinite(settings.breakMinutes) && settings.breakMinutes >= 1 && settings.breakMinutes <= 99 ? settings.breakMinutes : 5;
    for (const team of ['home', 'away']) settings[`${team}Category`] = normalizeCategory(settings[`${team}Category`]);
    for (const [key, min, max] of [['periodMinutes', 1, 99], ['periods', 1, 9], ['shiftSeconds', 5, 600], ['volume', 0, 100]]) {
      if (!Number.isFinite(settings[key]) || settings[key] < min || settings[key] > max) return null;
    }
    for (const key of ['home', 'away']) if (typeof settings[key] !== 'string' || !settings[key].trim()) return null;
    for (const key of ['homeLogo', 'awayLogo', 'background']) {
      if (typeof settings[key] !== 'string' || (settings[key] && !/^data:image\/(png|jpeg|webp|gif);base64,/.test(settings[key]))) settings[key] = '';
    }
    if (!Number.isFinite(data.remainingMs) || data.remainingMs < 0 || data.remainingMs > 59999000 ||
      !Number.isInteger(data.period) || data.period < 1 || data.period > 99 ||
      !Number.isFinite(data.shiftRemainingMs) || data.shiftRemainingMs <= 0 || data.shiftRemainingMs > settings.shiftSeconds * 1000) return null;
    for (const team of ['home', 'away']) {
      if (!Number.isInteger(data.scores?.[team]) || data.scores[team] < 0 || data.scores[team] > 999 || !Array.isArray(data.penalties?.[team])) return null;
      if (data.penalties[team].some(row => typeof row.id !== 'string' || typeof row.player !== 'string' || typeof row.label !== 'string' || !Number.isFinite(row.remainingMs) || row.remainingMs < 0 || row.remainingMs > 5999000)) return null;
    }
    let auxiliary = null;
    if (data.auxiliary) {
      const aux=data.auxiliary;
      if(!['break','timeout'].includes(aux.kind)||!Number.isFinite(aux.remainingMs)||aux.remainingMs<0||aux.remainingMs>(aux.kind==='timeout'?30000:5940000)||typeof aux.running!=='boolean'||(aux.kind==='timeout'&&!['home','away'].includes(aux.team))) return null;
      auxiliary={...aux,running:false};
    }
    const timeoutsUsed={home:Boolean(data.timeoutsUsed?.home),away:Boolean(data.timeoutsUsed?.away)};
    const goals=Array.isArray(data.goals)?data.goals.filter(goal=>goal&&typeof goal.id==='string'&&['home','away'].includes(goal.team)&&Number.isFinite(goal.period)&&Number.isFinite(goal.remainingMs)&&typeof goal.scorer==='string'&&Array.isArray(goal.assists)&&goal.assists.every(value=>typeof value==='string')):[];
    // A refresh is an explicit interruption: restore the last saved clock paused.
    const periodElapsedMs = Number.isFinite(data.periodElapsedMs) && data.periodElapsedMs >= 0 ? data.periodElapsedMs : Math.max(0,settings.periodMinutes*60000-data.remainingMs);
    const events = Array.isArray(data.events) ? data.events.filter(event=>event && typeof event.id==='string' && typeof event.type==='string' && Number.isFinite(event.remainingMs) && Number.isFinite(event.period)) : goals.map(goal=>({...goal,type:'Goal',elapsedMs:null,occurredAt:null}));
    return { ...data, settings, running: false, auxiliary, timeoutsUsed, goals, periodElapsedMs, events };
  } catch { return null; }
}
