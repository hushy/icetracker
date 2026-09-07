import React, { useEffect, useRef, useState } from 'react';
import { STORAGE_KEY, defaultSettings, createGame, advanceGame, formatTime, nextPeriod, parseTime, restoreGame } from './clock.js';
import { playHorn, unlockAudio } from './horn.js';
import { hornOptions } from './horn-options.js';
import './scoreboard.css';
import { I18nContext, translator, useI18n } from './i18n.js';
import { clubs, clubLogo, selectClub } from './teams.js';
import { youthCategories, teamDisplayName } from './youth.js';
import { useOperatorDisplay } from './display-sync.js';
import { penaltyReasons } from './penalty-reasons.js';
import { EventEditor, PresetManager, NewMatchChooser } from './ManagementForms.jsx';
import { undoGame, editMatchEvent, newMatch } from './management.js';
import { useWakeLock, useOffline } from './device-support.js';
import Icon from './Icon.jsx';
import MatchSheet from './MatchSheet.jsx';
import {eventClock,addMatchNote,periodLength} from './match-report.js';
import { recordMatchEvents } from './match-events.js';
import GameBoard from './GameBoard.jsx';
import { prepareDialog, isClockRunning, startBreak, startTimeout, leaveAuxiliary, pauseClocks, toggleActiveClock } from './phases.js';
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
    <p className="muted">{t("The game is paused while you set up.")}</p>
    <div className="form-grid">
      {['home', 'away'].map(team => <fieldset key={team}><legend>{team === 'home' ? t("Home team") : t("Away team")}</legend>
        <label>{t('Search clubs')}<input type="search" value={clubSearch[team]} onChange={event=>setClubSearch(previous=>({...previous,[team]:event.target.value}))} placeholder={t('City or club name')}/></label>
        <label>{t("Club (FFHG Nord-Est)")}<select value={draft[`${team}Club`]} onChange={event => setDraft(previous => selectClub(previous, team, event.target.value))}><option value="">{t("Custom team")}</option>{clubs.filter(club=>club.id===draft[`${team}Club`] || normalizeSearch(`${club.city} ${club.name}`).includes(normalizeSearch(clubSearch[team]))).map(club => <option key={club.id} value={club.id}>{club.city} — {club.name}</option>)}</select></label>
        <label>{t('Youth category')}<select value={draft[`${team}Category`]} onChange={event => change(`${team}Category`, event.target.value)}><option value="">{t('No category / senior')}</option>{youthCategories.map(category => <option key={category} value={category}>{category}</option>)}</select></label>
        <label>{t("Team / alliance name")}<input required maxLength="60" value={draft[team]} onChange={event => setDraft(previous => ({
              ...previous,
              [team]: event.target.value
            }))} /></label>
        <p className="field-help">{t('Choose the category playing this match. Edit the name for a second squad or club alliance; the club logo is kept.')}</p>
        <ImageField label={t("Team logo")} value={clubLogo(draft, team)} onChange={value => setDraft(previous => ({
            ...previous,
            [`${team}Logo`]: value,
            [`${team}Club`]: ''
          }))} />
      </fieldset>)}
    </div>
    <fieldset><legend>{t("Game clock")}</legend><div className="form-grid">
      <label>{t("Period length (minutes)")}<input type="number" min="1" max="99" required value={draft.periodMinutes} onChange={event => change('periodMinutes', Number(event.target.value))} /></label>
      <label>{t("Number of periods")}<input type="number" min="1" max="9" required value={draft.periods} onChange={event => change('periods', Number(event.target.value))} /></label>
    </div><p className="field-help">{t("Period length applies to the next period or a new game. Use Edit clock to change the current clock.")}</p></fieldset>
    <label className="check-label"><input type="checkbox" checked={draft.autoPauseOnGoalPenalty} onChange={event => change('autoPauseOnGoalPenalty', event.target.checked)} />{t('Auto pause on goal/penalty')}</label>
    <label className="check-label"><input type="checkbox" checked={Boolean(draft.noAnimations)} onChange={event=>change('noAnimations',event.target.checked)}/>{t('No animations')}</label>
    <label className="check-label"><input type="checkbox" checked={Boolean(draft.resetScoresEachPeriod)} onChange={event=>change('resetScoresEachPeriod',event.target.checked)}/>{t('Reset the score at each period')}</label>
    <p className="field-help">{t('For categories scored period by period. Goals stay on the match sheet, which keeps the running total.')}</p>
    <fieldset><legend>{t("Horn & junior shifts")}</legend>
      <label>{t("Horn sound")}<select value={draft.hornSound} onChange={event => change('hornSound', event.target.value)}>{hornOptions.map(option => <option key={option.id} value={option.id}>{t(option.label)}</option>)}</select></label>
      <p className="field-help">{t(hornOptions.find(option => option.id === draft.hornSound)?.description || hornOptions[0].description)}</p>
      <label className="check-label"><input type="checkbox" checked={draft.endHorn} onChange={event => change('endHorn', event.target.checked)} />{t("Sound horn at the end of each period")}</label>
      <label className="check-label"><input type="checkbox" checked={draft.shiftEnabled} onChange={event => change('shiftEnabled', event.target.checked)} />{t("Automatic junior shift horn")}</label>
      <div className="form-grid"><label>{t("Shift interval (seconds)")}<input type="number" min="5" max="600" required value={draft.shiftSeconds} onChange={event => change('shiftSeconds', Number(event.target.value))} /></label>
      <label>{t("Horn volume ·")} {draft.volume}%<input type="range" min="0" max="100" value={draft.volume} onChange={event => change('volume', Number(event.target.value))} /></label></div>
      <p className="field-help">{t("Shifts follow game time and pause at stoppages. Keep this page visible and the device awake for timely horns.")}</p>
      <button type="button" className="secondary" onClick={() => testHorn(draft.volume, 'manual', draft.hornSound)}><Icon name="horn" />{t("Test horn")}</button>
    </fieldset>
    <fieldset><legend>{t("Scoreboard background")}</legend><label>{t("Theme")}<select value={draft.theme} onChange={event => change('theme', event.target.value)}><option value="volants">{t("Français Volants · blue & white")}</option><option value="neutral">{t("Neutral · dark")}</option></select></label><ImageField label={t("Background image")} value={draft.background} onChange={value => change('background', value)} /><p className="field-help">{t("Images stay in this browser. PNG, JPG, WebP or GIF, up to 1 MB each.")}</p></fieldset>
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
function ClockForm({
  game,
  save,
  close
}) {
  const t = useI18n();
  const [value, setValue] = useState(formatTime(game.remainingMs));
  const [period, setPeriod] = useState(game.period);
  const [error, setError] = useState('');
  return <Modal title={t("Edit game clock")} close={close}><form onSubmit={event => {
      event.preventDefault();
      const ms = parseTime(value);
      if (ms === null) {
        setError('Use MM:SS, for example 12:30.');
        return;
      }
      save(ms, period);
    }}>
    <p className="muted">{t("The game is paused. Penalty and shift time are kept as they are.")}</p>
    <label>{t("Time remaining (MM:SS)")}<input autoFocus required value={value} onChange={event => setValue(event.target.value)} /></label>
    <label>{t("Period")}<input type="number" required min="1" max="99" value={period} onChange={event => setPeriod(Number(event.target.value))} /></label>
    {error && <p className="form-error" role="alert">{t(error)}</p>}
    <div className="modal-actions"><button className="secondary" type="button" onClick={close}>{t("Cancel")}</button><button className="primary" type="submit">{t("Save clock")}</button></div>
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
  const [undoTarget,setUndoTarget]=useState(null);
  const wakeStatus=useWakeLock(game.settings.keepAwake);
  const offlineStatus=useOffline();
  const [activeTab,setActiveTab]=useState('board');
  const [modal, setModal] = useState(null);
  const [notice, setNotice] = useState('');
  const [storageError, setStorageError] = useState(false);
  const [hornFlash, setHornFlash] = useState('');
  const flashTimeout = useRef(null);
  const [fullscreen, setFullscreen] = useState(false);
  function persist(value) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
      setStorageError(false);
    } catch {
      setStorageError(true);
    }
  }
  function horn(volume = current.current.settings.volume, type = 'manual', sound = current.current.settings.hornSound) {
    setHornFlash(type === 'shift' ? 'CHANGE LINES' : type === 'end' ? (current.current.auxiliary ? 'Countdown complete' : current.current.period >= current.current.settings.periods ? 'FINAL BUZZER' : 'PERIOD OVER') : 'HORN');
    clearTimeout(flashTimeout.current);
    flashTimeout.current = setTimeout(() => setHornFlash(''), 1800);
    playHorn(volume, type === 'shift' ? 0.9 : 3.2, sound).catch(() => setNotice('Sound is unavailable. Tap Test horn in Game setup to enable it.'));
  }
  function sync() {
    const now = performance.now();
    const result = advanceGame(current.current, now - tickAt.current);
    tickAt.current = now;
    result.game = recordMatchEvents(current.current,result.game,Date.now(),true);
    current.current = result.game;
    if (result.horn) horn(result.game.settings.volume, result.horn);
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
  function toggleClock() {
    if (!isClockRunning(current.current)) unlockAudio(current.current.settings.hornSound).catch(() => setNotice('Tap Test horn in Game setup to check sound before the game.'));
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
      if (event.key === 'Escape') setFullscreen(false);
      if (event.code !== 'Space' || event.repeat || event.altKey || event.ctrlKey || event.metaKey || document.querySelector('dialog[open]') || /INPUT|TEXTAREA|SELECT|BUTTON|A/.test(event.target.tagName) || event.target.isContentEditable) return;
      event.preventDefault();
      toggleClock();
    };
    const fullscreenChange = () => setFullscreen(Boolean(document.fullscreenElement));
    window.addEventListener('pagehide', pageHide);
    window.addEventListener('keydown', keydown);
    document.addEventListener('visibilitychange', visibility);
    document.addEventListener('fullscreenchange', fullscreenChange);
    return () => {
      clearInterval(interval);
      clearTimeout(flashTimeout.current);
      window.removeEventListener('pagehide', pageHide);
      window.removeEventListener('keydown', keydown);
      document.removeEventListener('visibilitychange', visibility);
      document.removeEventListener('fullscreenchange', fullscreenChange);
    };
  }, []);
  async function toggleFullscreen() {
    if (fullscreen) {
      setFullscreen(false);
      if (document.fullscreenElement) await document.exitFullscreen();
      return;
    }
    setFullscreen(true);
    try {
      if (document.fullscreenElement) await document.exitFullscreen();else if (document.documentElement.requestFullscreen) await document.documentElement.requestFullscreen();else setNotice('Fullscreen is unavailable in this browser. You can add this page to your home screen.');
    } catch {
      setNotice('Fullscreen could not be opened in this browser.');
    }
  }
  useEffect(() => {
    document.documentElement.lang = game.settings.language;
  }, [game.settings.language]);
  const ended = game.remainingMs === 0;
  const finalPeriod = game.period >= game.settings.periods;
  const toolbar = <>
    <div className="board-brand">ICE<span>TRACKER</span></div>
    <nav className="board-tabs" aria-label={t('Match views')}><button aria-pressed={activeTab==='board'} onClick={()=>setActiveTab('board')}><Icon name="monitor"/>{t('Board')}</button><button aria-pressed={activeTab==='sheet'} onClick={()=>setActiveTab('sheet')}><Icon name="sheet"/>{t('Match sheet')}</button></nav>
    <div className="toolbar-actions"><button className="secondary" onClick={()=>setModal('new-game')}><Icon name="plus"/>{t('New game')}</button><button className="secondary" disabled={!undoTarget} title={t('Undo last action')} aria-label={t('Undo last action')} onClick={()=>setModal('undo')}><Icon name="reset"/>{t('Undo')}</button><button className="secondary" onClick={()=>setNotice(display.open()?'Public window opened. Move it to your second screen and click Fullscreen.':'Allow pop-ups to open the public scoreboard.')}><Icon name="monitor"/>{t('Public screen')}</button><button className="secondary" title={t('Tools')} aria-label={t('Tools')} onClick={()=>setModal('tools')}><Icon name="settings"/>{t('Tools')}</button><button className="secondary" title={t('Fullscreen')} aria-label={t(fullscreen?'Exit fullscreen':'Fullscreen')} onClick={toggleFullscreen}><Icon name="expand"/>{t(fullscreen?'Exit fullscreen':'Fullscreen')}</button></div>
    {(notice||storageError)&&<div className="notice" role="alert">{t(notice||'Changes could not be saved on this device.')}<button className="icon-button" onClick={()=>setNotice('')} aria-label={t('Dismiss message')}>×</button></div>}
  </>;
  return <I18nContext.Provider value={game.settings.language}><div className={`ice-app theme-${game.settings.theme} ${fullscreen ? 'display-mode' : ''} ${activeTab==='board'?'board-view':'sheet-view'}`}>
    <main>{activeTab==='sheet'?<MatchSheet game={game} toolbar={toolbar} toggleClock={toggleClock} editEvent={event=>setModal({editEvent:event.id})} addNote={()=>openModal('note')} goBoard={()=>setActiveTab('board')} getSnapshot={()=>sync()} saveInfo={info=>{update(value=>({...value,matchInfo:info}));try{localStorage.setItem('icetracker-venue',JSON.stringify({venue:info.venue,competition:info.competition}));}catch{}}} restoreBackup={restored=>{restored={...restored,pauseStartedAt:Date.now(),displayRevision:crypto.randomUUID()};const before=sync();setUndoTarget(structuredClone(before));current.current=restored;tickAt.current=performance.now();setGame(restored);persist(restored);display.publish(restored);}}/>:<GameBoard game={game} hornFlash={hornFlash} toolbar={toolbar} actions={{
      score:(team,delta)=>openModal(delta>0?{goalTeam:team}:{removeGoalTeam:team}),
      addPenalty:team=>openModal(`penalty-${team}`),
      release:(team,row)=>{if(row.remainingMs===0)update(value=>({...value,penalties:{...value.penalties,[team]:value.penalties[team].filter(item=>item.id!==row.id)}}));else openModal({release:row,team});},
      discard:(team,row)=>openModal({discard:row,team}),
      startPenalty:(team,row)=>update(value=>({...value,penalties:{...value.penalties,[team]:value.penalties[team].map(item=>item.id===row.id?{...item,deferred:false}:item)}})),
      timeout:team=>openModal({timeoutTeam:team}),
      editClock:()=>openModal('clock'),
      restartShift:()=>update(value=>({...value,shiftRemainingMs:value.settings.shiftSeconds*1000})),
      toggle:toggleClock,horn:()=>horn(),break:()=>openModal('break'),nextPeriod:()=>openModal('next'),
      endAuxiliary:()=>openModal('end-auxiliary'),
    }}/>}</main>
    <footer className="ice-footer"><button className="credits-button" onClick={() => openModal('credits')}>{t('Source & credits')}</button><span>{t("ICE TIME. MADE SIMPLE.")}</span><a href="?mode=stats">{t("Open player statistics")} <Icon name="arrow" size={16} /></a></footer>
    {modal==='new-game'&&<NewMatchChooser Frame={Modal} game={game} close={()=>setModal(null)} start={startNewMatch} configure={()=>openModal('setup-new')}/>}
    {modal==='tools'&&<Modal title={t('Tools')} close={()=>setModal(null)}><div className="tools-grid"><button className="secondary" onClick={()=>openModal('setup')}><Icon name="settings"/>{t('Game setup')}</button><button className="secondary" onClick={()=>setModal('presets')}><Icon name="sheet"/>{t('Match presets')}</button><button className="secondary" onClick={()=>{setActiveTab('sheet');setModal(null);}}><Icon name="sheet"/>{t('Match sheet')}</button><button className="secondary" onClick={()=>setModal('credits')}>{t('Source & credits')}</button></div><label>{t('Language')}<select value={game.settings.language} onChange={e=>update(value=>({...value,settings:{...value.settings,language:e.target.value}}),false)}><option value="fr">Français</option><option value="en">English</option></select></label><label className="check-label"><input type="checkbox" checked={game.settings.keepAwake} onChange={e=>update(value=>({...value,settings:{...value.settings,keepAwake:e.target.checked,keepAwakePreferenceSet:true}}),false)}/>{t('Keep screen awake')}</label><p className="device-status">{t(wakeStatus)}<br/>{t(offlineStatus)}</p></Modal>}
    {modal==='undo'&&undoTarget&&<Modal title={t('Undo last action')} close={()=>setModal(null)}><p>{t('Restore the state before the last action? The clock will return to the saved time and stay paused.')}</p><p><strong>{undoTarget.scores.home} – {undoTarget.scores.away} · {formatTime(undoTarget.remainingMs)}</strong></p><div className="modal-actions"><button className="secondary" onClick={()=>setModal(null)}>{t('Cancel')}</button><button className="primary" onClick={()=>{const restored=undoGame(undoTarget);current.current=restored;tickAt.current=performance.now();setGame(restored);persist(restored);display.publish(restored);setUndoTarget(null);setModal(null);}}>{t('Undo last action')}</button></div></Modal>}
    {modal?.editEvent&&game.events.find(e=>e.id===modal.editEvent)&&<EventEditor Frame={Modal} game={game} event={game.events.find(e=>e.id===modal.editEvent)} close={()=>setModal(null)} save={patch=>{update(value=>editMatchEvent(value,modal.editEvent,patch));setModal(null);}}/>}
    {modal==='presets'&&<PresetManager Frame={Modal} settings={game.settings} close={()=>setModal(null)} apply={settings=>{const checked=restoreGame(JSON.stringify(createGame({...current.current.settings,...settings})));if(!checked){setNotice('Invalid preset.');return;}update(value=>({...value,settings:checked.settings,shiftRemainingMs:checked.settings.shiftSeconds*1000}));setModal(null);}}/>}
    {modal === 'credits' && <Modal title={t('Source & credits')} close={() => setModal(null)}><p>{t('Clubs verified against the FFHG Nord-Est directory.')}</p><p><a href="https://nord-est.ffhg.org/annuaire-clubs/" target="_blank" rel="noreferrer">FFHG · Nord-Est</a></p><p>Français Volants · #000034 / #FFFFFF</p>{hornOptions.map(option => <p key={option.id}><a href={option.source} target="_blank" rel="noreferrer">{t(option.label)} · {option.credit}</a> · <a href="https://creativecommons.org/publicdomain/zero/1.0/" target="_blank" rel="noreferrer">CC0 1.0</a></p>)}</Modal>}
    {modal === 'break' && <BreakForm minutes={game.settings.breakMinutes} close={()=>setModal(null)} save={minutes=>{unlockAudio(current.current.settings.hornSound).catch(()=>{});update(value=>startBreak(value,minutes));setModal(null);}}/>}
    {modal?.timeoutTeam && <Modal title={t('Timeout · {team}',{team:teamDisplayName(game.settings,modal.timeoutTeam,t)})} close={()=>setModal(null)}><p>{t('One 30-second timeout per team per game. Start only after the referee grants it.')}</p><div className="modal-actions"><button className="secondary" onClick={()=>setModal(null)}>{t('Cancel')}</button><button className="primary" onClick={()=>{unlockAudio(current.current.settings.hornSound).catch(()=>{});update(value=>startTimeout(value,modal.timeoutTeam));setModal(null);}}>{t('Use timeout')}</button></div></Modal>}
    {modal === 'end-auxiliary' && <Modal title={t('Back to game')} close={()=>setModal(null)}><p>{t('End this countdown and return to the paused match clock? A used timeout stays consumed.')}</p><div className="modal-actions"><button className="secondary" onClick={()=>setModal(null)}>{t('Cancel')}</button><button className="primary" onClick={()=>{update(leaveAuxiliary);setModal(null);}}>{t('Back to game')}</button></div></Modal>}
    {modal==='note'&&<NoteForm close={()=>setModal(null)} save={text=>{update(value=>addMatchNote(value,text,capturedClock.current));setModal(null);}}/>}
    {modal?.goalTeam && <GoalForm game={game} team={modal.goalTeam} close={()=>setModal(null)} save={details=>{update(value=>recordGoal(value,modal.goalTeam,{...details,clock:capturedClock.current}));setModal(null);}}/>}
    {modal?.removeGoalTeam && <Modal title={t('Remove a goal?')} close={()=>setModal(null)}><p>{t('The latest goal for this team and its assists will be removed. Check penalties manually if that goal ended one.')}</p><div className="modal-actions"><button className="secondary" onClick={()=>setModal(null)}>{t('Cancel')}</button><button className="primary" onClick={()=>{update(value=>removeGoal(value,modal.removeGoalTeam));setModal(null);}}>{t('Remove goal')}</button></div></Modal>}
    {(modal === 'setup' || modal === 'setup-new') && <Setup key={modal} newMatchSetup={modal==='setup-new'} game={game} close={() => setModal(null)} testHorn={horn} save={(settings, reset) => {
        if(reset){startNewMatch(settings);return;}
        update(value => ({
          ...value,
          settings,
          shiftRemainingMs: settings.shiftSeconds !== value.settings.shiftSeconds || settings.shiftEnabled !== value.settings.shiftEnabled ? settings.shiftSeconds * 1000 : value.shiftRemainingMs
        }));
        setModal(null);
      }} />}
    {modal === 'clock' && <ClockForm game={game} close={() => setModal(null)} save={(remainingMs, period) => {
        update(value => ({
          ...value,
          remainingMs,
          periodElapsedMs: Math.max(0,(periodLength(value,period)??value.settings.periodMinutes*60000)-remainingMs),
          periodLengths:{...value.periodLengths,[period]:Math.max(remainingMs,periodLength(value,period)??value.settings.periodMinutes*60000)},
          period,
          running: false
        }));
        setModal(null);
      }} />}
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
