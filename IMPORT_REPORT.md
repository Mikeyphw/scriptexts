# Import report

- The supplied `scriptexts` archive contained only an empty Git skeleton and no commit history.
- MenOfPorn Modern UI was imported from the current working v1.4.0 userscript.
- Manga Modern UI was imported as its complete builder: `build.mjs`, `package.json`, `src/original/`, and `dist/`.
- Sims CC Download Basket was imported as its complete builder: shared core, site adapters, entry points, build configuration, and generated outputs.
- Both Firefox XPIs were preserved unchanged under `releases/` and unpacked into editable source snapshots without stale signature metadata.
- Added four direct standalone userscripts: LPSG Video Unlocker, Telegram Media Downloader, 100 Search Engines Clean Dark UI, and Poast Nitter Reset.
- Duplicate `(1)` uploads were byte-identical and were intentionally not imported twice.
- Added Telegram Media Downloader as canonical editable extension source with a deterministic package step.
- Changed the Telegram extension ID from `telegram-media-downloader-complete@local` to `telegram-media-downloader@mikeyphw.scriptexts`.
- The uploaded Telegram extension ZIP is not preserved anywhere in the repository as an upstream snapshot.

## Content-site builder migration

MenOfPorn Modern UI moved from `userscripts/standalone/menofporn-modern-ui` into `userscripts/builders/content-site-modernizer` so it can share a builder with Bleeding Cool Modern Reader. Bleeding Cool fixtures were imported from the uploaded page snapshot archive for future regression work.


- Added AIPT Comics as a third shared content-site-modernizer profile using the provided home, category, and post fixtures.
