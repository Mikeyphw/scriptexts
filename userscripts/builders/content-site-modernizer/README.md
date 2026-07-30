# Content Site Modernizer

Shared userscript builder for dense WordPress/news-style sites that need a modern dark, flat, borderless, mobile-first interface.

## Outputs

- `dist/aipt-comics-modern-reader.user.js`
- `dist/bleeding-cool-modern-reader.user.js`
- `dist/menofporn-modern-ui.user.js`
- `dist/putinho-modern-ui.user.js`
- `dist/gayteam-modern-ui.user.js`
- `dist/justthegays-modern-ui.user.js`
- `dist/str8upgayporn-modern-ui.user.js`

Each output also gets a `.meta.js` update file. Install the `.user.js` file; userscript managers use `.meta.js` for lightweight update checks.

## Source model

Every content-site output is now generated from a profile in `src/profiles/` plus the shared editable runtime template in `src/core/runtime.template.js` and `src/core/styles.css`. MenOfPorn and Putinho were the last direct-script islands; their former `src/sites/*/*.source.js` files are retained only as short migration breadcrumbs and are not used by the builder. The builder reads `src/core/runtime.mjs`, which loads the template so syntax checks run against normal JavaScript instead of an opaque generated string.

## Commands

```bash
npm run build
npm run check
npm run test
```

## PageTual compatibility

The builder keeps PageTual page bars and side-controller visible instead of treating them as ads or original pagination. The shared runtime listens for PageTual's `postMessage({ command: "pagetual", action: "insert" })` signal and reconciles feed state through one live path, so load-more reads the current card list after next-page inserts instead of closing over stale cards. MenOfPorn and Putinho now use the same shared PageTual/feed-state reconciliation path as the other profile-driven sites.



## UX hardening

The shared runtime has a single feed-state layer for all sites. Search, saved filtering, PageTual append handling, and load-more use state classes (`csm-filter-hidden`, `csm-saved-hidden`, `csm-deferred-hidden`) rather than fighting over the `hidden` attribute. The drawer is a real modal dialog with focus trap, Escape close, and focus restoration.
## Browser smoke tests

Runtime/browser smoke tests are registered in `smoke.config.json`, but the runner lives at repo scope in `tools/smoke/run-content-site-smoke.py`. This keeps one Playwright Python environment and one browser cache for every builder.

From the repo root:

```bash
npm run smoke:content-sites:list
npm run smoke:content-sites -- --site gayteam --site putinho --site str8upgayporn
```

Set `PLAYWRIGHT_SMOKE=1` when you explicitly want a devtool validation run to execute the browser checks. Without that variable, validation remains offline-friendly and checks only Node tests plus smoke config shape.

When Playwright is installed but its managed browsers are not, you can use a system Chromium with `--executable /usr/bin/chromium` or `PLAYWRIGHT_EXECUTABLE_PATH=/usr/bin/chromium`.

The runner serves fixtures from a temporary local HTTP server by default, avoiding `file://` browser policy blocks. Add `--file-url` only when you specifically want file URL coverage.

### Smoke evidence

The repo-wide smoke runner now records actionable evidence instead of only returning pass/fail. Failed fixtures retain a screenshot, post-injection HTML snapshot, Playwright trace, and any console/page-error log under `smoke-results/content-site-modernizer/`. It also writes:

```text
smoke-results/content-site-modernizer/content-site-smoke-results.json
smoke-results/content-site-modernizer/content-site-smoke-summary.md
```

Useful commands from the repo root:

```bash
npm run smoke:content-sites:matrix
npm run smoke:content-sites:interactions
npm run smoke:content-sites -- --site gayteam --viewport desktop
npm run smoke:content-sites:report
```

The interaction smoke path exercises drawer open/close, saved/viewed card behavior, search filtering and restore, shared load-more buttons, and PageTual append simulation for feed fixtures. The default matrix is `mobile` at 390×900 and `desktop` at 1280×900. Normal devtool validation still only checks runner/config shape unless `PLAYWRIGHT_SMOKE=1` is set.

### Runtime-smoke repair notes

The runner selects visible controls before clicking, so mobile tests do not grab hidden desktop toolbar buttons. It also neutralizes captured ad/popup overlays in local fixtures and ignores local resource 404 noise that comes from archived pages rather than userscript failures. Section-preserving profiles append PageTual simulation nodes into original source lanes so reconciliation tests the same path as real next-page inserts.


Live drift checks are available from the repo root after the Playwright setup:

```bash
npm run smoke:content-sites:live:focused
```

Live mode is explicitly guarded. It uses configured `live.url` entries, writes to `smoke-results/content-site-modernizer-live/`, blocks third-party requests by default, skips interaction checks unless `--live-interactions` is passed, and refuses PageTual injection unless `--allow-live-pagetual` is also passed.

### Live drift report

Live smoke can also run in report-only drift mode. It compares live card/selector shape against fixture baselines, writes `content-site-live-drift.md`, and does not fail unless `--fail-on-live-drift` is explicitly passed.

```bash
npm run smoke:content-sites:live:drift:focused
```

### Accepted live baseline

The repo-wide smoke runner can now capture and compare an accepted live baseline for this builder. It is separate from static fixture drift: fixtures catch deterministic regressions, while the accepted live baseline records the live card/selector shape you reviewed.

```bash
npm run smoke:content-sites:live:baseline:capture
npm run smoke:content-sites:live:baseline:compare
npm run smoke:content-sites:live:baseline:update
```

The committed baseline file starts empty at `tools/smoke/live-baselines/content-site-modernizer-live-baseline.json`. Capture/update are explicit because live pages are noisy little weather systems, not deterministic test fixtures.

### PageTual compatibility contract v2

The content-site smoke runner includes an opt-in PageTual contract that simulates the difficult next-page cases: multiple appends, duplicate page payloads, appends while a no-match search filter is active, and restoring visible cards after that filter is cleared. Normal validation stays browser-free; run it manually with:

```bash
npm run smoke:content-sites:pagetual:focused -- --trace retain-on-failure --snapshot retain-on-failure
```

Use `npm run smoke:content-sites:pagetual` to run the same contract across every configured content-site fixture.

## Adding and refreshing sites

Use the repo-level onboarding generator for new shared-runtime profiles:

```bash
npm run content-sites:new -- --id example-site --name "Example Site Modern UI" --host example.com
```

The generator updates `scripts.config.mjs`, `smoke.config.json`, `repo-manifest.json`, creates starter fixtures, and adds a contract test. Use `--home-fixture` and `--post-fixture` to copy real captures instead of placeholders.

Use the fixture refresh planner after smoke failures or live drift reports:

```bash
npm run content-sites:fixtures:plan
```

Apply with a fresh source capture when possible:

```bash
npm run content-sites:fixtures:apply -- --site example-site --fixture home --source /path/to/fresh.html
```

### Accessibility smoke contract

Run the focused accessibility contract from the repo root:

```bash
npm run smoke:content-sites:a11y:focused -- --trace retain-on-failure --snapshot retain-on-failure
```

The contract is intentionally lightweight and dependency-free: it uses the existing Playwright runner to check visible control names, drawer `role="dialog"`/`aria-modal`, labelled and described drawer content, focus trap behavior, Escape close/focus restore, search input labelling, mobile bottom navigation labels, card link accessible names, and article progressbar semantics. Use `npm run smoke:content-sites:a11y` for every configured content-site fixture.

## Visual regression thumbnails

The builder can capture and compare deterministic fixture screenshots for each generated userscript. This catches visual soup that DOM contracts may miss while keeping regular validation browser-free.

```bash
npm run smoke:content-sites:visual:capture -- --executable /usr/bin/chromium
npm run smoke:content-sites:visual:compare -- --executable /usr/bin/chromium
npm run smoke:content-sites:visual:focused -- --executable /usr/bin/chromium
```

The accepted baseline directory is `tools/smoke/visual-baselines/content-site-modernizer/`; generated evidence goes to `smoke-results/content-site-modernizer-visual/`. Review screenshots and `content-site-visual-regression.md` before committing baseline updates.

## Profile schema and capabilities

Profiles are validated and normalized by `src/core/profile-schema.mjs` before the builder emits userscripts. Schema v1 owns the shared defaults for layout, performance, selectors, navigation actions, grants, and runtime capability flags.

```bash
npm run profiles:check
```

Run the repo-level alias from the repository root:

```bash
npm run content-sites:profiles:check
```

Capability flags are emitted into the generated profile payload as booleans, including feed/article chrome, saved and viewed state, search drawer, load-more, pagination, PageTual support, sectioned feeds, duration badges, accessibility chrome, and visual-regression eligibility. The onboarding generator imports the same defaults so newly generated profiles cannot silently drift from the runtime contract.

## Final seal

Run the final seal before releasing a content-site builder change or after onboarding another site:

```bash
npm run seal
```

From the repo root, use:

```bash
npm run content-sites:seal
npm run content-sites:seal:json
```

The seal verifies profile schema health, shared-runtime usage, generated output freshness, metadata-only `.meta.js` files, smoke config coverage, live URL registration, package script coverage, docs markers, and manifest coverage. It is intentionally browser-free; use the PageTual, accessibility, live drift, and visual smoke lanes when browser proof is needed.

## Release pack

Generate a single install ZIP for all generated content-site scripts from the repository root:

```bash
npm run content-sites:release-pack
```

From this builder directory, use:

```bash
npm run release-pack
```

The default archive is `release/content-site-modernizer/content-site-modernizer-userscripts.zip`. It includes installable userscripts under `scripts/`, update metadata under `meta/`, plus `manifest.json`, `checksums.sha256`, and `RELEASE_INDEX.md`. Use `npm run content-sites:release-pack:check` or `npm run release-pack:check` to validate the release-pack manifest without writing a ZIP.

## Managed Playwright smoke environment

Run browser smoke through the root wrapper so the repo uses one `.venv-smoke`:

```bash
npm run smoke:content-sites:interactions:managed -- --pagetual "$HOME/Downloads/Pagetual-1.9.37.132.user.js" --trace retain-on-failure --snapshot retain-on-failure
```

The wrapper prefers uv and auto-deactivates when the command exits.

### PageTual ingest final seal

The final seal now checks the repaired PageTual handoff instead of only checking that PageTual hooks exist. Inserted next-page nodes are marked with `data-csm-page-tual-candidate`, legacy `data-csm-pagetual-candidate` markers remain accepted, hidden source roots are scanned when they contain marked candidates, already-modernized cards are skipped during source selection, and the insert event immediately ingests raw candidates into the existing `.csm-feed-grid`.

Use the managed interaction smoke as the browser proof:

```bash
npm run smoke:content-sites:interactions:managed -- --pagetual "$HOME/Downloads/Pagetual-1.9.37.132.user.js" --trace retain-on-failure --snapshot retain-on-failure
```

Devtool can run that same lane during validation when `PLAYWRIGHT_SMOKE=1` and `PAGETUAL_SCRIPT` points to the PageTual userscript.
