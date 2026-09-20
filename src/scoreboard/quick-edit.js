import { periodLength } from './match-report.js';

const MAX_CLOCK_MS = 5999000;

const validDuration = value => Number.isFinite(value) && Number.isInteger(value) && value >= 0 && value <= MAX_CLOCK_MS;
const validPeriod = value => Number.isFinite(value) && Number.isInteger(value) && value >= 1 && value <= 99;

/**
 * Applies an operator's small clock correction without changing unrelated live state.
 * The caller must give this the latest synced game, rather than a dialog snapshot.
 */
export function applyClockEdit(game, patch = {}) {
  const hasRemaining = Object.prototype.hasOwnProperty.call(patch, 'remainingMs');
  const hasPeriod = Object.prototype.hasOwnProperty.call(patch, 'period');
  if (!hasRemaining && !hasPeriod) return game;

  if (game.auxiliary) {
    // A break/timeout owns the visible clock. Its period is deliberately not editable.
    if (!hasRemaining) return game;
    const maximum = game.auxiliary.kind === 'timeout' ? 30000 : 5940000;
    if (!validDuration(patch.remainingMs) || patch.remainingMs > maximum) return game;
    const remainingMs = patch.remainingMs;
    if (remainingMs === game.auxiliary.remainingMs) return game;
    return {
      ...game,
      auxiliary: { ...game.auxiliary, remainingMs, running: game.auxiliary.running && remainingMs > 0 }
    };
  }

  if ((hasRemaining && !validDuration(patch.remainingMs)) || (hasPeriod && !validPeriod(patch.period))) return game;
  const remainingMs = hasRemaining ? patch.remainingMs : game.remainingMs;
  const period = hasPeriod ? patch.period : game.period;
  if (remainingMs === game.remainingMs && period === game.period) return game;
  const savedLength = periodLength(game, period) ?? game.settings.periodMinutes * 60000;
  const length = Math.max(remainingMs, savedLength);
  return {
    ...game,
    remainingMs,
    period,
    periodElapsedMs: Math.max(0, savedLength - remainingMs),
    periodLengths: { ...game.periodLengths, [period]: length },
    // A correction never starts a stopped clock; setting it to zero always stops it.
    running: remainingMs > 0 ? game.running : false
  };
}
