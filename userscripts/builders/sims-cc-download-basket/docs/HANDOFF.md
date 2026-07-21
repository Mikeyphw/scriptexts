# Sims CC Download Basket — New Chat Handoff

## Start here

Continue development from `project/sims_cc_download_basket_build.zip`. It is the source-of-truth builder archive. Do **not** start from older standalone scripts found elsewhere in the conversation or filesystem.

The generated userscripts included under `userscripts/` were extracted directly from that archive and are version **1.4.1**:

- `modthesims-download-basket.user.js`
- `simblrcc-download-basket.user.js`
- `thesimsresource-download-basket.user.js`

The HTML fixtures the user uploaded are under `html/mts_testpage/`. Preserve them as test inputs. `dump.html` is intentionally present exactly as uploaded and is zero bytes.

## Immediate status

The latest reported MTS listing-page problem was visible in `evidence/mts_cards_chips_and_missing_basket.png`:

1. Category chips in cards were clipped/chopped.
2. Replacement cards had no visible `+ Basket` button.

Version **1.4.1** was built to address both:

- MTS chip rows use automatic height, wrapping, and visible overflow.
- The MTS replacement-card renderer creates the Basket action directly, avoiding an observer timing gap.
- Cards are marked as wired immediately to prevent duplicate later insertion.

The scripts passed static syntax checks and ZIP integrity checks. They were **not live-browser tested** against the current sites in this environment, so the next chat should verify the fix using the supplied MTS HTML fixtures and, when possible, a live MTS page.

## Project goal

Maintain three standalone Tampermonkey userscripts that share a cross-site Sims custom-content download basket while providing dark, modern, responsive site rewrites for:

- Mod The Sims (MTS)
- Simblr.cc
- The Sims Resource (TSR)

The scripts must remain independently installable. Each generated output should contain the shared runtime plus only its selected site's heavy implementation.

## Non-negotiable user preferences

- Keep the project archive as `.zip`.
- Use the stable source archive name `sims_cc_download_basket_build.zip`.
- Generate one userscript per site; do not merge them into one script.
- Do not generate `.txt` mirrors.
- Keep the theme dark, flat, modern, borderless, and mobile-friendly.
- Use Sims 3 colors mainly as restrained accents or gradients, not as a flashy full-page palette.
- Preserve existing performance optimizations and target-specific pruning.
- Avoid `eval` because Tampermonkey warns about it.
- Do not restore the removed “Add visible mods” action; keep per-card basket actions.
- Build archives should remain unversioned/stable in filename even when userscript metadata versions increase.

## Architecture

The source archive contains:

- `src/entry/*.user.js` — metadata and small per-target entries.
- `src/core/app.js` — shared basket, storage, settings, duplicate detection, network/cache, diagnostics, download queue, overlays, and common wiring. Heavy page rewrites are marked with site-pruning blocks.
- `src/core/design-system.js` — shared theme tokens, typography, basket UI, responsive rules, and common site styling.
- `src/sites/mts.js`, `simblr.js`, `tsr.js` — site adapters and extraction logic.
- `build.mjs` — dependency-free target-aware inliner/pruner, CSS-only compactor, validation, and build report.
- `scripts.config.mjs` — output targets and selected site IDs.

Build guarantees already implemented:

- Every output contains only its selected heavy site implementation.
- Duplicate top-level function declarations fail the build.
- Missing selected-site code or leaked foreign-site implementation fails the build.
- CSS compaction is limited to known CSS template literals so HTML/text template literals are not damaged.
- Generated files are much shorter than the earlier 13K-line outputs.

## Build workflow

Unpack the source archive, edit source files rather than only `dist/`, then run:

```bash
npm run build
npm run check
```

Before delivering a change:

1. Bump all three userscript `@version` values consistently unless a site-specific hotfix clearly warrants otherwise.
2. Run the build and syntax checks.
3. Confirm no foreign site implementation leaked into another target.
4. Confirm the MTS HTML fixtures still render without clipped chips or missing/duplicated basket actions.
5. Recreate the stable archive `sims_cc_download_basket_build.zip` with the top-level folder `sims_cc_download_basket_build/`.
6. Deliver the archive and the three generated userscripts.

## Major functionality already implemented

### Shared basket

- Cross-site GM storage.
- Grouping by mod with multiple files.
- Multi-file chooser.
- Search, filters, sorting, compact/detailed views, and session baskets.
- Duplicate detection using canonical/source URLs, normalized filenames, size, final URL, ETag, optional SHA-256, and confidence scoring.
- Download plan, queue states, stale-link refresh, health checks, retry-failed flow, and multiple export formats.
- Notes/tags, backup/undo, keyboard shortcuts, storage diagnostics, and settings import/export/reset.
- Saved mod information and full descriptions.
- Basket only shows a compact description preview; clicking it or the info action opens a full overlay with source, creator, description, and files.
- Simplified basket UI: search remains visible; refine/sort/session controls are grouped; primary footer exposes Download and More; per-mod and per-file actions live in `…` menus.

### Stability and diagnostics

- Page-type routing.
- Shared throttled cleanup scheduler and MutationObserver strategy.
- Processed-node/data caching.
- Deferred/idle work for heavier sections.
- Cleanup budgeting.
- CSS containment/content visibility.
- Safe modes: Full theme, Light theme only, Basket only, Disabled.
- Per-site theme toggles, Basket UI toggle, and native rewrite toggle.
- Visual Debug UI labels/outlines.
- Automatic broken-layout recovery and native-content restoration.
- Build-size and metadata reports.

### MTS

- Full-width dark listing layout and custom cards.
- Adjustable grid/density controls.
- Custom detail-page hero/gallery/tabs/breadcrumbs/stats/related cards.
- Native light-background leak cleanup and dark navigation/dropdowns.
- Version 1.4.1 directly renders the per-card Basket action and fixes wrapped chip clipping.

### Simblr.cc

- Full page rebuilds for home, hub, listing, and detail pages.
- Hierarchical Sims 1/2/3/4/general filter grouping.
- Custom cards, detail gallery, download panel, and related content.

### TSR

- Document-start focus/visibility guard without `eval`.
- Controlled top bar, ad cleanup, custom listing cards, pagination, and rebuilt detail layout.
- Creator/related sections and readable tabs.

## Important regression risks

- Do not reintroduce all three heavy site implementations into every target.
- Do not add duplicate function declarations that silently override newer implementations.
- Do not broadly hide every empty `div`; that previously risked removing structural placeholders/icons.
- Avoid broad global selectors and unthrottled MutationObserver work.
- Keep advanced basket actions behind menus/overlays; the user explicitly found the previous basket too busy.
- Preserve full mod descriptions in storage, but never expand them inline in the basket list.
- Prevent duplicate Basket buttons when both direct rendering and observer wiring run.
- Do not solve line count only through unsafe minification; maintain target pruning and readable source.

## Supplied fixtures

- `html/mts_testpage/index.html` — smaller captured MTS page.
- `html/mts_testpage/test.html` — larger captured/transformed test page before the latest fix.
- `html/mts_testpage/test-fixed.html` — larger fixed/reference test page supplied in the conversation.
- `html/mts_testpage/dump.html` — zero-byte uploaded file; retained for completeness.
- `evidence/mts_cards_chips_and_missing_basket.png` — screenshot of clipped chips and missing Basket actions.

## Suggested first action in the new chat

Unpack `project/sims_cc_download_basket_build.zip`, run `npm run build && npm run check`, compare the generated MTS script with `userscripts/modthesims-download-basket.user.js`, then test the MTS rewrite against the supplied HTML fixtures. Confirm chip rows wrap fully and exactly one Basket action exists per replacement card before making further changes.
