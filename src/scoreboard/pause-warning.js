// Wall-clock pause duration is shared with the public screen, independent of game time.
const active = game => game.auxiliary || game;
export function trackPause(before, after, now = Date.now()) {
  const clock = active(after);
  let pauseStartedAt = null;
  if (!clock.running && clock.remainingMs > 0) {
    const phaseChanged = before.period !== after.period || before.auxiliary?.kind !== after.auxiliary?.kind || before.auxiliary?.team !== after.auxiliary?.team;
    const continuing = !active(before).running && !phaseChanged;
    pauseStartedAt = continuing && Number.isFinite(after.pauseStartedAt) ? Math.min(after.pauseStartedAt, now) : now;
  }
  return after.pauseStartedAt === pauseStartedAt ? after : {...after, pauseStartedAt};
}
export function pauseWarning(game, now = Date.now()) {
  const clock = active(game);
  if (clock.running || clock.remainingMs <= 0) return null;
  const seconds = Number.isFinite(game.pauseStartedAt) ? Math.max(0, Math.floor((now-game.pauseStartedAt)/1000)) : 0;
  return {seconds,level:seconds>=120?3:seconds>=45?2:seconds>=15?1:0};
}
