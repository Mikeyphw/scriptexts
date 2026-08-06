# MyReadingManga Reimagined builder

A clean-room, MRM-only userscript builder based on the supplied August 2026 HTML captures, with typography isolated from the live theme’s root font size and a dedicated idempotent PageTual ingestion lane. It lives beside the legacy multi-site manga builder so the new implementation can be tested independently before any YaoiMangaOnline or BaraMangaOnline migration.

## Why this is a separate builder

The older `manga-reader-modernizer` builder packages three large direct-source scripts. This builder does not import those files. Its source is split into small runtime modules and style sheets, then assembled into one userscript by a dependency-free build step.

## Build and verify

```bash
npm run build
npm run build:verify
npm run test
npm run check
# Optional, requires Python Playwright and Chromium
npm run smoke
```

Install:

- `dist/myreadingmanga-reimagined.user.js`

The script has its own namespace and storage prefix, so it can be installed beside the legacy MRM script for comparison. Disable the older script while testing to avoid two interfaces acting on the same page.

## Source layout

- `src/modules/`: archive, facet, storage, reader, settings, and bootstrap modules.
- `src/styles/`: UI, archive grid, settings, and reader CSS.
- `test/fixtures/`: extracted `index.html` documents from the supplied SingleFileZ captures.
- `docs/FEATURE_MATRIX.md`: preserved feature contract.
- `docs/ARCHITECTURE.md`: new design and extension points.

## Incremental archive contract

Version 6.2.0 treats the archive grid as one stable collection. Card reconciliation compares the desired order before touching the DOM, ignores already-enhanced cards moved by the userscript, and processes only newly inserted raw article roots. PageTual `postMessage` and custom-event signals mark and ingest hidden next-page candidates, preserve active filters, reject duplicate canonical URLs, and run one delayed settlement pass after PageTual finishes its own DOM batch.

## Phase 1 archive UX

Version 6.2.0 adds a persistent density model with Comfortable, Balanced, Compact, and advanced Custom modes. Balanced is the default five-column desktop layout. The sticky archive command bar now keeps local search, quick English/hide-read toggles, sorting, density, active filters, and the full filter workspace within reach while scrolling.

Cards use a cover-first hierarchy with language and reading-state badges, a two-line title, artist/group byline, compact taxonomy, reader/original actions, and reversible mark-read controls. Reader position is stored independently from read history, resumes at the saved page, and marks a title complete only after the final page is reached.

## Generated artifact policy

The repository root build runs `build:verify` for this builder so validation proves the tracked release artifacts are reproducible without rewriting them. Use `npm run build` inside this builder, or `npm run build:mrm-reimagined:write` at the repository root, only when intentionally regenerating `dist`.
