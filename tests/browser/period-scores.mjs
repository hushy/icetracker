import assert from 'node:assert/strict';
import {createGame, defaultSettings} from '../../src/scoreboard/clock.js';
import {openBoard, openPublicScreen} from './harness.mjs';

export const name = 'per-period scores clear on both screens without a sheet mismatch';
export default async function run(browser, url) {
  const game = createGame({...defaultSettings, language: 'fr', home: 'Paris', away: 'Amiens', periodMinutes: 1});
  const {page, errors} = await openBoard(browser, url, game);
  const display = await openPublicScreen(page, 'Écran public');
  display.on('pageerror', error => errors.push(error.message));

  await page.getByRole('button', {name: 'Configuration', exact: true}).click();
  await page.getByText('Options du match', {exact: true}).click();
  await page.getByRole('checkbox', {name: 'RAZ du score à chaque période'}).check();
  await page.getByRole('button', {name: 'Enregistrer', exact: true}).click();

  const goal = async team => {
    await page.getByRole('button', {name: `But · ${team}`, exact: true}).click();
    await page.getByRole('checkbox', {name: 'Aucune assistance'}).check();
    await page.getByRole('button', {name: 'Valider le but', exact: true}).click();
  };
  await goal('Paris');
  await goal('Amiens');
  assert.deepEqual(await page.locator('.score').allInnerTexts(), ['1', '1'], 'period 1 score');

  await page.getByRole('button', {name: 'Période suivante', exact: true}).first().click();
  assert.ok((await page.locator('.ice-modal').innerText()).includes('le score repart à 0 – 0'), 'the dialog announces the reset');
  await page.getByRole('button', {name: 'Période suivante', exact: true}).last().click();
  await page.waitForTimeout(400);
  assert.deepEqual(await page.locator('.score').allInnerTexts(), ['0', '0'], 'score cleared for period 2');
  assert.deepEqual(await display.locator('.score').allInnerTexts(), ['0', '0'], 'public screen cleared too');

  await goal('Paris');
  await page.getByRole('button', {name: 'Feuille de match', exact: true}).first().click();
  assert.ok((await page.locator('.sheet-score').innerText()).includes('Score de la période 2'), 'the sheet names the period score');
  await page.getByRole('button', {name: /À compléter/}).click();
  const review = await page.locator('.review-list').innerText();
  assert.ok(!/ne correspond pas aux buts/.test(review), `the reset is not a score mismatch: ${review}`);

  await page.getByRole('button', {name: 'Aperçu / export', exact: true}).click();
  const totals = (await page.locator('.match-report').innerText()).split('\n').filter(line => /^(1|2|Total)\t/.test(line));
  assert.ok(totals.some(line => /^1\t1 \/ 1/.test(line)), 'period 1 keeps 1-1');
  assert.ok(totals.some(line => /^2\t1 \/ 0/.test(line)), 'period 2 shows 1-0');
  assert.ok(totals.some(line => /^Total\t2 \/ 1/.test(line)), 'the sheet still totals the match');

  assert.deepEqual(errors, [], 'no page errors');
  await page.close();
}
