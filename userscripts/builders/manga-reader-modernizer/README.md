# Manga Reader Modernizer builder

Independent builder for the MyReadingManga, YaoiMangaOnline, and BaraMangaOnline modern-reader userscripts. Its source-of-truth files live under `src/original/`; `build.mjs` normalizes userscript metadata and writes installable files to `dist/`.

## Build

```bash
npm install
npm run build
```

Install only the generated files:

- `dist/myreadingmanga-modern-reader.user.js`
- `dist/yaoimangaonline-modern-reader.user.js`
- `dist/baramangaonline-modern-reader.user.js`

Each generated userscript also receives a `.meta.js` file for userscript-manager update checks.

This builder is unrelated to the Sims CC Basket builder. They share the repository but not a build system or source format.
