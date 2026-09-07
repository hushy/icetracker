import {readFile, writeFile} from 'node:fs/promises';
import {chromium} from 'playwright-core';

// vite builds with base '/icetracker/', so dist/index.html cannot be opened over
// file://. Inlining the bundle gives the same page the operator downloads.
export async function previewUrl(dist = 'dist') {
  let page;
  try {
    page = await readFile(`${dist}/index.html`, 'utf8');
  } catch {
    throw new Error(`No ${dist}/index.html — run npm run build first.`);
  }
  const inline = async (pattern, wrap) => {
    for (const match of [...page.matchAll(pattern)]) {
      const asset = await readFile(`${dist}/assets/${match[1].split('/').pop()}`, 'utf8');
      // A function replacement: bundles contain $& and $` sequences that a string one would expand.
      page = page.replace(match[0], () => wrap(asset));
    }
  };
  await inline(/<script type="module" crossorigin src="([^"]+)"><\/script>/g,
    asset => `<script type="module">${asset.replaceAll('</script', '<\\/script')}</script>`);
  await inline(/<link rel="stylesheet" crossorigin href="([^"]+)">/g, asset => `<style>${asset}</style>`);
  await writeFile(`${dist}/preview.html`, page);
  return new URL(`${dist}/preview.html`, `file://${process.cwd()}/`).href;
}

// playwright-core ships no browser: use the one already installed on the machine.
const candidates = [
  process.env.CHROME_PATH,
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/Applications/Chromium.app/Contents/MacOS/Chromium',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium',
].filter(Boolean);
export async function launch() {
  const failures = [];
  for (const executablePath of candidates) {
    try { return await chromium.launch({executablePath, headless: true}); }
    catch (error) { failures.push(`${executablePath}: ${error.message.split('\n')[0]}`); }
  }
  throw new Error(`No usable Chrome. Set CHROME_PATH.\n${failures.join('\n')}`);
}

// Each scenario starts from a known match instead of clicking one together.
export async function openBoard(browser, url, game, viewport = {width: 1440, height: 900}) {
  const page = await browser.newPage({viewport});
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.addInitScript(saved => localStorage.setItem('icetracker-scoreboard-v1', JSON.stringify(saved)), game);
  await page.goto(url);
  await page.waitForSelector('.game-clock');
  return {page, errors};
}
export async function openPublicScreen(page, label) {
  const popup = page.waitForEvent('popup');
  await page.getByRole('button', {name: label, exact: true}).click();
  const display = await popup;
  await display.waitForSelector('.game-clock');
  return display;
}
