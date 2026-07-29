import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const root = new URL('../', import.meta.url);
const profileText = await readFile(new URL('src/profiles/justthegays.mjs', root), 'utf8');
const home = await readFile(new URL('test/fixtures/justthegays-home.html', root), 'utf8');
const category = await readFile(new URL('test/fixtures/justthegays-category.html', root), 'utf8');
const post = await readFile(new URL('test/fixtures/justthegays-post.html', root), 'utf8');
const built = await readFile(new URL('dist/justthegays-modern-ui.user.js', root), 'utf8').catch(() => '');

test('JustTheGays fixtures retain the captured Svelte/video-card contracts', () => {
  for (const marker of [
    'id=root-cont',
    'class=\"video-item',
    'class=\"duration-pill',
    'class=\"video-title',
    'class=\"video-stats',
    'class=\"thumbnail',
    'https://justthegays.tv/video/',
    'https://justthegays.tv/p6909/latest?page=2'
  ]) assert.ok(home.includes(marker), `missing ${marker}`);

  for (const marker of [
    'Young &amp; Twink',
    'pagination-button',
    'https://justthegays.tv/p6896/category/youngtwink?page=2',
    'video-categories',
    'Performers'
  ]) assert.ok(category.includes(marker), `missing ${marker}`);
});

test('JustTheGays post fixture retains video-page contracts', () => {
  for (const marker of [
    'id=vjs_video_3',
    'class=\"video-js',
    'id=vjs_video_3_html5_api',
    'class=\"stat',
    'id=comments',
    'video-info',
    'Like this video?'
  ]) assert.ok(post.includes(marker), `missing ${marker}`);
});

test('JustTheGays profile targets feed, post, search, pagination, and PageTual surfaces', () => {
  const combined = `${profileText}\n${built}`;
  for (const marker of [
    'justthegays-modern-ui',
    'https://justthegays.tv/*',
    '.video-item',
    '.video-title',
    '.duration-pill',
    'justify-center.py-4',
    'csm-duration-badge',
    'csm-pagination',
    'installContentSiteModernizer',
    'pagetual_pageBar',
    '/search?q=',
    'Young & Twink',
    'Bareback'
  ]) assert.ok(combined.includes(marker), `missing ${marker}`);
});
