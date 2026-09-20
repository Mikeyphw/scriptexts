import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, stat } from 'node:fs/promises';
import { resolve } from 'node:path';
const ROOT = resolve(import.meta.dirname, '..');
const read = p => readFile(resolve(ROOT,p),'utf8');

test('all three site adapters remain wired with representative fixtures', async () => {
  const [mts, simblr, tsr, cfg] = await Promise.all([read('test/fixtures/mts-detail.html'),read('test/fixtures/simblr-detail.html'),read('test/fixtures/tsr-detail.html'),read('scripts.config.mjs')]);
  assert.match(mts,/getfile\.php\?file=123/); assert.match(simblr,/\/download\/456/); assert.match(tsr,/data-item=.*789/);
  for (const site of ['mts','simblr','tsr']) assert.match(cfg,new RegExp(`site: '${site}'`));
});

test('site parsers deduplicate stable file identifiers and retain metadata', async () => {
  const src=await read('src/core/app.js');
  assert.match(src,/function parseMtsFiles/); assert.match(src,/searchParams\.get\('file'\)/);
  assert.match(src,/function parseSimblrFiles/); assert.match(src,/pathname\.match\(\/\\\/download\\\/\(\\d\+\)/);
  assert.match(src,/function parseTsrFiles/); assert.match(src,/FileSize_nice/);
  assert.match(src,/function dedupeFiles/); assert.match(src,/const byKey = new Map\(\)/);
});

test('basket migration, normalization, persistence and duplicate fingerprints remain present', async()=>{
  const src=await read('src/core/app.js');
  for (const token of ['migrateOldData();','function normalizeBasket','function saveBasket','function makeFingerprints','function findDuplicateCandidates','duplicateIndex']) assert.ok(src.includes(token), token);
  assert.match(src,/OLD_MTS_LOCALSTORAGE_KEY/); assert.match(src,/version: VERSION/);
});

test('download queue supports failure retry and user cancellation', async()=>{
  const src=await read('src/core/app.js');
  assert.match(src,/downloadCancelled: false/); assert.match(src,/if \(state\.downloadCancelled\)/);
  assert.match(src,/Cancel queue/); assert.match(src,/retryFailedDownloads/); assert.match(src,/lastFailedFileKeys/);
});

test('mobile basket UI retains safe touch and responsive contracts', async()=>{
  const src=await read('src/core/app.js');
  assert.match(src,/runMobileModeAuditFixes/); assert.match(src,/sccb-mobile-scrollbox/); assert.match(src,/--sccb-card-min-mobile/);
  assert.match(src,/@media[^\{]*max-width/s);
});


test('download-link resolution is bounded, stale-aware and preserves fallback URLs', async()=>{
  const src=await read('src/core/app.js');
  assert.match(src,/async function resolveNetworkMetaForFile/);
  assert.match(src,/async function resolveMetadataForFileList/);
  assert.match(src,/async function refreshStaleFiles/);
  assert.match(src,/mapWithConcurrency\(files, Math\.min\(getFetchConcurrency\(\), 3\)/);
  assert.match(src,/method: 'HEAD'/);
  assert.match(src,/credentials: 'include'/);
});

test('build specializes shared core to one adapter per generated userscript', async()=>{
  const build=await read('build.mjs');
  assert.match(build,/specializeSiteBlocks/);
  for (const name of ['sims-basket-modthesims','sims-basket-simblrcc','sims-basket-thesimsresource']) {
    const out=await read(`dist/${name}.user.js`);
    assert.match(out,/runSimsCcDownloadBasket/);
  }
});

test('generated outputs are syntax-valid and bounded', async()=>{
  for (const name of ['sims-basket-modthesims','sims-basket-simblrcc','sims-basket-thesimsresource']) {
    const path=resolve(ROOT,`dist/${name}.user.js`); const info=await stat(path); assert.ok(info.size < 550_000, `${name} unexpectedly bloated: ${info.size}`);
  }
});
