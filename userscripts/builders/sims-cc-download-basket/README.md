# Sims CC Download Basket builder

Independent target-aware builder for the ModTheSims, Simblr.cc, and The Sims Resource userscripts. Shared behavior lives in `src/core/`, site adapters live in `src/sites/`, and target entry points live in `src/entry/`.

## Build

```bash
npm install
npm run build
```

Install only the generated files under `dist/`.

This builder is specific to Sims CC Basket. It is not the source model for MenOfPorn or the Manga builder.

## Regression and release seal

Run `npm test` for the MTS, Simblr and TSR fixture/contracts. Run `npm run seal` for deterministic build verification, regression tests, and syntax checks. The download queue supports cancellation between files and retrying failed entries; basket normalization preserves the versioned shared-storage model and duplicate fingerprints.
