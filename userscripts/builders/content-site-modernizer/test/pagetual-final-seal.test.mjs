import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const builderRoot = new URL('../', import.meta.url);
const repoRoot = new URL('../../../', builderRoot);
const runtime = await readFile(new URL('src/core/runtime.template.js', builderRoot), 'utf8');
const runner = await readFile(new URL('tools/smoke/run-content-site-smoke.py', repoRoot), 'utf8');
const validate = await readFile(new URL('.devtool-artifact/validate.sh', repoRoot), 'utf8');
const finalSeal = await readFile(new URL('tools/content-sites/final-seal.mjs', repoRoot), 'utf8');
const builtScripts = await Promise.all([
  'dist/aipt-comics-modern-reader.user.js',
  'dist/bleeding-cool-modern-reader.user.js',
  'dist/menofporn-modern-ui.user.js',
  'dist/putinho-modern-ui.user.js',
  'dist/gayteam-modern-ui.user.js',
  'dist/justthegays-modern-ui.user.js',
  'dist/str8upgayporn-modern-ui.user.js'
].map((path) => readFile(new URL(path, builderRoot), 'utf8')));

test('PageTual final seal locks direct ingest runtime semantics', () => {
  assert.match(runtime, /data-csm-page-tual-candidate="1"/);
  assert.match(runtime, /data-csm-pagetual-candidate="1"/);
  assert.match(runtime, /dataset\.csmPageTualCandidate === '1'/);
  assert.match(runtime, /hasPageTualCandidate/);
  assert.match(runtime, /\(!isExcluded\(explicitRoot\) \|\| hasPageTualCandidate\(explicitRoot\)\)/);
  assert.match(runtime, /if \(node\.dataset\.csmCard\) continue/);
  assert.match(runtime, /const ingestPageTualCandidates/);
  assert.match(runtime, /selectCardNodes\(candidates, currentFeedLinkSet\(\), \{ allowHiddenSource: true, limit: 0 \}\)/);
  assert.match(runtime, /grid\.append\(item\);\n\s+enhanceCard\(item\);/);
  assert.match(runtime, /installLoadMore\(grid\);\n\s+applyFeedState\(grid\);/);
  assert.match(runtime, /markPageTualCandidates\(event\?\.detail\?\.root \|\| d\);\n\s+ingestPageTualCandidates\(event\?\.detail\?\.root \|\| d\);/);
  assert.match(runtime, /reconcileFeed\(\{ reason: 'pagetual' \}\)/);
  assert.match(runtime, /root instanceof HTMLElement && root\.matches\?\.\(sel\)/, 'PageTual root itself should be marked when it is a feed item');
});

test('PageTual final seal locks runner growth and validator gates', () => {
  assert.match(runner, /def pagetual_growth_timeout/);
  assert.match(runner, /growthTimeoutMs", 12000/);
  assert.match(runner, /os\.environ\.get\("PAGETUAL_SCRIPT"\)/);
  assert.match(runner, /"ingestPath": "direct-pagetual-insert"/);
  assert.match(runner, /PageTual ingest: simulated insert -> raw candidates selected -> modern cards appended/);
  assert.match(runner, /url\.pathname = `\$\{clean\}-\$\{linkSuffix\}\/`/);
  assert.doesNotMatch(runner, /replace\(\/\\\/\$\//, 'Python source should avoid invalid escape warnings for JS regex text');

  assert.match(validate, /PLAYWRIGHT_SMOKE=1/);
  assert.match(validate, /PAGETUAL_SCRIPT/);
  assert.match(validate, /smoke:content-sites:interactions:managed/);
  assert.match(validate, /--trace retain-on-failure/);
  assert.match(validate, /--snapshot retain-on-failure/);
});

test('PageTual final seal checks are part of the browser-free seal command', () => {
  for (const marker of [
    'PageTual candidate marker compatibility',
    'PageTual hidden-root inclusion',
    'PageTual direct ingest path',
    'PageTual managed validator gate'
  ]) assert.match(finalSeal, new RegExp(marker), `final-seal should check ${marker}`);
});

test('generated userscripts carry the final PageTual ingest runtime', () => {
  for (const built of builtScripts) {
    assert.match(built, /const ingestPageTualCandidates/);
    assert.match(built, /data-csm-page-tual-candidate="1"/);
    assert.match(built, /data-csm-pagetual-candidate="1"/);
    assert.match(built, /root instanceof HTMLElement && root\.matches\?\.\(sel\)/);
  }
});
