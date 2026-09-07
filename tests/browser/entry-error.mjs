import assert from 'node:assert/strict';
import {createGame, defaultSettings} from '../../src/scoreboard/clock.js';
import {openBoard, openPublicScreen} from './harness.mjs';

export const name = 'entry error stays silent; report times stay inside their period';
export default async function run(browser, url) {
  const game = createGame({...defaultSettings, language: 'en', home: 'Paris', away: 'Amiens'});
  game.penalties.away = [{id: 'oops', player: '18', label: '02:00', remainingMs: 120000, kind: 'minor',
    reason: 'tripping', assessedClock: {period: 1, remainingMs: 1200000, elapsedMs: 0, occurredAt: Date.now()}}];
  const {page, errors} = await openBoard(browser, url, game);
  const display = await openPublicScreen(page, 'Public screen');
  display.on('pageerror', error => errors.push(error.message));

  // An entry error never announces anything and never touches the clock.
  await page.getByRole('button', {name: 'Resume', exact: true}).click();
  await page.waitForTimeout(1200);
  const before = await display.locator('.game-clock').innerText();
  await page.getByRole('button', {name: /Remove the penalty entered by mistake for Amiens/}).click();
  await page.getByRole('button', {name: 'Remove entry error', exact: true}).click();
  await page.waitForTimeout(1200);
  assert.equal(await page.locator('.penalty-row').count(), 0, 'the penalty row is gone');
  assert.notEqual(await display.locator('.game-clock').innerText(), before, 'the clock kept running');
  assert.equal(await page.locator('.clock-toggle.pause').count(), 1, 'the clock is still running');
  assert.equal(await display.locator('.penalty-notice').count(), 0, 'nothing was announced');
  await page.getByRole('button', {name: 'Match sheet', exact: true}).first().click();
  await page.getByRole('checkbox', {name: 'Full journal'}).check();
  const journal = await page.locator('.event-table').innerText();
  assert.ok(!/Penalty/.test(journal), `no penalty trace left in the journal: ${journal}`);

  // A goal in each period: the second must not be timed from the start of the match.
  await page.getByRole('button', {name: 'Board', exact: true}).first().click();
  const goal = async scorer => {
    await page.getByRole('button', {name: 'Goal · Paris', exact: true}).click();
    await page.getByLabel('Scorer', {exact: true}).fill(scorer);
    await page.getByRole('checkbox', {name: 'No assists'}).check();
    await page.getByRole('button', {name: 'Confirm goal', exact: true}).click();
  };
  await goal('12');
  await page.getByRole('button', {name: 'Edit clock & period', exact: true}).click();
  await page.getByLabel('Time remaining (MM:SS)', {exact: true}).fill('00:00');
  await page.getByRole('button', {name: 'Save clock', exact: true}).click();
  await page.getByRole('button', {name: 'Next period', exact: true}).first().click();
  await page.getByRole('button', {name: 'Next period', exact: true}).last().click();
  await page.getByRole('button', {name: 'Resume', exact: true}).click();
  await page.waitForTimeout(3200);
  await goal('7');
  await page.getByRole('button', {name: 'Match sheet', exact: true}).first().click();
  await page.getByRole('button', {name: 'Preview / export', exact: true}).click();
  const report = await page.locator('.match-report').innerText();
  assert.ok(/period elapsed/i.test(report), 'the sheet labels the column Period elapsed');
  const second = report.split('\n').find(line => /^2\t2\t/.test(line));
  assert.ok(/\t00:0[0-9]\t/.test(second), `the period 2 goal is timed inside its period: ${second}`);
  assert.ok(!/19:5|20:0/.test(report), 'no cumulative match time is left on the sheet');

  assert.deepEqual(errors, [], 'no page errors');
  await page.close();
}
