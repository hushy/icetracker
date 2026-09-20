import industrialUrl from './assets/audio/industrial.mp3?inline';
import { HORN_VOLUME } from './horn-options.js';
let context;
const buffers = new Map();
let active;
let playbackRequest = 0;
async function loadHorn() {
  if (!buffers.has('industrial')) {
    buffers.set('industrial', fetch(industrialUrl).then(response => {
      if (!response.ok) throw new Error('Audio load failed');
      return response.arrayBuffer();
    }).then(bytes => context.decodeAudioData(bytes)).catch(error => {
      buffers.delete('industrial'); throw error;
    }));
  }
  return buffers.get('industrial');
}
export async function unlockAudio() {
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  if (!AudioContext) throw new Error('Audio is not supported in this browser.');
  context ||= new AudioContext();
  if (context.state !== 'running') await context.resume();
  if (context.state !== 'running') throw new Error('Tap Test horn to enable sound.');
  loadHorn().catch(() => {});
}
export async function playHorn(_volume, duration = 3.2) {
  const request = ++playbackRequest;
  if (active) { try { active.stop(); } catch { /* Already ended. */ } active = null; }
  await unlockAudio();
  const sample = await loadHorn();
  if (request !== playbackRequest) return;
  const start = context.currentTime;
  const length = Math.min(duration, sample.duration);
  const gain = context.createGain();
  gain.gain.setValueAtTime(0, start);
  gain.gain.linearRampToValueAtTime(HORN_VOLUME / 100, start + 0.02);
  gain.gain.setValueAtTime(HORN_VOLUME / 100, start + Math.max(0.02, length - 0.1));
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
