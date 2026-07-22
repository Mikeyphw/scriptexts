# Content Site Modernizer

Shared userscript builder for dense WordPress/news-style sites that need a modern dark, flat, borderless, mobile-first interface.

## Outputs

- `dist/aipt-comics-modern-reader.user.js`
- `dist/bleeding-cool-modern-reader.user.js`
- `dist/menofporn-modern-ui.user.js`

Each output also gets a `.meta.js` update file. Install the `.user.js` file; userscript managers use `.meta.js` for lightweight update checks.

## Source model

MenOfPorn is imported as a builder-managed source script in `src/sites/menofporn/` so the v1.4 repair work is preserved. Bleeding Cool and AIPT Comics use the shared `src/core/` runtime with site profiles under `src/profiles/`.

## Commands

```bash
npm run build
npm run check
```
