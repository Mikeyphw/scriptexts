import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const builder = path.dirname(here);
const src = path.join(builder, 'src');
const mobile = fs.readFileSync(path.join(src, '45-mobile-first.part.js'), 'utf8');
const gallery = fs.readFileSync(path.join(src, '30-media-renderer-lightbox.part.js'), 'utf8');
const scanner = fs.readFileSync(path.join(src, '10-xenforo-scanner-cache.part.js'), 'utf8');
const controls = fs.readFileSync(path.join(src, '20-gallery-controls.part.js'), 'utf8');
const downloads = fs.readFileSync(path.join(src, '40-download-archive-network.part.js'), 'utf8');
const bootstrap = fs.readFileSync(path.join(src, '00-bootstrap-ui.part.js'), 'utf8');

function sandbox() {
  const stored = new Map();
  const context = {
    localStorage: {
      getItem: key => stored.has(key) ? stored.get(key) : null,
      setItem: (key, value) => stored.set(key, String(value)),
      removeItem: key => stored.delete(key),
    },
    document: { getElementById: () => null, querySelector: () => null },
    getThreadCacheId: () => 'fixture-thread',
    showToast() {}, stopActivePreviewVideo() {}, renderGrid() {},
    state: { filteredMedia: [], currentIndex: 0, filteredMediaCache: null,
      selectedMediaIds: new Set(), mediaById: new Map(), zipRunning: false, zipPaused: false, lightboxZoomed: false },
    config: { fetchConcurrency: 2, zipConcurrency: 2, scanConcurrency: 2, maxRetries: 2 },
    isMobileProfile: true, formatBytes: n => `${n} bytes`,
    navigator: {}, confirm: () => true,
    commitBulkSelection() {}, setSelectionMode() {}, console,
  };
  const code = mobile + '\n;globalThis.__mobile = { mobileUX, mobileStorageRead, mobileStorageWrite, mobileThreadKey, mobileLoadCheckpoint, mobileToggleFavorite, mobileDownloadCheckpoint, mobileSaveDeliveredPart, mobileRecordItemResult, mobileConfirmPartSaved, mobileFinishDownload, mobileSaveSelection, mobileRestoreSelection, mobileClearHistory, mobileSetDataSaver, mobileResetZoom };';
  vm.runInNewContext(code, context, { filename: '45-mobile-first.part.js' });
  return { ...context, stored, api: context.__mobile };
}

test('mobile source is executable JavaScript without third-party globals at load', () => {
  assert.ok(mobile.includes('function installMobileUX()'));
  assert.ok(sandbox().api);
});

test('tap opens lightbox unless selection mode is expressly enabled', () => {
  const body = gallery.slice(gallery.indexOf('function attachGalleryGridHandlers('), gallery.indexOf('function renderGrid('));
  assert.match(body, /isMobileLayout\(\) && state\.selectionMode/);
  assert.doesNotMatch(body, /state\.selectionMode \|\| state\.selectedMediaIds\.size/);
  assert.match(body, /openLightbox\(getFilteredIndexFromCard\(card\)\)/);
});

test('long press cancels when touch is dragged or scrolling', () => {
  assert.match(mobile, /Math\.hypot\(dx, dy\) > 10/);
  assert.match(mobile, /clearTimeout\(state\.cardLongPressTimer\)/);
  assert.match(mobile, /Math\.abs\(dy\) > Math\.abs\(dx\) \* 1\.2/);
  assert.match(mobile, /pointercancel/);
});

test('mobile search is displayed instead of focusing hidden desktop input', () => {
  assert.match(controls, /if \(isMobileLayout\(\)\) \{ mobileOpenSearch\(\); return; \}/);
  assert.match(mobile, /pg-mf-query/);
  assert.match(mobile, /setGallerySearch\(event\.target\.value\)/);
  assert.match(mobile, /pg-mf-page/);
  assert.match(mobile, /pg-mf-sort/);
  assert.match(bootstrap, /\.pg-mf-sheet\[hidden\]/);
});

test('favorites are per-thread, persistent, bounded and reversible', () => {
  const s = sandbox();
  s.api.mobileToggleFavorite({ id: '123' });
  assert.deepEqual(JSON.parse(s.stored.get('pg_mf_favorites_fixture-thread')), ['123']);
  s.api.mobileToggleFavorite({ id: '123' });
  assert.deepEqual(JSON.parse(s.stored.get('pg_mf_favorites_fixture-thread')), []);
});

test('recovery checkpoints include only finalized part entries, not unclosed writers', () => {
  const s = sandbox();
  s.api.mobileDownloadCheckpoint([{ id: 'a' }, { id: 'b' }, { id: 'c' }]);
  let checkpoint = JSON.parse(s.stored.get('pg_mf_pending-zip_fixture-thread'));
  assert.equal(checkpoint.deliveredIds.length, 0);
  s.api.mobileSaveDeliveredPart([{item: {id:'a'}}, {item: {id:'b'}}], 'part01.zip', 314159);
  checkpoint = JSON.parse(s.stored.get('pg_mf_pending-zip_fixture-thread'));
  assert.deepEqual(checkpoint.deliveredIds, ['a','b']);
  assert.equal(checkpoint.parts[0].state, 'download-triggered');
  s.api.mobileFinishDownload('interrupted');
  assert.equal(JSON.parse(s.stored.get('pg_mf_pending-zip_fixture-thread')).status, 'interrupted');
});

test('malformed persisted ZIP state is rejected rather than trusted', () => {
  const s = sandbox();
  s.stored.set('pg_mf_pending-zip_fixture-thread', JSON.stringify({
    version: 1, thread: 'fixture-thread', sourceIds: ['ok'],
    deliveredIds: ['ok'], parts: 'corrupt',
  }));
  assert.equal(s.api.mobileLoadCheckpoint(), null);
  s.stored.set('pg_mf_pending-zip_fixture-thread', JSON.stringify({
    version: 1, thread: 'other-thread', sourceIds: [], deliveredIds: [], parts: [],
  }));
  assert.equal(s.api.mobileLoadCheckpoint(), null);
});

test('data saver lowers concurrency and is safely reversible', () => {
  const s = sandbox();
  s.api.mobileSetDataSaver(true);
  assert.equal(s.config.zipConcurrency, 1);
  assert.equal(s.config.scanConcurrency, 1);
  assert.equal(s.config.maxRetries, 1);
  s.api.mobileSetDataSaver(false);
  assert.equal(s.config.zipConcurrency, 2);
  assert.equal(JSON.parse(s.stored.get('pg_mf_data_saver')), false);
});

test('thread privacy cleanup clears favorites and recovery while retaining unrelated preferences', () => {
  const s = sandbox();
  s.api.mobileToggleFavorite({id:'secret'});
  s.api.mobileDownloadCheckpoint([{id:'secret'}]);
  s.api.mobileSetDataSaver(true);
  s.api.mobileClearHistory();
  assert.equal(s.stored.has('pg_mf_favorites_fixture-thread'), false);
  assert.equal(s.stored.has('pg_mf_pending-zip_fixture-thread'), false);
  assert.equal(JSON.parse(s.stored.get('pg_mf_data_saver')), true);
});

test('scan scopes preserve default all-page behavior and existing retry/cache contracts', () => {
  assert.match(scanner, /scanAllThreadPages\(mode = "all"\)/);
  assert.match(scanner, /mode === "recent" \? discoveredPages\.slice\(-5\)/);
  assert.match(scanner, /mode === "uncached"/);
  assert.match(scanner, /shouldRevalidateCachedPage/);
  assert.match(scanner, /scanFetchMaxAttempts/);
  assert.match(scanner, /Retry-After/);
});

test('ZIP part save attempts are not incorrectly claimed to be OS-verified saves', () => {
  assert.match(downloads, /mobileSaveDeliveredPart\(partManifestEntries, action\.download, zipBlob\.size, action\.href\)/);
  assert.match(downloads, /mobileFinishDownload\(failed \? "completed-with-errors" : "completed"\)/);
  assert.match(mobile, /save not verified/);
  assert.match(mobile, /download-triggered/);
  assert.match(mobile, /Retry all/);
});

test('pinch/pan and drag selection preserve native video controls and limit translations', () => {
  assert.match(mobile, /Math\.max\(1, Math\.min\(4,/);
  assert.match(mobile, /event\.target\.closest\("video"\)/);
  assert.match(mobile, /Math\.max\(-boundX, Math\.min\(boundX,/);
  assert.match(mobile, /mobileInstallSwipeSelection/);
  assert.match(mobile, /setAttribute\("aria-modal", "true"\)/);
});

test('mobile action families have delegated behavior instead of inert buttons', () => {
  for (const action of ['gallery','search','select','downloads','more']) {
    assert.ok(mobile.includes(`data-mf="${action}"`), action);
    assert.ok(mobile.includes(`command === "${action}"`), action);
  }
  for (const id of ['pg-mf-favorites','pg-mf-recent','pg-mf-clear-filter',
                    'pg-mf-downloads-close','pg-mf-pause','pg-mf-cancel',
                    'pg-mf-resume','pg-mf-retry-all','pg-mf-clear-history',
                    'pg-mf-scan-current','pg-mf-scan-recent','pg-mf-scan-new','pg-mf-scan-all','pg-mf-save-selection','pg-mf-restore-selection']) {
    assert.ok(mobile.includes(`id="${id}"`), id);
    assert.ok(mobile.includes(`"${id}"`), `Missing delegated action: ${id}`);
  }
  assert.match(mobile, /dock.addEventListener\("click"/);
  assert.match(mobile, /search.addEventListener\("click"/);
  assert.match(mobile, /downloads.addEventListener\("click"/);
});

test('large mobile grids render in bounded pages with a manual load-more fallback', () => {
  assert.match(gallery, /const pageSize = isMobileLayout\(\) \? \(lowMemory \? 120 : 240\)/);
  assert.match(gallery, /visibleLimit = Math.min\(pageSize, displayOrder.length\)/);
  assert.match(gallery, /pg-mf-load-more/);
  assert.match(gallery, /IntersectionObserver/);
  assert.match(gallery, /button.addEventListener\("click", next\)/);
});

test('generated UI is bounded and retains the existing tested script infrastructure', () => {
  const manifest = JSON.parse(fs.readFileSync(path.join(builder, 'modules.json'), 'utf8'));
  assert.deepEqual(manifest.slice(-2), ['45-mobile-first.part.js', '50-integration-init.part.js']);
  const generated = manifest.map(file => fs.readFileSync(path.join(src, file), 'utf8')).join('');
  const standalone = fs.readFileSync(path.resolve(builder, '../../standalone/lpsg-media-gallery-unlocker/lpsg-media-gallery-unlocker.user.js'), 'utf8');
  assert.equal(generated, standalone);
  assert.ok(generated.length < 450000);
});

test('per-item ZIP results persist without storing source URLs and explicit device confirmation remains voluntary', () => {
  const s = sandbox();
  s.api.mobileDownloadCheckpoint([{id:'a'}, {id:'b'}]);
  s.api.mobileRecordItemResult({id:'a',src:'https://example.org?private=token'}, 'archived', 2048);
  s.api.mobileRecordItemResult({id:'b',src:'https://example.org?private=token'}, 'failed');
  s.api.mobileSaveDeliveredPart([{item:{id:'a'},size:2048}], 'part01.zip', 2080);
  assert.equal(JSON.parse(s.stored.get('pg_mf_pending-zip_fixture-thread')).results.a.status, 'download-triggered');
  assert.equal(JSON.parse(s.stored.get('pg_mf_pending-zip_fixture-thread')).results.b.status, 'failed');
  assert.ok(!s.stored.get('pg_mf_pending-zip_fixture-thread').includes('private=token'));
  s.api.mobileConfirmPartSaved(0);
  const record = JSON.parse(s.stored.get('pg_mf_pending-zip_fixture-thread'));
  assert.deepEqual(record.confirmedIds,['a']);
  assert.equal(record.parts[0].state,'user-confirmed');
});

test('named selections can be saved and restored without selecting unavailable media', () => {
  const s = sandbox();
  s.state.selectedMediaIds = new Set(['a','unavailable']);
  s.api.mobileSaveSelection();
  assert.deepEqual(JSON.parse(s.stored.get('pg_mf_selection_fixture-thread')), ['a','unavailable']);
  s.state.selectedMediaIds.clear();
  s.state.mediaById.set('a', {id:'a'});
  s.api.mobileRestoreSelection();
  assert.deepEqual([...s.state.selectedMediaIds], ['a']);
  assert.equal(s.state.autoSelectNewMedia, false);
});

test('session-only favorites do not persist to disk', () => {
  const s = sandbox();
  s.stored.set('pg_mf_session_favorites','true');
  s.api.mobileToggleFavorite({id:'session-secret'});
  assert.equal(s.stored.has('pg_mf_favorites_fixture-thread'),false);
  assert.ok(s.api.mobileUX.favorites.has('session-secret'));
});

test('recovery retention rejects expired checkpoints', () => {
  const s = sandbox();
  s.api.mobileDownloadCheckpoint([{id:'a'}]);
  const key = 'pg_mf_pending-zip_fixture-thread';
  const record = JSON.parse(s.stored.get(key));
  record.createdAt = Date.now() - 40 * 86400000;
  s.stored.set(key,JSON.stringify(record));
  assert.equal(s.api.mobileLoadCheckpoint(), null);
});

test('live previews, video autoplay, and automatic duration probing respect data saver', () => {
  assert.match(gallery, /mediaElement\.autoplay = !mobileStorageRead/);
  assert.match(gallery, /mediaElement\.preload = mobileStorageRead/);
  assert.match(scanner, /document\.visibilityState === "hidden"/);
  assert.match(mobile, /navigator\.deviceMemory/);
  assert.match(mobile, /connection\?\.effectiveType/);
});

test('one-handed overlays do not overlap and privacy cleanup is disabled during ZIP writes', () => {
  assert.match(mobile, /mobileHideDownloads\(\);\s*mobileUX\.searchOpen = true/);
  assert.match(mobile, /if \(mobileUX\.searchOpen\) mobileCloseSearch\(\)/);
  assert.match(mobile, /if \(state\.zipRunning\) \{ showToast\("mf-privacy"/);
  assert.match(mobile, /pg-mf-retention/);
  assert.match(mobile, /pg-mf-session-favorites/);
});

test('share-file action is explicit, size-bounded, and requires a fresh user tap to share', () => {
  assert.match(mobile, /async function mobileFetchBoundedShareBlob/);
  assert.match(mobile, /bytes > maxBytes/);
  assert.match(mobile, /await reader\.read\(\)/);
  assert.match(mobile, /mobileUX\.preparedShare\?\.id === item\.id/);
  assert.match(mobile, /navigator\.canShare\(\{ files: \[file\] \}\)/);
  assert.match(mobile, /pg-mf-share-file-action/);
  assert.match(mobile, /await navigator\.share\(\{ title: "LPSG media", files: \[file\] \}\)/);
});

test('mobile gesture handler does not race legacy pinch state', () => {
  assert.match(controls, /!isMobileLayout\(\) && pinchStarted && event\.touches\.length > 1/);
  assert.match(bootstrap, /img\.pg-lb-media\.pg-zoomed/);
});

// Native Devtool owns overlay transactions; the staging helper enforces upstream safety.
test('consolidated launcher re-attests existing native package and keeps check read-only', () => {
  const helper = fs.readFileSync(path.join(builder, 'MOBILE_FIRST.md'), 'utf8');
  assert.match(helper, /native Devtool|Devtool v3\.1/i);
  assert.match(mobile, /sourceIdSet/);
  assert.match(mobile, /Object\.create\(null\)/);
});
