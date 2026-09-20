import {launch, previewUrl} from './harness.mjs';
import * as entryError from './entry-error.mjs';
import * as periodScores from './period-scores.mjs';
import * as publicClock from './public-clock.mjs';
import * as quickEdits from './quick-edits.mjs';
import * as configuration from './configuration.mjs';

const url = await previewUrl();
const browser = await launch();
let failed = 0;
for (const scenario of [entryError, periodScores, publicClock, quickEdits, configuration]) {
  try {
    await scenario.default(browser, url);
    console.log(`PASS ${scenario.name}`);
  } catch (error) {
    failed++;
    console.error(`FAIL ${scenario.name}\n${error.stack}`);
  }
}
await browser.close();
process.exit(failed ? 1 : 0);
