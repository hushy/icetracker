# IceTracker

A touchscreen-friendly static hockey scoreboard for GitHub Pages, with French/English UI and synchronized operator/public windows. No backend or account is required.

## Operator workflow

The main **Scoreboard** keeps scores, penalties, clock and period controls together. **Match sheet** contains the event journal and editing/export actions. The simplified header contains undo, public screen, fullscreen and **Tools**. Tools groups game setup, presets, language and device options.

- Choose clubs and categories, set period length/count and test the horn in **Tools → Game setup**.
- The selector includes 39 FFHG Nord-Est clubs with bundled logos and city/name search, including Amiens, Rouen and Caen. U7–U20 category labels remain independent; squad/alliance names are editable. These are club presets, not a verified list of every season's competition entries.
- Default Français Volants navy/white theme, neutral alternative, and uploaded team/background images up to 1 MB each.
- Game time, penalties and junior shifts advance together. Pause/resume with the large control or Space outside a control/dialog. Paused countdowns show a red warning, animated unless reduced motion is requested.
- Goal and penalty entry do not pause by default. **Auto pause on goal/penalty** in setup is opt-in. Other clock/setup/phase dialogs pause explicitly. Confirming a penalty starts it if play is running, unless it is marked waiting.
- A goal accepts an optional scorer and up to two optional assists. Confirmation updates the score. **Hide goal animation** suppresses the six-second public announcement for that goal only.
- **Break** is a general countdown before a game or between periods, replacing Warm-up. Match, penalty and shift clocks freeze during it. Return to the paused match explicitly. Old warm-up saves migrate to Break.
- Each team has one confirmed 30-second timeout per game. It stays used across periods/refreshes; a new game resets it.
- Period end freezes clocks and can sound a horn. Next period retains scores/penalties and resets game/shift clocks paused. Overtime duration follows the period setting unless manually edited.

## Undo, event corrections and presets

**Undo** restores the full state immediately before the last operator action, including scores, penalties, events, settings and clocks. Confirmation shows the score and saved clock. Restoration always pauses both match and auxiliary clocks. One undo is available in the current session; timer ticks and opening utility dialogs do not replace it. There is no redo. Undoing a goal also restores a penalty that the goal ended.

The match sheet records goals, assists, penalty transitions, clock pause/resume/corrections, period changes, breaks and timeouts. Rows carry period, elapsed time within that period, remaining time and local event time. Old events lacking timestamps show a dash.

**Edit** corrects an event's period/times and player details. Goal corrections also update linked goal details without changing the score or live clock. Penalty-row edits correct the journal, not an active penalty timer. Live decisions remain under operator control. Edits do not replay goal animations.

**CSV** downloads the score and journal in a UTF-8, semicolon-separated file, with spreadsheet-formula protection. **Print / PDF** opens browser printing; choose Save as PDF for a landscape A4 match sheet. The print layout includes score and events and removes operator controls. This uses the browser's PDF output, not a separate PDF download service.

**Tools → Match presets** saves named period, break, horn and auto-pause settings locally. Presets do not contain team rosters, images or live game state. Applying one keeps the current score and clock; period duration applies to the next period/new game. Delete saved presets in the same window.

## Two screens, no backend

Open **Public screen**, move the new window to the second monitor, then use fullscreen. It shares the board's logos/background and penalties, but has no editing controls. Operator dialogs and match-sheet navigation never replace the public board. Audio plays only in the operator window.

BroadcastChannel synchronizes windows on the same origin, with opener/postMessage fallback for the standalone file preview. Heartbeats run twice per second; the public display interpolates time. After four seconds without contact it freezes with a warning. Use one operator tab per game. This is not remote sharing across devices, browser profiles or private windows.

## Offline and screen wake lock

Production builds generate a versioned service worker and precache HTML, JavaScript, CSS and the bundled logos/sounds. Open the hosted HTTPS site online once and wait for **Ready for offline use** in Tools before relying on offline reopening. Cached operator and public URLs work offline. New versions activate after existing windows close, avoiding forced mid-game updates. Browser storage eviction/clearing can remove the offline cache.

The standalone file preview includes its artwork and audio, but cannot install the hosted service worker; Tools reports this separately. Development mode also does not register it. GitHub Pages or localhost is required for service-worker operation.

**Keep screen awake** is enabled by default (including migration from the previous default-off version). An explicit subsequent opt-out is saved. The option in Tools requests a screen wake lock on supported browsers for operator and public views. It is reacquired when a visible page returns, and released when disabled. Tools shows whether it is active or unavailable. Browser/OS decisions can release it; no wake-lock or audio guarantee is made during OS sleep.

State and images save locally under `icetracker-scoreboard-v1`, independently of the old statistics app. Refresh restores paused and does not count closed-page time. Presets use `icetracker-presets-v1`. Storage failures are reported; keeping the page open lets the current game continue.

## Audio and penalties

Three bundled CC0 alternatives: deep ship horn (default), industrial horn and short echo horn. Manual horn, period/break/timeout-end horn and optional junior-shift horn with 5–600 second intervals. Volume and sound test are in setup. Keep the page visible and test device audio before play. Delayed shift horns are not replayed in a burst. Prior crowd/synth choices migrate to the deep horn.

Penalty presets include minor, double minor, major and misconduct, with custom type/duration. Waiting timers start manually; mark coincidental sanctions only when officials confirm no strength reduction.

After a power-play goal, the app proposes an eligible minor/bench-minor change and requires operator confirmation. The shortest active minor segment is selected; double-minor first segments leave two minutes. Equal expiry times require the captain's choice confirmed by the referee. Major, misconduct, coincidental and penalty-shot cases do not yield an eligible release. Overtime, custom/nonstandard sanctions and complex recorded situations require manual review. The app does not infer goalkeeper substitutions, delayed calls or special youth formats.

The [FFHG rules page](https://www.hockeyfrance.com/presentation/documentation/regles-de-jeu/) refers to IIHF rules. Implementation follows classical [IIHF 2026/27 rules](https://blob.iihf.com/iihf-media/iihfmvc/media/downloads/rule%20book/2026-27_iihf_rule_book.pdf), rules 16–19, Appendix IV Table 12, and rule 87.1 for timeouts; experimental Appendix VII changes are not applied.

## Run and publish

Use Node 22 or newer:

```sh
npm ci
npm run dev
npm run test:scoreboard
npm run build
npm run preview
```

Development URL: http://localhost:3000/icetracker/. Build outputs `dist/`, including `sw.js`. Scoreboard tests use Node's built-in runner. Original statistics/voice Vitest files are preserved, but their undeclared dependencies are outside the scoreboard checks.

Push the source to `hushy/icetracker` main and select **Settings → Pages → Source → GitHub Actions**. The included workflow tests, builds and deploys. Vite's base is `/icetracker/`; the deployed URL is https://hushy.github.io/icetracker/. See [GitHub Pages workflow documentation](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages).

Original player statistics remain at `?mode=stats`, voice debug at `?debug=voice`. See [README-STATS.md](README-STATS.md). These preserved integrations are not guaranteed offline. Club and audio sources are in [ASSETS.md](ASSETS.md).

## Compact display

Board and match sheet use the viewport height. Main game controls remain fixed while long penalty lists or event rows scroll inside their panels. The board uses plus/minus score controls, a plus-only penalty button, a full period label and separate Edit button above the clock, and a fully labelled timeout control below each team score, separate from the penalties. Icon actions have accessible names and tooltips. Optional penalty settings are collapsed in the form; a proposed power-play release opens its review automatically. Buteur/assist numbers share one compact row. The main view omits redundant clock labels and the footer.

Ambiguous actions retain text labels: undo, public screen, tools, fullscreen, horn, next period, penalty release/clear and shift restart. Plus/minus remain icon-only where the score or penalty heading supplies the context.

## Penalty reasons and announcements

Penalty entry includes an optional reason selector (17 common choices, including Other). Reasons are descriptive and never choose the duration or sanction type automatically. The labels follow common infractions in the [French IIHF rulebook linked by FFHG](https://www.hockeyfrance.com/wp-content/uploads/2026/07/2026-27_IIHF_Rulebook_FR__09062026-vf_compressed.pdf). Saved penalties and match-sheet/CSV/PDF exports retain the reason. The event editor can correct the recorded reason.

A five-second announcement appears within the operator and public game boards when a penalty is added, expires, is manually ended or is reduced after a goal. It displays the player/team and optional reason; additions show duration, reductions show time left. Multiple events queue in order. Initial history, repeated snapshots and event edits do not replay announcements. Undo/new-game removal clears pending announcements; public disconnection suppresses them. Reduced-motion preferences disable movement, and announcements do not trigger an extra horn or change pause behavior.
