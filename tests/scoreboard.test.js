import test from 'node:test';
import assert from 'node:assert/strict';
import { advanceGame, createGame, defaultSettings, formatTime, nextPeriod, parseTime, restoreGame } from '../src/scoreboard/clock.js';
const running = (settings = {}) => ({ ...createGame({ ...defaultSettings, ...settings }), running: true });
const penalty = ms => ({ id: 'p1', player: '12', label: '02:00', remainingMs: ms });
test('delayed ticks advance game, penalties and shifts by the same elapsed time', () => {
  const game = running({ shiftEnabled: true }); game.penalties.home = [penalty(120000)];
  const result = advanceGame(game, 25350);
  assert.equal(result.game.remainingMs, 1174650); assert.equal(result.game.penalties.home[0].remainingMs, 94650);
  assert.equal(result.game.shiftRemainingMs, 34650); assert.equal(result.horn, null);
});
test('pause freezes all timers, resume accounts only for active play', () => {
  let game = advanceGame(running({ shiftEnabled: true }), 12000).game;
  game = { ...game, running: false }; assert.equal(advanceGame(game, 90000).game, game);
  const result = advanceGame({ ...game, running: true }, 8000).game;
  assert.equal(result.remainingMs, 1180000); assert.equal(result.shiftRemainingMs, 40000);
});
test('period buzzer caps penalty decrement at the end of play and only rings once', () => {
  const game = running(); game.remainingMs = 1000; game.penalties.away = [penalty(10000)];
  const result = advanceGame(game, 8000); assert.equal(result.game.remainingMs, 0);
  assert.equal(result.game.penalties.away[0].remainingMs, 9000); assert.equal(result.game.running, false);
  assert.equal(result.horn, 'end'); assert.equal(advanceGame(result.game, 9000).horn, null);
});
test('expired penalties never go negative', () => {
  const game = running(); game.penalties.home = [penalty(1000)];
  assert.equal(advanceGame(game, 5000).game.penalties.home[0].remainingMs, 0);
});
test('shift horn repeats at exact game-time intervals', () => {
  const first = advanceGame(running({ shiftEnabled: true }), 60000);
  assert.equal(first.horn, 'shift'); assert.equal(first.game.shiftRemainingMs, 60000);
  const second = advanceGame(first.game, 60000); assert.equal(second.horn, 'shift');
});
test('a delayed tick emits one horn and preserves shift alignment', () => {
  const result = advanceGame(running({ shiftEnabled: true }), 185000);
  assert.equal(result.horn, 'shift'); assert.equal(result.game.shiftRemainingMs, 55000);
});
test('end horn wins over simultaneous shift horn; disabling end horn stays silent', () => {
  const game = running({ shiftEnabled: true }); game.remainingMs = 60000;
  assert.equal(advanceGame(game, 60000).horn, 'end');
  game.settings.endHorn = false; assert.equal(advanceGame(game, 60000).horn, null);
});
test('next period retains score and penalties and resets clocks paused', () => {
  const game = running({ shiftEnabled: true }); game.scores.home = 3; game.penalties.home = [penalty(30000)];
  const result = nextPeriod(game); assert.equal(result.period, 2); assert.equal(result.remainingMs, 1200000);
  assert.equal(result.running, false); assert.equal(result.scores.home, 3);
  assert.equal(result.penalties.home[0].remainingMs, 30000); assert.equal(result.shiftRemainingMs, 60000);
});
test('formatting rounds up to avoid an early 00:00', () => {
  assert.equal(formatTime(1), '00:01'); assert.equal(formatTime(60100), '01:01');
  assert.equal(formatTime(-1), '00:00'); assert.equal(formatTime(1200000), '20:00');
});
test('clock corrections reject invalid seconds and support zero', () => {
  assert.equal(parseTime('12:30'), 750000); assert.equal(parseTime('00:00'), 0);
  for (const value of ['12:99', '-1:20', 'abc', '1:2', 'Infinity']) assert.equal(parseTime(value), null);
});
test('saved games restore paused and malformed saves are rejected', () => {
  const game = running(); game.scores.away = 2;
  const result = restoreGame(JSON.stringify(game)); assert.equal(result.running, false); assert.equal(result.scores.away, 2);
  for (const value of ['', '{}', 'null', '{broken', JSON.stringify({ ...game, period: -1 }), JSON.stringify({ ...game, shiftRemainingMs: 0 }), JSON.stringify({ ...game, scores: { home: -1, away: 0 } })]) assert.equal(restoreGame(value), null);
});
test('image URLs from saved state cannot initiate remote requests', () => {
  const game = createGame(); game.settings.background = 'https://example.com/tracker.png';
  assert.equal(restoreGame(JSON.stringify(game)).settings.background, '');
});

// Public display projection never mutates operator state or plays a horn.
import { readDisplaySnapshot, projectDisplay, DISPLAY_TIMEOUT_MS } from '../src/scoreboard/display-model.js';
import { translator, french } from '../src/scoreboard/i18n.js';
test('public display follows live clock and penalties without changing source state', () => {
  const game = running({ shiftEnabled: true }); game.penalties.home = [penalty(90000)];
  const snapshot = readDisplaySnapshot({ type: 'state', game, sentAt: 10000 });
  assert.equal(snapshot.game.running, true);
  const view = projectDisplay(snapshot, 11250);
  assert.equal(view.game.remainingMs, 1198750); assert.equal(view.game.penalties.home[0].remainingMs, 88750);
  assert.equal(view.game.shiftRemainingMs, 58750); assert.equal(snapshot.game.remainingMs, 1200000);
});
test('public display immediately reflects an operator pause and clock correction', () => {
  const game = createGame(); game.remainingMs = 85000; game.scores.away = 3;
  const snapshot = readDisplaySnapshot({ type: 'state', game, sentAt: 10000 });
  const view = projectDisplay(snapshot, 13000);
  assert.equal(view.game.remainingMs, 85000); assert.equal(view.game.scores.away, 3); assert.equal(view.disconnected, false);
});
test('heartbeat updates retain team settings and language', () => {
  const game = running({ language: 'fr', homeClub: 'francais-volants' });
  const previous = readDisplaySnapshot({ type: 'state', game, sentAt: 10000 });
  const { settings, ...clock } = advanceGame(game, 500).game;
  const next = readDisplaySnapshot({ type: 'state', game: clock, sentAt: 10500 }, previous);
  assert.equal(next.game.settings.language, 'fr'); assert.equal(next.game.settings.homeClub, 'francais-volants');
  assert.equal(next.game.remainingMs, 1199500);
});
test('disconnected public display freezes instead of running indefinitely', () => {
  const snapshot = readDisplaySnapshot({ type: 'state', game: running(), sentAt: 10000 });
  const first = projectDisplay(snapshot, 10000 + DISPLAY_TIMEOUT_MS + 1);
  const later = projectDisplay(snapshot, 1000000);
  assert.equal(first.disconnected, true); assert.equal(later.game.running, false);
  assert.equal(first.game.remainingMs, later.game.remainingMs);
});
test('incomplete and invalid public snapshots are rejected', () => {
  assert.equal(readDisplaySnapshot({ type: 'state', game: { running: true }, sentAt: 1 }), null);
  assert.equal(readDisplaySnapshot({ type: 'request', game: createGame(), sentAt: 1 }), null);
  const game = createGame(); game.remainingMs = -1;
  assert.equal(readDisplaySnapshot({ type: 'state', game, sentAt: 1 }), null);
});
test('French translation covers dynamic match messages and preserves parameters', () => {
  const t = translator('fr'); assert.equal(t('Game setup'), 'Configuration du match');
  assert.equal(t('PERIOD {n}', { n: 2 }), 'PÉRIODE 2');
  assert.equal(t('Penalty · {team}', { team: 'Français Volants' }), 'Pénalité · Français Volants');
  for (const [key, value] of Object.entries(french)) {
    assert.deepEqual([...key.matchAll(/\{(\w+)\}/g)].map(x=>x[1]).sort(), [...value.matchAll(/\{(\w+)\}/g)].map(x=>x[1]).sort(), key);
  }
});
test('existing saves gain default FV theme, English option and new horn', () => {
  const game = createGame(); delete game.settings.theme; delete game.settings.language; delete game.settings.hornSound;
  const result = restoreGame(JSON.stringify(game)); assert.equal(result.settings.theme, 'volants');
  assert.equal(result.settings.language, 'en'); assert.equal(result.settings.hornSound, 'icebreaker');
});
import { youthCategories, normalizeCategory, teamDisplayName } from '../src/scoreboard/youth.js';
test('youth category labels follow each side without changing its name or logo', () => {
  const game = createGame(); game.settings.home = 'Français Volants de Paris';
  game.settings.homeCategory = 'U11'; game.settings.awayCategory = 'U13';
  assert.equal(teamDisplayName(game.settings, 'home'), 'Français Volants de Paris · U11');
  assert.equal(teamDisplayName(game.settings, 'away', translator('fr')), 'VISITEURS · U13');
  assert.equal(game.settings.home, 'Français Volants de Paris');
  assert.equal(game.remainingMs, 1200000); assert.equal(game.settings.shiftEnabled, false);
});
test('all youth categories persist and synchronize to the public window', () => {
  for (const category of youthCategories) {
    const game = createGame(); game.settings.homeCategory = category;
    const restored = restoreGame(JSON.stringify(game)); assert.equal(restored.settings.homeCategory, category);
    const snapshot = readDisplaySnapshot({type:'state', game, sentAt:1000});
    assert.equal(snapshot.game.settings.homeCategory, category);
  }
});
test('legacy saves and invalid category values display without a suffix', () => {
  const game = createGame(); delete game.settings.homeCategory; game.settings.awayCategory = {invalid:true};
  const restored = restoreGame(JSON.stringify(game));
  assert.equal(restored.settings.homeCategory, ''); assert.equal(restored.settings.awayCategory, '');
  assert.equal(teamDisplayName(restored.settings, 'home'), 'HOME');
  assert.equal(normalizeCategory('U99'), '');
});

import { normalizeHorn, hornOptions } from '../src/scoreboard/horn-options.js';
test('old crowd recording and synthesized horn migrate to the new deep horn', () => {
  for (const old of ['arena', 'synth', undefined, 'invalid']) {
    const game = createGame(); game.settings.hornSound = old;
    assert.equal(restoreGame(JSON.stringify(game)).settings.hornSound, 'icebreaker');
  }
  for (const {id} of hornOptions) assert.equal(normalizeHorn(id), id);
});

import { startWarmup, startTimeout, leaveAuxiliary, toggleActiveClock, pauseClocks } from '../src/scoreboard/phases.js';
import { powerPlayRecommendation, recordGoal, removeGoal } from '../src/scoreboard/penalty-rules.js';
const sanction = (id, kind='minor', remainingMs=120000, extra={}) => ({id,kind,player:id,label:kind==='double'?'04:00':'02:00',remainingMs,...extra});
test('warm-up runs independently and pauses/resumes without consuming match, shift or penalties',()=>{
 const source=running({shiftEnabled:true}); source.penalties.home=[sanction('12')];
 let game=startWarmup(source,5);game=advanceGame(game,10000).game;
 assert.equal(game.auxiliary.remainingMs,290000);assert.equal(game.remainingMs,source.remainingMs);assert.deepEqual(game.penalties,source.penalties);assert.equal(game.shiftRemainingMs,source.shiftRemainingMs);
 game=pauseClocks(game);assert.equal(advanceGame(game,50000).game.auxiliary.remainingMs,290000);
 game=toggleActiveClock(game);const end=advanceGame(game,400000);assert.equal(end.horn,'end');assert.equal(advanceGame(end.game,1000).horn,null);assert.equal(leaveAuxiliary(end.game).running,false);
});
test('each team gets one timeout per game, retained across periods and refresh',()=>{
 let game=startTimeout(running(),'home');assert.equal(game.auxiliary.remainingMs,30000);
 assert.equal(startTimeout(game,'away'),game);game=leaveAuxiliary(advanceGame(game,30000).game);
 assert.equal(startTimeout(game,'home'),game);game=nextPeriod(game);
 assert.equal(restoreGame(JSON.stringify(game)).timeoutsUsed.home,true);
 assert.equal(startTimeout(game,'away').timeoutsUsed.away,true);assert.equal(createGame().timeoutsUsed.home,false);
});
test('public auxiliary clock interpolates, disconnect freezes it, restore always pauses',()=>{
 const game=startWarmup(running(),2);const snap=readDisplaySnapshot({type:'state',sentAt:1000,game});
 assert.equal(projectDisplay(snap,2500).game.auxiliary.remainingMs,118500);
 assert.equal(projectDisplay(snap,6000).game.auxiliary.running,false);
 assert.equal(restoreGame(JSON.stringify(game)).auxiliary.running,false);
});
test('power-play goal selects shortest minor; equal strength and shorthanded goals release none',()=>{
 const game=running();game.penalties.away=[sanction('12'),sanction('18','minor',45000)];
 assert.deepEqual(powerPlayRecommendation(game,'home').candidates.map(p=>p.id),['18']);
 assert.equal(powerPlayRecommendation(game,'away').candidates.length,0);
 game.penalties.home=[sanction('3'),sanction('4')];assert.equal(powerPlayRecommendation(game,'home').candidates.length,0);
});
test('major, misconduct, coincidental, waiting and penalty-shot situations do not release a player',()=>{
 for(const row of [sanction('1','major'),sanction('1','misconduct'),sanction('1','minor',120000,{coincidental:true}),sanction('1','minor',120000,{deferred:true})]){
 const game=running();game.penalties.away=[row];assert.equal(powerPlayRecommendation(game,'home').candidates.length,0);
 }
 const game=running();game.penalties.away=[sanction('1')];assert.equal(powerPlayRecommendation(game,'home',true).candidates.length,0);
});
test('double-minor compares its active segment and retains the second two minutes',()=>{
 const game=running();game.penalties.away=[sanction('12','double',150000),sanction('18','minor',90000)];
 const rec=powerPlayRecommendation(game,'home');assert.equal(rec.candidates[0].id,'12');assert.equal(rec.candidates[0].afterMs,120000);
 const changed=recordGoal(game,'home',{id:'g',releaseId:'12'});assert.equal(changed.penalties.away[0].remainingMs,120000);
 assert.equal(powerPlayRecommendation(changed,'home').candidates[0].id,'18');
 changed.penalties.away=[sanction('12','double',40000)];assert.equal(powerPlayRecommendation(changed,'home').candidates[0].afterMs,0);
});
test('tied penalties expose both choices; unfamiliar, queued or overtime situations require review',()=>{
 const game=running();game.penalties.away=[sanction('1'),sanction('2')];assert.equal(powerPlayRecommendation(game,'home').candidates.length,2);
 game.penalties.away.push(sanction('3'));assert.equal(powerPlayRecommendation(game,'home').candidates.length,0);
 game.penalties.away=[sanction('1','custom')];assert.equal(powerPlayRecommendation(game,'home').candidates.length,0);
 game.penalties.away=[sanction('1')];game.period=4;assert.equal(powerPlayRecommendation(game,'home').candidates.length,0);
});
test('confirmed goals save scorer and up to two assists; corrections remove the latest team event',()=>{
 const source=running();source.penalties.away=[sanction('12')];
 let game=recordGoal(source,'home',{id:'g1',scorer:'8',assist1:'9',assist2:'10',releaseId:'12'});
 assert.equal(source.scores.home,0);assert.equal(source.penalties.away[0].remainingMs,120000);
 assert.equal(game.scores.home,1);assert.equal(game.running,true);assert.deepEqual(game.goals[0].assists,['9','10']);assert.equal(game.penalties.away[0].remainingMs,0);
 game=recordGoal(game,'away',{id:'g2'});assert.deepEqual(game.goals[1].assists,[]);
 game=removeGoal(game,'home');assert.equal(game.goals[0].id,'g2');assert.equal(game.scores.home,0);assert.equal(game.penalties.away[0].remainingMs,0);
 assert.equal(recordGoal(startWarmup(game,2),'home').scores.home,0);
});

import { observeGoals } from '../src/scoreboard/goal-animation.js';
test('public goal animation ignores initial history and repeated synchronization, announces new goals once',()=>{
 const old={id:'old'}, first={id:'new',scorer:'12',assists:['8','9']};
 let observed=observeGoals(null,[old]);assert.equal(observed.goal,null);
 observed=observeGoals(observed.seen,[old,first]);assert.equal(observed.goal,first);
 observed=observeGoals(observed.seen,[old,first]);assert.equal(observed.goal,null);
 observed=observeGoals(observed.seen,[old]);assert.equal(observed.goal,null);
 observed=observeGoals(observed.seen,[old,first]);assert.equal(observed.goal,null);
 observed=observeGoals(observed.seen,[]);assert.equal(observed.goal,null);
 const next={id:'next'};assert.equal(observeGoals(observed.seen,[next]).goal,next);
});


import { prepareDialog } from '../src/scoreboard/phases.js';
test('goal and penalty dialogs preserve manual clock control by default, including confirmation',()=>{
 const game=running();
 for(const modal of [{goalTeam:'home'},{removeGoalTeam:'home'},'penalty-home','penalty-away',{release:{id:'p'}}]){
  assert.equal(prepareDialog(game,modal).running,true);
  assert.equal(prepareDialog({...game,running:false},modal).running,false);
 }
 const scored=recordGoal(game,'home',{id:'manual'});
 assert.equal(scored.running,true);assert.equal(advanceGame(scored,5000).game.remainingMs,game.remainingMs-5000);
 assert.equal(recordGoal({...game,running:false},'home',{id:'paused'}).running,false);
 assert.equal(prepareDialog(game,'setup').running,false);
});
test('auto pause is opt-in, applies to goal and penalty dialogs and persists',()=>{
 const game=running({autoPauseOnGoalPenalty:true});
 for(const modal of [{goalTeam:'home'},'penalty-away',{release:{id:'p'}}])assert.equal(prepareDialog(game,modal).running,false);
 assert.equal(recordGoal(game,'home',{id:'auto'}).running,false);
 assert.equal(restoreGame(JSON.stringify(game)).settings.autoPauseOnGoalPenalty,true);
 delete game.settings.autoPauseOnGoalPenalty;
 assert.equal(restoreGame(JSON.stringify(game)).settings.autoPauseOnGoalPenalty,false);
});

import {recordMatchEvents} from '../src/scoreboard/match-events.js';
test('match sheet timestamps goals, penalties and corrections without duplicating timer ticks',()=>{
 let game=running();game=advanceGame(game,90000).game;
 const scored=recordMatchEvents(game,recordGoal(game,'home',{id:'sheet-goal',scorer:'12',assist1:'8'}),1700000000000);
 const event=scored.events[0];assert.equal(event.type,'Goal');assert.equal(event.elapsedMs,90000);assert.equal(event.remainingMs,1110000);assert.equal(event.occurredAt,1700000000000);assert.deepEqual(event.assists,['8']);
 const ticking=recordMatchEvents(scored,advanceGame(scored,1000).game,1700000001000,true);assert.equal(ticking.events.length,1);
 const corrected=recordMatchEvents(ticking,removeGoal(ticking,'home'));assert.equal(corrected.events.at(-1).type,'Goal removed');assert.equal(corrected.events[0].type,'Goal');
 const added=recordMatchEvents(corrected,{...corrected,penalties:{...corrected.penalties,away:[sanction('12')]}});assert.equal(added.events.at(-1).type,'Penalty added');
 assert.equal(restoreGame(JSON.stringify(added)).events.length,3);
});
test('match sheet preserves elapsed period time across settings edits and resets it on next period',()=>{
 let game=advanceGame(running(),30000).game;game.settings={...game.settings,periodMinutes:15};
 assert.equal(game.periodElapsedMs,30000);const next=recordMatchEvents(game,nextPeriod(game));assert.equal(next.periodElapsedMs,0);assert.equal(next.events.at(-1).remainingMs,900000);
 const fresh=recordMatchEvents(next,createGame());assert.equal(fresh.events.length,1);assert.equal(fresh.events[0].type,'New game');
});
test('penalty expiration records exact clock crossing even on a delayed tick',()=>{
 const before=running();before.penalties.home=[sanction('12','minor',2000)];const after=recordMatchEvents(before,advanceGame(before,5000).game,10000,true);
 assert.equal(after.events[0].type,'Penalty served');assert.equal(after.events[0].elapsedMs,2000);assert.equal(after.events[0].remainingMs,1198000);assert.equal(after.events[0].occurredAt,7000);
});

test('hide animation applies only to the chosen goal and preserves score, details and synchronization',()=>{
 const source=running();const baseline=observeGoals(null,source.goals);
 const scored=recordGoal(source,'home',{id:'hidden',scorer:'12',assist1:'8',hideAnimation:true});
 assert.equal(scored.scores.home,1);assert.equal(scored.goals[0].scorer,'12');assert.equal(scored.goals[0].hideAnimation,true);
 const restored=restoreGame(JSON.stringify(scored));assert.equal(restored.goals[0].hideAnimation,true);
 const observed=observeGoals(baseline.seen,restored.goals);assert.equal(observed.goal,null);assert.equal(observed.seen.has('hidden'),true);
 assert.equal(observeGoals(observed.seen,restored.goals).goal,null);
 const next=recordGoal(scored,'home',{id:'visible'});assert.equal(observeGoals(observed.seen,next.goals).goal.id,'visible');
});

import {undoGame,editMatchEvent,presetSettings,matchCsv} from '../src/scoreboard/management.js';
import {startBreak} from '../src/scoreboard/phases.js';
test('undo restores scores, penalty release and event history without resuming clocks',()=>{
 const before=running();before.penalties.away=[sanction('12')];const snapshot=structuredClone(before);
 const after=recordMatchEvents(before,recordGoal(before,'home',{id:'undo-goal',releaseId:'12'}));assert.equal(after.penalties.away[0].remainingMs,0);
 const undone=undoGame(snapshot);assert.equal(undone.scores.home,0);assert.equal(undone.penalties.away[0].remainingMs,120000);assert.deepEqual(undone.events,[]);assert.equal(undone.running,false);assert.equal(snapshot.running,true);
 assert.equal(undoGame(startBreak(before,5)).auxiliary.running,false);
});
test('editing linked goal events preserves live state and persists corrected details',()=>{
 const before=running();const goal=recordMatchEvents(before,recordGoal(before,'home',{id:'edit-goal',scorer:'12',assist1:'8'}));
 const edited=editMatchEvent(goal,goal.events[0].id,{scorer:'15',assists:['9','10'],period:2,remainingMs:900000,elapsedMs:300000,occurredAt:1700000000000});
 assert.equal(edited.goals[0].scorer,'15');assert.deepEqual(edited.goals[0].assists,['9','10']);assert.equal(edited.scores.home,1);assert.equal(edited.remainingMs,goal.remainingMs);assert.equal(edited.period,1);assert.equal(edited.running,true);
 const journaled=recordMatchEvents(goal,edited);assert.equal(journaled.events[0].scorer,'15');assert.equal(restoreGame(JSON.stringify(journaled)).events[0].period,2);
});
test('break replaces legacy warm-up and freezes match clocks',()=>{
 const game=running();const started=startBreak(game,7);assert.equal(started.auxiliary.kind,'break');assert.equal(started.settings.breakMinutes,7);assert.equal(advanceGame(started,1000).game.remainingMs,game.remainingMs);
 const legacy={...started,settings:{...started.settings,warmupMinutes:8},auxiliary:{...started.auxiliary,kind:'warmup'}};delete legacy.settings.breakMinutes;const restored=restoreGame(JSON.stringify(legacy));assert.equal(restored.settings.breakMinutes,8);assert.equal(restored.auxiliary.kind,'break');
});
test('presets contain match format settings without teams, live state or artwork',()=>{
 const settings={...defaultSettings,breakMinutes:8,periodMinutes:15,home:'Example',homeLogo:'data:image/png;base64,AAAA'};const preset=presetSettings(settings);assert.equal(preset.periodMinutes,15);assert.equal(preset.breakMinutes,8);assert.equal(preset.home,undefined);assert.equal(preset.homeLogo,undefined);assert.equal(preset.scores,undefined);
});
test('CSV exports French event times and escapes quotes, delimiters and spreadsheet formulas',()=>{
 const game=createGame({...defaultSettings,language:'fr',home:'=BAD;"name"'});game.events=[{id:'csv',type:'Goal',team:'home',scorer:'12',assists:['8','9'],period:1,elapsedMs:90000,remainingMs:1110000,occurredAt:1700000000000}];const csv=matchCsv(game);assert.ok(csv.startsWith('\uFEFF'));assert.match(csv,/Chrono montant/);assert.match(csv,/01:30/);assert.match(csv,/18:30/);assert.match(csv,/"'=BAD;""name"""/);assert.match(csv,/8 \/ 9/);
});

import {penaltyReasons,penaltyReasonLabel} from '../src/scoreboard/penalty-reasons.js';
import {observePenaltyEvents} from '../src/scoreboard/penalty-animation.js';
test('optional penalty reason survives saving, expiration, manual release and CSV export',()=>{
 const before=running({language:'fr'});const row={...sanction('12','minor',2000),reason:'hooking'};
 const added=recordMatchEvents(before,{...before,penalties:{...before.penalties,home:[row]}},1000);
 assert.equal(added.events[0].reason,'hooking');assert.equal(restoreGame(JSON.stringify(added)).penalties.home[0].reason,'hooking');assert.match(matchCsv(added),/Accrocher/);
 const ended=recordMatchEvents(added,advanceGame(added,2000).game,3000,true);assert.equal(ended.events.at(-1).reason,'hooking');assert.equal(ended.events.at(-1).type,'Penalty served');
 const released=recordMatchEvents(added,{...added,penalties:{home:[],away:[]}},3000);assert.equal(released.events.at(-1).reason,'hooking');assert.equal(released.events.at(-1).type,'Penalty ended');
 assert.equal(penaltyReasonLabel(''), '');assert.equal(new Set(penaltyReasons.map(r=>r.id)).size,penaltyReasons.length);
});
test('penalty announcements ignore initial history, replay and corrections; preserve simultaneous events',()=>{
 const old={id:'old',type:'Penalty added'};let observed=observePenaltyEvents(null,[old]);assert.deepEqual(observed.fresh,[]);
 const added={id:'add',type:'Penalty added'},ended={id:'end',type:'Penalty served'};observed=observePenaltyEvents(observed.seen,[old,added,ended]);assert.deepEqual(observed.fresh,[added,ended]);
 assert.deepEqual(observePenaltyEvents(observed.seen,[old,added,ended]).fresh,[]);
 assert.deepEqual(observePenaltyEvents(observed.seen,[old]).fresh,[]);
 assert.deepEqual(observePenaltyEvents(observed.seen,[old,{id:'goal',type:'Goal'}]).fresh,[]);
 const reduced={id:'reduced',type:'Penalty reduced',penaltyRemainingMs:120000};assert.deepEqual(observePenaltyEvents(observed.seen,[old,reduced]).fresh,[reduced]);
});

test('wake lock defaults on and migrates old defaults while preserving a new explicit opt-out',()=>{
 assert.equal(createGame().settings.keepAwake,true);
 const legacy=createGame();legacy.settings.keepAwake=false;delete legacy.settings.keepAwakePreferenceSet;
 assert.equal(restoreGame(JSON.stringify(legacy)).settings.keepAwake,true);
 legacy.settings.keepAwakePreferenceSet=true;
 assert.equal(restoreGame(JSON.stringify(legacy)).settings.keepAwake,false);
 legacy.settings.keepAwake=true;
 assert.equal(restoreGame(JSON.stringify(legacy)).settings.keepAwake,true);
});

import { eventClock, reportModel, matchElapsed, reviewIssues, backupText, readBackup, addMatchNote, reportCsv } from '../src/scoreboard/match-report.js';
test('goal occurrence is captured before entry while all clocks keep running', () => {
  let game=advanceGame(running(),10000).game;
  const clock=eventClock(game,100000);
  game=advanceGame(game,7000).game;
  const after=recordMatchEvents(game,recordGoal(game,'home',{id:'capture',scorer:'12',clock}),107000);
  assert.equal(after.remainingMs,1183000);assert.equal(after.running,true);
  const goal=after.events.find(e=>e.type==='Goal');
  assert.equal(goal.remainingMs,1190000);assert.equal(goal.elapsedMs,10000);
  assert.equal(goal.occurredAt,100000);assert.equal(goal.enteredAt,107000);
});
test('cumulative report time uses each recorded period length after format changes', () => {
  let game=createGame({...defaultSettings,periodMinutes:15});
  game=nextPeriod({...game,settings:{...game.settings,periodMinutes:20}});
  const event={period:2,elapsedMs:446000,remainingMs:754000};
  assert.equal(matchElapsed(game,event),1346000);
  game=nextPeriod({...game,settings:{...game.settings,periodMinutes:5}});
  assert.equal(matchElapsed(game,{period:3,elapsedMs:30000}),2130000);
  assert.equal(matchElapsed({...game,periodLengths:{},events:[]},event),null);
});
test('penalty report distinguishes assessment, actual start, early end and imposed minutes', () => {
  let game=running();
  const row={...penalty(120000),kind:'minor',reason:'tripping',servedBy:'9',deferred:true,assessedClock:eventClock(game,1000)};
  game=recordMatchEvents(game,{...game,penalties:{...game.penalties,home:[row]}},5000);
  game=advanceGame(game,10000).game;
  game=recordMatchEvents(game,{...game,penalties:{...game.penalties,home:[{...row,deferred:false}]}},15000);
  game=advanceGame(game,44000).game;
  game=recordMatchEvents(game,{...game,penalties:{...game.penalties,home:[]}},59000);
  const report=reportModel(game),p=report.penalties[0];
  assert.equal(p.elapsedMs,0);assert.equal(p.start.elapsedMs,10000);assert.equal(p.end.elapsedMs,54000);
  assert.equal(p.durationMs,120000);assert.equal(report.totals[0].home.penaltyMs,120000);assert.equal(p.servedBy,'9');
});
test('report excludes removed goals and operational actions without losing the journal', () => {
  let game=createGame();
  game=recordMatchEvents(game,recordGoal(game,'home',{id:'g',scorer:'12'}),1000);
  game=recordMatchEvents(game,removeGoal(game,'home'),2000);
  assert.equal(reportModel(game).goals.length,0);assert.equal(game.events.length,2);
  assert.equal(reviewIssues(game).length,0);
});
test('review distinguishes an unconfirmed blank assist from a confirmed unassisted goal', () => {
  let game=createGame();game=recordMatchEvents(game,recordGoal(game,'home',{id:'g',scorer:'12'}),1000);
  assert.ok(reviewIssues(game).some(e=>e.message==='Assists to confirm'));
  game=editMatchEvent(game,game.events[0].id,{assistsConfirmed:true});
  assert.equal(reviewIssues(game).length,0);
});
test('correction history preserves original entry time and previous values through backup', () => {
  let game=createGame();game=recordMatchEvents(game,recordGoal(game,'home',{id:'g',scorer:'12'}),1000);
  const id=game.events[0].id;
  game=editMatchEvent(game,id,{scorer:'18',occurredAt:900});
  game=editMatchEvent(game,id,{scorer:'19'});
  const restored=readBackup(backupText(game));
  assert.equal(restored.events[0].history.length,2);
  assert.equal(restored.events[0].history[0].previous.scorer,'12');
  assert.equal(restored.events[0].history[1].previous.scorer,'18');
  assert.equal(restored.events[0].enteredAt,1000);assert.equal(restored.goals[0].scorer,'19');
});
test('backups round trip match data, notes and artwork, restoring all clocks paused', () => {
  let game=running();game.matchInfo={venue:'Paris',competition:'U13'};
  game=addMatchNote(game,'Check with referee',eventClock(game,5000));
  game=startTimeout(game,'home');
  const restored=readBackup(backupText(game));
  assert.equal(restored.running,false);assert.equal(restored.auxiliary.running,false);
  assert.equal(restored.matchInfo.venue,'Paris');assert.equal(restored.events[0].note,'Check with referee');
  assert.deepEqual(restored.periodLengths,game.periodLengths);
});
test('malformed or lossy backup imports fail instead of silently dropping records', () => {
  const game=createGame();game.events=[{id:'bad',type:'Goal',period:1,remainingMs:0,assists:{bad:true}}];
  for(const input of ['{}','not json',JSON.stringify(game),backupText(game)])assert.equal(readBackup(input),null);
  game.events=[{id:'a',type:'Goal',period:1,remainingMs:0,elapsedMs:-100}];
  assert.equal(readBackup(backupText(game)),null);
});
test('period exports omit other periods and private notes and escape spreadsheet formulas', () => {
  let game=createGame();game=recordMatchEvents(game,recordGoal(game,'home',{id:'g1',scorer:'12'}),1000);
  game=nextPeriod(game);game=recordMatchEvents(game,recordGoal(game,'away',{id:'g2',scorer:'18'}),2000);
  game=addMatchNote(game,'Private discussion');
  const csv=reportCsv(game,'2',key=>key,team=>team==='home'?'=DANGER()':'Visitors');
  assert.equal(reportModel(game,'2').goals.length,1);
  assert.ok(csv.includes("'=DANGER()"));assert.ok(!csv.includes('Private discussion'));assert.ok(csv.includes('"18"'));assert.ok(!csv.includes('"12"'));
});
test('review detects score mismatch and matching duplicate records', () => {
  let game=createGame();game=recordMatchEvents(game,recordGoal(game,'home',{id:'g1',scorer:'12',assistsConfirmed:true}),1000);
  game=recordMatchEvents(game,recordGoal(game,'home',{id:'g2',scorer:'12',assistsConfirmed:true}),2000);
  assert.equal(reviewIssues(game).filter(i=>i.message==='Possible duplicate').length,2);
  game.scores.home=7;
  assert.ok(reviewIssues(game).some(i=>i.message==='Score and recorded goals differ'));
});
test('internal notes never pause live match or auxiliary clocks',()=>{
 const live=running();assert.equal(prepareDialog(live,'note'),live);
 const timeout=startTimeout(live,'home');assert.equal(prepareDialog(timeout,'note'),timeout);
});
test('manual penalty timing corrections affect report without changing live timers',()=>{
 let game=running();game=recordMatchEvents(game,{...game,penalties:{home:[penalty(120000)],away:[]}},1000);
 const id=game.events[0].id;
 game=editMatchEvent(game,id,{startOverrideMs:60000,endOverrideMs:104000});
 const row=reportModel(game).penalties[0];assert.equal(row.startMs,60000);assert.equal(row.endMs,104000);
 assert.equal(game.penalties.home[0].remainingMs,120000);assert.equal(row.durationMs,120000);
});

import {newMatch} from '../src/scoreboard/management.js';
test('new match resets play and sheet while preserving chosen setup and venue',()=>{
 let game=running();game.scores.home=4;game.events=[{id:'old',type:'Match note'}];game.goals=[{id:'g'}];game.penalties.home=[penalty(120000)];game.timeoutsUsed.home=true;game.matchInfo={venue:'Paris',competition:'U13',number:'old'};
 const fresh=newMatch(game,{...game.settings,periodMinutes:15,periods:2});
 assert.deepEqual(fresh.scores,{home:0,away:0});assert.equal(fresh.remainingMs,900000);assert.equal(fresh.period,1);assert.equal(fresh.running,false);
 assert.deepEqual(fresh.events,[]);assert.deepEqual(fresh.goals,[]);assert.deepEqual(fresh.penalties,{home:[],away:[]});assert.equal(fresh.timeoutsUsed.home,false);
 assert.equal(fresh.settings.periods,2);assert.equal(fresh.settings.home,game.settings.home);assert.equal(fresh.matchInfo.venue,'Paris');assert.equal(fresh.matchInfo.number,undefined);assert.ok(fresh.displayRevision);
 assert.equal(game.scores.home,4);
});
test('invalid saved configuration cannot replace the current match',()=>{
 const game=running();assert.equal(newMatch(game,{...game.settings,periodMinutes:-5}),null);assert.equal(game.running,true);
});

import {trackPause,pauseWarning} from '../src/scoreboard/pause-warning.js';
test('pause duration uses wall time and persists through unrelated actions and public snapshots',()=>{
 const before=running();let paused=trackPause(before,{...before,running:false},100000);
 assert.equal(paused.pauseStartedAt,100000);
 paused=trackPause(paused,{...paused,scores:{home:1,away:0}},106000);
 assert.deepEqual(pauseWarning(paused,114999),{seconds:14,level:0});
 const packet=readDisplaySnapshot({type:'state',sentAt:115000,game:paused},null);
 assert.equal(packet.game.pauseStartedAt,100000);
 assert.deepEqual(pauseWarning(packet.game,115000),{seconds:15,level:1});
 assert.deepEqual(pauseWarning(paused,145000),{seconds:45,level:2});
 assert.deepEqual(pauseWarning(paused,220000),{seconds:120,level:3});
});
test('resume, new pause and phase changes reset the warning; completed clocks have none',()=>{
 let game=running();game=trackPause(game,{...game,running:false},100000);
 const resumed=trackPause(game,{...game,running:true},120000);assert.equal(resumed.pauseStartedAt,null);assert.equal(pauseWarning(resumed,130000),null);
 const paused=trackPause(resumed,{...resumed,running:false},140000);assert.equal(pauseWarning(paused,142000).seconds,2);
 const next=trackPause(paused,nextPeriod(paused),150000);assert.equal(next.pauseStartedAt,150000);
 const completed=trackPause(paused,{...paused,remainingMs:0},160000);assert.equal(pauseWarning(completed,170000),null);
});
test('auxiliary pause duration follows the active countdown, not the frozen game clock',()=>{
 let game=startTimeout(running(),'home');assert.equal(pauseWarning(game,100000),null);
 game=trackPause(game,{...game,auxiliary:{...game.auxiliary,running:false}},100000);
 assert.equal(pauseWarning(game,120000).seconds,20);
 const back=trackPause(game,leaveAuxiliary(game),130000);assert.equal(back.pauseStartedAt,130000);
});
test('restore preserves a saved pause but starts a fresh pause for previously running clocks',()=>{
 const game={...createGame(),pauseStartedAt:1000};assert.equal(restoreGame(JSON.stringify(game)).pauseStartedAt,1000);
 const restored=restoreGame(JSON.stringify({...game,running:true}));assert.ok(restored.pauseStartedAt>1000);
 assert.deepEqual(pauseWarning({...game,pauseStartedAt:20000},10000),{seconds:0,level:0});
});

test('global no-animation setting persists, synchronizes and belongs to saved configurations',()=>{
 const game=createGame({...defaultSettings,noAnimations:true});
 assert.equal(restoreGame(JSON.stringify(game)).settings.noAnimations,true);
 assert.equal(readDisplaySnapshot({type:'state',sentAt:Date.now(),game},null).game.settings.noAnimations,true);
 assert.equal(presetSettings(game.settings).noAnimations,true);
 const old={...game,settings:{...game.settings}};delete old.settings.noAnimations;
 assert.equal(restoreGame(JSON.stringify(old)).settings.noAnimations,false);
});
test('disabled goal and penalty animations consume events without replaying on re-enable',()=>{
 const goal={id:'hidden-global',team:'home'},event={id:'hidden-penalty',type:'Penalty started'};
 const goals=observeGoals(new Set(),[goal],true);assert.equal(goals.goal,null);assert.equal(observeGoals(goals.seen,[goal],false).goal,null);
 const penalties=observePenaltyEvents(new Set(),[event],true);assert.deepEqual(penalties.fresh,[]);assert.deepEqual(observePenaltyEvents(penalties.seen,[event],false).fresh,[]);
 assert.equal(observePenaltyEvents(new Set(),[event]).fresh.length,1);
});
