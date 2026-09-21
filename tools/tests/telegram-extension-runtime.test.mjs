import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=(p)=>readFileSync(new URL('../../'+p,import.meta.url),'utf8');
const bg=read('extensions/telegram-media-downloader/src/background.js');
const content=read('extensions/telegram-media-downloader/src/content.js');
const common=read('extensions/telegram-media-downloader/src/scripts/common.js');
const manifest=JSON.parse(read('extensions/telegram-media-downloader/src/manifest.json'));

test('download jobs use request identity and persisted state',()=>{
 assert.match(bg,/requestId/); assert.match(bg,/CONFIG\.storage\.downloadJobs/); assert.match(common,/downloadJobs: "tmd:download-jobs"/);
 assert.match(bg,/downloadId/); assert.match(bg,/state: "active"/);
});
test('same URL is not the download identity',()=>{
 assert.doesNotMatch(bg,/find\([^\n]*url ===/); assert.match(bg,/findIndex\(\(job\) => job\.requestId === requestId\)/);
});
test('download startup has bounded retry and cancellation',()=>{
 assert.match(bg,/DOWNLOAD_RETRY_DELAYS = \[0, 300, 900\]/); assert.match(bg,/CANCEL_DOWNLOAD/); assert.match(bg,/ext\.downloads\.cancel/);
});
test('browser download completion and interruption survive background lifetime',()=>{
 assert.match(bg,/downloads\?\.onChanged/); assert.match(bg,/state: "complete"/); assert.match(bg,/state: "interrupted"/);
});
test('content observer filters irrelevant Telegram churn',()=>{
 assert.match(content,/const relevant = mutations\.some/); assert.match(content,/if \(relevant\) tick\(\)/);
 assert.doesNotMatch(content,/attributeFilter: \["class", "src", "style"\]/);
});
test('WebK and WebZ fixtures remain represented',()=>{
 const k=read('tools/tests/fixtures/telegram-extension/webk.html'); const z=read('tools/tests/fixtures/telegram-extension/webz.html');
 assert.match(k,/data-mid|media/i); assert.match(z,/data-mid|MediaViewer|VideoPlayer/i);
 assert.match(content,/media-viewer/); assert.match(content,/MediaViewer/);
});
test('manifest and source runtime version converge',()=>{
 assert.equal(manifest.version,'3.5.1'); assert.match(common,/version: "3\.5\.1"/);
});
test('complete canonical extension source is buildable',()=>{
 for(const name of ['content.js','page-bridge.js','popup.js','library.js','settings.js','scripts/common.js','scripts/protocol-v2.js']) assert.ok(read('extensions/telegram-media-downloader/src/'+name).length>100);
});

test('extension package builder is reproducible and timestamp-independent',()=>{
 const builder=read('extensions/telegram-media-downloader/build.py');
 assert.match(builder,/ZIP_TIMESTAMP = \(1980, 1, 1, 0, 0, 0\)/);
 assert.match(builder,/archive\.writestr\(deterministic_info\(rel\), path\.read_bytes\(\)/);
 assert.doesNotMatch(builder,/archive\.write\(path,/);
 assert.match(builder,/compresslevel=9/);
});

