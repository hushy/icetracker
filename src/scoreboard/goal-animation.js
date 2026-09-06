export const GOAL_ANIMATION_MS = 6000;
// The first snapshot is a baseline. Repeated heartbeats and score corrections
// must never replay a previously announced goal.
export function observeGoals(seen, goals = []) {
  const ids = goals.map(goal => goal.id);
  const fresh = seen === null ? [] : goals.filter(goal => !seen.has(goal.id));
  return { seen: new Set([...(seen || []), ...ids]), goal: fresh.at(-1)?.hideAnimation === true ? null : fresh.at(-1) || null };
}
