import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import profile from '../src/profiles/bleeding-cool.mjs';

const root = new URL('../', import.meta.url);
const runtime = await readFile(new URL('src/core/runtime.template.js', root), 'utf8');
const css = await readFile(new URL('src/core/styles.css', root), 'utf8');
const fixture = await readFile(new URL('test/fixtures/bleeding-cool-article-regression.html', root), 'utf8');

function fixtureHas(selector) {
  if (selector.includes('td-post-content') && fixture.includes('class="td-post-content"')) return true;
  if (selector.includes(' h1') && fixture.includes('<h1>')) return true;
  if (selector.includes(' time') && fixture.includes('<time ')) return true;
  if (selector.includes("[rel='author']") && fixture.includes('rel="author"')) return true;
  return false;
}

function cssRulesContaining(fragment) {
  return [...css.matchAll(/([^{}]+)\{([^{}]*)\}/g)]
    .filter((block) => block[1].includes(fragment))
    .map((block) => block[2])
    .join('\n');
}

test('Bleeding Cool article DOM evidence independently classifies an article', () => {
  const evidence = profile.client.articleEvidence;
  const score = evidence.filter(fixtureHas).length;
  assert.ok(score >= profile.client.articleEvidenceMin, `evidence score ${score} is below threshold`);
  assert.match(runtime, /csmArticleDecision\(\{/);
  assert.match(runtime, /evidenceScore:\s*articleEvidenceScore\(\)/);
  assert.match(runtime, /evidenceMin:\s*profile\.articleEvidenceMin \|\| 2/);
});

test('article fixture protects complete text after an image', () => {
  assert.match(fixture, /<img[^>]+>[\s\S]*FULL_SENTINEL_AFTER_IMAGE:[\s\S]*END_OF_SENTINEL/);
  assert.match(fixture, /FULL_LIST_SENTINEL/);
  const rule = cssRulesContaining('.td-post-content,.td-article-content,.entry-content,.post-content,');
  assert.match(rule, /-webkit-line-clamp:\s*unset\s*!important/);
  assert.match(rule, /line-clamp:\s*unset\s*!important/);
  assert.match(rule, /max-height:\s*none\s*!important/);
  assert.match(rule, /overflow:\s*visible\s*!important/);
  assert.match(rule, /text-overflow:\s*clip\s*!important/);
  assert.match(rule, /white-space:\s*normal\s*!important/);
});

test('article subtitle/dek readability is not opacity-clamped', () => {
  const rule = cssRulesContaining('.td-post-sub-title,.entry-subtitle,.post-subtitle,.dek,.excerpt');
  assert.match(rule, /opacity:\s*1\s*!important/);
  assert.match(rule, /color:\s*var\(--csm-muted\)\s*!important/);
});

test('article bottom navigation has safe-area-aware content clearance', () => {
  assert.match(css, /--csm-bottomnav-clearance:\s*calc\([^;]*env\(safe-area-inset-bottom/);
  assert.match(css, /html\.csm-article-mode\.csm-site-bleeding-cool-modern-reader body\s*\{[^}]*padding-bottom:\s*var\(--csm-bottomnav-clearance\)\s*!important/s);
  assert.deepEqual(profile.client.nav.articleBottom.map((item) => item.id), ['back', 'save', 'comments', 'top', 'more']);
});

test('feed clamp remains scoped away from article prose', () => {
  const summary = cssRulesContaining('.csm-card-summary');
  assert.match(summary, /line-clamp:\s*3/);
  assert.doesNotMatch(summary, /\.csm-article/);
  const listRule = cssRulesContaining('.csm-article li');
  assert.doesNotMatch(listRule, /display:\s*block/);
  assert.match(listRule, /line-clamp:\s*unset/);
});

test('article cleanup removes only orphan separator nodes', () => {
  assert.equal(profile.client.articleCleanup.removeOrphanSeparators, true);
  assert.match(fixture, /class="orphan-separator">·<\/p>/);
  assert.match(runtime, /removeOrphanSeparators/);
  assert.match(runtime, /node\.children\.length/);
  assert.match(runtime, /node\.querySelector\?\.\('a,img,video,iframe'\)/);
  assert.match(runtime, /node\.classList\.add\('csm-source-hidden'\)/);
});
