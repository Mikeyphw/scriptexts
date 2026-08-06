# Architecture

The generated userscript is a single IIFE, but the source is deliberately not monolithic.

1. `00-core` defines runtime state, selectors, DOM helpers, safe same-origin fetching, image source resolution, and accessibility utilities.
2. `01-storage` owns schema defaults, deep migration, local read history, and the 14-day facet cache.
3. `02-site-model` translates captured MRM HTML into cards, taxonomies, native facets, manga pages, comments, and page type.
4. `03-theme` injects the built CSS and maps settings to CSS variables/data attributes.
5. `04-facets` owns IN/OUT filter semantics and ElasticPress URL generation.
6. `05-archive` enhances cards, filters/sorts them, tracks dynamic inserts, and exposes visible-post sequences to the reader.
7. `06-reader` owns fetched post parsing, all reader modes, comments, keyboard/mobile navigation, and post-page actions.
8. `07-settings` renders the control panel and facet directory.
9. `08-app` performs page-specific startup.

The build script concatenates modules in lexical order, embeds the combined CSS and immutable config, and generates both installable and metadata-only files. No legacy MRM source file is read by this builder.

Future site migrations should add a site adapter rather than embedding selectors throughout the runtime. For now, this builder intentionally accepts only `myreadingmanga.info`.
