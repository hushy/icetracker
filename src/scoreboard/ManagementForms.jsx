import React,{useState} from 'react';
import {periodLength,reportModel} from './match-report.js';
import {penaltyReasons,penaltyReasonLabel} from './penalty-reasons.js';
import {useI18n} from './i18n.js';
import {formatTime,parseTime} from './clock.js';
import {PRESETS_KEY,presetSettings,readPresets} from './management.js';
const localInput=ms=>{if(ms==null)return '';const d=new Date(ms);return new Date(ms-d.getTimezoneOffset()*60000).toISOString().slice(0,19);};
export function EventEditor({event,game,save,close,Frame}){
 const t=useI18n();
 const timing=event.type==='Penalty added'?reportModel(game).penalties.find(row=>row.id===event.id):null;
 const [draft,setDraft]=useState({...event,up:event.elapsedMs==null?'':formatTime(Math.floor(event.elapsedMs/1000)*1000),down:formatTime(event.remainingMs),local:localInput(event.occurredAt),assist1:event.assists?.[0]||'',assist2:event.assists?.[1]||'',startOverride:event.startOverrideMs==null?'':(timing?.startMs==null?'':formatTime(timing.startMs)),endOverride:event.endOverrideMs==null?'':(timing?.endMs==null?'':formatTime(timing.endMs))});
 const [error,setError]=useState('');
 const change=(key,value)=>setDraft(old=>({...old,[key]:value}));
 function changeRemaining(value) {
   const ms=parseTime(value), length=periodLength(game,Number(draft.period));
   setDraft(old=>({...old,down:value,...(ms!=null&&length!=null&&ms<=length?{up:formatTime(length-ms)}:{})}));
 }
 function submit(e) {
   e.preventDefault();
   const remainingMs=parseTime(draft.down),elapsedMs=draft.up?parseTime(draft.up):null,occurredAt=draft.local?new Date(draft.local).getTime():null;
   const players=[draft.scorer,draft.assist1,draft.assist2].map(value=>(value||'').trim()).filter(Boolean);
   const length=periodLength(game,Number(draft.period));
   if(['startOverride','endOverride'].some(key=>draft[key]&&parseTime(draft[key])==null)){setError('Check the event times.');return;}
   if(remainingMs==null||(draft.up&&elapsedMs==null)||(draft.local&&!Number.isFinite(occurredAt))||(length!=null&&elapsedMs!=null&&Math.abs(length-remainingMs-elapsedMs)>1000)){setError('Check the event times.');return;}
   if(new Set(players).size!==players.length){setError('Scorer and assists must be different players.');return;}
   if(event.type==='Penalty added'&&(!parseTime(draft.label||'')||parseTime(draft.label)>5999000)){setError('Enter a duration between 00:01 and 99:59.');return;}
   save({period:Number(draft.period),remainingMs,elapsedMs,occurredAt,scorer:(draft.scorer||'').trim(),assists:[draft.assist1,draft.assist2].map(value=>value.trim()).filter(Boolean),assistsConfirmed:Boolean(draft.assistsConfirmed||draft.assist1||draft.assist2),player:(draft.player||'').trim(),servedBy:(draft.servedBy||'').trim(),reason:draft.reason||'',...(event.label!=null?{label:draft.label}:{}),...(event.type==='Match note'?{note:(draft.note||'').trim()}:{}),duplicateChecked:Boolean(draft.duplicateChecked),...(event.type==='Penalty added'?{penaltyTimingBasis:'period',startOverrideMs:draft.startOverride?parseTime(draft.startOverride):null,endOverrideMs:draft.endOverride?parseTime(draft.endOverride):null}:{})});
 }
 return <Frame title={t('Edit event')} close={close}><form onSubmit={submit}>
 <p className="muted">{t(event.type)} · {t('Period')} {event.period} · {formatTime(event.remainingMs)}</p>
 {event.type==='Goal'&&<><div className="player-number-grid">{[['scorer','Scorer'],['assist1','A1'],['assist2','A2']].map(([key,label])=><label key={key}>{t(label)}<input autoFocus={key==='scorer'} inputMode="numeric" maxLength="8" value={draft[key]||''} onChange={e=>change(key,e.target.value)}/></label>)}</div>{!draft.assist1&&!draft.assist2&&<label className="check-label"><input type="checkbox" checked={!!draft.assistsConfirmed} onChange={e=>change('assistsConfirmed',e.target.checked)}/>{t('No assists')}</label>}</>}
 {event.type.startsWith('Penalty')&&<><div className="form-grid"><label>{t('Player number (optional)')}<input autoFocus maxLength="8" value={draft.player||''} onChange={e=>change('player',e.target.value)}/></label><label>{t('Served by (optional)')}<input maxLength="8" value={draft.servedBy||''} onChange={e=>change('servedBy',e.target.value)}/></label></div><label>{t('Penalty reason (optional)')}<select value={draft.reason||''} onChange={e=>change('reason',e.target.value)}><option value="">{t('Not specified')}</option>{penaltyReasons.map(item=><option key={item.id} value={item.id}>{t(item.label)}</option>)}</select></label>{event.type==='Penalty added'&&<label>{t('Assessed duration (MM:SS)')}<input required value={draft.label||''} onChange={e=>change('label',e.target.value)}/></label>}</>}
 {event.type==='Match note'&&<label>{t('Internal note')}<textarea autoFocus required maxLength="1000" value={draft.note||''} onChange={e=>change('note',e.target.value)}/></label>}
 <details className="form-disclosure"><summary>{t('Event time')}</summary><label>{t('Period')}<input type="number" min="1" max="99" required value={draft.period} onChange={e=>{const period=Number(e.target.value),length=periodLength(game,period),remaining=parseTime(draft.down);setDraft(old=>({...old,period,...(length!=null&&remaining!=null&&length>=remaining?{up:formatTime(length-remaining)}:{})}));}}/></label><div className="form-grid"><label>{t('Remaining clock')}<input required value={draft.down} onChange={e=>changeRemaining(e.target.value)}/></label><label>{t('Elapsed clock')}<input value={draft.up} placeholder="MM:SS" onChange={e=>{const ms=parseTime(e.target.value),length=periodLength(game,Number(draft.period));setDraft(old=>({...old,up:e.target.value,...(ms!=null&&length!=null&&ms<=length?{down:formatTime(length-ms)}:{})}));}}/></label></div><label>{t('Local time')}<input type="datetime-local" step="1" value={draft.local} onChange={e=>change('local',e.target.value)}/></label>{event.type==='Penalty added'&&<><div className="form-grid">{[['startOverride','Actual start · period elapsed'],['endOverride','Actual end · period elapsed']].map(([key,label])=><label key={key}>{t(label)}<input placeholder="MM:SS" value={draft[key]} onChange={e=>change(key,e.target.value)}/></label>)}</div><p className="field-help">{t('Leave blank to use recorded penalty timing. Corrections affect the report only.')}</p></>}<p className="field-help">{t('Entered at')}: {localInput(event.enteredAt??event.occurredAt).replace('T',' ')||'—'}</p></details>
 <details className="form-disclosure"><summary>{t('Review & history')}</summary><label className="check-label"><input type="checkbox" checked={!!draft.duplicateChecked} onChange={e=>change('duplicateChecked',e.target.checked)}/>{t('Checked: this is not a duplicate')}</label>{event.history?.length?event.history.map((revision,i)=><div className="revision" key={i}><strong>{localInput(revision.at).replace('T',' ')}</strong><p>{t('Previous values')}: {t('Period')} {revision.previous.period} · {formatTime(revision.previous.remainingMs)} · {revision.previous.scorer||revision.previous.player||'—'} · {(revision.previous.assists||[]).join(' / ')} {revision.previous.label} {t(penaltyReasonLabel(revision.previous.reason))} {revision.previous.note}</p></div>):<p>{t('No corrections yet.')}</p>}</details>
 <p className="field-help">{t('Edits correct the match sheet and goal details. Live scores, clocks and penalties stay under operator control.')}</p>
 {error&&<p role="alert" className="form-error">{t(error)}</p>}<div className="modal-actions"><button type="button" className="secondary" onClick={close}>{t('Cancel')}</button><button className="primary">{t('Save event')}</button></div></form></Frame>;
}
export function PresetManager({settings,apply,close,Frame}){
 const t=useI18n();const [rows,setRows]=useState(()=>{try{const data=JSON.parse(localStorage.getItem(PRESETS_KEY)||'[]');return Array.isArray(data)?data.filter(r=>typeof r.name==='string'&&r.settings):[];}catch{return [];}});const [name,setName]=useState('');const [error,setError]=useState('');
 const store=next=>{try{localStorage.setItem(PRESETS_KEY,JSON.stringify(next));setRows(next);setError('');return true;}catch{setError('Changes could not be saved on this device.');return false;}};
 return <Frame title={t('Match presets')} close={close}><p>{t('Save current period, break and horn settings. Applying a preset keeps the current score and clock; period length applies to the next period or a new game.')}</p><form onSubmit={e=>{e.preventDefault();if(!name.trim())return;if(store([...rows,{id:crypto.randomUUID(),name:name.trim(),settings:presetSettings(settings)}]))setName('');}}><label>{t('Preset name')}<input required maxLength="60" value={name} onChange={e=>setName(e.target.value)}/></label><button className="primary">{t('Save current settings')}</button></form><div className="preset-list">{rows.map(row=><div key={row.id}><strong>{row.name}</strong><button className="secondary" onClick={()=>apply(row.settings)}>{t('Apply')}</button><button className="secondary" onClick={()=>store(rows.filter(r=>r.id!==row.id))}>{t('Delete')}</button></div>)}</div>{error&&<p className="form-error">{t(error)}</p>}</Frame>;
}

export function NewMatchChooser({game,start,configure,close,Frame}) {
  const t=useI18n();
  const [rows]=useState(readPresets),[selected,setSelected]=useState('');
  const chosen=rows.find(row=>row.id===selected);
  return <Frame title={t('New game')} close={close}>
    <p className="muted">{t('Choose a saved configuration or configure the next game.')}</p>
    <fieldset className="new-match-preset"><legend>{t('Saved configuration')}</legend>
      {rows.length?<><label>{t('Configuration')}<select aria-label={t('Configuration')} value={selected} onChange={e=>setSelected(e.target.value)}><option value="">{t('Choose a configuration')}</option>{rows.map(row=><option value={row.id} key={row.id}>{row.name}</option>)}</select></label>
      {chosen&&<p className="field-help">{chosen.settings.periods} × {chosen.settings.periodMinutes} min</p>}
      <p className="field-help">{t('Clock and horn settings. Current teams and artwork are kept.')}</p>
      <button type="button" className="primary" disabled={!chosen} onClick={()=>start({...game.settings,...presetSettings(chosen.settings)})}>{t('Start new game')}</button></>:<p className="field-help">{t('No saved configurations yet.')}</p>}
    </fieldset>
    <button type="button" className="secondary new-match-configure" onClick={configure}>{t('Configure game')} <span aria-hidden="true">→</span></button>
    <p className="field-help">{t('Starting a new game clears the score and match sheet. The new clock stays paused.')}</p>
    <div className="modal-actions"><button type="button" className="secondary" onClick={close}>{t('Cancel')}</button></div>
  </Frame>;
}
