# Migration

Run the guarded cleanup script after extracting the overlay into an older checkout:

```bash
bash tools/migrate-old-layout.sh --apply
```

It removes pre-normalization paths such as `extensions/mrm-suite-downloader`, `extensions/stardew-nexus-queue`, `userscripts/builders/manga-modern-ui`, and old underscore-heavy standalone userscript directories.

After cleanup:

```bash
npm install
npm run build
npm run check
git add -A
git commit -m "Normalize userscript and extension identifiers"
```
