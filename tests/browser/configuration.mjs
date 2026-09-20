import assert from 'node:assert/strict';
import {createGame, defaultSettings} from '../../src/scoreboard/clock.js';
import {openBoard, openPublicScreen} from './harness.mjs';

export const name = 'configuration stays live, keeps junior controls and applies presets only on commit';

const modal = page => page.locator('.ice-modal');
const openDisclosure = async (dialog, pattern) => {
  const details = dialog.locator('details').filter({hasText: pattern}).first();
  if (await details.count() && await details.locator('summary').count()) {
    const open = await details.getAttribute('open');
    if (open === null) await details.locator('summary').click();
  }
};

export default async function run(browser, url) {
  const game = createGame({...defaultSettings, language: 'en', home: 'Paris', away: 'Amiens', periodMinutes: 1,
    shiftEnabled: true, shiftSeconds: 45});
  const {page, errors} = await openBoard(browser, url, game);
  const display = await openPublicScreen(page, 'Public screen');
  display.on('pageerror', error => errors.push(error.message));

  // Configuration replaced the operator tools/fullscreen controls; fullscreen remains public-only.
  assert.equal(await page.getByRole('button', {name: 'Tools', exact: true}).count(), 0);
  assert.equal(await page.getByRole('button', {name: 'Fullscreen', exact: true}).count(), 0);
  assert.equal(await page.getByRole('button', {name: 'Configuration', exact: true}).count(), 1);
  assert.equal(await display.getByRole('button', {name: 'Fullscreen', exact: true}).count(), 1);

  await page.getByRole('button', {name: 'Resume', exact: true}).click();
  await page.waitForTimeout(1100);
  const before = await page.locator('.game-clock').innerText();

  // Entering and cancelling setup leaves active play alone.
  await page.getByRole('button', {name: 'Configuration', exact: true}).click();
  assert.equal(await page.locator('.clock-toggle.pause').count(), 1, 'configuration entry keeps play live');
  const setup = modal(page);
  assert.equal(await setup.getByRole('button', {name: 'Horn sound', exact: true}).count(), 0, 'fixed horn has no sound selector');
  assert.equal(await setup.getByLabel(/Horn volume|Volume of the horn/i).count(), 0, 'fixed horn has no volume control');
  assert.equal(await setup.getByLabel('Background image', {exact: true}).count(), 0, 'background image control is removed');
  assert.equal(await setup.getByLabel('Theme', {exact: true}).count(), 0, 'theme control is removed');
  await openDisclosure(setup, /Horn.*junior|junior.*shift/i);
  assert.ok(await setup.getByLabel('Automatic junior shift horn', {exact: true}).count(), 'junior shift toggle retained');
  assert.ok(await setup.getByLabel('Shift interval (seconds)', {exact: true}).count(), 'junior shift interval retained');
  await setup.getByRole('button', {name: 'Cancel', exact: true}).click();
  await page.waitForTimeout(1100);
  assert.equal(await page.locator('.clock-toggle.pause').count(), 1, 'cancel keeps play live');
  assert.notEqual(await page.locator('.game-clock').innerText(), before, 'cancel does not rewind the clock');

  // Saving setup also keeps play live.
  await page.getByRole('button', {name: 'Configuration', exact: true}).click();
  await page.waitForTimeout(1100);
  await modal(page).getByRole('button', {name: 'Save setup', exact: true}).click();
  assert.equal(await page.locator('.clock-toggle.pause').count(), 1, 'saved setup keeps play live');

  // A legacy preset with a custom horn is accepted as configuration data but cannot
  // bring back the removed sound/volume settings.
  await page.evaluate(() => localStorage.setItem('icetracker-presets-v1', JSON.stringify([
    {id:'legacy', name:'Legacy custom horn', settings:{periodMinutes:5, periods:3, breakMinutes:6,
      shiftEnabled:true, shiftSeconds:50, hornSound:'icebreaker', volume:12}}
  ])));

  // New-game configuration is also a draft: canceling it leaves the live match alone.
  await page.getByRole('button', {name: 'New game', exact: true}).click();
  await page.getByRole('button', {name: 'Configure game', exact: true}).click();
  assert.equal(await page.locator('.clock-toggle.pause').count(), 1, 'new-game configuration entry keeps play live');
  const nextSetup = modal(page);
  await openDisclosure(nextSetup, /Saved configuration|Match preset|Configuration/i);
  const configuration = nextSetup.getByLabel('Configuration', {exact: true});
  await configuration.selectOption('legacy');
  await nextSetup.getByRole('button', {name: 'Apply', exact: true}).click();
  assert.equal(await nextSetup.getByLabel('Period length (minutes)', {exact: true}).inputValue(), '5', 'preset updates new-game draft');
  assert.equal(await nextSetup.getByLabel('Horn sound', {exact: true}).count(), 0, 'preset cannot restore horn selector');
  assert.equal(await nextSetup.getByLabel(/Horn volume|Volume of the horn/i).count(), 0, 'preset cannot restore volume control');
  await nextSetup.getByRole('button', {name: 'Cancel', exact: true}).click();
  await page.getByRole('button', {name: 'Cancel', exact: true}).click();
  await page.waitForTimeout(400);
  assert.equal(await page.locator('.clock-toggle.pause').count(), 1, 'cancelled new-game draft keeps play live');

  // Applying the same draft and pressing Start is the commit point.
  await page.getByRole('button', {name: 'New game', exact: true}).click();
  await page.getByRole('button', {name: 'Configure game', exact: true}).click();
  const committedSetup = modal(page);
  await openDisclosure(committedSetup, /Saved configuration|Match preset|Configuration/i);
  await committedSetup.getByLabel('Configuration', {exact: true}).selectOption('legacy');
  await committedSetup.getByRole('button', {name: 'Apply', exact: true}).click();
  await committedSetup.getByRole('button', {name: 'Start new game', exact: true}).click();
  await page.waitForTimeout(400);
  assert.equal(await page.locator('.clock-toggle').innerText(), 'Resume', 'starting new game commits and pauses');
  assert.equal(await page.locator('.game-clock').innerText(), '05:00', 'starting new game commits preset duration');
  assert.equal(await page.locator('.clock-edit').count(), 1, 'operator clock edit remains available');

  assert.deepEqual(errors, [], 'no page errors');
  await display.close();
  await page.close();
}
