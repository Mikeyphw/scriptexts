import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const root = new URL('../', import.meta.url);
const runtimeModule = await readFile(new URL('src/core/runtime.mjs', root), 'utf8');
const runtime = await readFile(new URL('src/core/runtime.template.js', root), 'utf8');
const styles = await readFile(new URL('src/core/styles.css', root), 'utf8');
const menOfPornProfile = await readFile(new URL('src/profiles/menofporn.mjs', root), 'utf8');
const putinhoProfile = await readFile(new URL('src/profiles/putinho.mjs', root), 'utf8');
const gayteam = await readFile(new URL('src/profiles/gayteam.mjs', root), 'utf8');
const justTheGays = await readFile(new URL('src/profiles/justthegays.mjs', root), 'utf8');
const str8upGayPorn = await readFile(new URL('src/profiles/str8upgayporn.mjs', root), 'utf8');

const builtScripts = await Promise.all([
  'dist/aipt-comics-modern-reader.user.js',
  'dist/bleeding-cool-modern-reader.user.js',
  'dist/menofporn-modern-ui.user.js',
  'dist/putinho-modern-ui.user.js',
  'dist/gayteam-modern-ui.user.js',
  'dist/justthegays-modern-ui.user.js',
  'dist/str8upgayporn-modern-ui.user.js'
].map((path) => readFile(new URL(path, root), 'utf8')));

test('shared runtime preserves and reacts to PageTual insertions', () => {
  assert.ok(runtimeModule.includes('runtime.template.js'), 'runtime module should load editable template source');
  for (const marker of [
    'pageTualSelector',
    'isPageTualNode',
    "data.command === 'pagetual'",
    "data.action === 'insert'",
    "addEventListener('pagetual:insert'",
    'handlePageTualInsert',
    'reconcileFeed({ reason',
    'revealNextBatch(grid)',
    'csm-deferred-hidden',
    'refreshStates()'
  ]) assert.ok(runtime.includes(marker), `missing ${marker}`);

  assert.match(styles, /\.pagetual_pageBar/);
  assert.match(styles, /#pagetual-sideController/);
  assert.match(styles, /autopagerize_page_info/);
});

test('MenOfPorn and Putinho are no longer direct PageTual implementations', () => {
  for (const profile of [menOfPornProfile, putinhoProfile]) {
    assert.ok(profile.includes('css": "src/core/styles.css"'), 'profile should use shared runtime CSS');
    assert.ok(profile.includes('client": {'), 'profile should provide shared runtime client config');
    assert.ok(!profile.includes('source": "src/sites/'), 'profile should not point at retired direct source');
  }
  for (const marker of [
    'pageTualSelector',
    'isPageTualNode',
    "data.command === 'pagetual'",
    "data.action === 'insert'",
    "addEventListener('pagetual:insert'",
    'handlePageTualInsert',
    'reconcileFeed({ reason'
  ]) assert.ok(runtime.includes(marker), `missing ${marker}`);
});

test('profile-driven sites no longer classify PageTual controls as ads or hidden navigation', () => {
  for (const profile of [menOfPornProfile, putinhoProfile, gayteam, justTheGays, str8upGayPorn]) {
    for (const forbidden of [
    '#pagetual-sideController',
    "[id^='pagetual-sideController']",
    "[id^='pagetual_']",
    '#pagetual_pageBar2'
    ]) assert.ok(!profile.includes(forbidden), `still hides ${forbidden}`);
  }
});


test('shared runtime has hardened drawer and feed-state semantics', () => {
  for (const marker of [
    "drawer.setAttribute('role', 'dialog')",
    "drawer.setAttribute('aria-modal', 'true')",
    'trapDrawerFocus',
    'activeDrawerTrigger',
    "feedState = { mode: 'all'",
    'cardMatchesFeedState',
    'csm-filter-hidden',
    'csm-saved-hidden',
    'csm-feed-status',
    'showAllCards',
    "addEventListener('pagehide'"
  ]) assert.ok(runtime.includes(marker), `missing ${marker}`);

  for (const marker of [
    '--csm-text-xs',
    '--csm-focus-ring',
    ':focus-visible',
    '.csm-feed-status',
    '.csm-filter-hidden',
    '@supports not ((backdrop-filter'
  ]) assert.ok(styles.includes(marker), `missing ${marker}`);
});

test('all generated content-site scripts include PageTual compatibility hooks', () => {
  for (const built of builtScripts) {
    assert.ok(built.includes('pagetual'), 'missing PageTual command hook');
    assert.ok(built.includes('pagetual_pageBar'), 'missing PageTual page bar styling');
  }
});
