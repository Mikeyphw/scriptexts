# MyReadingManga Reimagined builder

A clean-room, MRM-only userscript builder based on the supplied August 2026 HTML captures. It lives beside the legacy multi-site manga builder so the new implementation can be tested independently before any YaoiMangaOnline or BaraMangaOnline migration.

## Why this is a separate builder

The older `manga-reader-modernizer` builder packages three large direct-source scripts. This builder does not import those files. Its source is split into small runtime modules and style sheets, then assembled into one userscript by a dependency-free build step.

## Build and verify

```bash
npm run build
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
