# Legacy MyReadingManga retirement

The former `myreadingmanga-modern-reader` output from `userscripts/builders/manga-reader-modernizer` is retired. It is intentionally absent from both `src/original/` and `dist/`, and it is no longer listed as an install artifact in `repo-manifest.json`.

The supported replacement is `userscripts/builders/myreadingmanga-reimagined/dist/myreadingmanga-reimagined.user.js`. That script is the sole repository owner of the `https://myreadingmanga.info/*` userscript route.

YaoiMangaOnline and BaraMangaOnline remain supported by `manga-reader-modernizer`; retiring the MyReadingManga target does not retire those scripts.

Repository validation intentionally fails if the legacy source/dist filenames return, if the old output is restored to the manifest, or if another generated userscript claims the MyReadingManga route. Historical Git commits remain the source for the retired implementation if it ever needs to be inspected.
