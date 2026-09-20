import { useEffect, useRef, useState } from 'react';
// The Window Management API places the public window on the arena screen by itself.
// Chrome and Edge only: everywhere else the operator keeps dragging the window over.
const available = () => typeof window !== 'undefined' && typeof window.getScreenDetails === 'function';
export const isExtended = () => Boolean(window.screen?.isExtended);

export function useExtendedScreen() {
  const [extended, setExtended] = useState(() => {
    try { return isExtended(); } catch { return false; }
  });
  useEffect(() => {
    const update = () => { try { setExtended(isExtended()); } catch { setExtended(false); } };
    update();
    // screen.isExtended needs no permission but only reports a change event with one.
    const poll = setInterval(update, 2000);
    window.screen?.addEventListener?.('change', update);
    window.addEventListener('resize', update);
    return () => {
      clearInterval(poll);
      window.screen?.removeEventListener?.('change', update);
      window.removeEventListener('resize', update);
    };
  }, []);
  return extended;
}

export async function screenDetails() {
  if (!available()) return null;
  try {
    const permission = await navigator.permissions?.query({name: 'window-management'}).catch(() => null);
    if (permission?.state === 'denied') return null;
    return await window.getScreenDetails();
  } catch { return null; }
}
// Asking ahead of the click keeps window.open inside the user gesture, so the popup
// blocker stays quiet. Only possible once the permission has been granted.
export async function grantedScreenDetails() {
  try {
    const permission = await navigator.permissions?.query({name: 'window-management'});
    return permission?.state === 'granted' ? await screenDetails() : null;
  } catch { return null; }
}
export function arenaScreen(details) {
  const screens = details?.screens;
  if (!screens?.length) return null;
  const others = screens.filter(screen => screen !== details.currentScreen);
  return others.find(screen => !screen.isPrimary) || others[0] || null;
}
export function popupFeatures(screen) {
  if (!screen) return 'popup,width=1280,height=800';
  // `fullscreen` is honoured by Chrome once window management is granted; the public
  // page also asks for fullscreen itself, which covers the browsers that ignore it.
  return `popup,fullscreen,left=${screen.availLeft},top=${screen.availTop},width=${screen.availWidth},height=${screen.availHeight}`;
}

// One cache per operator page: the details object stays live and tracks screen changes.
export function useArenaScreen(extended) {
  const cache = useRef(null);
  useEffect(() => {
    let cancelled = false;
    if (extended && !cache.current) grantedScreenDetails().then(details => { if (!cancelled) cache.current = details; });
    return () => { cancelled = true; };
  }, [extended]);
  return async () => {
    if (!extended) return null;
    cache.current = cache.current || await screenDetails();
    return arenaScreen(cache.current);
  };
}
