import {useEffect,useState} from 'react';
export function useWakeLock(enabled){
 const [status,setStatus]=useState('Wake lock off');
 useEffect(()=>{let lock=null,disposed=false,pending=false;
 const acquire=async()=>{if(!enabled){setStatus('Wake lock off');return;}if(!navigator.wakeLock){setStatus('Wake lock unavailable');return;}if(document.visibilityState!=='visible'||pending||lock)return;pending=true;try{const next=await navigator.wakeLock.request('screen');if(disposed){await next.release();return;}lock=next;setStatus('Screen kept awake');next.addEventListener('release',()=>{lock=null;if(!disposed)setStatus('Wake lock released');});}catch{if(!disposed)setStatus('Wake lock unavailable');}finally{pending=false;}};
 acquire();document.addEventListener('visibilitychange',acquire);return()=>{disposed=true;document.removeEventListener('visibilitychange',acquire);lock?.release().catch(()=>{});};},[enabled]);return status;
}
export function useOffline(){const [status,setStatus]=useState('Preparing offline mode');useEffect(()=>{let disposed=false;if(location.protocol==='file:'){setStatus('Local preview · hosted offline mode unavailable');return;}if(!('serviceWorker' in navigator)||!import.meta.env.PROD){setStatus('Offline mode unavailable');return;}navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`).then(()=>navigator.serviceWorker.ready).then(()=>{if(!disposed)setStatus('Ready for offline use');}).catch(()=>{if(!disposed)setStatus('Offline mode unavailable');});return()=>{disposed=true;};},[]);return status;}
