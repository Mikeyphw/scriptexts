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
