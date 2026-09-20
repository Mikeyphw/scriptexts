import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';
import test from 'node:test';
import profile from '../src/profiles/bleeding-cool.mjs';

const root = new URL('../', import.meta.url);
const runtime = await readFile(new URL('src/core/runtime.template.js', root), 'utf8');
const policySource = await readFile(new URL('src/core/feed-layout.runtime.js', root), 'utf8');
const runtimeLoader = await readFile(new URL('src/core/runtime.mjs', root), 'utf8');
const css = await readFile(new URL('src/core/styles.css', root), 'utf8');
const fixture = await readFile(new URL('test/fixtures/bleeding-cool-feed-mobile-regression.html', root), 'utf8');

function loadPolicy() {
  const context = {};
  vm.createContext(context);
  vm.runInContext(`${policySource}\nthis.api={csmFeedVariantForIndex,csmInteractionProfile};`, context);
  return context.api;
}
const policy = loadPolicy();

function ruleFor(selectorFragment) {
  return [...css.matchAll(/([^{}]+)\{([^{}]*)\}/g)]
    .filter((block) => block[1].includes(selectorFragment))
    .map((block) => block[2])
    .join('\n');
}

test('feed variants are deterministic: one featured story then standard cards', () => {
  assert.equal(profile.client.layout.featuredCardCount, 1);
  assert.equal(policy.csmFeedVariantForIndex(0, 1), 'featured');
  assert.equal(policy.csmFeedVariantForIndex(1, 1), 'standard');
  assert.equal(policy.csmFeedVariantForIndex(99, 1), 'standard');
  assert.match(runtime, /applyFeedCardVariants\(grid\)/);
  assert.match(runtime, /csm-card-featured/);
  assert.match(runtime, /csm-card-standard/);
  assert.doesNotMatch(css, /csm-site-bleeding-cool-modern-reader[^\n,{]*\.csm-card:first-child/, 'Bleeding Cool geometry must be variant-class driven, not accidental first-child styling');
  assert.match(fixture, /id="story-featured"/);
  assert.match(fixture, /id="story-standard-portrait"/);
  assert.match(fixture, /id="story-standard-landscape"/);
});

test('wide coarse-pointer and Android profiles get mobile behavior independent of CSS width', () => {
  const wideCoarse = policy.csmInteractionProfile({ width: 1280, coarsePointer: true, maxTouchPoints: 5, breakpoint: 760 });
  const wideAndroid = policy.csmInteractionProfile({ width: 1280, userAgent: 'Mozilla/5.0 (Android 16; Mobile)', breakpoint: 760 });
  const desktop = policy.csmInteractionProfile({ width: 1280, userAgent: 'Mozilla/5.0 (X11; Linux x86_64)', breakpoint: 760 });
  const hybridDesktop = policy.csmInteractionProfile({ width: 1440, userAgent: 'Mozilla/5.0 (Windows NT 10.0)', anyCoarsePointer: true, maxTouchPoints: 10, breakpoint: 760 });
  assert.equal(wideCoarse.mobile, true);
  assert.equal(wideCoarse.coarse, true);
  assert.equal(wideAndroid.mobile, true);
  assert.equal(desktop.mobile, false);
  assert.equal(hybridDesktop.mobile, false, 'a large fine-pointer/touch desktop must not be forced into mobile layout by any-pointer alone');
  assert.match(runtime, /csm-mobile-profile/);
  assert.match(runtime, /\(any-pointer: coarse\)/);
  assert.match(runtime, /orientationchange/);
  assert.match(css, /html\.csm-mobile-profile\.csm-feed-mode\.csm-site-bleeding-cool-modern-reader/);
  assert.match(ruleFor('html.csm-mobile-profile.csm-site-bleeding-cool-modern-reader .csm-bottomnav'), /display:\s*grid\s*!important/);
  assert.match(ruleFor('.csm-feed-grid > .csm-card'), /grid-column:\s*1 \/ -1\s*!important/);
});

test('feed thumbnails fill deliberate card geometry while article media remains uncropped', () => {
  assert.equal(profile.client.layout.cardImageFit, 'cover');
  const feedRule = ruleFor('html.csm-feed-mode.csm-site-bleeding-cool-modern-reader .csm-card img');
  const articleRule = ruleFor('html.csm-article-mode.csm-site-bleeding-cool-modern-reader .csm-article img');
  assert.match(feedRule, /object-fit:\s*cover\s*!important/);
  assert.match(articleRule, /object-fit:\s*contain\s*!important/);
  assert.match(ruleFor('.csm-card-standard .csm-card-media'), /min-height:\s*128px\s*!important/);
});

test('mobile feed density clamps summaries to two lines and uses a compact standard-card layout', () => {
  const summaryRule = ruleFor('.csm-card-standard .csm-card-summary');
  const standardRule = ruleFor('.csm-card-standard');
  assert.match(summaryRule, /-webkit-line-clamp:\s*2\s*!important/);
  assert.match(summaryRule, /line-clamp:\s*2\s*!important/);
  assert.match(standardRule, /grid-template-columns:\s*minmax\(112px, 36%\) minmax\(0, 1fr\)\s*!important/);
  assert.match(fixture, /must use the standard two-line mobile summary contract/);
});

test('breaking-news strip is rebuilt as an accessible horizontally scrollable surface', () => {
  assert.match(profile.client.selectors.feed.breaking, /td-trending-now-wrap/);
  assert.match(runtime, /installNewsTicker\(articleMode\)/);
  assert.match(runtime, /source\.classList\.add\('csm-source-hidden'\)/);
  assert.match(runtime, /aria-label', 'Breaking news'/);
  const tickerRule = ruleFor('.csm-news-ticker');
  const itemRule = ruleFor('.csm-news-ticker-item');
  assert.match(tickerRule, /overflow-x:\s*auto\s*!important/);
  assert.match(tickerRule, /white-space:\s*nowrap\s*!important/);
  assert.match(itemRule, /text-overflow:\s*ellipsis\s*!important/);
  assert.match(fixture, /td-trending-now-wrap/);
});

test('Bleeding Cool bottom navigation is less dominant but preserves touch size and safe-area inset', () => {
  const navRule = ruleFor('html.csm-site-bleeding-cool-modern-reader .csm-bottomnav');
  const buttonRule = ruleFor('html.csm-site-bleeding-cool-modern-reader .csm-bottomnav button');
  assert.match(navRule, /env\(safe-area-inset-bottom\)/);
  assert.match(navRule, /padding:\s*\.22rem\s*!important/);
  const minHeight = Number(buttonRule.match(/min-height:\s*(\d+)px\s*!important/)?.[1] || 0);
  assert.ok(minHeight >= 44, `touch target must stay >=44px, got ${minHeight}`);
  assert.match(buttonRule, /font-size:\s*\.76rem\s*!important/);
});

test('generated runtime loads the feed-layout policy that regression tests execute', () => {
  assert.match(runtimeLoader, /feed-layout\.runtime\.js/);
  assert.match(runtimeLoader, /\$\{feedLayoutPolicy\}/);
});
