# Feature matrix

## Archive workspace

- Persistent Comfortable (4-column), Balanced (5-column default), Compact (6-column), and advanced Custom density modes.
- Adjustable gap and cover ratio.
- Live local search across title and taxonomy data.
- Hide-read and English-only filters.
- Default, A–Z, Z–A, and English-first display ordering.
- Persistent local read history, reversible mark-read/unread controls, saved page progress, reader resume, completion-on-last-page, and bulk “mark visible read”.
- Cover-first cards with language/progress/read badges, two-line titles, artist/group bylines, responsive metadata chips, a full Reader/Continue action, original-post action, and reversible read controls. Post pages also receive metadata chips and a comment-count-aware action row.
- Idempotent MutationObserver reconciliation that ignores userscript-owned card moves and reaches quiescence after each insert.
- PageTual next-page ingestion through postMessage and custom events, including hidden source roots, duplicate URL rejection, active-filter preservation, delayed settlement, and visible/restyled PageTual controls.

## Facets

- Language, category, genre, tag, artist, pairing, group, and status.
- IN and OUT modes, mutually exclusive per term.
- Native ElasticPress facet discovery on search pages.
- Synthetic facet discovery from article taxonomy classes elsewhere.
- Searchable collapsible groups, compact first page, full modal directory, counts, and active-filter chips.
- Native `ep_filter_*` URL synchronization and an explicit server-side apply action, including the site’s relevance/newest/oldest/random order.
- Paginated full-directory modal and fourteen-day native facet directory cache.
- Default OUT filters for `cuntboy`, `ai`, and `shota`, matching the prior MRM behavior.

## Reader

- Same-page modal reader with fetched post parsing.
- Long strip, long strip with gaps, and paged modes.
- Comfort/wide width, fit-width/fit-height, LTR/RTL, thumbnails, page counter, and scrubber.
- First/previous/next/last page controls and archive-sequence post navigation.
- Fullscreen, open-original, comments view, adjacent prefetch, focus restoration, and Escape close.
- Keyboard shortcuts: F, W, M, C, R, T, Home, End, arrows, Page Up/Down, and Alt+arrows.
- Mobile three-zone navigation and optional auto-hiding toolbar.
- Lazy/source-set image resolution, duplicate rejection, decorative-image filtering, dimensions, and a 30-minute session fallback cache.

## Site UI

- Dark responsive makeover with host-independent 16px typography, accessible minimum text sizes, configurable accent, and component border policies.
- Left/right control-panel docking.
- Independent makeover toggle with recovery button.
- Reader remains available when the site makeover is disabled.
- Reduced-motion support, accessible names, dialog semantics, focus trapping, and live result announcements.

## Reimagined site shell

- Unified responsive header combining brand, native navigation, and site search.
- Sticky archive command bar with title, loaded/visible and in-progress counts, full-width local search, English/hide-read quick filters, sorting, density controls, active-filter summary, and a direct filters entry point.
- Image-first cards with readable titles, compact metadata, a secondary Reader action, and configurable contain/cover artwork fitting.
- Larger accessible archive pagination and a condensed responsive footer with expandable long lists.

## Phase 4 adaptive shell and reader continuity

- Header hides on downward scroll and returns on upward intent, without leaving a sticky-toolbar gap.
- Archive/search pages use the archive command bar as the sole search surface; post pages retain global site search.
- Main navigation exposes active-section state and a compact More menu for secondary links.
- Compact footer groups Recent comments, Browse, and Site links; mobile uses closed accordions by default.
- Reader shows page count plus percentage progress and announces restored progress when resuming.
- Reader opened from an archive card exposes Back to archive and restores the invoking card/scroll context.
- Adjacent-post controls show titles when the archive sequence or post navigation supplies them.
- Mobile paged mode provides visible bottom controls, horizontal swipe navigation, and double-tap zoom.
- Focus mode (`D`) removes reader chrome while keeping an explicit Exit focus control.


## Phase 5 personal library and adaptive reader

- Saved-for-later state is available on archive cards, post pages, and the reader, with reversible controls and a Saved-only archive filter/view.
- Saved records are bounded local state and retain title/cover metadata for future library evolution.
- A compact Continue reading shelf surfaces unfinished loaded titles with page and percentage progress.
- Reader view, width, fit, direction, and thumbnail choices inherit legacy defaults but persist independently for mobile and desktop after a device-specific change.
- Paged mode hydrates a small active-page neighborhood instead of assigning every image source immediately.
- Data Saver, 2G, and slow-2G connections use a tighter hydration radius, text-only thumbnails, and suppress adjacent-post prefetch.
- The `S` reader shortcut toggles saved state without interfering with existing navigation shortcuts.

## Phase 6 accessibility and completion seal

- Skip-to-content navigation is injected ahead of the custom header and targets the main content region.
- All primary injected controls receive high-visibility `:focus-visible` treatment; read, saved, filter, and progress states include text/ARIA semantics.
- Mobile workspace, facet modal, and metadata sheet prevent background scrolling and overscroll while open.
- Touch targets are raised to practical mobile floors without inflating dense taxonomy chips unnecessarily.
- `prefers-contrast: more` and `prefers-reduced-motion: reduce` receive explicit UI treatment.
- Release validation preserves the public npm registry contract, read-only generated-artifact verification, Chromium fixture interactions, PageTual insertion behavior, repository metadata normalization, and byte-stable overlay payloads.
