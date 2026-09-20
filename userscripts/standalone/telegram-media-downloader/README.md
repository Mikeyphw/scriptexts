# Telegram Media Downloader

Standalone Telegram Web media downloader userscript.

## Source model

This is a **standalone userscript**. The editable source and installable artifact are the same file:

- `telegram-media-downloader.user.js`

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

`Telegram Web K, Z, and legacy web clients`

## Imported version

`1.212`

## License

GNU GPLv3.

## Runtime v2

The userscript uses MutationObserver-driven WebK/WebZ discovery and a shared cancellable media transfer engine with bounded retries, Range validation, and a 256 MiB in-memory fallback guard. Run `npm run test:telegram` from the repository root for its regression suite.
