import React, { useEffect, useRef, useState } from 'react';
import { STORAGE_KEY, createGame, advanceGame, formatTime, nextPeriod, parseTime, restoreGame } from './clock.js';
import { playHorn, unlockAudio } from './horn.js';
import { industrialHorn } from './horn-options.js';
import './scoreboard.css';
import { I18nContext, translator, useI18n } from './i18n.js';
import { clubs, clubLogo, selectClub } from './teams.js';
import { youthCategories, teamDisplayName } from './youth.js';
import { useOperatorDisplay } from './display-sync.js';
import { useExtendedScreen, useArenaScreen } from './screens.js';
import { penaltyReasons } from './penalty-reasons.js';
import { EventEditor, PresetPanel, NewMatchChooser } from './ManagementForms.jsx';
import { undoGame, editMatchEvent, newMatch } from './management.js';
import { useWakeLock, useOffline } from './device-support.js';
import Icon from './Icon.jsx';
import MatchSheet from './MatchSheet.jsx';
import {eventClock,addMatchNote} from './match-report.js';
import { applyClockEdit } from './quick-edit.js';
import { recordMatchEvents } from './match-events.js';
import GameBoard from './GameBoard.jsx';
import { prepareDialog, isClockRunning, startBreak, startTimeout, leaveAuxiliary, toggleActiveClock } from './phases.js';
import { powerPlayRecommendation, recordGoal, removeGoal, discardPenalty, penaltyKindLabel, penaltyKinds } from './penalty-rules.js';
function Modal({
  title,
  children,
  close
}) {
  const t = useI18n();
  const ref = useRef(null);
  useEffect(() => {
    ref.current.showModal();
  }, []);
  return <dialog className="ice-modal" ref={ref} onCancel={close} onClick={event => {
    if (event.target === ref.current) {
      const rect = ref.current.getBoundingClientRect();
      if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) close();
    }
  }} aria-labelledby="modal-title">
    <div className="modal-heading"><h2 id="modal-title">{title}</h2><button type="button" className="icon-button" onClick={close} aria-label={t("Close dialog")}><Icon name="close" /></button></div>{children}
  </dialog>;
}
function ImageField({
  label,
  value,
  onChange
}) {
  const t = useI18n();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const pending = useRef(0);
  useEffect(() => () => {
    pending.current++;
  }, []);
  async function upload(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    setError('');
    if (!['image/png', 'image/jpeg', 'image/webp', 'image/gif'].includes(file.type) || file.size > 1024 * 1024) {
      setError('Choose a PNG, JPG, WebP or GIF under 1 MB.');
      event.target.value = '';
      return;
    }
    const version = ++pending.current;
    setLoading(true);
    try {
      const data = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      await new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = resolve;
        img.onerror = reject;
        img.src = data;
      });
      if (version === pending.current) onChange(data);
    } catch {
      if (version === pending.current) setError('That image could not be opened. Try another file.');
    } finally {
      if (version === pending.current) setLoading(false);
    }
  }
  return <div className="image-field"><label>{label}<input type="file" accept="image/png,image/jpeg,image/webp,image/gif" onChange={upload} /></label>
    {loading && <p role="status">{t("Reading image…")}</p>}
    {value && <div className="image-preview"><img src={value} alt={t('{label} preview', {
        label
      })} /><button type="button" onClick={() => {
        pending.current++;
        setLoading(false);
        onChange('');
      }}>{t("Remove image")}</button></div>}
    {error && <p className="form-error" role="alert">{t(error)}</p>}
  </div>;
}
function Setup({
  game,
  save,
  close,
  testHorn,
  device,
  newMatchSetup = false
}) {
  const t = useI18n();
  const [draft, setDraft] = useState({
    ...game.settings
  });
  const newGame = newMatchSetup;
  const [clubSearch,setClubSearch]=useState({home:'',away:''});
  const normalizeSearch=value=>value.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
  const change = (key, value) => setDraft(previous => ({
    ...previous,
    [key]: value
  }));
  return <Modal title={t(newMatchSetup ? "Configure new game" : "Game setup")} close={close}><form onSubmit={event => {
      event.preventDefault();
      save({
        ...draft,
        home: draft.home.trim() || t("HOME"),
        away: draft.away.trim() || t("AWAY")
      }, newGame);
    }}>
    <p className="muted">{t("Play continues while you set up. Changes apply when you save.")}</p>
    <details className="form-disclosure" open={newMatchSetup}><summary>{t('Teams')}</summary><div className="form-grid">
      {['home', 'away'].map(team => <fieldset key={team}><legend>{team === 'home' ? t("Home team") : t("Away team")}</legend>
        <label>{t('Search clubs')}<input type="search" value={clubSearch[team]} onChange={event=>setClubSearch(previous=>({...previous,[team]:event.target.value}))} placeholder={t('City or club name')}/></label>
        <label>{t("Club (FFHG Nord-Est)")}<select value={draft[`${team}Club`]} onChange={event => setDraft(previous => selectClub(previous, team, event.target.value))}><option value="">{t("Custom team")}</option>{clubs.filter(club=>club.id===draft[`${team}Club`] || normalizeSearch(`${club.city} ${club.name}`).includes(normalizeSearch(clubSearch[team]))).map(club => <option key={club.id} value={club.id}>{club.city} — {club.name}</option>)}</select></label>
        <label>{t('Youth category')}<select value={draft[`${team}Category`]} onChange={event => change(`${team}Category`, event.target.value)}><option value="">{t('No category / senior')}</option>{youthCategories.map(category => <option key={category} value={category}>{category}</option>)}</select></label>
        <label>{t("Team / alliance name")}<input required maxLength="60" value={draft[team]} onChange={event => setDraft(previous => ({
              ...previous,
              [team]: event.target.value
            }))} /></label>
        <p className="field-help">{t('Choose the category playing this match. Edit the name for a second squad or club alliance; the club logo is kept.')}</p>
        <details className="form-disclosure"><summary>{t('Team logo')}</summary><ImageField label={t("Image file")} value={clubLogo(draft, team)} onChange={value => setDraft(previous => ({
            ...previous,
            [`${team}Logo`]: value,
            [`${team}Club`]: ''
          }))} /></details>
      </fieldset>)}
    </div></details>
    <fieldset><legend>{t("Game clock")}</legend><div className="form-grid">
      <label>{t("Period length (minutes)")}<input type="number" min="1" max="99" required value={draft.periodMinutes} onChange={event => change('periodMinutes', Number(event.target.value))} /></label>
      <label>{t("Number of periods")}<input type="number" min="1" max="9" required value={draft.periods} onChange={event => change('periods', Number(event.target.value))} /></label>
    </div><p className="field-help">{t("Period length applies to the next period or a new game. Use Edit clock to change the current clock.")}</p></fieldset>
    <details className="form-disclosure"><summary>{t('Game options')}</summary><label className="check-label"><input type="checkbox" checked={draft.autoPauseOnGoalPenalty} onChange={event => change('autoPauseOnGoalPenalty', event.target.checked)} />{t('Auto pause on goal/penalty')}</label>
    <label className="check-label"><input type="checkbox" checked={Boolean(draft.noAnimations)} onChange={event=>change('noAnimations',event.target.checked)}/>{t('No animations')}</label>
    <label className="check-label"><input type="checkbox" checked={Boolean(draft.resetScoresEachPeriod)} onChange={event=>change('resetScoresEachPeriod',event.target.checked)}/>{t('Reset the score at each period')}</label>
    <p className="field-help">{t('For categories scored period by period. Goals stay on the match sheet, which keeps the running total.')}</p></details>
    <details className="form-disclosure"><summary>{t("Horn & junior shifts")}</summary>
      <label className="check-label"><input type="checkbox" checked={draft.endHorn} onChange={event => change('endHorn', event.target.checked)} />{t("Sound horn at the end of each period")}</label>
      <label className="check-label"><input type="checkbox" checked={draft.shiftEnabled} onChange={event => change('shiftEnabled', event.target.checked)} />{t("Automatic junior shift horn")}</label>
      <label>{t("Shift interval (seconds)")}<input type="number" min="5" max="600" required value={draft.shiftSeconds} onChange={event => change('shiftSeconds', Number(event.target.value))} /></label>
      <p className="field-help">{t("Shifts follow game time and pause at stoppages. Keep this page visible and the device awake for timely horns.")}</p>
      <button type="button" className="secondary" onClick={() => testHorn()}><Icon name="horn" />{t("Test horn")}</button>
    </details>
    <PresetPanel settings={draft} apply={settings => setDraft(previous => ({...previous, ...settings}))}/>
    {device}
    {newMatchSetup&&<p className="field-help">{t("Starting a new game clears the score and match sheet. The new clock stays paused.")}</p>}
    <div className="modal-actions"><button type="button" className="secondary" onClick={close}>{t("Cancel")}</button><button className="primary" type="submit">{newGame ? t("Start new game") : t("Save setup")}</button></div>
  </form></Modal>;
}
function PenaltyForm({
  teamName,
  add,
  close
}) {
  const t = useI18n();
  const [player, setPlayer] = useState('');
  const [reason,setReason]=useState('');
  const [seconds, setSeconds] = useState(120);
  const [custom, setCustom] = useState('02:00');
  const [kind,setKind]=useState('custom');
  const [coincidental,setCoincidental]=useState(false);
  const [deferred,setDeferred]=useState(false);
  const [servedBy,setServedBy]=useState('');
  const [error, setError] = useState('');
  return <Modal title={t('Penalty · {team}', {
    team: teamName
  })} close={close}><form onSubmit={event => {
      event.preventDefault();
      const duration = seconds === 'custom' ? parseTime(custom) : seconds * 1000;
      if (!duration || duration > 5999000) {
        setError('Enter a duration between 00:01 and 99:59.');
        return;
      }
      add({
        id: crypto.randomUUID(),
        player: player.trim(), reason, servedBy:servedBy.trim(),
        label: formatTime(duration),
        remainingMs: duration, kind: seconds === 'custom' ? kind : ({120:'minor',240:'double',300:'major',600:'misconduct'}[seconds]), coincidental, deferred
      });
    }}><label>{t("Player number (optional)")}<input autoFocus inputMode="numeric" maxLength="8" placeholder={t("e.g. 12")} value={player} onChange={event => setPlayer(event.target.value)} /></label>
    <label>{t('Penalty reason (optional)')}<select value={reason} onChange={event=>setReason(event.target.value)}><option value="">{t('Not specified')}</option>{penaltyReasons.map(item=><option key={item.id} value={item.id}>{t(item.label)}</option>)}</select></label>
    <fieldset><legend>{t("Penalty length")}</legend><div className="duration-options">{[120, 240, 300, 600].map(value => <button key={value} type="button" className={seconds === value ? 'selected' : ''} onClick={() => setSeconds(value)}>{value / 60} min</button>)}<button type="button" className={seconds === 'custom' ? 'selected' : ''} onClick={() => setSeconds('custom')}>{t("Custom")}</button></div></fieldset>
    {seconds === 'custom' && <label>{t("Duration (MM:SS)")}<input required value={custom} onChange={event => setCustom(event.target.value)} placeholder="02:00" /></label>}
    {seconds==='custom'&&<label>{t('Penalty type')}<select value={kind} onChange={event=>setKind(event.target.value)}>{penaltyKinds.map(value=><option key={value} value={value}>{t(penaltyKindLabel(value))}</option>)}</select></label>}
    <details className="form-disclosure"><summary>{t('Advanced penalty options')}{(coincidental||deferred||servedBy)&&<span className="option-dot"/>}</summary><label>{t('Served by (optional)')}<input inputMode="numeric" maxLength="8" value={servedBy} onChange={event=>setServedBy(event.target.value)}/></label><label className="check-label"><input type="checkbox" checked={coincidental} onChange={event=>setCoincidental(event.target.checked)}/>{t('Coincidental · does not reduce team strength')}</label>
    <label className="check-label"><input type="checkbox" checked={deferred} onChange={event=>setDeferred(event.target.checked)}/>{t('Waiting · start the timer manually when authorized')}</label>
    <p className="field-help">{t('Minor penalties can be proposed for release after a power-play goal. Major, misconduct and coincidental penalties are excluded.')}</p></details>
    {error && <p className="form-error" role="alert">{t(error)}</p>}
    <div className="modal-actions"><button className="secondary" type="button" onClick={close}>{t("Cancel")}</button><button className="primary" type="submit">{t("Add penalty")}</button></div>
  </form></Modal>;
}
function ClockForm({game, save, close}) {
  const t = useI18n();
  const active=game.auxiliary;
  const [value, setValue] = useState(formatTime(active?.remainingMs ?? game.remainingMs));
  const [period, setPeriod] = useState(game.period);
  const [timeDirty,setTimeDirty] = useState(false);
  const [periodDirty,setPeriodDirty] = useState(false);
  const [error, setError] = useState('');
  const currentTime=formatTime(active?.remainingMs ?? game.remainingMs);
  const title=active?.kind==='break' ? t('Edit break clock') : active?.kind==='timeout' ? t('Edit timeout clock') : t('Edit game clock');
  return <Modal title={title} close={close}><form onSubmit={event => {
      event.preventDefault();
      const ms = timeDirty ? parseTime(value) : undefined;
      const maximum=active?.kind==='timeout'?30000:active?.kind==='break'?5940000:5999000;
      if (timeDirty && (ms === null || ms > maximum)) {
        setError(active?.kind==='timeout'?'Timeout cannot exceed 00:30.':active?.kind==='break'?'Break cannot exceed 99:00.':'Enter a time between 00:00 and 99:59.');
        return;
      }
      save({...(timeDirty?{remainingMs:ms}:{}),...(!active&&periodDirty?{period}:{})});
    }}>
    <p className="muted">{t('Changes apply when saved. The clock keeps its current running or paused state.')}</p>
    <p className="clock-edit-live" role="status">{t('Live now')} · <strong>{currentTime}</strong> · {t(isClockRunning(game)?'Running':'Clock paused')}</p>
    <label>{t("Time remaining (MM:SS)")}<input autoFocus required value={value} onChange={event => {setTimeDirty(true);setValue(event.target.value);}} /></label>
    {!active&&<label>{t("Period")}<input type="number" required min="1" max="99" value={period} onChange={event => {setPeriodDirty(true);setPeriod(Number(event.target.value));}} /></label>}
    {error && <p className="form-error" role="alert">{t(error)}</p>}
    <div className="modal-actions"><button className="secondary" type="button" onClick={close}>{t("Cancel")}</button><button className="primary" type="submit">{t("Save clock")}</button></div>
  </form></Modal>;
}
function TeamEditor({game, team, save, close}) {
  const t=useI18n();
  const [draft,setDraft]=useState(()=>({
    name:game.settings[team], club:game.settings[`${team}Club`], category:game.settings[`${team}Category`], logo:game.settings[`${team}Logo`]
  }));
  const [search,setSearch]=useState('');
  const normalize=value=>value.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
  const chooseClub=id=>{
    const next=selectClub({...game.settings,[team]:draft.name,[`${team}Club`]:draft.club,[`${team}Category`]:draft.category,[`${team}Logo`]:draft.logo},team,id);
    setDraft(old=>({...old,name:next[team],club:next[`${team}Club`],logo:next[`${team}Logo`]}));
  };
  const name=teamDisplayName(game.settings,team,t);
  return <Modal title={t('Edit {team}',{team:name})} close={close}><form onSubmit={event=>{event.preventDefault();save({
    [team]:draft.name.trim()||t(team==='home'?'HOME':'AWAY'), [`${team}Club`]:draft.club, [`${team}Category`]:draft.category, [`${team}Logo`]:draft.logo
  });}}>
    <label>{t('Team / alliance name')}<input autoFocus required maxLength="60" value={draft.name} onChange={event=>setDraft(old=>({...old,name:event.target.value}))}/></label>
    <details className="form-disclosure"><summary>{t('Club & category')}</summary><label>{t('Search clubs')}<input type="search" value={search} onChange={event=>setSearch(event.target.value)} placeholder={t('City or club name')}/></label>
    <label>{t('Club (FFHG Nord-Est)')}<select value={draft.club} onChange={event=>chooseClub(event.target.value)}><option value="">{t('Custom team')}</option>{clubs.filter(club=>club.id===draft.club||normalize(`${club.city} ${club.name}`).includes(normalize(search))).map(club=><option key={club.id} value={club.id}>{club.city} — {club.name}</option>)}</select></label>
    <label>{t('Youth category')}<select value={draft.category} onChange={event=>setDraft(old=>({...old,category:event.target.value}))}><option value="">{t('No category / senior')}</option>{youthCategories.map(category=><option key={category} value={category}>{category}</option>)}</select></label></details>
    <details className="form-disclosure"><summary>{t('Team logo')}</summary><ImageField label={t('Team logo')} value={clubLogo({...game.settings,[`${team}Club`]:draft.club,[`${team}Logo`]:draft.logo},team)} onChange={logo=>setDraft(old=>({...old,logo,club:''}))}/></details>
    <div className="modal-actions"><button className="secondary" type="button" onClick={close}>{t('Cancel')}</button><button className="primary">{t('Save team')}</button></div>
  </form></Modal>;
}
function BreakForm({minutes, save, close}) {
  const t=useI18n();
  const [duration,setDuration]=useState(minutes);
  return <Modal title={t('Break')} close={close}><form onSubmit={event=>{event.preventDefault();save(duration);}}><label>{t('Break duration (minutes)')}<input type="number" required min="1" max="99" value={duration} onChange={event=>setDuration(Number(event.target.value))}/></label><p>{t('The match clock and penalties stay frozen during break.')}</p><div className="modal-actions"><button className="secondary" type="button" onClick={close}>{t('Cancel')}</button><button className="primary" type="submit">{t('Start break')}</button></div></form></Modal>;
}
function GoalForm({game, team, save, close}) {
  const t=useI18n();
  const [scorer,setScorer]=useState('');
  const [assist1,setAssist1]=useState('');
  const [assist2,setAssist2]=useState('');
  const [assistsConfirmed,setAssistsConfirmed]=useState(false);
  const [penaltyShot,setPenaltyShot]=useState(false);
  const [hideAnimation,setHideAnimation]=useState(false);
  const [release,setRelease]=useState(true);
  const [choice,setChoice]=useState('');
  const [error,setError]=useState('');
  const recommendation=powerPlayRecommendation(game,team,penaltyShot);
  const selected=recommendation.candidates.length===1?recommendation.candidates[0]:recommendation.candidates.find(row=>row.id===choice);
  return <Modal title={t('Goal · {team}',{team:teamDisplayName(game.settings,team,t)})} close={close}><form onSubmit={event=>{
    event.preventDefault();
    const players=[scorer,assist1,assist2].map(value=>value.trim()).filter(Boolean);
    if(new Set(players).size!==players.length){setError('Scorer and assists must be different players.');return;}
    if(release&&recommendation.candidates.length&&!selected){setError('Choose the penalty indicated by the referee.');return;}
    save({id:crypto.randomUUID(),scorer,assist1,assist2,assistsConfirmed,penaltyShot,hideAnimation,releaseId:release?selected?.id:null});
  }}><p className="muted">{t(isClockRunning(game) ? 'The clock is running. Confirm the goal to update the score.' : 'The clock is paused. Confirm the goal to update the score.')}</p><div className="player-number-grid"><label title={t('Scorer number (optional)')}>{t('Scorer')}<input autoFocus inputMode="numeric" maxLength="8" value={scorer} onChange={event=>setScorer(event.target.value)} placeholder="12"/></label><label title={t('Assist 1 (optional)')}>{t('A1')}<input inputMode="numeric" maxLength="8" value={assist1} onChange={event=>setAssist1(event.target.value)}/></label><label title={t('Assist 2 (optional)')}>{t('A2')}<input inputMode="numeric" maxLength="8" value={assist2} onChange={event=>setAssist2(event.target.value)}/></label></div>{!assist1&&!assist2&&<label className="check-label"><input type="checkbox" checked={assistsConfirmed} onChange={event=>setAssistsConfirmed(event.target.checked)}/>{t('No assists')}</label>}<label className="check-label"><input type="checkbox" checked={penaltyShot} onChange={event=>setPenaltyShot(event.target.checked)}/>{t('Penalty-shot goal')}</label>
  <label className="check-label"><input type="checkbox" checked={hideAnimation} onChange={event=>setHideAnimation(event.target.checked)}/>{t('Hide goal animation')}</label>
  <details className="power-play-proposal form-disclosure" open={recommendation.candidates.length>0}><summary>{t('Power-play penalty review')}</summary><p>{t(recommendation.reason)}</p>{recommendation.candidates.length>0&&<><label className="check-label"><input type="checkbox" checked={release} onChange={event=>setRelease(event.target.checked)}/>{t('Apply the proposed penalty change when confirming this goal')}</label>{recommendation.candidates.length>1&&<label>{t('Player designated by the referee')}<select value={choice} onChange={event=>setChoice(event.target.value)}><option value="">{t('Choose player')}</option>{recommendation.candidates.map(row=><option key={row.id} value={row.id}>{row.player?`#${row.player}`:t('TEAM')} · {formatTime(row.remainingMs)}</option>)}</select></label>}{selected&&<p className="release-result"><strong>{selected.player?`#${selected.player}`:t('TEAM')} · {teamDisplayName(game.settings,recommendation.team,t)}</strong><br/>{t(selected.afterMs?'End the first minor; 02:00 remains. The player stays in the penalty box.':'End this minor penalty. Confirm the player’s return with the referee.')}</p>}</>}
  <a href="https://www.hockeyfrance.com/presentation/documentation/regles-de-jeu/" target="_blank" rel="noreferrer">{t('FFHG / IIHF · rules 16–19')}</a></details>{error&&<p className="form-error" role="alert">{t(error)}</p>}
  <div className="modal-actions"><button className="secondary" type="button" onClick={close}>{t('Cancel')}</button><button className="primary" type="submit">{t(release&&selected?'Confirm goal and penalty change':'Confirm goal')}</button></div></form></Modal>;
}

function NoteForm({save,close}) {
  const t=useI18n(),[text,setText]=useState('');
  return <Modal title={t('Internal note')} close={close}><form onSubmit={e=>{e.preventDefault();if(text.trim())save(text);}}><label>{t('Note')}<textarea autoFocus required maxLength="1000" rows="4" value={text} onChange={e=>setText(e.target.value)}/></label><p className="field-help">{t('Notes are internal and excluded from the report.')}</p><div className="modal-actions"><button type="button" className="secondary" onClick={close}>{t('Cancel')}</button><button className="primary">{t('Save')}</button></div></form></Modal>;
}
export default function Scoreboard() {
  const [game, setGame] = useState(() => {
    try {
      const saved=restoreGame(localStorage.getItem(STORAGE_KEY));if(saved)return saved;
      const fresh=createGame();try{const remembered=JSON.parse(localStorage.getItem('icetracker-venue')||'{}');for(const key of ['venue','competition'])if(typeof remembered[key]==='string')fresh.matchInfo[key]=remembered[key];}catch{}return fresh;
    } catch {
      return createGame();
    }
  });
  const t = translator(game.settings.language);
  const current = useRef(game);
  const tickAt = useRef(performance.now());
  const capturedClock = useRef(null);
  const lastSaved = useRef(0);
  const display = useOperatorDisplay(current, sync);
  const extendedScreen = useExtendedScreen();
  const findArenaScreen = useArenaScreen(extendedScreen);
  const [undoTarget,setUndoTarget]=useState(null);
  const wakeStatus=useWakeLock(game.settings.keepAwake);
  const offlineStatus=useOffline();
  const [activeTab,setActiveTab]=useState('board');
  const [modal, setModal] = useState(null);
  const [notice, setNotice] = useState('');
  const [storageError, setStorageError] = useState(false);
  const [hornFlash, setHornFlash] = useState('');
  const flashTimeout = useRef(null);
  function persist(value) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
      setStorageError(false);
    } catch {
      setStorageError(true);
    }
  }
  function horn(type = 'manual') {
    setHornFlash(type === 'shift' ? 'CHANGE LINES' : type === 'end' ? (current.current.auxiliary ? 'Countdown complete' : current.current.period >= current.current.settings.periods ? 'FINAL BUZZER' : 'PERIOD OVER') : 'HORN');
    clearTimeout(flashTimeout.current);
    flashTimeout.current = setTimeout(() => setHornFlash(''), 1800);
    playHorn(type === 'shift' ? 0.9 : 3.2).catch(() => setNotice('Sound is unavailable. Tap Test horn in Configuration to enable it.'));
  }
  function sync() {
    const now = performance.now();
    const result = advanceGame(current.current, now - tickAt.current);
    tickAt.current = now;
    result.game = recordMatchEvents(current.current,result.game,Date.now(),true);
    current.current = result.game;
    if (result.horn) horn(result.horn);
    return result.game;
  }
  function update(action, undoable = true) {
    const before = sync();
    const next = recordMatchEvents(before,action(before));
    if(undoable && next !== before)setUndoTarget(structuredClone(before));
    current.current = next;
    setGame(next);
    persist(next);
    display.publish(next);
  }
  function openModal(name) {
    capturedClock.current=eventClock(sync());
    update(value => prepareDialog(value, name), false);
    setModal(name);
  }
  function startNewMatch(settings) {
    const fresh=newMatch(current.current,settings);
    if(!fresh){setNotice('Invalid preset.');return;}
    update(()=>fresh);
    setActiveTab('board');setModal(null);setNotice('');
    clearTimeout(flashTimeout.current);setHornFlash('');
  }
  // With a second screen the public window goes there fullscreen on its own.
  async function openPublicScreen() {
    const arena = await findArenaScreen();
    if (display.open(arena)) setNotice(arena ? 'Public screen opened fullscreen on the arena display.' : 'Public window opened. Move it to your second screen and click Fullscreen.');
    else setNotice('Allow pop-ups to open the public scoreboard.');
  }
  function toggleClock() {
    if (!isClockRunning(current.current)) unlockAudio().catch(() => setNotice('Tap Test horn in Configuration to check sound before the game.'));
    update(toggleActiveClock);
  }
  useEffect(() => {
    const interval = setInterval(() => {
      const value = sync();
      setGame(value);
      if (isClockRunning(value) || lastSaved.current) {
        if (performance.now() - lastSaved.current > 1000 || !isClockRunning(value)) {
          persist(value);
          lastSaved.current = isClockRunning(value) ? performance.now() : 0;
        }
      }
    }, 100);
    const pageHide = () => {
      const value = sync();
      persist(value);
    };
    const visibility = () => {
      const value = sync();
      setGame(value);
      persist(value);
    };
    const keydown = event => {
      if (event.code !== 'Space' || event.repeat || event.altKey || event.ctrlKey || event.metaKey || document.querySelector('dialog[open]') || /INPUT|TEXTAREA|SELECT|BUTTON|A/.test(event.target.tagName) || event.target.isContentEditable) return;
      event.preventDefault();
      toggleClock();
    };
    window.addEventListener('pagehide', pageHide);
    window.addEventListener('keydown', keydown);
    document.addEventListener('visibilitychange', visibility);
    return () => {
      clearInterval(interval);
      clearTimeout(flashTimeout.current);
      window.removeEventListener('pagehide', pageHide);
      window.removeEventListener('keydown', keydown);
      document.removeEventListener('visibilitychange', visibility);
    };
  }, []);
  useEffect(() => {
    document.documentElement.lang = game.settings.language;
  }, [game.settings.language]);
  const ended = game.remainingMs === 0;
  const finalPeriod = game.period >= game.settings.periods;
  const toolbar = <>
    <div className="board-brand">ICE<span>TRACKER</span></div>
    <nav className="board-tabs" aria-label={t('Match views')}><button aria-pressed={activeTab==='board'} onClick={()=>setActiveTab('board')}><Icon name="monitor"/>{t('Board')}</button><button aria-pressed={activeTab==='sheet'} onClick={()=>setActiveTab('sheet')}><Icon name="sheet"/>{t('Match sheet')}</button></nav>
    <div className="toolbar-actions"><button className="language-toggle" title={t(game.settings.language==='fr'?'Switch language to English':'Passer en français')} aria-label={t(game.settings.language==='fr'?'Switch language to English':'Passer en français')} onClick={()=>update(value=>({...value,settings:{...value.settings,language:value.settings.language==='fr'?'en':'fr'}}),false)}><span aria-hidden="true">{game.settings.language==='fr'?'🇫🇷':'🇬🇧'}</span>{game.settings.language.toUpperCase()}</button><button className="secondary" onClick={()=>setModal('new-game')}><Icon name="plus"/>{t('New game')}</button><button className="secondary" disabled={!undoTarget} title={t('Undo last action')} aria-label={t('Undo last action')} onClick={()=>setModal('undo')}><Icon name="reset"/>{t('Undo')}</button><button className={`secondary ${extendedScreen?'screen-ready':''}`} title={t(extendedScreen?'Second screen detected · opens fullscreen there':'Public screen')} onClick={openPublicScreen}><Icon name="monitor"/>{t('Public screen')}</button><button className="secondary" title={t('Configuration')} onClick={()=>openModal('setup')}><Icon name="settings"/>{t('Configuration')}</button></div>
    {(notice||storageError)&&<div className="notice" role="alert">{t(notice||'Changes could not be saved on this device.')}<button className="icon-button" onClick={()=>setNotice('')} aria-label={t('Dismiss message')}>×</button></div>}
  </>;
  return <I18nContext.Provider value={game.settings.language}><div className={`ice-app theme-${game.settings.theme} ${activeTab==='board'?'board-view':'sheet-view'}`}>
    <main>{activeTab==='sheet'?<MatchSheet game={game} toolbar={toolbar} toggleClock={toggleClock} editEvent={event=>setModal({editEvent:event.id})} addNote={()=>openModal('note')} goBoard={()=>setActiveTab('board')} getSnapshot={()=>sync()} saveInfo={info=>{update(value=>({...value,matchInfo:info}));try{localStorage.setItem('icetracker-venue',JSON.stringify({venue:info.venue,competition:info.competition}));}catch{}}} restoreBackup={restored=>{restored={...restored,pauseStartedAt:Date.now(),displayRevision:crypto.randomUUID()};const before=sync();setUndoTarget(structuredClone(before));current.current=restored;tickAt.current=performance.now();setGame(restored);persist(restored);display.publish(restored);}}/>:<GameBoard game={game} hornFlash={hornFlash} toolbar={toolbar} actions={{
      score:(team,delta)=>openModal(delta>0?{goalTeam:team}:{removeGoalTeam:team}),
      addPenalty:team=>openModal(`penalty-${team}`),
      release:(team,row)=>{if(row.remainingMs===0)update(value=>({...value,penalties:{...value.penalties,[team]:value.penalties[team].filter(item=>item.id!==row.id)}}));else openModal({release:row,team});},
      discard:(team,row)=>openModal({discard:row,team}),
      startPenalty:(team,row)=>update(value=>({...value,penalties:{...value.penalties,[team]:value.penalties[team].map(item=>item.id===row.id?{...item,deferred:false}:item)}})),
      timeout:team=>openModal({timeoutTeam:team}),
      editClock:()=>openModal('clock'),
      editTeam:team=>openModal({editTeam:team}),
      restartShift:()=>update(value=>({...value,shiftRemainingMs:value.settings.shiftSeconds*1000})),
      toggle:toggleClock,horn:()=>horn(),break:()=>openModal('break'),nextPeriod:()=>openModal('next'),
      endAuxiliary:()=>openModal('end-auxiliary'),
    }}/>}</main>
    <footer className="ice-footer"><button className="credits-button" onClick={() => openModal('credits')}>{t('Source & credits')}</button><span>{t("ICE TIME. MADE SIMPLE.")}</span><a href="?mode=stats">{t("Open player statistics")} <Icon name="arrow" size={16} /></a></footer>
    {modal==='new-game'&&<NewMatchChooser Frame={Modal} game={game} close={()=>setModal(null)} start={startNewMatch} configure={()=>openModal('setup-new')}/>}
    {modal==='undo'&&undoTarget&&<Modal title={t('Undo last action')} close={()=>setModal(null)}><p>{t('Restore the state before the last action? The clock will return to the saved time and stay paused.')}</p><p><strong>{undoTarget.scores.home} – {undoTarget.scores.away} · {formatTime(undoTarget.remainingMs)}</strong></p><div className="modal-actions"><button className="secondary" onClick={()=>setModal(null)}>{t('Cancel')}</button><button className="primary" onClick={()=>{const restored=undoGame(undoTarget);current.current=restored;tickAt.current=performance.now();setGame(restored);persist(restored);display.publish(restored);setUndoTarget(null);setModal(null);}}>{t('Undo last action')}</button></div></Modal>}
    {modal?.editEvent&&game.events.find(e=>e.id===modal.editEvent)&&<EventEditor Frame={Modal} game={game} event={game.events.find(e=>e.id===modal.editEvent)} close={()=>setModal(null)} save={patch=>{update(value=>editMatchEvent(value,modal.editEvent,patch));setModal(null);}}/>}
    {modal === 'credits' && <Modal title={t('Source & credits')} close={() => setModal(null)}><p>{t('Clubs verified against the FFHG Nord-Est directory.')}</p><p><a href="https://nord-est.ffhg.org/annuaire-clubs/" target="_blank" rel="noreferrer">FFHG · Nord-Est</a></p><p>Français Volants · #000034 / #FFFFFF</p><p><a href={industrialHorn.source} target="_blank" rel="noreferrer">{t(industrialHorn.label)} · {industrialHorn.credit}</a> · <a href="https://creativecommons.org/publicdomain/zero/1.0/" target="_blank" rel="noreferrer">CC0 1.0</a></p></Modal>}
    {modal === 'break' && <BreakForm minutes={game.settings.breakMinutes} close={()=>setModal(null)} save={minutes=>{unlockAudio().catch(()=>{});update(value=>startBreak(value,minutes));setModal(null);}}/>}
    {modal?.timeoutTeam && <Modal title={t('Timeout · {team}',{team:teamDisplayName(game.settings,modal.timeoutTeam,t)})} close={()=>setModal(null)}><p>{t('One 30-second timeout per team per game. Start only after the referee grants it.')}</p><div className="modal-actions"><button className="secondary" onClick={()=>setModal(null)}>{t('Cancel')}</button><button className="primary" onClick={()=>{unlockAudio().catch(()=>{});update(value=>startTimeout(value,modal.timeoutTeam));setModal(null);}}>{t('Use timeout')}</button></div></Modal>}
    {modal === 'end-auxiliary' && <Modal title={t('Back to game')} close={()=>setModal(null)}><p>{t('End this countdown and return to the paused match clock? A used timeout stays consumed.')}</p><div className="modal-actions"><button className="secondary" onClick={()=>setModal(null)}>{t('Cancel')}</button><button className="primary" onClick={()=>{update(leaveAuxiliary);setModal(null);}}>{t('Back to game')}</button></div></Modal>}
    {modal==='note'&&<NoteForm close={()=>setModal(null)} save={text=>{update(value=>addMatchNote(value,text,capturedClock.current));setModal(null);}}/>}
    {modal?.goalTeam && <GoalForm game={game} team={modal.goalTeam} close={()=>setModal(null)} save={details=>{update(value=>recordGoal(value,modal.goalTeam,{...details,clock:capturedClock.current}));setModal(null);}}/>}
    {modal?.removeGoalTeam && <Modal title={t('Remove a goal?')} close={()=>setModal(null)}><p>{t('The latest goal for this team and its assists will be removed. Check penalties manually if that goal ended one.')}</p><div className="modal-actions"><button className="secondary" onClick={()=>setModal(null)}>{t('Cancel')}</button><button className="primary" onClick={()=>{update(value=>removeGoal(value,modal.removeGoalTeam));setModal(null);}}>{t('Remove goal')}</button></div></Modal>}
    {(modal === 'setup' || modal === 'setup-new') && <Setup key={modal} newMatchSetup={modal==='setup-new'} game={game} close={() => setModal(modal === 'setup-new' ? 'new-game' : null)} testHorn={horn} device={<details className="form-disclosure"><summary>{t('This device')}</summary><label className="check-label"><input type="checkbox" checked={game.settings.keepAwake} onChange={e=>update(value=>({...value,settings:{...value.settings,keepAwake:e.target.checked,keepAwakePreferenceSet:true}}),false)}/>{t('Keep screen awake')}</label><p className="device-status">{t(wakeStatus)}<br/>{t(offlineStatus)}</p><button type="button" className="secondary" onClick={()=>{setActiveTab('sheet');setModal(null);}}><Icon name="sheet"/>{t('Match sheet')}</button></details>} save={(settings, reset) => {
        if(reset){startNewMatch(settings);return;}
        update(value => ({
          ...value,
          settings,
          shiftRemainingMs: settings.shiftSeconds !== value.settings.shiftSeconds || settings.shiftEnabled !== value.settings.shiftEnabled ? settings.shiftSeconds * 1000 : value.shiftRemainingMs
        }));
        setModal(null);
      }} />}
    {modal === 'clock' && <ClockForm game={game} close={() => setModal(null)} save={patch => {
        update(value => applyClockEdit(value, patch), false);
        setModal(null);
      }} />}
    {modal?.editTeam && <TeamEditor game={game} team={modal.editTeam} close={()=>setModal(null)} save={patch=>{update(value=>({...value,settings:{...value.settings,...patch}}),false);setModal(null);}}/>}
    {typeof modal === 'string' && modal.startsWith('penalty-') && <PenaltyForm teamName={teamDisplayName(game.settings, modal.slice(8), t)} close={() => setModal(null)} add={row => {
        const team = modal.slice(8);
        update(value => ({
          ...value,
          penalties: {
            ...value.penalties,
            [team]: [...value.penalties[team], {...row,assessedClock:capturedClock.current}]
          }
        }));
        setModal(null);
      }} />}
    {modal === 'next' && <Modal title={finalPeriod ? t("Start an overtime period?") : t("Move to the next period?")} close={() => setModal(null)}><p>{t(game.settings.resetScoresEachPeriod ? 'The clock will reset to {minutes}:00 and the score returns to 0 – 0. Remaining penalty time carries over. Press Resume / start when play begins.' : 'The clock will reset to {minutes}:00. Scores and remaining penalty time carry over. Press Resume / start when play begins.', {
            minutes: game.settings.periodMinutes
          })}</p>{!ended && <p className="form-error">{t('There is still {time} on this period’s clock.', {
            time: formatTime(game.remainingMs)
          })}</p>}<div className="modal-actions"><button className="secondary" onClick={() => setModal(null)}>{t("Cancel")}</button><button className="primary" onClick={() => {
            update(nextPeriod);
            setModal(null);
          }}>{t("Next period")}</button></div></Modal>}
    {modal?.release && <Modal title={t("Release this penalty?")} close={() => setModal(null)}><p>{t('{player} has {time} remaining. Use this for an end of penalty decided by the referee: it is recorded on the match sheet and announced.', {
            player: modal.release.player ? t('Player #{player}', {
              player: modal.release.player
            }) : t('This penalty'),
            time: formatTime(modal.release.remainingMs)
          })}</p><div className="modal-actions"><button className="secondary" onClick={() => setModal(null)}>{t("Cancel")}</button><button className="primary" onClick={() => {
            update(value => ({
              ...value,
              penalties: {
                ...value.penalties,
                [modal.team]: value.penalties[modal.team].filter(row => row.id !== modal.release.id)
              }
            }));
            setModal(null);
          }}>{t("Release penalty")}</button></div></Modal>}
    {modal?.discard && <Modal title={t('Remove an entry error?')} close={() => setModal(null)}><p>{t('{player} was entered by mistake. The penalty and its events leave the match sheet, with no announcement and no change to the clock.', {
            player: modal.discard.player ? t('Player #{player}', {player: modal.discard.player}) : t('This penalty')
          })}</p><p className="field-help">{t('For a penalty that really was served, use Release instead.')}</p><div className="modal-actions"><button className="secondary" onClick={() => setModal(null)}>{t("Cancel")}</button><button className="primary" onClick={() => {
            update(value => discardPenalty(value, modal.team, modal.discard.id));
            setModal(null);
          }}>{t('Remove entry error')}</button></div></Modal>}
  </div></I18nContext.Provider>;
}
