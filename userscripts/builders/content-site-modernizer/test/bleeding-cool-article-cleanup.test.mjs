import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';
import test from 'node:test';
import profile from '../src/profiles/bleeding-cool.mjs';

const root = new URL('../', import.meta.url);
const runtime = await readFile(new URL('src/core/runtime.template.js', root), 'utf8');
const policySource = await readFile(new URL('src/core/article-cleanup.runtime.js', root), 'utf8');
const runtimeLoader = await readFile(new URL('src/core/runtime.mjs', root), 'utf8');
const css = await readFile(new URL('src/core/styles.css', root), 'utf8');
const fixture = await readFile(new URL('test/fixtures/bleeding-cool-article-cleanup-regression.html', root), 'utf8');

function loadPolicy() {
  const context = {};
  vm.createContext(context);
  vm.runInContext(`${policySource}\nthis.api={csmNormalizeCleanupText,csmTitleTokenOverlap,csmLooksLikeCompetingProductTitle,csmShouldHideMismatchedCaption};`, context);
  return context.api;
}

const policy = loadPolicy();

test('tail chrome cleanup is structural and does not key off ordinary editorial mentions', () => {
  const cleanup = profile.client.articleCleanup;
  assert.equal(cleanup.sharePromptText, 'Enjoyed this? Please share on social media!');
  assert.match(cleanup.googleNewsLinkSelector, /news\.google\.com/);
  assert.match(runtime, /csmNormalizeCleanupText\(node\.textContent\) !== sharePrompt/);
  assert.match(runtime, /if \(tailMarkers\.length\)/);
  assert.match(runtime, /\/\^About\\s\+\/i/);
  assert.match(runtime, /followsTailMarker\(heading\)/);
  assert.match(fixture, /id="editorial-reference"[^>]*>[^<]*Facebook sharing, Google News discovery, Twitter\/X discourse, and an author biography/);
  assert.doesNotMatch(cleanup.hideSelectors.join('\n'), /editorial-reference|Facebook sharing|Google News discovery|author biography/i);
  assert.match(fixture, /id="editorial-google-link"[\s\S]*news\.google\.com\/articles\/editorial-example/);
  assert.match(fixture, /id="editorial-facebook-link"[\s\S]*facebook\.com\/example-publication[\s\S]*twitter\.com\/example-publication/);
  assert.match(runtime, /if \(!hasPromoBadge && linkText !== googlePromoText\) continue/);
});

test('known Bleeding Cool share, Google News and author-tail markers are covered', () => {
  const cleanup = profile.client.articleCleanup;
  assert.match(fixture, /id="share-prompt">Enjoyed this\? Please share on social media!/);
  assert.match(fixture, /href="https:\/\/news\.google\.com\/publications\/example"/);
  assert.match(fixture, /id="author-heading">About Jude Terror LOLtron/);
  assert.match(fixture, /id="comments-boundary">Comments will load/);
  assert.ok(cleanup.authorStopTextPrefixes.some((text) => text.startsWith('Comments will load')));
  assert.match(runtime, /isSocialOnly/);
  assert.match(runtime, /socialImages = \$\$\('img\[src\*="social_"\]/);
  assert.match(runtime, /safeHideArticleNode\(box, content\)/);
  assert.match(runtime, /maxAuthorSiblingScan/);
  assert.doesNotMatch(cleanup.googleNewsContainerSelector, /(^|,)section(,|$)/, 'Google News cleanup must not climb into a generic section');
  assert.doesNotMatch(cleanup.authorContainerSelector, /(^|,)section(,|$)/, 'author cleanup must not hide a generic article section');
});

test('media caption mismatch policy hides only a strongly contradictory local caption', () => {
  const mismatch = policy.csmShouldHideMismatchedCaption({
    mediaLabel: 'INANNA THE NAME SHE LOST #2',
    caption: 'MONEY SHOT THE F* OFFS #4 (OF 5)',
    followingTitle: 'INANNA THE NAME SHE LOST #2'
  });
  const correct = policy.csmShouldHideMismatchedCaption({
    mediaLabel: 'MONEY SHOT THE F* OFFS #4 (OF 5)',
    caption: 'MONEY SHOT THE F* OFFS #4 (OF 5)',
    followingTitle: 'MONEY SHOT THE F* OFFS #4 (OF 5)'
  });
  const unrelatedProse = policy.csmShouldHideMismatchedCaption({
    mediaLabel: 'Cover image',
    caption: 'Photo supplied by the publisher',
    followingTitle: 'The story continues below'
  });
  const validDescriptiveCaption = policy.csmShouldHideMismatchedCaption({
    mediaLabel: 'BATMAN #21',
    caption: 'Variant cover by Jim Lee',
    followingTitle: 'BATMAN #21'
  });
  assert.equal(mismatch, true);
  assert.equal(correct, false);
  assert.equal(unrelatedProse, false);
  assert.equal(validDescriptiveCaption, false, 'descriptive captions must not be mistaken for a competing product title');
  assert.ok(policy.csmTitleTokenOverlap('INANNA THE NAME SHE LOST #2', 'INANNA THE NAME SHE LOST #2') >= 0.9);
});

test('caption association stays local to each semantic media group', () => {
  assert.match(fixture, /<figure id="inanna-group">[\s\S]*?<figcaption>MONEY SHOT THE F\* OFFS #4 \(OF 5\)<\/figcaption>[\s\S]*?<\/figure>\s*<p class="solicit-title">INANNA THE NAME SHE LOST #2<\/p>/);
  assert.match(fixture, /<figure id="money-shot-group">[\s\S]*?<figcaption>MONEY SHOT THE F\* OFFS #4 \(OF 5\)<\/figcaption>[\s\S]*?<\/figure>/);
  assert.match(runtime, /const caption = first\(captionSelector, group\)/);
  assert.match(runtime, /let node = group\.nextElementSibling/);
  assert.doesNotMatch(runtime, /first\(captionSelector, content\)/);
  assert.match(runtime, /group\.dataset\.csmCaptionMismatch = 'true'/);
});

test('article media is preserved independently from feed thumbnail cropping', () => {
  assert.match(css, /\.csm-article-media-group\s*\{[^}]*overflow:\s*visible\s*!important[^}]*contain:\s*none\s*!important/s);
  assert.match(css, /\.csm-article-media-caption\s*\{[^}]*-webkit-line-clamp:\s*unset\s*!important/s);
  assert.match(css, /html\.csm-article-mode\.csm-site-bleeding-cool-modern-reader \.csm-article img\s*\{[^}]*object-fit:\s*contain\s*!important/s);
  assert.match(css, /html\.csm-feed-mode\.csm-site-bleeding-cool-modern-reader \.csm-card img\s*\{/);
});

test('generated runtime is built from the same cleanup policy source that tests execute', () => {
  assert.match(runtimeLoader, /article-cleanup\.runtime\.js/);
  assert.match(runtimeLoader, /\$\{cleanupPolicy\}/);
  assert.match(runtime, /csmShouldHideMismatchedCaption/);
});
