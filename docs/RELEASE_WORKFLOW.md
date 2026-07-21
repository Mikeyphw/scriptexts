# Release workflow

1. Edit source in `userscripts/standalone`, `userscripts/builders`, or `extensions`.
2. Run `npm run build`.
3. Run `npm run check`.
4. Commit source plus generated install artifacts.

Userscript updates work through raw GitHub URLs:

- `@updateURL` points to the generated `.meta.js` file.
- `@downloadURL` points to the installable `.user.js` file.

Browser extensions use rebuilt unsigned XPIs under `extensions/<slug>/dist/`. Because extension IDs are repository-owned, signed upstream packages are not reused.
