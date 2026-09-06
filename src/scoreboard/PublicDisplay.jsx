import React, { useEffect, useRef, useState } from 'react';
import { usePublicDisplay } from './display-sync.js';
import { translator } from './i18n.js';
import { useWakeLock } from './device-support.js';
import Icon from './Icon.jsx';
import GoalCelebration from './GoalCelebration.jsx';
import { observeGoals, GOAL_ANIMATION_MS } from './goal-animation.js';
import GameBoard from './GameBoard.jsx';
import './scoreboard.css';
export default function PublicDisplay({ id }) {
  const view=usePublicDisplay(id);
  const [fullscreen,setFullscreen]=useState(false);
  const game=view?.game;
  useWakeLock(Boolean(game?.settings.keepAwake));
  const seenGoals=useRef(null);
  const [celebration,setCelebration]=useState(null);
  useEffect(()=>{
    if (!game) return;
    const observed=observeGoals(seenGoals.current,game.goals);
    seenGoals.current=observed.seen;
    if (observed.goal && !view.disconnected) setCelebration(observed.goal);
    else if (celebration && (view.disconnected || !game.goals.some(goal=>goal.id===celebration.id))) setCelebration(null);
  },[game,view?.disconnected,celebration]);
  useEffect(()=>{
    if (!celebration) return;
    const timer=setTimeout(()=>setCelebration(null),GOAL_ANIMATION_MS);
    return()=>clearTimeout(timer);
  },[celebration]);
  const t=translator(game?.settings.language||'en');
  useEffect(()=>{document.documentElement.lang=game?.settings.language||'en';},[game?.settings.language]);
  useEffect(()=>{
    const change=()=>setFullscreen(Boolean(document.fullscreenElement));
    const key=event=>{if(event.key==='Escape')setFullscreen(false);};
    document.addEventListener('fullscreenchange',change);window.addEventListener('keydown',key);
    return()=>{document.removeEventListener('fullscreenchange',change);window.removeEventListener('keydown',key);};
  },[]);
  async function toggleFullscreen(){
    if(fullscreen){setFullscreen(false);if(document.fullscreenElement)await document.exitFullscreen();return;}
    setFullscreen(true);try{await document.documentElement.requestFullscreen?.();}catch{/* Window-filling layout remains available. */}
  }
  return <div className={`ice-app public-display theme-${game?.settings.theme||'volants'} ${fullscreen?'is-fullscreen':''}`}>
    <div className="public-toolbar"><button onClick={toggleFullscreen}><Icon name="expand"/>{t(fullscreen?'Exit fullscreen':'Fullscreen')}</button></div>
    {!game?<div className="display-waiting"><h1>{t('Waiting for operator…')}</h1><p>{t('Open the public window from the operator page on this computer.')}</p></div>:<main><GameBoard game={game} disconnected={view.disconnected}/></main>}
    {celebration && game && <GoalCelebration key={celebration.id} goal={celebration} settings={game.settings}/> }
  </div>;
}
