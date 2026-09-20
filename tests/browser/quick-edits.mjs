import assert from 'node:assert/strict';
import {createGame, defaultSettings} from '../../src/scoreboard/clock.js';
import {openBoard, openPublicScreen} from './harness.mjs';

export const name = 'quick edits keep live clocks, team names and language synchronized';
const clockSeconds = text => {
  const [minutes, seconds] = text.split(':').map(Number);
  return minutes * 60 + seconds;
};

export default async function run(browser, url) {
  const game = createGame({...defaultSettings, language: 'en', autoPauseOnGoalPenalty: true,
    home: 'Paris', away: 'Amiens', periodMinutes: 1});
  const {page, errors} = await openBoard(browser, url, game);
  const display = await openPublicScreen(page, 'Public screen');
  display.on('pageerror', error => errors.push(error.message));

  // The wall receives the clock and scores but no operator-only edit controls.
  assert.equal(await display.locator('.clock-edit').count(), 0, 'public screen has no clock edit');
  assert.equal(await display.locator('.transport').count(), 0, 'public screen has no transport controls');

  await page.getByRole('button', {name: 'Resume', exact: true}).click();
  await page.waitForTimeout(1100);
  const afterStart = await page.locator('.game-clock').innerText();

  // Opening and cancelling an edit leaves the live clock running.
  await page.getByRole('button', {name: 'Edit clock & period', exact: true}).click();
  await page.getByRole('button', {name: 'Cancel', exact: true}).click();
  await page.waitForTimeout(1100);
  assert.equal(await page.locator('.clock-toggle.pause').count(), 1, 'cancel keeps operator clock running');
  assert.notEqual(await page.locator('.game-clock').innerText(), afterStart, 'cancelled edit does not freeze the clock');

  // Saving without changing the duration also keeps it live.
  const beforeSave = await page.locator('.game-clock').innerText();
  await page.getByRole('button', {name: 'Edit clock & period', exact: true}).click();
  await page.waitForTimeout(1300);
  await page.getByRole('button', {name: 'Save clock', exact: true}).click();
  await page.waitForTimeout(300);
  assert.equal(await page.locator('.clock-toggle.pause').count(), 1, 'unchanged save keeps operator clock running');
  assert.equal(await display.locator('.public-clock-state.live').count(), 1, 'unchanged save keeps public clock live');
  assert.ok(clockSeconds(await page.locator('.game-clock').innerText()) < clockSeconds(beforeSave) || beforeSave === '00:00',
    `unchanged save used the current live time (${beforeSave})`);

  // A duration correction applies immediately and continues counting down.
  await page.getByRole('button', {name: 'Edit clock & period', exact: true}).click();
  await page.getByLabel('Time remaining (MM:SS)', {exact: true}).fill('00:40');
  await page.getByRole('button', {name: 'Save clock', exact: true}).click();
  await page.waitForTimeout(1400);
  const corrected = await page.locator('.game-clock').innerText();
  assert.match(corrected, /^00:3\d$/, `duration correction applied while live: ${corrected}`);

  // Editing only the period never rewinds the live duration.
  await page.getByRole('button', {name: 'Edit clock & period', exact: true}).click();
  const beforePeriod = await page.locator('.game-clock').innerText();
  await page.getByLabel('Period', {exact: true}).fill('2');
  await page.getByRole('button', {name: 'Save clock', exact: true}).click();
  await page.waitForTimeout(400);
  const afterPeriod = await page.locator('.game-clock').innerText();
  assert.notEqual(afterPeriod, '01:00', 'period edit does not rewind to the configured period');
  assert.equal(await page.locator('.clock-toggle.pause').count(), 1, 'period edit keeps play live');
  assert.ok(afterPeriod <= beforePeriod || beforePeriod === '00:00', `period edit continues from ${beforePeriod} to ${afterPeriod}`);

  // Team quick edit updates the wall without stopping play.
  const homeEdit = page.locator('.team-panel.home button[aria-label*="Edit"]');
  assert.equal(await homeEdit.count(), 1, 'home team exposes an operator edit');
  await homeEdit.click();
  await page.getByLabel('Team / alliance name', {exact: true}).fill('North Stars');
  await page.getByRole('button', {name: 'Save team', exact: true}).click();
  await display.locator('.team-panel.home h2').filter({hasText: 'North Stars'}).waitFor();
  assert.equal(await page.locator('.clock-toggle.pause').count(), 1, 'team edit keeps operator clock running');

  // Language changes are also live settings and survive a reload.
  await page.locator('.language-toggle').click();
  assert.match(await page.locator('.language-toggle').innerText(), /FR$/);
  assert.equal(await page.locator('.clock-toggle.pause').count(), 1, 'language toggle keeps operator clock running');
  await display.waitForFunction(() => document.documentElement.lang === 'fr');
  assert.equal(await display.locator('.clock-edit').count(), 0, 'public screen stays read-only after language update');
  // Open a fresh context with the saved storage: the harness seeds the first
  // page on every navigation, so a normal reload would overwrite the value.
  const persistedStorage = await page.evaluate(() => localStorage.getItem('icetracker-scoreboard-v1'));
  const reloadedContext = await page.context().browser().newContext();
  await reloadedContext.addInitScript(saved => localStorage.setItem('icetracker-scoreboard-v1', saved), persistedStorage);
  const reloaded = await reloadedContext.newPage();
  reloaded.on('pageerror', error => errors.push(error.message));
  await reloaded.goto(url);
  await reloaded.waitForSelector('.game-clock');
  const persistedLanguage = await reloaded.locator('.language-toggle').innerText();
  assert.match(persistedLanguage, /FR$/, `language persists after reload: ${persistedLanguage}`);
  await reloadedContext.close();

  for (const viewport of [{width: 1366, height: 768}, {width: 390, height: 844}]) {
    await page.setViewportSize(viewport);
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
      `operator page has no horizontal overflow at ${viewport.width}px`);
    const toolbarTextFits = await page.locator('.toolbar-actions button').evaluateAll(buttons =>
      buttons.every(button => button.scrollWidth <= button.clientWidth + 1));
    assert.equal(toolbarTextFits, true, `toolbar labels fit at ${viewport.width}px`);
    const transport = page.locator('.transport');
    await transport.scrollIntoViewIfNeeded();
    const transportBox = await transport.boundingBox();
    assert.ok(transportBox && transportBox.width > 0 && transportBox.height > 0,
      `transport remains visible at ${viewport.width}px`);
  }
  assert.deepEqual(errors, [], 'no page errors');
  await display.close();
  await page.close();
}
