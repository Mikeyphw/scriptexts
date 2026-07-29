# Release workflow

1. Edit source in `userscripts/standalone`, `userscripts/builders`, or `extensions`.
2. Run the relevant builder command, such as `npm run build:content-sites` for content-site profiles.
3. Run the deterministic checks.
4. Run optional browser smoke only for the changed surface.
5. Commit source and generated install artifacts together.

Userscripts are installed from `.user.js` files. `.meta.js` files are generated update beacons and should be committed beside their matching `.user.js` files.

## Content-site builder release checklist

The content-site builder is profile-driven and shared-runtime based. Use this browser-free sequence before release:

```bash
npm run build:content-sites
npm run content-sites:profiles:check
npm run content-sites:seal
npm --prefix userscripts/builders/content-site-modernizer run test
node tools/check-repo.mjs
```

`npm run content-sites:seal` verifies generated output freshness, profile/schema coverage, smoke config registration, manifest coverage, and docs markers without launching Playwright.

Use optional Playwright lanes according to the changed surface:

```bash
npm run smoke:content-sites:pagetual:focused
npm run smoke:content-sites:a11y:focused
npm run smoke:content-sites:visual:focused
npm run smoke:content-sites:live:drift:focused
```

## Other builders and extensions

- `npm run build:manga` regenerates manga reader userscripts.
- `npm run build:sims` regenerates Sims CC userscripts.
- `npm run build:extensions` rebuilds extension packages and checksums.
- `npm run check` validates the repository manifest, userscript metadata, syntax, and known generated artifact markers.

## Content-site release pack

After the content-site final seal passes, create the optional all-userscript release ZIP:

```bash
npm run content-sites:release-pack
```

The default output is `release/content-site-modernizer/content-site-modernizer-userscripts.zip`. The ZIP includes installable `.user.js` files, matching `.meta.js` update beacons, `manifest.json`, `checksums.sha256`, and `RELEASE_INDEX.md`.

Use check mode in deterministic validation or before writing an artifact:

```bash
npm run content-sites:release-pack:check
```

The release pack command uses a built-in dependency-free ZIP writer, so it does not require npm packages or a system `zip` binary.
