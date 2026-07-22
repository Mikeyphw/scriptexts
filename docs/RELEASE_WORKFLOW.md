# Release workflow

1. Edit source in `userscripts/standalone`, `userscripts/builders`, or `extensions`.
2. Run `npm run build`.
3. Run `npm run check`.
4. Commit source and generated install artifacts together.

Userscripts are installed from `.user.js` files. `.meta.js` files are generated update beacons and should be committed beside their matching `.user.js` files.

The content-site builder emits both MenOfPorn and Bleeding Cool outputs from `userscripts/builders/content-site-modernizer`.


- `npm run build:content-sites` regenerates MenOfPorn, Bleeding Cool, and AIPT Comics userscripts plus their metadata files.
