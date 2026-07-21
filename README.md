# scriptexts

Organized home for browser userscripts and Firefox extensions.

## Layout

```text
userscripts/
  standalone/                  Single-file installable userscripts
  builders/                    Projects that generate site-specific userscripts
extensions/                    Editable Firefox extension sources and rebuilt unsigned XPIs
tools/                         Repository checks, inventory, and userscript update metadata tools
```

## Identifier policy

- Firefox extension IDs use `<project-slug>@mikeyphw.scriptexts`.
- Userscript namespaces use `https://github.com/Mikeyphw/scriptexts/userscripts/<script-slug>`.
- Userscript `@updateURL` values point at `.meta.js` files in this repository's raw GitHub tree.
- Userscript `@downloadURL` values point at the installable `.user.js` files in the raw GitHub tree.

## Commands

```bash
npm install
npm run build
npm run check
npm run inventory
```

`npm run build` regenerates builder userscripts, extension XPIs, and `.meta.js` update files.
