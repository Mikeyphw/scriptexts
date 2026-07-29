# Content-site final seal

The final seal is the browser-free release-readiness check for the `content-site-modernizer` builder. It verifies that the now-consolidated shared-runtime builder is internally consistent before a release or a new site onboarding pass.

Run it from the repository root:

```bash
npm run content-sites:seal
```

Machine-readable output is available for scripts:

```bash
npm run content-sites:seal:json
```

The same check can be run from the builder directory:

```bash
npm run seal
```

## What it checks

The seal checks the source-to-artifact chain without launching a browser:

- every registered profile validates through schema v1
- every site is built through the shared runtime profile path
- generated `.user.js` and `.meta.js` files exist for every profile
- generated output is fresh according to `build.mjs --check`
- `.meta.js` files remain metadata-only update beacons
- generated userscripts contain the normalized runtime profile payload
- `smoke.config.json` has one matching site entry per profile
- smoke entries reference the expected generated userscript path
- home fixtures and guarded live URLs are registered for each site
- root and builder package scripts expose the expected command surface
- repo docs and manifest mention the final seal policy

## What it does not do

The seal intentionally does not run Playwright. Browser checks remain opt-in through the smoke lanes:

```bash
npm run smoke:content-sites:pagetual:focused
npm run smoke:content-sites:a11y:focused
npm run smoke:content-sites:visual:focused
npm run smoke:content-sites:live:drift:focused
```

This keeps normal Devtool overlay validation fast, deterministic, and offline-friendly while still making browser proof available when needed.

## Recommended release order

For a content-site runtime/profile change, use this sequence:

```bash
npm run build:content-sites
npm run content-sites:profiles:check
npm run content-sites:seal
npm --prefix userscripts/builders/content-site-modernizer run test
node tools/check-repo.mjs
```

After that, run whichever optional Playwright lane matches the risk of the change. For example, PageTual changes should run the PageTual contract; accessibility changes should run the a11y contract; visual CSS changes should run visual compare.

## Release pack handoff

Once the final seal passes, produce the optional all-userscript release ZIP:

```bash
npm run content-sites:release-pack
```

The release packer verifies generated output freshness, profile metadata versions, and per-file SHA-256 checksums before writing `release/content-site-modernizer/content-site-modernizer-userscripts.zip`. Use `npm run content-sites:release-pack:check` for the same release-pack validation without writing the ZIP.
