import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import menOfPorn from '../src/profiles/menofporn.mjs';

const root = new URL('../', import.meta.url);
const home = await readFile(new URL('test/fixtures/menofporn-home.html', root), 'utf8');
const post = await readFile(new URL('test/fixtures/menofporn-post.html', root), 'utf8');
const built = await readFile(new URL('dist/menofporn-modern-ui.user.js', root), 'utf8');

test('MenOfPorn fixtures retain the captured Bloglo contracts', () => {
  for (const marker of ['id="masthead"', 'id="bloglo-primary-nav"', 'id="secondary"', 'class="bloglo-article', 'class="post-thumb']) assert.match(home, new RegExp(marker));
  for (const marker of ['class="entry-content bloglo-entry"', 'comments-area', 'bloglo-article']) assert.match(post, new RegExp(marker));
});

test('MenOfPorn is generated from the shared runtime profile', () => {
  assert.equal(menOfPorn.version, '1.5.2');
  assert.equal(menOfPorn.source, undefined);
  assert.equal(menOfPorn.css, 'src/core/styles.css');
  assert.equal(menOfPorn.client.id, 'menofporn-modern-ui');
  assert.ok(menOfPorn.client.selectors.feed.items.includes('article.bloglo-article'));
  assert.match(menOfPorn.client.selectors.page.nav, /#bloglo-primary-nav/);
  assert.match(menOfPorn.client.selectors.article.root, /article\.bloglo-article/);
  assert.match(menOfPorn.client.selectors.feed.summary, /entry-summary/);
});

test('generated MenOfPorn output uses shared runtime instead of the retired mop direct shell', () => {
  for (const marker of [
    'function installContentSiteModernizer',
    'const PROFILE = {',
    'menofporn-modern-ui',
    'pageTualSelector',
    'summaryTextFor',
    '.csm-card-summary',
    'article.bloglo-article',
    '#bloglo-primary-nav'
  ]) assert.ok(built.includes(marker), `missing ${marker}`);

  for (const obsolete of [
    'mop-reading-progress',
    'data-mop-action',
    'function scheduleCurrentPostViewed',
    'function renderFilters',
    'mop-card-clickable',
    'mop-modern-ui:v1'
  ]) assert.ok(!built.includes(obsolete), `obsolete direct-script marker ${obsolete}`);
});
