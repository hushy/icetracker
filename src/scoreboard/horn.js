import icebreakerUrl from './assets/audio/icebreaker.mp3?inline';
import industrialUrl from './assets/audio/industrial.mp3?inline';
import echoUrl from './assets/audio/echo.mp3?inline';
import { DEFAULT_HORN, normalizeHorn } from './horn-options.js';
const sources = { icebreaker: icebreakerUrl, industrial: industrialUrl, echo: echoUrl };
let context;
const buffers = new Map();
let active;
let playbackRequest = 0;
async function loadHorn(sound) {
  const id = normalizeHorn(sound);
  if (!buffers.has(id)) {
    buffers.set(id, fetch(sources[id]).then(response => {
      if (!response.ok) throw new Error('Audio load failed');
      return response.arrayBuffer();
    }).then(bytes => context.decodeAudioData(bytes)).catch(error => {
      buffers.delete(id); throw error;
    }));
  }
  return buffers.get(id);
}
export async function unlockAudio(sound = DEFAULT_HORN) {
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  if (!AudioContext) throw new Error('Audio is not supported in this browser.');
  context ||= new AudioContext();
  if (context.state !== 'running') await context.resume();
  if (context.state !== 'running') throw new Error('Tap Test horn to enable sound.');
  loadHorn(sound).catch(() => {});
}
export async function playHorn(volume, duration = 3.2, sound = DEFAULT_HORN) {
  const request = ++playbackRequest;
  if (active) { try { active.stop(); } catch { /* Already ended. */ } active = null; }
  if (volume === 0) return;
  await unlockAudio(sound);
  const sample = await loadHorn(sound);
  if (request !== playbackRequest) return;
  const start = context.currentTime;
  const length = Math.min(duration, sample.duration);
  const gain = context.createGain();
  gain.gain.setValueAtTime(0, start);
  gain.gain.linearRampToValueAtTime(Math.max(0, Math.min(100, volume)) / 100, start + 0.02);
  gain.gain.setValueAtTime(Math.max(0, Math.min(100, volume)) / 100, start + Math.max(0.02, length - 0.1));
  gain.gain.linearRampToValueAtTime(0, start + length);
  gain.connect(context.destination);
  const source = context.createBufferSource();
  source.buffer = sample;
  source.connect(gain);
  source.onended = () => { source.disconnect(); gain.disconnect(); if (active === source) active = null; };
  active = source;
  source.start(start);
  source.stop(start + length);
}
