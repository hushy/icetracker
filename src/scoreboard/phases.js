export function isClockRunning(game) {
  return game.auxiliary ? game.auxiliary.running : game.running;
}
export function startBreak(game, minutes) {
  if (game.auxiliary || !Number.isFinite(minutes) || minutes < 1 || minutes > 99) return game;
  return { ...game, running: false, settings: { ...game.settings, breakMinutes: minutes },
    auxiliary: { kind: 'break', team: null, remainingMs: minutes * 60000, running: true } };
}
export function startTimeout(game, team) {
  if (!['home', 'away'].includes(team) || game.auxiliary || game.timeoutsUsed?.[team]) return game;
  return { ...game, running: false, timeoutsUsed: { ...game.timeoutsUsed, [team]: true },
    auxiliary: { kind: 'timeout', team, remainingMs: 30000, running: true } };
}
export function leaveAuxiliary(game) { return { ...game, auxiliary: null, running: false }; }
export function pauseClocks(game) {
  return { ...game, running: false, auxiliary: game.auxiliary ? { ...game.auxiliary, running: false } : null };
}
export function toggleActiveClock(game) {
  if (game.auxiliary) return { ...game, auxiliary: { ...game.auxiliary, running: game.auxiliary.remainingMs > 0 && !game.auxiliary.running } };
  return { ...game, running: game.remainingMs > 0 && !game.running };
}

export function prepareDialog(game, dialog) {
  if (dialog === 'note') return game;
  if (dialog === 'clock' || dialog === 'setup' || dialog === 'setup-new' || dialog?.editTeam) return game;
  // Correcting an entry error is bookkeeping: the clock never stops for it.
  if (dialog?.discard) return game;
  const goalOrPenalty = Boolean(dialog?.goalTeam || dialog?.removeGoalTeam || dialog?.release ||
    (typeof dialog === 'string' && dialog.startsWith('penalty-')));
  return goalOrPenalty && !game.settings.autoPauseOnGoalPenalty ? game : pauseClocks(game);
}

// Compatibility for previously saved integrations.
export const startWarmup=startBreak;
