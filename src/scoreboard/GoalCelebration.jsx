import React from 'react';
import { translator } from './i18n.js';
import { teamDisplayName } from './youth.js';
import { clubLogo } from './teams.js';

export default function GoalCelebration({ goal, settings }) {
  const t = translator(settings.language);
  const logo = clubLogo(settings, goal.team);
  return <div className={`goal-celebration ${goal.team}`} role="status" aria-live="polite" aria-atomic="true">
    <div className="goal-celebration-card">
      {logo && <img className="goal-celebration-logo" src={logo} alt="" />}
      <p className="goal-celebration-team">{teamDisplayName(settings, goal.team, t)}</p>
      <h1>{t('GOAL!')}</h1>
      {goal.scorer && <div className="goal-celebration-scorer"><span>{t('Scorer')}</span><strong>#{goal.scorer}</strong></div>}
      {goal.assists?.length > 0 && <div className="goal-celebration-assists"><span>{t('Assists')}</span><strong>{goal.assists.map(player => `#${player}`).join(' · ')}</strong></div>}
    </div>
  </div>;
}
