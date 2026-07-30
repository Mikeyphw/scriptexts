# Repo-wide smoke tests

This directory contains optional Playwright Python smoke runners for generated browser artifacts. They are repo-wide on purpose: one Python environment and one browser cache can serve every userscript builder instead of each builder creating its own miniature swamp.

## Setup

```bash
cd "$HOME/Code/scriptexts"
python3 -m venv .venv-smoke
. .venv-smoke/bin/activate
pip install -r requirements-smoke.txt
python -m playwright install chromium
```

## Content-site modernizer

List configured sites without importing Playwright:

```bash
python tools/smoke/run-content-site-smoke.py --builder content-site-modernizer --list
```

Run the default smoke set:

```bash
python tools/smoke/run-content-site-smoke.py --builder content-site-modernizer
```

Run specific sites and optionally inject PageTual before the site userscript:

```bash
python tools/smoke/run-content-site-smoke.py \
  --builder content-site-modernizer \
  --site gayteam \
  --site putinho \
  --site str8upgayporn \
  --pagetual "$HOME/Downloads/Pagetual-1.9.37.132.user.js"
```

Results and failure screenshots are written under `smoke-results/`. Normal devtool validation does not require Playwright. Overlay validators should only run browser smoke tests when `PLAYWRIGHT_SMOKE=1` is set.

When Playwright is installed but its managed browsers are not, you can use a system Chromium with `--executable /usr/bin/chromium` or `PLAYWRIGHT_EXECUTABLE_PATH=/usr/bin/chromium`.

The runner serves fixtures from a temporary local HTTP server by default, avoiding `file://` browser policy blocks. Add `--file-url` only when you specifically want file URL coverage.

## Evidence and viewport matrix

The smoke runner writes machine-readable results plus human-readable evidence under `smoke-results/content-site-modernizer/`:

```text
content-site-smoke-results.json
content-site-smoke-summary.md
<site>-<fixture>-<viewport>.png          # failures
<site>-<fixture>-<viewport>.html         # failures, post-injection snapshot
<site>-<fixture>-<viewport>.trace.zip    # failures, Playwright trace
<site>-<fixture>-<viewport>-console.log  # when console output exists
```

Run the configured mobile + desktop matrix for every content-site profile:

```bash
npm run smoke:content-sites:matrix
```

Run just one viewport:

```bash
npm run smoke:content-sites -- --site gayteam --viewport desktop
```

Run the focused interaction smoke set for the sites that have caused the most real-world pagination/UI bugs:

```bash
npm run smoke:content-sites:interactions
```

Feed fixtures assert more than shell presence: the runner opens and closes drawers, toggles direct card saved/viewed controls or verifies shared viewed storage, types a no-match search and then clears it, clicks shared load-more buttons when present, and simulates a PageTual append when the fixture requests it.

Regenerate the Markdown report from an existing JSON result:

```bash
npm run smoke:content-sites:report
```

Tracing and snapshots default to `retain-on-failure`. You can force everything on when a layout feels slippery:

```bash
npm run smoke:content-sites -- \
  --site str8upgayporn \
  --matrix \
  --trace on \
  --snapshot on
```


## Guarded live-site drift checks

Fixture smoke remains the deterministic default. Use `--live` only when you want to check whether the real site shape still matches the generated script profile:

```bash
npm run smoke:content-sites:live:focused

npm run smoke:content-sites:live -- --site gayteam --viewport desktop
```

Live mode uses the `live.url` entries in each builder smoke config, writes evidence to `smoke-results/content-site-modernizer-live/`, blocks third-party requests by default, and allows console/page errors by default because live pages often have noisy ad or analytics failures unrelated to the userscript.

Interaction checks are off in live mode unless you pass `--live-interactions`. PageTual injection is also guarded: `--pagetual` is refused on live pages unless `--allow-live-pagetual` is present. Use `--allow-live-third-party` only when a real-site check needs external resources.

### Runtime-smoke repair notes

The runner selects visible controls before clicking, so mobile tests do not grab hidden desktop toolbar buttons. It also neutralizes captured ad/popup overlays in local fixtures and ignores local resource 404 noise that comes from archived pages rather than userscript failures. Section-preserving profiles append PageTual simulation nodes into original source lanes so reconciliation tests the same path as real next-page inserts.

The runner neutralizes captured ad overlays before fixture UI clicks, keeping smoke failures focused on the generated userscript controls.

## Live drift report

Live drift mode compares a live page against the fixture baseline without making shape drift a failure by default. It records card counts, expected selector presence, severity, notes, and sample live cards in `content-site-live-drift.md` inside the live evidence directory.

```bash
npm run smoke:content-sites:live:drift

npm run smoke:content-sites:live:drift:focused -- \
  --trace retain-on-failure \
  --snapshot retain-on-failure
```

Use `--fail-on-live-drift` only when you want the report to grow CI teeth. The default is intentionally report-only so a live ad/CDN wobble does not break normal development.

## Accepted live baseline management

Live drift reports compare live pages against static fixtures. Accepted live baselines add a second comparison layer: a JSON snapshot of the live shape you have reviewed and approved.

Capture the current guarded live shape into the committed baseline file:

```bash
npm run smoke:content-sites:live:baseline:capture
```

Compare future live runs against that accepted baseline without failing by default:

```bash
npm run smoke:content-sites:live:baseline:compare
```

Refresh the accepted baseline explicitly after reviewing drift output:

```bash
npm run smoke:content-sites:live:baseline:update
```

The default baseline path is `tools/smoke/live-baselines/content-site-modernizer-live-baseline.json`. Use `--live-baseline <path>` to test against a scratch baseline without modifying the committed one.

Baseline compare writes `content-site-live-baseline.md` beside the normal live smoke JSON and drift report. Use `--fail-on-live-baseline-drift` only when you want accepted-live drift to fail the run at the configured severity threshold.

### PageTual compatibility contract v2

The content-site smoke runner includes an opt-in PageTual contract that simulates the difficult next-page cases: multiple appends, duplicate page payloads, appends while a no-match search filter is active, and restoring visible cards after that filter is cleared. Normal validation stays browser-free; run it manually with:

```bash
npm run smoke:content-sites:pagetual:focused -- --trace retain-on-failure --snapshot retain-on-failure
```

Use `npm run smoke:content-sites:pagetual` to run the same contract across every configured content-site fixture.

## Fixture refresh handoff

Smoke evidence can now feed the content-site fixture refresh assistant:

```bash
npm run content-sites:fixtures:plan
```

The planner reads `smoke-results/content-site-modernizer/content-site-smoke-results.json` by default and lists failed or drifted fixtures with their target fixture paths and retained snapshots. Apply mode is intentionally guarded:

```bash
npm run content-sites:fixtures:apply -- --site putinho --fixture home --source /path/to/fresh-source.html
```

Retained Playwright snapshots are not used unless `--allow-smoke-snapshot` is passed because they can contain the already-injected modern UI.

## Visual regression thumbnails

`run-content-site-visual.py` is the repo-wide visual smoke runner for generated content-site userscripts. It reuses `smoke.config.json`, serves fixture HTML locally, injects the generated userscript, stabilizes animations/ads/iframes, then captures full-page screenshots.

```bash
npm run smoke:content-sites:visual:capture -- --executable /usr/bin/chromium
npm run smoke:content-sites:visual:compare -- --executable /usr/bin/chromium
npm run smoke:content-sites:visual:focused -- --executable /usr/bin/chromium
```

Capture/update writes accepted screenshots to `tools/smoke/visual-baselines/content-site-modernizer/`. Compare writes current screenshots, thumbnails, optional pixel diffs, JSON, and Markdown under `smoke-results/content-site-modernizer-visual/`. Compare remains report-only unless `--fail-on-visual-diff` is passed. Install `Pillow` from `requirements-smoke.txt` to get pixel diff ratios and generated diff images; without it, the runner still detects changed screenshot hashes.

### PageTual direct-ingest smoke note

The focused interaction smoke now exercises the direct PageTual ingest path. The simulated append emits the same insert signals that real PageTual uses, then expects raw candidates to be selected and enhanced into modern `.csm-card` nodes. The Markdown summary includes `PageTual ingest: simulated insert -> raw candidates selected -> modern cards appended` when PageTual evidence is present.

For Devtool overlays, set `PLAYWRIGHT_SMOKE=1` and `PAGETUAL_SCRIPT=/path/to/Pagetual.user.js` to run this browser lane inside the validator.
