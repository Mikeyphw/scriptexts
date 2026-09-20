# Manga Reader Modernizer builder

Independent builder for the supported **YaoiMangaOnline** and **BaraMangaOnline** modern-reader userscripts. Source-of-truth files live under `src/original/`; `build.mjs` normalizes userscript metadata and writes installable files to `dist/`.

## MyReadingManga retirement

The legacy `myreadingmanga-modern-reader` target is retired and is no longer built, validated, released, or shipped from this builder. The canonical MyReadingManga implementation is:

`userscripts/builders/myreadingmanga-reimagined/dist/myreadingmanga-reimagined.user.js`

Do not re-add the old MyReadingManga source or dist artifacts to this builder. Regression tests and the repository static checker enforce single ownership of `myreadingmanga.info`.

## Build and validate

```bash
npm install
npm run build
npm run check
```

Install only the generated files:

- `dist/yaoimangaonline-modern-reader.user.js`
- `dist/baramangaonline-modern-reader.user.js`

Each generated userscript also receives a `.meta.js` file for userscript-manager update checks. `npm run build:check` verifies that committed dist artifacts are byte-for-byte current without rewriting them.

This builder is unrelated to the Sims CC Basket builder. They share the repository but not a build system or source format.
