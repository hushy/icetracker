import { useEffect, useRef, useState } from 'react';
import { readDisplaySnapshot, projectDisplay } from './display-model.js';
import { popupFeatures } from './screens.js';
const channelName = id => `icetracker-public-${id}`;
const targetOrigin = () => location.protocol === 'file:' ? '*' : location.origin;
export function publicWindowId() {
  try {
    let id = sessionStorage.getItem('icetracker-operator-id');
    if (!id) { id = crypto.randomUUID(); sessionStorage.setItem('icetracker-operator-id', id); }
    return id;
  } catch { return crypto.randomUUID(); }
}
export function useOperatorDisplay(current, sync) {
  const id = useRef(null);
  if (!id.current) id.current = publicWindowId();
  const channel = useRef(null);
  const child = useRef(null);
  function publish(game = sync(), full = true) {
    const { settings, ...clock } = game;
    const packet = { type: 'state', id: id.current, sentAt: Date.now(), game: full ? game : clock };
    channel.current?.postMessage(packet);
    if (child.current && !child.current.closed) child.current.postMessage(packet, targetOrigin());
  }
  function open(arena = null) {
    const url = new URL(location.href); url.search = ''; url.hash = ''; url.searchParams.set('display', id.current);
    if (arena) url.searchParams.set('fullscreen', '1');
    child.current = window.open(url.href, `icetracker-display-${id.current}`, popupFeatures(arena));
    if (child.current) publish();
    return Boolean(child.current);
  }
  useEffect(() => {
    try { channel.current = new BroadcastChannel(channelName(id.current)); } catch { /* postMessage also supports a local file preview. */ }
    const request = packet => { if (packet?.type === 'request' && packet.id === id.current) publish(); };
    if (channel.current) channel.current.onmessage = event => request(event.data);
    const message = event => {
      if (event.source === child.current && (location.protocol === 'file:' ? event.origin === 'null' : event.origin === location.origin)) request(event.data);
    };
    window.addEventListener('message', message);
    const heartbeat = setInterval(() => publish(sync(), false), 500);
    return () => { clearInterval(heartbeat); channel.current?.close(); channel.current = null; window.removeEventListener('message', message); };
  }, []);
  return { open, publish };
}
export function usePublicDisplay(id) {
  const snapshot = useRef(null);
  const [view, setView] = useState(null);
  useEffect(() => {
    let channel;
    try { channel = new BroadcastChannel(channelName(id)); } catch { /* opener fallback */ }
    const receive = packet => {
      if (packet?.id !== id) return;
      const next = readDisplaySnapshot(packet, snapshot.current);
      if (next && (!snapshot.current || next.sentAt >= snapshot.current.sentAt)) {
        snapshot.current = next; setView(projectDisplay(next, Date.now()));
      }
    };
    if (channel) channel.onmessage = event => receive(event.data);
    const message = event => {
      if (event.source === window.opener && (location.protocol === 'file:' ? event.origin === 'null' : event.origin === location.origin)) receive(event.data);
    };
    window.addEventListener('message', message);
    const request = () => {
      const packet = { type: 'request', id };
      channel?.postMessage(packet);
      if (window.opener && !window.opener.closed) window.opener.postMessage(packet, targetOrigin());
    };
    request();
    const timer = setInterval(() => setView(projectDisplay(snapshot.current, Date.now())), 100);
    const retry = setInterval(request, 3000);
    return () => { clearInterval(timer); clearInterval(retry); channel?.close(); window.removeEventListener('message', message); };
  }, [id]);
  return view;
}
