import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';
import test from 'node:test';
import profile from '../src/profiles/bleeding-cool.mjs';

const root = new URL('../', import.meta.url);
const runtime = await readFile(new URL('src/core/runtime.template.js', root), 'utf8');
const runtimeLoader = await readFile(new URL('src/core/runtime.mjs', root), 'utf8');
const detectionSource = await readFile(new URL('src/core/article-detection.runtime.js', root), 'utf8');
const cleanupSource = await readFile(new URL('src/core/article-cleanup.runtime.js', root), 'utf8');
const feedSource = await readFile(new URL('src/core/feed-layout.runtime.js', root), 'utf8');
const css = await readFile(new URL('src/core/styles.css', root), 'utf8');
const longArticle = await readFile(new URL('test/fixtures/bleeding-cool-release-long-article.html', root), 'utf8');
const largeFeed = await readFile(new URL('test/fixtures/bleeding-cool-release-large-feed.html', root), 'utf8');
const home = await readFile(new URL('test/fixtures/bleeding-cool-home.html', root), 'utf8');
const comics = await readFile(new URL('test/fixtures/bleeding-cool-comics.html', root), 'utf8');
const tv = await readFile(new URL('test/fixtures/bleeding-cool-tv.html', root), 'utf8');
const post = await readFile(new URL('test/fixtures/bleeding-cool-post.html', root), 'utf8');

function loadPolicy(source, names) {
  const context = {};
  vm.createContext(context);
  vm.runInContext(`${source}\nthis.api={${names.join(',')}};`, context);
  return context.api;
}
const detection = loadPolicy(detectionSource, ['csmArticleDecision']);
const cleanup = loadPolicy(cleanupSource, ['csmShouldHideMismatchedCaption','csmTitleTokenOverlap']);
const feed = loadPolicy(feedSource, ['csmFeedVariantForIndex','csmInteractionProfile']);

function rulesContaining(fragment) {
  return [...css.matchAll(/([^{}]+)\{([^{}]*)\}/g)]
    .filter((block) => block[1].includes(fragment))
    .map((block) => block[2]).join('\n');
}

test('article decision policy rejects feed evidence and accepts article evidence/hints', () => {
  assert.equal(detection.csmArticleDecision({ hintMatched: false, evidenceScore: 1, evidenceCount: 4, evidenceMin: 2 }), false);
  assert.equal(detection.csmArticleDecision({ hintMatched: false, evidenceScore: 2, evidenceCount: 4, evidenceMin: 2 }), true);
  assert.equal(detection.csmArticleDecision({ hintMatched: true, evidenceScore: 0, evidenceCount: 4, evidenceMin: 2 }), true);
  assert.equal(detection.csmArticleDecision({ hintMatched: false, evidenceScore: 99, evidenceCount: 0, evidenceMin: 2 }), false);
  assert.match(runtime, /csmArticleDecision\(\{/);
  assert.match(runtimeLoader, /article-detection\.runtime\.js/);
});

test('home, category, TV and post fixtures remain represented in release coverage', () => {
  assert.match(home, /bleedingcool\.com\/?(?:[\"'])/i);
  assert.match(comics, /bleedingcool\.com\/comics\//i);
  assert.match(tv, /bleedingcool\.com\/tv\//i);
  assert.match(post, /bleedingcool\.com\/(?:comics|tv|movies|games|collectibles|wrestling)\/[^\"'<]+/i);
  assert.ok(profile.matches.includes('https://bleedingcool.com/*'));
  assert.ok(profile.matches.includes('https://www.bleedingcool.com/*'));
});

test('long article fixture proves text after media and end-of-article copy are release invariants', () => {
  const paragraphs = [...longArticle.matchAll(/LONG_ARTICLE_PARAGRAPH_/g)].length;
  assert.ok(paragraphs >= 30, `expected >=30 long-article paragraphs, got ${paragraphs}`);
  assert.match(longArticle, /<img[^>]*>[\s\S]*RELEASE_SENTINEL_AFTER_IMAGE:[\s\S]*END_RELEASE_SENTINEL/);
  assert.match(longArticle, /RELEASE_LIST_SENTINEL_AFTER_IMAGE/);
  assert.match(longArticle, /LONG_ARTICLE_PARAGRAPH_30/);
  const articleRule = rulesContaining('.td-post-content,.td-article-content,.entry-content,.post-content,');
  for (const invariant of [
    /-webkit-line-clamp:\s*unset\s*!important/,
    /line-clamp:\s*unset\s*!important/,
    /max-height:\s*none\s*!important/,
    /overflow:\s*visible\s*!important/,
    /text-overflow:\s*clip\s*!important/,
    /white-space:\s*normal\s*!important/
  ]) assert.match(articleRule, invariant);
  assert.match(rulesContaining('.csm-article li'), /overflow:\s*visible\s*!important/);
});

test('article bottom navigation cannot occlude the long article tail', () => {
  assert.match(css, /--csm-bottomnav-clearance:\s*calc\([^;]*env\(safe-area-inset-bottom/);
  assert.match(css, /html\.csm-article-mode\.csm-site-bleeding-cool-modern-reader body\s*\{[^}]*padding-bottom:\s*var\(--csm-bottomnav-clearance\)\s*!important/s);
  assert.deepEqual(profile.client.nav.articleBottom.map((item) => item.id), ['back','save','comments','top','more']);
});

test('cleanup and media-caption safety remain deterministic', () => {
  assert.equal(cleanup.csmShouldHideMismatchedCaption({ mediaLabel: 'INANNA THE NAME SHE LOST #2', caption: 'MONEY SHOT THE F* OFFS #4 (OF 5)', followingTitle: 'INANNA THE NAME SHE LOST #2' }), true);
  assert.equal(cleanup.csmShouldHideMismatchedCaption({ mediaLabel: 'BATMAN #21', caption: 'Variant cover by Jim Lee', followingTitle: 'BATMAN #21' }), false);
  assert.match(runtime, /cleanupArticleChrome\(root\)/);
  assert.match(runtime, /normalizeArticleMediaGroups\(root\)/);
  assert.match(runtime, /first\(captionSelector, group\)/);
  assert.doesNotMatch(runtime, /first\(captionSelector, content\)/);
});

test('large feed fixture stays a one-featured-rest-standard workload', () => {
  const count = [...largeFeed.matchAll(/<article id="release-card-/g)].length;
  assert.equal(count, 80);
  const variants = Array.from({ length: count }, (_, index) => feed.csmFeedVariantForIndex(index, profile.client.layout.featuredCardCount));
  assert.equal(variants.filter((value) => value === 'featured').length, 1);
  assert.equal(variants.filter((value) => value === 'standard').length, 79);
  assert.match(rulesContaining('.csm-card-standard .csm-card-summary'), /line-clamp:\s*2\s*!important/);
  assert.match(rulesContaining('html.csm-feed-mode.csm-site-bleeding-cool-modern-reader .csm-card img'), /object-fit:\s*cover\s*!important/);
});

test('mobile/wide-mobile release contract preserves Iceraven-style behavior without hijacking desktop', () => {
  const androidWide = feed.csmInteractionProfile({ width: 1280, userAgent: 'Mozilla/5.0 (Android 16; Mobile)', anyCoarsePointer: true, maxTouchPoints: 5, breakpoint: 760 });
  const coarseWide = feed.csmInteractionProfile({ width: 1100, coarsePointer: true, maxTouchPoints: 5, breakpoint: 760 });
  const desktop = feed.csmInteractionProfile({ width: 1440, userAgent: 'Mozilla/5.0 (X11; Linux x86_64)', anyCoarsePointer: true, maxTouchPoints: 10, breakpoint: 760 });
  assert.equal(androidWide.mobile, true);
  assert.equal(coarseWide.mobile, true);
  assert.equal(desktop.mobile, false);
  assert.match(rulesContaining('html.csm-mobile-profile.csm-site-bleeding-cool-modern-reader .csm-bottomnav'), /display:\s*grid\s*!important/);
});

test('core user-facing feature families remain configured', () => {
  const primary = new Set(profile.client.nav.primary.map((item) => item.id));
  for (const id of ['home','comics','tv','movies']) assert.ok(primary.has(id), `missing primary nav ${id}`);
  const feedBottom = new Set(profile.client.nav.bottom.map((item) => item.id));
  for (const id of ['home','browse','search','saved','more']) assert.ok(feedBottom.has(id), `missing feed action ${id}`);
  const articleBottom = new Set(profile.client.nav.articleBottom.map((item) => item.id));
  for (const id of ['back','save','comments','top','more']) assert.ok(articleBottom.has(id), `missing article action ${id}`);
  const actions = new Set([...profile.client.nav.bottom, ...profile.client.nav.articleBottom].map((item) => item.action));
  for (const action of actions) assert.match(runtime, new RegExp(`action === '${action}'`), `runtime must handle ${action}`);
});

test('release profile version and generated install artifact contract are sealed', async () => {
  assert.equal(profile.version, '0.1.7');
  const generated = await readFile(new URL('dist/bleeding-cool-modern-reader.user.js', root), 'utf8');
  assert.match(generated, /\/\/ @version\s+0\.1\.7/);
  assert.match(generated, /csmArticleDecision/);
  assert.match(generated, /csmShouldHideMismatchedCaption/);
  assert.match(generated, /csmInteractionProfile/);
});
