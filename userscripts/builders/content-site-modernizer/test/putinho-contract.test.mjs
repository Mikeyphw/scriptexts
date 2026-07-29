import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import putinho from '../src/profiles/putinho.mjs';

const root = new URL('../', import.meta.url);
const home = await readFile(new URL('test/fixtures/putinho-home.html', root), 'utf8');
const post = await readFile(new URL('test/fixtures/putinho-post.html', root), 'utf8');
const built = await readFile(new URL('dist/putinho-modern-ui.user.js', root), 'utf8');

test('Putinho fixtures retain the captured Jannah contracts', () => {
  for (const marker of ['id="posts-container"', 'class="post-item', 'class="post-thumb"', 'class="post-title"', 'class="post-excerpt"']) assert.match(home, new RegExp(marker));
  for (const marker of ['id="the-post"', 'class="post-title entry-title"', 'class="entry-content', 'id="respond"']) assert.match(post, new RegExp(marker));
});

test('Putinho is generated from the shared runtime profile', () => {
  assert.equal(putinho.version, '1.1.2');
  assert.equal(putinho.source, undefined);
  assert.equal(putinho.css, 'src/core/styles.css');
  assert.equal(putinho.client.id, 'putinho-modern-ui');
  assert.ok(putinho.client.selectors.feed.items.includes('.post-item'));
  assert.match(putinho.client.selectors.article.root, /#the-post/);
  assert.match(putinho.client.selectors.feed.summary, /post-excerpt/);
  assert.ok(putinho.client.articleHints.includes('#the-post'));
});

test('generated Putinho output uses shared runtime instead of the retired ptn direct shell', () => {
  for (const marker of [
    'function installContentSiteModernizer',
    'const PROFILE = {',
    'putinho-modern-ui',
    'pageTualSelector',
    'summaryTextFor',
    '.csm-card-summary',
    '.post-item',
    '#the-post'
  ]) assert.ok(built.includes(marker), `missing ${marker}`);

  for (const obsolete of [
    'ptn-reading-progress',
    'data-ptn-action',
    'function scheduleCurrentPostViewed',
    'function renderFilters',
    'root.matches(\'.post-item\')',
    'article.bloglo-article',
    '#bloglo-primary-nav'
  ]) assert.ok(!built.includes(obsolete), `obsolete direct-script marker ${obsolete}`);
});
