# LPSG Media Gallery Unlocker

Optimized LPSG media gallery and downloader userscript.

## Source model

This is a **standalone userscript**. The editable source and installable artifact are the same file:

- `lpsg-media-gallery-unlocker.user.js`

The companion `.meta.js` file is generated for userscript-manager updates. Edit the `.user.js` file directly, update its userscript `@version`, then run:

```bash
npm run build
npm run check
```

## Update metadata

- Namespace pattern: `https://github.com/Mikeyphw/scriptexts/userscripts/<script-slug>`
- `@updateURL`: raw GitHub `.meta.js`
- `@downloadURL`: raw GitHub `.user.js`

## Target

`https://www.lpsg.com/*`

## Imported version

`6.7.3-optimized`

## License

MIT.


## Development source and tests

The standalone `.user.js` is generated from `userscripts/builders/lpsg-media-gallery-unlocker/src/`. Run `npm run build:lpsg` to regenerate it, `npm run check:lpsg` to verify byte-for-byte reproducibility, and `npm run test:lpsg` for the dedicated XenForo/LPSG contract fixture suite. The gallery includes page filtering, selected-only filtering, and optional page grouping for navigating large scanned threads.

## Release seal

The LPSG builder has a deterministic final seal. Run `npm run seal:lpsg` from the repository root. It verifies byte-for-byte generated output reproducibility, userscript syntax, the complete LPSG regression suite, wide-mobile/Iceraven responsive contracts, large-gallery performance guardrails, and preservation of discovery, filtering, URL export, direct download, ZIP, selection, cache, lightbox, video, pagination and post-attribution features. `npm run seal:lpsg:json` emits machine-readable evidence.
