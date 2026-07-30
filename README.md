# scriptexts

Organized monorepo for userscripts and small browser extensions.

```text
userscripts/
  standalone/                  Direct single-file installable userscripts
  builders/                    Projects that generate site-specific userscripts
extensions/                    Editable Firefox extension projects with reproducible packages
docs/                          Repository layout and release notes
tools/                         Validation, metadata, and inventory helpers
```

## Build

```bash
npm install
npm run build
npm run check
```

`npm run build` regenerates shared content-site userscripts, Manga reader scripts, Sims basket scripts, extension XPIs, and userscript `.meta.js` update files.

## Userscript source models

- `userscripts/builders/content-site-modernizer` builds MenOfPorn Modern UI, Putinho Modern UI, Gayteam Modern UI, JustTheGays Modern UI, STR8UPGAYPORN Modern UI, Bleeding Cool Modern Reader, and AIPT Comics Modern Reader.
- `userscripts/builders/manga-reader-modernizer` builds the manga reader scripts.
- `userscripts/builders/sims-cc-download-basket` builds the Sims CC basket scripts.
- `userscripts/standalone` contains direct scripts that do not have project-specific builders.

Install `.user.js` files. The companion `.meta.js` files are update beacons used by userscript managers.


## Content-site modernizers

AIPT Comics Modern Reader, MenOfPorn Modern UI, Putinho Modern UI, Gayteam Modern UI, JustTheGays Modern UI, and STR8UPGAYPORN Modern UI are generated from shared runtime profiles by the `userscripts/builders/content-site-modernizer` builder alongside Bleeding Cool. Installable outputs live under `userscripts/builders/content-site-modernizer/dist/`, including `aipt-comics-modern-reader.user.js`, `putinho-modern-ui.user.js`, `gayteam-modern-ui.user.js`, `justthegays-modern-ui.user.js`, and `str8upgayporn-modern-ui.user.js`. The content-site scripts share one PageTual-compatible runtime: they keep PageTual navigation visible, reprocess next-page cards after PageTual appends them, and use the same drawer/feed-state/load-more behavior across all generated sites.
## Optional Playwright smoke tests

Browser smoke tests are repo-wide, not builder-local. Create one local Python environment when you want runtime proof:

```bash
python3 -m venv .venv-smoke
. .venv-smoke/bin/activate
pip install -r requirements-smoke.txt
python -m playwright install chromium
```

Then run content-site checks from the repo root:

```bash
npm run smoke:content-sites:list
npm run smoke:content-sites -- --site gayteam --site putinho --site str8upgayporn
```

For a full mobile/desktop browser matrix with evidence output:

```bash
npm run smoke:content-sites:matrix
```

For the highest-signal interaction pass on the weirdest pagination/card shapes:

```bash
npm run smoke:content-sites:interactions
```

Smoke evidence is written to `smoke-results/content-site-modernizer/` as JSON, Markdown, screenshots, HTML snapshots, console logs, and traces on failure. Feed fixtures now exercise real UI interactions too: drawer open/close, card save/viewed behavior where available, search filtering and restore, shared load-more controls, and PageTual append reprocessing.

Normal devtool validation does not require Playwright. Overlays may opt into browser smoke checks with `PLAYWRIGHT_SMOKE=1`.

When Playwright is installed but its managed browsers are not, you can use a system Chromium with `--executable /usr/bin/chromium` or `PLAYWRIGHT_EXECUTABLE_PATH=/usr/bin/chromium`.

The runner serves fixtures from a temporary local HTTP server by default, avoiding `file://` browser policy blocks. Add `--file-url` only when you specifically want file URL coverage.

Smoke runner repair note: the content-site Playwright runner now selects visible controls before clicking, neutralizes captured ad overlays in fixtures, ignores local fixture resource 404 noise, and appends PageTual simulation nodes into original source lanes where profiles preserve sections.

For guarded live-site drift checks, use the explicit live command. It blocks third-party requests by default, writes to `smoke-results/content-site-modernizer-live/`, and does not run interaction checks unless you opt in:

```bash
npm run smoke:content-sites:live:focused

npm run smoke:content-sites:live -- --site str8upgayporn --viewport desktop
```

PageTual is never injected into live pages unless you pass both `--pagetual ...` and `--allow-live-pagetual`.

For live DOM drift checks, run the report-only live drift command. It compares live card/selector shape to fixture baselines and writes `content-site-live-drift.md` without failing by default:

```bash
npm run smoke:content-sites:live:drift:focused
```

### Content-site live baseline smoke

The content-site smoke runner includes accepted live baseline management. Use it after reviewing live drift reports:

```bash
npm run smoke:content-sites:live:baseline:capture
npm run smoke:content-sites:live:baseline:compare
npm run smoke:content-sites:live:baseline:update
```

Baseline capture/update writes `tools/smoke/live-baselines/content-site-modernizer-live-baseline.json`; compare writes `content-site-live-baseline.md` in the live smoke results directory. Normal validation remains browser-free.

### PageTual compatibility contract v2

The content-site smoke runner includes an opt-in PageTual contract that simulates the difficult next-page cases: multiple appends, duplicate page payloads, appends while a no-match search filter is active, and restoring visible cards after that filter is cleared. Normal validation stays browser-free; run it manually with:

```bash
npm run smoke:content-sites:pagetual:focused -- --trace retain-on-failure --snapshot retain-on-failure
```

Use `npm run smoke:content-sites:pagetual` to run the same contract across every configured content-site fixture.

### Content-site onboarding and fixture refresh

The content-site modernizer has repo-level helper tools for adding another site and keeping fixtures current without turning browser evidence into accidental committed soup.

Create a new shared-runtime site profile from the repo root:

```bash
npm run content-sites:new -- \
  --id example-site \
  --name "Example Site Modern UI" \
  --host example.com
```

Preview the generated paths first:

```bash
npm run content-sites:new:dry-run -- \
  --id example-site \
  --name "Example Site Modern UI" \
  --host example.com \
  --json
```

Plan fixture refresh candidates from smoke evidence:

```bash
npm run content-sites:fixtures:plan
```

Refresh a fixture only from an explicit fresh source capture unless you intentionally pass `--allow-smoke-snapshot` for retained Playwright DOM snapshots:

```bash
npm run content-sites:fixtures:apply -- \
  --site gayteam \
  --fixture home \
  --source /path/to/fresh-captured-source.html
```

### Shared-runtime migration

MenOfPorn and Putinho were migrated off their retired direct source files in the `1.5.0` and `1.1.0` releases. Their old `src/sites/*/*.source.js` files are now tiny migration breadcrumbs; the active source of truth is `src/profiles/menofporn.mjs`, `src/profiles/putinho.mjs`, `src/core/runtime.template.js`, and `src/core/styles.css`.

### Accessibility smoke contract

The content-site smoke runner now has an opt-in accessibility contract for the shared runtime chrome. It checks visible control names, mobile-only/desktop-only visibility, drawer dialog semantics, focus trapping, Escape close behavior, search input labelling, bottom navigation labels, card link names, and article progressbar semantics.

```bash
npm run smoke:content-sites:a11y:focused -- --trace retain-on-failure --snapshot retain-on-failure
```

Use `npm run smoke:content-sites:a11y` to run the same checks across every configured content-site fixture. Normal validation remains browser-free.

## Visual regression thumbnails

The content-site builder has an optional Playwright visual regression lane. It is deliberately outside normal Devtool validation so ordinary overlays stay fast, offline-friendly, and browser-free.

```bash
npm run smoke:content-sites:visual:capture -- --executable /usr/bin/chromium
npm run smoke:content-sites:visual:compare -- --executable /usr/bin/chromium
npm run smoke:content-sites:visual:focused -- --executable /usr/bin/chromium
```

Baselines live in `tools/smoke/visual-baselines/content-site-modernizer/`. Current screenshots, thumbnails, diffs, JSON, and `content-site-visual-regression.md` are written under `smoke-results/content-site-modernizer-visual/`. Compare mode is report-only unless `--fail-on-visual-diff` is passed.

## Content-site profile schema

The content-site modernizer now validates every shared-runtime profile through `src/core/profile-schema.mjs` before building. The schema normalizes layout, performance, selector, and capability defaults at build time, then emits the normalized profile into each generated userscript. Use the repo-level check before adding or reshaping profiles:

```bash
npm run content-sites:profiles:check
```

The site onboarding generator uses the same defaults, so new profiles start with the same schema version and capability map as the handwritten profiles.

## Content-site final seal

The content-site modernizer has a browser-free release-readiness seal. It checks that every generated site is profile-driven, schema-normalized, registered in smoke config, represented in the manifest, and paired with fresh `.user.js`/`.meta.js` outputs.

```bash
npm run content-sites:seal
npm run content-sites:seal:json
```

The seal is the last deterministic gate before optional Playwright checks. It does not launch a browser, so Devtool validation stays fast and offline-friendly.


## Managed smoke Python environment

The repo-level Playwright smoke tools use a managed `.venv-smoke` environment.
Use `uv` when available; the wrapper falls back to `venv` + `pip` when uv is not installed.

```bash
npm run smoke:env:sync
npm run smoke:env:doctor
npm run smoke:env:install-browsers
```

Managed smoke commands auto-activate that environment for the subprocess and auto-deactivate when it exits:

```bash
npm run smoke:content-sites:interactions:managed -- --pagetual "$HOME/Downloads/Pagetual-1.9.37.132.user.js" --trace retain-on-failure --snapshot retain-on-failure
```

For an interactive shell, use:

```bash
source tools/smoke/activate-smoke-env.sh
# run smoke commands
smoke-env-deactivate
```

## Content-site release pack

After the final seal passes, generate an installable release ZIP for every content-site userscript:

```bash
npm run content-sites:release-pack
```

The pack is written to `release/content-site-modernizer/content-site-modernizer-userscripts.zip` and contains `scripts/*.user.js`, `meta/*.meta.js`, `manifest.json`, `checksums.sha256`, and `RELEASE_INDEX.md`. Check mode verifies the pack manifest without writing a ZIP:

```bash
npm run content-sites:release-pack:check
```

The release packer is dependency-free and browser-free, so it is safe for normal Devtool validation. Generated release ZIPs stay untracked under `release/`.
