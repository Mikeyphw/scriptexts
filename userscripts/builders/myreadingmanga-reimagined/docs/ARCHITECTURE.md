# Architecture

The generated userscript is a single IIFE, but the source is deliberately not monolithic.

1. `00-core` defines runtime state, selectors, DOM helpers, safe same-origin fetching, image source resolution, and accessibility utilities.
2. `01-storage` owns schema defaults, deep migration, local read history, bounded per-post reader progress, completion state, and the 14-day facet cache.
3. `02-site-model` translates captured MRM HTML into cards, taxonomies, native facets, manga pages, comments, and page type.
4. `03-theme` injects the built CSS and maps settings plus density presets to CSS variables/data attributes.
5. `04-facets` owns IN/OUT filter semantics and ElasticPress URL generation.
6. `05-archive` owns the sticky command bar, cover-first card hierarchy, read/progress visuals, density controls, filtering/sorting, idempotent dynamic insertion, PageTual candidates, and visible-post sequences.
7. `06-reader` owns fetched post parsing, all reader modes, comments, keyboard/mobile navigation, and post-page actions.
8. `07-settings` renders the control panel and facet directory.
9. `08-app` performs page-specific startup.

The build script concatenates modules in lexical order, embeds the combined CSS and immutable config, and generates both installable and metadata-only files. No legacy MRM source file is read by this builder.

Future site migrations should add a site adapter rather than embedding selectors throughout the runtime. For now, this builder intentionally accepts only `myreadingmanga.info`.

## Site-shell enhancement

`08-app` clones the native navigation/search into a responsive shell, preserving the original DOM for the disabled-makeover recovery path. It also condenses long footer clouds/comments into accessible `details` sections. `05-archive` owns the archive overview and synchronizes its controls with the workspace panel through the shared preference events.


## Typography isolation

The live WordPress theme may set the document root below the browser default, so the userscript does not rely on host `rem` sizing. Custom shells establish a 16px local baseline and critical labels, card titles, chips, controls, pagination, reader chrome, and footer text use explicit pixel floors. Browser smoke deliberately simulates a 10px host root to prevent regressions.

## Stable incremental archive and PageTual

The archive owns one primary `.mrm-card-grid`. Reconciliation is URL-keyed and idempotent: the runtime moves or reorders cards only when the current child sequence differs from the requested sequence. The MutationObserver ignores already-enhanced cards and queues only roots containing raw archive articles.

PageTual compatibility follows the repository’s shared content-site contract. The runtime accepts `postMessage({ command: "pagetual", action: "insert" })`, `pagetual:insert`, and `pagetual_page_inserted`; marks raw candidates; scans hidden source roots; moves unique cards into the primary grid; removes duplicate candidates; reapplies the current filter state; and performs immediate plus delayed settlement passes. Page bars and the side controller remain visible and are restyled rather than suppressed.

Metadata controls use card container queries. Wide cards show two terms plus an overflow count, narrow cards show one term plus an accurate compact overflow count, and every label ellipsizes inside its own button without clipping the overflow or dismiss controls.

## Phase 1 state model

Density is a named preference rather than a loose column count. Comfortable, Balanced, and Compact resolve to stable desktop/tablet/mobile column and gap presets in `03-theme`; the original sliders remain available as a Custom mode. This keeps the toolbar and settings panel synchronized without rewriting card DOM.

Read history and reader progress are separate stores. Opening the modal creates or advances a progress record, reopening resumes from the saved page, and reaching the final page promotes the post to read. Manual mark-read/unread remains available on every archive card; marking unread clears stale progress so the visual state cannot contradict itself.

The archive command bar is sticky under the desktop site shell and becomes a compact sticky control surface on mobile. All toolbar changes flow through shared preferences, so the workspace drawer, active chips, PageTual inserts, and current card set remain coherent.

## Phase 4 chrome and reader continuity

`08-app` now owns an adaptive chrome controller rather than a static clone of the WordPress header. It extracts unique native navigation links into five primary destinations plus an overflow `details` menu, marks current destinations, suppresses duplicated global search on archive/search pages, and uses a requestAnimationFrame scroll controller to hide/show the toolbar. The controller also toggles `mrm-header-hidden` on the root so `05-archive` can move its sticky overview into the vacated space without DOM churn.

Footer enhancement is clone-based and reversible through the makeover class. Source comments, taxonomy links, navigation, and copyright remain untouched in the hidden native footer. The generated `mrm-compact-footer` contains sanitized clones and is hidden whenever the site makeover is disabled.

`06-reader` keeps progress state in the existing bounded per-post store, but surfaces it through a semantic `progress` element and synchronized labels. Reader openings remember the invoking archive card and scroll position, sequence navigation resolves titles from the archive model, and focus mode remains ephemeral so it cannot strand a future session. Paged mobile gestures deliberately disable the legacy invisible tap zones so swipe and zoom receive real pointer input; strip modes retain the tap-zone contract.


## Phase 5 personal-library and adaptive-loading architecture

`01-storage` owns a bounded saved-post map alongside read history and reader progress. Saved state is keyed by canonical URL and dispatched through a dedicated event, so archive cards, post actions, filters, and an open reader update in place without rebuilding unrelated DOM. The Continue reading shelf is derived from loaded archive cards plus unfinished reader-progress records rather than maintaining a second competing content model.

Reader preferences now resolve through `readerPreferences()`: the legacy `reader` object is the shared migration/fallback layer, while `readerProfiles.mobile` and `readerProfiles.desktop` contain only device-specific overrides. Crossing the 760px breakpoint re-renders the open reader against the other profile without rewriting either profile.

Paged images are rendered with a durable `data-mrm-src` and only a bounded neighborhood receives `src`. Navigation expands that hydration window as needed. Network Information API hints are deliberately advisory: Data Saver and 2G-class effective types shrink the window and disable thumbnail/adjacent-post prefetch, while browsers without the API retain the normal bounded policy.

## Phase 6 accessibility and release architecture

`08-app` establishes a stable main-content target and injects the skip link before custom chrome. Focus indication is CSS-owned and shared across archive, settings, reader, footer, recovery, and modal controls. Modal ownership remains local to each component, but root lock classes provide one predictable background-scroll contract for the mobile workspace, facet directory, and metadata sheet.

The completion seal intentionally keeps build validation read-only for tracked MRM `dist` files. Source generation is explicit, while repository-wide validation verifies reproducibility, public npm resolution, canonical userscript metadata, the captured MRM HTML contracts, Chromium interactions, PageTual ingestion/quiescence, and post-validation payload hashes.
