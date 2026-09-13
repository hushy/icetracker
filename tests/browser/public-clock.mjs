import assert from 'node:assert/strict';
import {createGame, defaultSettings} from '../../src/scoreboard/clock.js';
import {openBoard, openPublicScreen} from './harness.mjs';

export const name = 'public screen states the clock with one glyph under a full-width header';
export default async function run(browser, url) {
  const game = {...createGame({...defaultSettings, language: 'fr', home: 'Paris', away: 'Amiens'}),
    pauseStartedAt: Date.now() - 125000};
  const {page, errors} = await openBoard(browser, url, game, {width: 1366, height: 768});

  // The operator keeps the counter and its escalation; that is an operator tool.
  await page.waitForSelector('.pause-level-3');
  assert.match(await page.locator('.pause-warning').innerText(), /Chrono en pause depuis 12\d secondes/);

  const display = await openPublicScreen(page, 'Écran public');
  display.on('pageerror', error => errors.push(error.message));
  await display.setViewportSize({width: 1920, height: 1080});
  await display.waitForSelector('.public-clock-state.paused');
  assert.equal(await display.locator('.pause-warning').count(), 0, 'no pause counter on the wall');
  assert.equal(await display.locator('.clock-live').count(), 0, 'no LIVE badge on the wall');
  await page.getByRole('button', {name: 'Reprendre', exact: true}).click();
  await display.waitForSelector('.public-clock-state.live');
  await page.getByRole('button', {name: 'Pause', exact: true}).click();
  await display.waitForSelector('.public-clock-state.paused');

  // The clock is a header across the wall, not a column taking a third of it.
  const [grid, clock, home, away] = await Promise.all(
    ['.board-grid', '.clock-panel', '.team-panel.home', '.team-panel.away']
      .map(selector => display.locator(selector).boundingBox()));
  assert.ok(clock.width > grid.width * 0.9, `the clock header spans the wall: ${clock.width} of ${grid.width}`);
  assert.ok(home.y >= clock.y + clock.height - 1 && away.y >= clock.y + clock.height - 1, 'both teams sit under the header');
  assert.ok(Math.abs(home.y - away.y) < 2, 'the teams share one row');
  const fontSize = selector => display.locator(selector).evaluate(el => parseFloat(getComputedStyle(el).fontSize));
  assert.ok(await fontSize('.team-panel.home .score') >= 160, 'the score is sized for a wall');
  assert.ok(await fontSize('.game-clock') >= 140, 'the clock is sized for a wall');

  assert.deepEqual(errors, [], 'no page errors');
  await page.close();
}
