import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const root = new URL('../', import.meta.url);
const profileText = await readFile(new URL('src/profiles/gayteam.mjs', root), 'utf8');
const home = await readFile(new URL('test/fixtures/gayteam-home.html', root), 'utf8');
const category = await readFile(new URL('test/fixtures/gayteam-category.html', root), 'utf8');
const post = await readFile(new URL('test/fixtures/gayteam-post.html', root), 'utf8');
const built = await readFile(new URL('dist/gayteam-modern-ui.user.js', root), 'utf8').catch(() => '');

test('Gayteam fixtures retain the captured DLE/thumb contracts', () => {
  for (const marker of [
    'class="section__content section__items"',
    'class="thumb-item"',
    'class="thumb-item__link"',
    'class="thumb-item__img img-responsive img-fit-cover"',
    'class="thumb-item__label thumb-item__label--time"',
    'class="pagination clr ignore-select"',
    'https://gayteam.club/page/2/',
    'class="thumb-item__title"'
  ]) assert.match(home, new RegExp(marker));

  assert.match(category, /https:\/\/gayteam\.club\/bareback\//);
  assert.match(category, /Bareback gay video watch online free/);
});

test('Gayteam post fixture retains video-page contracts', () => {
  for (const marker of [
    'class="inner-page ignore-select"',
    'class="inner-page__title"',
    'class="poster-container loaded"',
    'class="download-btn"',
    'inner-page__meta',
    'class="inner-page__text tabs-block__content"',
    'class="inner-page__tags"'
  ]) assert.match(post, new RegExp(marker));
});

test('Gayteam profile targets feed, post, search, and category surfaces', () => {
  const combined = `${profileText}
${built}`;
  for (const marker of [
    'gayteam-modern-ui',
    'https://gayteam.club/*',
    '.thumb-item',
    '.thumb-item__title',
    '.thumb-item__label--time',
    'csm-duration-badge',
    'csm-pagination',
    '.inner-page',
    '.poster-container',
    '/index.php?do=search&subaction=search&story=',
    'Bareback',
    'Latinos',
    'Trans'
  ]) assert.ok(combined.includes(marker), `missing ${marker}`);
});
