export const penaltyKinds = ['minor', 'bench', 'double', 'major', 'misconduct', 'custom'];
export function penaltyKind(row) {
  if (penaltyKinds.includes(row.kind)) return row.kind;
  return { '02:00': 'minor', '04:00': 'double', '05:00': 'major', '10:00': 'misconduct' }[row.label] || 'custom';
}
export const penaltyKindLabel = kind => ({minor:'Minor · 2 min',bench:'Bench minor',double:'Double minor · 2 + 2',major:'Major · 5 min',misconduct:'Misconduct · 10 min',custom:'Custom penalty'}[kind] || 'Custom penalty');
export const isStrengthPenalty = row => row.remainingMs > 0 && !row.coincidental && !row.deferred && penaltyKind(row) !== 'misconduct';
export function minorSegmentRemaining(row) {
  return penaltyKind(row) === 'double' && row.remainingMs > 120000 ? row.remainingMs - 120000 : row.remainingMs;
}
// IIHF 2026/27 rules 16.2, 17.2, 18.2, 19 and Appendix IV Table 12.
// Recommendations require recorded, non-coincidental time penalties. Officials
// remain responsible for special formats, announced/delayed calls and substitutions.
export function powerPlayRecommendation(game, scoringTeam, penaltyShot = false) {
  const defendingTeam = scoringTeam === 'home' ? 'away' : 'home';
  const result = {team:defendingTeam, candidates:[], reason:'No penalty ends on this goal.'};
  if (penaltyShot) return {...result,reason:'Penalty-shot goals do not release a player.'};
  if (game.auxiliary || game.period > game.settings.periods) return {...result,reason:'Confirm special-format or overtime penalty decisions with the referee.'};
  const own = game.penalties[scoringTeam].filter(isStrengthPenalty);
  const other = game.penalties[defendingTeam].filter(isStrengthPenalty);
  if ([...own,...other].some(row=>penaltyKind(row)==='custom' || (penaltyKind(row)==='double' && row.label!=='04:00')) || own.length>2 || other.length>2) return {...result,reason:'Penalty situation needs manual review.'};
  // Multiple simultaneous entries for one player may be sequential sanctions.
  for (const rows of [own,other]) {
    const players=rows.map(row=>row.player).filter(Boolean);
    if(new Set(players).size!==players.length) return {...result,reason:'Penalty situation needs manual review.'};
  }
  if (other.length <= own.length) return result;
  const eligible=other.filter(row=>['minor','bench','double'].includes(penaltyKind(row)));
  if (!eligible.length) return result;
  const shortest=Math.min(...eligible.map(minorSegmentRemaining));
  const candidates=eligible.filter(row=>Math.abs(minorSegmentRemaining(row)-shortest)<1).map(row=>({
    id:row.id,player:row.player,remainingMs:row.remainingMs,
    afterMs:penaltyKind(row)==='double'&&row.remainingMs>120000?120000:0,
  }));
  return {...result,candidates,reason:candidates.length>1?'Equal remaining times: follow the captain’s choice confirmed by the referee.':'The non-coincidental minor with the shortest active segment ends.'};
}
export function applyPowerPlayRelease(game, scoringTeam, id, penaltyShot = false) {
  const result=powerPlayRecommendation(game,scoringTeam,penaltyShot);
  const choice=result.candidates.find(candidate=>candidate.id===id);
  if(!choice) return game;
  return {...game,penalties:{...game.penalties,[result.team]:game.penalties[result.team].map(row=>row.id===id?{...row,remainingMs:choice.afterMs}:row)}};
}
// A penalty entered by mistake never happened: no notice, no clock change and no
// trace on the match sheet. Use it only for entry errors, not for a real release.
export function discardPenalty(game, team, id) {
  if(!game.penalties[team]?.some(row=>row.id===id)) return game;
  // An untouched events array must stay the same array: an empty new one reads as a new match.
  const events=(game.events||[]).filter(event=>event.penaltyId!==id);
  return {...game, discardedPenaltyIds:[...(game.discardedPenaltyIds||[]),id],
    penalties:{...game.penalties,[team]:game.penalties[team].filter(row=>row.id!==id)},
    ...(events.length===(game.events||[]).length?{}:{events})};
}
export function recordGoal(game, team, details = {}) {
  if(game.auxiliary || game.scores[team]>=999) return game;
  const event={id:details.id,team,period:game.period,remainingMs:game.remainingMs,...details.clock,assistsConfirmed:Boolean(details.assistsConfirmed || details.assist1 || details.assist2),scorer:details.scorer?.trim()||'',
    assists:[details.assist1,details.assist2].map(value=>value?.trim()||'').filter(Boolean),penaltyShot:Boolean(details.penaltyShot),hideAnimation:details.hideAnimation === true,releasedPenaltyId:details.releaseId||null};
  const changed=details.releaseId?applyPowerPlayRelease(game,team,details.releaseId,details.penaltyShot):game;
  return {...changed,running:game.settings.autoPauseOnGoalPenalty ? false : changed.running,scores:{...changed.scores,[team]:changed.scores[team]+1},goals:[...(changed.goals||[]),event]};
}
export function removeGoal(game, team) {
  if(game.scores[team]===0) return game;
  const goals=[...(game.goals||[])];
  // With per-period scoring the displayed score only counts this period's goals.
  const index=goals.findLastIndex(goal=>goal.team===team&&(!game.settings.resetScoresEachPeriod||goal.period===game.period));
  if(index<0&&game.settings.resetScoresEachPeriod) return game;
  if(index>=0)goals.splice(index,1);
  // Score corrections cannot silently reinstate a penalty after subsequent play.
  return {...game,scores:{...game.scores,[team]:game.scores[team]-1},goals};
}
