import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const root = new URL('../', import.meta.url);
const profileText = await readFile(new URL('src/profiles/str8upgayporn.mjs', root), 'utf8');
const home = await readFile(new URL('test/fixtures/str8upgayporn-home.html', root), 'utf8');
const built = await readFile(new URL('dist/str8upgayporn-modern-ui.user.js', root), 'utf8').catch(() => '');

test('STR8UPGAYPORN fixture retains the captured WP-Drudge contracts', () => {
  for (const marker of [
    'wp-theme-wp-drudge-v2',
    'id="featured"',
    'id="content-wrap"',
    'id="column-1"',
    'id="column-2"',
    'id="column-3"',
    'class="wpd-posted-links"',
    'class="posts-list',
    'class="headline-link"',
    'class="readmore"',
    'Str8UpDaily',
    'New Releases',
    'Hot Links',
    'https://str8upgayporn.com/category/str8updaily/'
  ]) assert.ok(home.includes(marker), `missing ${marker}`);
});

test('STR8UPGAYPORN fixture keeps enough story cards for grid rebuild', () => {
  const postItems = home.match(/<li class="cf the-content"/g) || [];
  const headlines = home.match(/class="headline-link"/g) || [];
  const images = home.match(/class="image-wrap link-list-image"/g) || [];
  assert.ok(postItems.length >= 100, `expected dense post list, saw ${postItems.length}`);
  assert.ok(headlines.length >= 100, `expected headline links, saw ${headlines.length}`);
  assert.ok(images.length >= 80, `expected image cards, saw ${images.length}`);
});

test('STR8UPGAYPORN profile targets WP-Drudge feed, article, search, pagination, and PageTual surfaces', () => {
  const combined = `${profileText}\n${built}`;
  for (const marker of [
    'str8upgayporn-modern-ui',
    'STR8UPGAYPORN Modern UI',
    'https://str8upgayporn.com/*',
    '#featured .featured-wrap',
    '.posts-list > li',
    '.headline-link',
    '.wp-pagenavi',
    '.wp-paginate',
    '/?s=',
    '/category/str8updaily/',
    'installContentSiteModernizer',
    'csm-bottomnav',
    'pagetual_pageBar'
  ]) assert.ok(combined.includes(marker), `missing ${marker}`);
});
