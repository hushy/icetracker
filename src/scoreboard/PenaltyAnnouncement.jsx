import React,{useEffect,useRef,useState} from 'react';
import {translator} from './i18n.js';
import {teamDisplayName} from './youth.js';
import {formatTime} from './clock.js';
import {penaltyReasonLabel} from './penalty-reasons.js';
import {observePenaltyEvents,PENALTY_ANIMATION_MS} from './penalty-animation.js';
import Icon from './Icon.jsx';
export function PenaltyNotice({event,settings}){
 const t=translator(settings.language);
 const ended=['Penalty served','Penalty ended'].includes(event.type);
 const reason=penaltyReasonLabel(event.reason);
 return <div className={`penalty-notice ${ended?'finished':'added'}`} role="status" aria-live="polite" aria-atomic="true">
   <div className="penalty-notice-title"><Icon name={ended?'check':'clock'}/><strong>{t(ended?'Penalty ended':event.type)}</strong></div>
   <div className="penalty-notice-player">{event.player?`#${event.player}`:t('TEAM')}<span>{teamDisplayName(settings,event.team,t)}</span></div>
   {reason&&<div className="penalty-notice-reason">{t(reason)}</div>}
   {!ended&&<div className="penalty-notice-time">{event.type==='Penalty reduced'?formatTime(event.penaltyRemainingMs):event.label}{event.deferred?` · ${t('Waiting')}`:''}</div>}
 </div>;
}
export default function PenaltyAnnouncement({game,disconnected=false,suspended=false}){
 const displayRevision=useRef(game.displayRevision);
 const seen=useRef(null);const [queue,setQueue]=useState([]);
 useEffect(()=>{
   if(displayRevision.current!==game.displayRevision){displayRevision.current=game.displayRevision;seen.current=observePenaltyEvents(null,game.events).seen;setQueue([]);return;}
   const observed=observePenaltyEvents(seen.current,game.events,game.settings.noAnimations);seen.current=observed.seen;
   const ids=new Set((game.events||[]).map(event=>event.id));
   setQueue(previous=>{
     const kept=previous.filter(event=>ids.has(event.id));
     const fresh=disconnected?[]:observed.fresh.filter(event=>(event.enteredAt??event.occurredAt)!=null&&Date.now()-(event.type==='Penalty added'?(event.enteredAt??event.occurredAt):event.occurredAt)<15000);
     if(disconnected||game.settings.noAnimations)return previous.length?[]:previous;
     return fresh.length?[...kept,...fresh]:kept.length===previous.length?previous:kept;
   });
 },[game.events,game.displayRevision,game.settings.noAnimations,disconnected]);
 const active=queue[0];
 useEffect(()=>{if(!active||suspended||game.settings.noAnimations)return;const timer=setTimeout(()=>setQueue(previous=>previous.slice(1)),PENALTY_ANIMATION_MS);return()=>clearTimeout(timer);},[active?.id,suspended,game.settings.noAnimations]);
 return active&&!suspended&&!game.settings.noAnimations?<PenaltyNotice key={active.id} event={active} settings={game.settings}/>:null;
}
