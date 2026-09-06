import { advanceGame, restoreGame } from './clock.js';
import { pauseClocks } from './phases.js';
export const DISPLAY_TIMEOUT_MS = 4000;
export function readDisplaySnapshot(packet, previous) {
  if (!packet || packet.type !== 'state' || !Number.isFinite(packet.sentAt) || typeof packet.game?.running !== 'boolean') return null;
  try {
  const merged = { ...packet.game, settings: packet.game.settings || previous?.game.settings };
  const game = restoreGame(JSON.stringify(merged));
  return game ? { game: { ...game, running: packet.game.running, auxiliary: game.auxiliary ? {...game.auxiliary,running:packet.game.auxiliary.running} : null }, sentAt: packet.sentAt } : null;
  } catch { return null; }
}
export function projectDisplay(snapshot, now) {
  if (!snapshot) return null;
  const elapsed = Math.max(0, now - snapshot.sentAt);
  const disconnected = elapsed > DISPLAY_TIMEOUT_MS;
  const { game } = advanceGame(snapshot.game, Math.min(elapsed, DISPLAY_TIMEOUT_MS));
  return { game: disconnected ? pauseClocks(game) : game, disconnected };
}
