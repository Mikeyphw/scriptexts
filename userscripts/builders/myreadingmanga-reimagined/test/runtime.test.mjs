import assert from "node:assert/strict";
import { readFile, stat } from "node:fs/promises";
import { test } from "node:test";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(fileURLToPath(import.meta.url));
const fixture = (name) => readFile(join(root, "fixtures", name), "utf8");
const output = () => readFile(join(root, "..", "dist", "myreadingmanga-reimagined.user.js"), "utf8");
const run = promisify(execFile);

test("fixtures cover every supported page type", async () => {
  const [home, genre, search, post] = await Promise.all([fixture("mrm-home.html"), fixture("mrm-genre.html"), fixture("mrm-search.html"), fixture("mrm-post.html")]);
  assert.match(home, /body class="home blog/);
  assert.ok((home.match(/<article\b/g) || []).length >= 70);
  assert.match(genre, /body class="archive tax-genre/);
  assert.ok((genre.match(/entry-title-link/g) || []).length >= 30);
  assert.match(search, /body class="search search-results/);
  assert.match(search, /ep-filter-widget widget_ep-facet/);
  assert.match(search, /ep_filter_post_tag=/);
  assert.match(post, /body class="wp-singular post-template-default single single-post/);
  assert.ok((post.match(/img-myreadingmanga/g) || []).length >= 20);
  assert.match(post, /id=comments\b/);
});

test("generated userscript is a clean modular build", async () => {
  const script = await output();
  assert.match(script, /@name\s+MyReadingManga Reimagined/);
  assert.match(script, /@version\s+6\.7\.0/);
  assert.match(script, /module: 00-core\.js/);
  assert.match(script, /module: 08-app\.js/);
  assert.doesNotMatch(script, /src\/original\/myreadingmanga-modern-reader/);
  assert.doesNotMatch(script, /Manga Archive Panel \+ Reader Popup/);
});

test("feature contracts remain present in the rebuilt runtime", async () => {
  const script = await output();
  const markers = [
    "Hide read", "Only English", "Mark visible read", "title-asc", "english-first",
    "ep_filter_post_tag", "14 * 24 * 60 * 60 * 1000", "pagetual:insert",
    "Strip + gaps", "Fit height", "previous-post", "mrm-reader-scrubber",
    "requestFullscreen", "IntersectionObserver", "mrm-reader-mobile-zones", "const updateNavigation",
    "Enable site makeover", "Enable MRM UI", "Desktop columns", "Cover ratio",
    "Clear read history", "Comments", "Open post", "Cross-origin reader fetch blocked",
    "Apply filters on site", "ep_sort", "mrm-facet-modal-pagination", "cuntboy", "shota",
    "reader-pages:", "30 * 60 * 1000", "naturalWidth",
  ];
  for (const marker of markers) assert.ok(script.includes(marker), `missing feature marker: ${marker}`);
});


test("generated metadata uses repository canonical field order", async () => {
  const script = await output();
  const header = script.match(/^\/\/ ==UserScript==[\s\S]*?^\/\/ ==\/UserScript==/m)?.[0];
  assert.ok(header, "missing userscript header");
  const fields = [...header.matchAll(/^\/\/ @([A-Za-z0-9:_-]+)\s+/gm)].map((match) => match[1]);
  assert.deepEqual(fields.slice(0, 9), [
    "name", "namespace", "homepageURL", "supportURL", "updateURL", "downloadURL", "version", "description", "run-at",
  ]);
});

test("disabled makeover does not disable the reader runtime", async () => {
  const script = await output();
  assert.match(script, /classList\.toggle\("mrm-ui-disabled"/);
  assert.match(script, /MRM\.reader\.installPostButtons\(\)/);
  assert.match(script, /MRM\.settings\.installRecoveryButton\(\)/);
  assert.doesNotMatch(script, /if \(!MRM\.storage\.preferences\.uiEnabled\) return/);
});


test("hidden panel CSS contract prevents invisible click interception", async () => {
  const script = await output();
  assert.match(script, /\.mrm-control-panel\[hidden\] \{ display: none !important; \}/);
});


test("native search URL contract and default exclusions are generated", async () => {
  const script = await output();
  assert.match(script, /ep_filter_lang/);
  assert.match(script, /ep_filter_artist/);
  assert.match(script, /url\.searchParams\.set\("ep_sort"/);
  assert.match(script, /exclude: \{ tag: \["cuntboy", "ai", "shota"\] \}/);
  assert.match(script, /preferences = \{ \.\.\.preferences, filters: clone\(filters\) \}/);
});



test("mobile archive and inline post geometry are sealed", async () => {
  const script = await output();
  assert.match(script, /className: "mrm-card-grid"/);
  assert.match(script, /\.mrm-card-grid > \.mrm-card/);
  assert.match(script, /width: auto !important;/);
  assert.match(script, /width: min\(100%, 1100px\) !important;/);
});


test("desktop visual hierarchy and site shell are sealed", async () => {
  const script = await output();
  const markers = [
    "mrm-site-toolbar", "MyReadingManga archive", "mrm-archive-overview",
    "Search titles, artists, groups, tags", "mrm-overview-sort", "All filters",
    "mrm-overview-density", "data-overview-toggle", "mrm-launcher-count",
    "Fit entire cover", "data-mrm-cover-fit", "slice(0, 2)",
    "archive-pagination a", "mrm-footer-more", "density: \"balanced\"",
    "grid: { density: \"balanced\", desktop: 5", "coverFit: \"contain\"",
  ];
  for (const marker of markers) assert.ok(script.includes(marker), `missing visual-shell marker: ${marker}`);
  assert.match(script, /collectNavigationLinks/);
  assert.match(script, /mrm-compact-footer/);
  assert.match(script, /appendOverflow\(links, browseLinks, 14/);
});


test("typography is isolated from the host root font size", async () => {
  const script = await output();
  const markers = [
    "--mrm-type-base: 16px", "font-size: clamp(15px", "font-size: 12px",
    ".mrm-control-panel", ".mrm-reader-modal", "slice(0, 2)",
  ];
  for (const marker of markers) assert.ok(script.includes(marker), `missing typography marker: ${marker}`);
  assert.doesNotMatch(script, /font-size:\s*[^;{}]*rem/);
});


test("archive chips and PageTual mutation stability are sealed", async () => {
  const script = await output();
  for (const marker of [
    "pageTualCandidateAttr", "syncGridOrder", "desired.every",
    "rawArticleRoots", "markPageTualCandidates", "removeDuplicateCandidate",
    "data.command === \"pagetual\"", "data.action === \"insert\"",
    "handlePageTualInsert", "queueScan(document, 90)",
    "mrm-chip-label", "mrm-filter-chip-remove", "mrm-taxonomy-more-compact",
    "grid-column: 1 / -1 !important", "max-height: none !important"
  ]) assert.ok(script.includes(marker), `missing stability marker: ${marker}`);
  assert.doesNotMatch(script, /for \(const card of visible\)[\s\S]{0,120}root\.append/);
});


test("phase 1 density, hierarchy, and read-progress contracts are sealed", async () => {
  const script = await output();
  for (const marker of [
    "comfortable: { desktop: 4", "balanced: { desktop: 5", "compact: { desktop: 6",
    "mrm-card-language-badge", "mrm-card-state-badge", "mrm-card-byline",
    "mrm-card-progress", "mrm-card-read-toggle", "Mark unread", "Continue",
    "reader-progress", "getReaderProgress", "setReaderProgress", "unmarkRead",
    "requestAnimationFrame(() => goTo(state.pageIndex, false))",
    "role=\"radiogroup\" aria-label=\"Archive density\"",
    "data-overview-toggle=\"onlyEnglish\"", "data-overview-toggle=\"hideRead\"",
  ]) assert.ok(script.includes(marker), `missing phase 1 marker: ${marker}`);
  assert.doesNotMatch(script, /\.mrm-is-read \{ opacity:/);
});

test("builder check mode verifies dist without rewriting release artifacts", async () => {
  const builder = join(root, "..", "build.mjs");
  const artifacts = [
    join(root, "..", "dist", "myreadingmanga-reimagined.user.js"),
    join(root, "..", "dist", "myreadingmanga-reimagined.meta.js"),
  ];
  const before = await Promise.all(artifacts.map(async (path) => ({
    content: await readFile(path),
    mtimeNs: (await stat(path, { bigint: true })).mtimeNs,
  })));
  const { stdout } = await run(process.execPath, [builder, "--check"], { cwd: join(root, "..") });
  assert.match(stdout, /verified 2 generated artifacts without rewriting dist/);
  const after = await Promise.all(artifacts.map(async (path) => ({
    content: await readFile(path),
    mtimeNs: (await stat(path, { bigint: true })).mtimeNs,
  })));
  for (let index = 0; index < artifacts.length; index += 1) {
    assert.deepEqual(after[index].content, before[index].content, `${artifacts[index]} content changed`);
    assert.equal(after[index].mtimeNs, before[index].mtimeNs, `${artifacts[index]} was rewritten`);
  }
});

test("repository root build verifies MRM dist instead of rewriting it", async () => {
  const repositoryPackage = JSON.parse(await readFile(join(root, "..", "..", "..", "..", "package.json"), "utf8"));
  assert.equal(
    repositoryPackage.scripts["build:mrm-reimagined"],
    "npm --prefix userscripts/builders/myreadingmanga-reimagined run build:verify",
  );
  assert.equal(
    repositoryPackage.scripts["build:mrm-reimagined:write"],
    "npm --prefix userscripts/builders/myreadingmanga-reimagined run build",
  );
});


test("phase 2 saved views and grouped metadata contracts are sealed", async () => {
  const generated = await output();
  assert.match(generated, /savedViews:\s*\[\]/);
  assert.match(generated, /const saveView =/);
  assert.match(generated, /English unread/);
  assert.match(generated, /text: "Include"/);
  assert.match(generated, /text: "Exclude"/);
  assert.match(generated, /openMetadataPopover/);
  assert.match(generated, /mrm-metadata-group-chips/);
  assert.match(generated, /height: min\(92dvh, 860px\)/);
});


test("phase 3 PageTual continuity and long-archive performance contracts are sealed", async () => {
  const generated = await output();
  for (const marker of [
    "mrm-page-separator", "mrm-page-load-status", "Loading the next page…",
    "taking longer than expected", "mrm-scroll-position", "schedulePositionUpdate",
    "archivePositionObserver", "addPageSeparator", "syncPageSeparators",
    "content-visibility: auto", "contain-intrinsic-size", "12000",
    "Page ${pageSequence} loaded · ${added} new releases"
  ]) assert.ok(generated.includes(marker), `missing phase 3 marker: ${marker}`);
});

test("phase 4 adaptive chrome and reader continuity contracts are sealed", async () => {
  const generated = await output();
  for (const marker of [
    "mrm-site-toolbar-hidden", "installToolbarMotion", "mrm-site-toolbar-no-search",
    "mrm-site-more-menu", "aria-current", "Recent comments", "Browse", "Site links",
    "mrm-compact-footer-grid", "mrm-reader-progress-meter", "mrm-reader-progress-label",
    "Back to archive", "sequenceInfo", "Resuming ${state.title}", "mrm-reader-mobile-controls",
    "toggleFocus", "is-focus-mode", "onPointerDown", "onPointerUp", "onDoubleClick",
    "is-image-zoomed", "d: toggleFocus",
  ]) assert.ok(generated.includes(marker), `missing phase 4 marker: ${marker}`);
  assert.match(generated, /archiveOwnsSearch = MRM\.runtime\.page === "archive" \|\| MRM\.runtime\.page === "search"/);
  assert.match(generated, /html\.mrm-ui-disabled \.mrm-compact-footer \{ display: none !important; \}/);
});



test("phase 5 personal library and adaptive reader contracts are sealed", async () => {
  const generated = await output();
  for (const marker of [
    "saved-posts", "onlySaved", "Saved for later", "mrm-card-save-toggle",
    "mrm-continue-shelf", "Continue reading", "readerProfiles", "readerDevice",
    "readerPreferences", "updateReaderPreferences", "constrainedConnection",
    "pagedPrefetchRadius", "hydratePagedWindow", "data-mrm-src", "Save for later (S)",
  ]) assert.ok(generated.includes(marker), `missing phase 5 marker: ${marker}`);
  assert.match(generated, /if \(constrainedConnection\(\)\) return;/);
  assert.match(generated, /matchMedia\("\(max-width: 760px\)"\)/);
});

test("phase 6 accessibility and release-hardening contracts are sealed", async () => {
  const generated = await output();
  for (const marker of [
    "mrm-skip-link", "Skip to content", "--mrm-focus-ring", ":focus-visible",
    "mrm-panel-open", "mrm-modal-open", "mrm-metadata-open", "prefers-contrast: more",
    "aria-pressed", "Clear saved posts", "Reader controls are remembered separately",
  ]) assert.ok(generated.includes(marker), `missing phase 6 marker: ${marker}`);
  assert.match(generated, /\.mrm-reader-toolbar button, \.mrm-reader-footer button \{ min-height: 44px; \}/);
});
