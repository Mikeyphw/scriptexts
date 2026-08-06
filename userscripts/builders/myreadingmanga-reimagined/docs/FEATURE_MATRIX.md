# Feature matrix

## Archive workspace

- Responsive cover grid with desktop, tablet, and mobile column settings.
- Adjustable gap and cover ratio.
- Live local search across title and taxonomy data.
- Hide-read and English-only filters.
- Default, A–Z, Z–A, and English-first display ordering.
- Persistent local read history and bulk “mark visible read”.
- Metadata chips and card-level Reader actions. Post pages also receive metadata chips and a comment-count-aware action row.
- MutationObserver and PageTual insert-event reprocessing.

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

- Dark responsive makeover with configurable accent and component border policies.
- Left/right control-panel docking.
- Independent makeover toggle with recovery button.
- Reader remains available when the site makeover is disabled.
- Reduced-motion support, accessible names, dialog semantics, focus trapping, and live result announcements.
