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

Version 6.4.0 treats the archive grid as one stable collection. Card reconciliation compares the desired order before touching the DOM, ignores already-enhanced cards moved by the userscript, and processes only newly inserted raw article roots. PageTual `postMessage` and custom-event signals mark and ingest hidden next-page candidates, preserve active filters, reject duplicate canonical URLs, and run one delayed settlement pass after PageTual finishes its own DOM batch.

## Phase 1 archive UX

Version 6.4.0 adds a persistent density model with Comfortable, Balanced, Compact, and advanced Custom modes. Balanced is the default five-column desktop layout. The sticky archive command bar now keeps local search, quick English/hide-read toggles, sorting, density, active filters, and the full filter workspace within reach while scrolling.

Cards use a cover-first hierarchy with language and reading-state badges, a two-line title, artist/group byline, compact taxonomy, reader/original actions, and reversible mark-read controls. Reader position is stored independently from read history, resumes at the saved page, and marks a title complete only after the final page is reached.

## Generated artifact policy

The repository root build runs `build:verify` for this builder so validation proves the tracked release artifacts are reproducible without rewriting them. Use `npm run build` inside this builder, or `npm run build:mrm-reimagined:write` at the repository root, only when intentionally regenerating `dist`.

## Phase 2 filter experience

Version 6.4.0 adds built-in and user-saved filter views, readable Include/Exclude facet actions, a mobile bottom-sheet workspace, and grouped card metadata popovers.


## Phase 3: long archive continuity

- PageTual batches receive stable page separators with the page number and newly accepted release count.
- Near-bottom and PageTual loading signals expose a compact loading state, slow-load fallback, and direct next-page retry link.
- A transient observer-driven position pill reports the current visible result without scanning the whole archive on every scroll.
- Cards use `content-visibility: auto` plus intrinsic-size reservation so very large appended archives remain smooth.
- Separators follow default archive order, disappear for alternate sorts, and hide when their whole batch is filtered out.

## Phase 4: adaptive chrome and reader continuity

Version 6.5.0 trims the site chrome without hiding functionality. The global header now owns only brand/navigation on archive/search pages, because the archive command bar already owns search. Navigation exposes a compact More menu, marks the active section, and slides out while scrolling down before returning on upward intent. The sticky archive bar follows the header so no dead offset is left behind.

The original multi-block WordPress footer is replaced, while the makeover is enabled, by compact Recent comments, Browse, and Site links sections. Desktop keeps them expanded; mobile presents them as accordions.

Reader continuity now includes a thin percentage progress meter, explicit resume announcements, adjacent-post titles, an archive-return action when the reader was opened from a card, reachable mobile bottom controls, paged swipe navigation, paged double-tap zoom, and a distraction-free Focus mode (`D`). The older invisible three-zone tap layer remains available in strip modes but yields to swipe/zoom gestures in paged mode.

## Phase 5: personal library and adaptive reader

Version 6.7.0 adds a first-class Saved library across archive cards, post pages, and the reader. Saved state is locally persisted, filterable through both a toolbar quick filter and a built-in filter view, and visible through text plus ARIA state rather than color alone. A compact Continue reading shelf surfaces loaded posts with unfinished persisted reader progress.

Reader controls now use device profiles. Existing reader preferences remain the shared fallback, while changes made on mobile and desktop are stored independently. In paged mode the reader hydrates only the active page neighborhood; data-saver and 2G-class connections use a smaller window, text-only thumbnails, and no adjacent-post prefetch.

## Phase 6: accessibility, performance, and release hardening

The injected shell now provides a skip-to-content link, strong `:focus-visible` rings, improved high-contrast behavior, reduced-motion coverage, and explicit state labels. Mobile workspace, facet dialogs, and metadata sheets lock background scrolling while open, and primary mobile commands keep touch-friendly target floors.

The final release gate keeps the portable public npm registry contract, read-only root MRM build verification, Chromium interaction coverage, PageTual compatibility checks, canonical metadata normalization, and byte-stable Devtool payload verification.
