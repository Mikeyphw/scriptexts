import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import crypto from 'node:crypto';
const root=process.cwd();
const ext=path.join(root,'extensions/manga-site-media-downloader');
const read=(p)=>fs.readFileSync(path.join(root,p),'utf8');
const content=read('extensions/manga-site-media-downloader/src/content.js');
const manifest=JSON.parse(read('extensions/manga-site-media-downloader/src/manifest.json'));
const sha=(p)=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');

test('supported site fixtures remain represented by extraction selectors',()=>{
 for(const name of ['mangalotus','bara','yaoi','nhentai']){
  const html=read(`tools/tests/fixtures/manga-extension/${name}.html`);
  assert.match(html,/<img\b/i);
 }
 for(const host of ['mangalotus.com','baramangaonline.com','yaoimangaonline.com','nhentai.net']) assert.ok(manifest.permissions.some(x=>x.includes(host)));
});
test('gallery extraction preserves ordered image bookkeeping and deduplication',()=>{
 assert.match(content,/const unique = new Set\(\)/);
 assert.match(content,/Array\.from\(unique\)/);
 assert.match(content,/image_\$\{String\(index \+ 1\)\.padStart\(3, "0"\)\}/);
});
test('downloads use bounded image concurrency and bounded retry',()=>{
 assert.match(content,/Math\.min\(Number\(payload\.imageConcurrency/);
 assert.match(content,/fetchImagePayloadWithRetries\(imageUrl, payload\.url, 3\)/);
 assert.match(content,/350 \* attempt/);
});
test('partial chapter recovery is recorded inside every CBZ',()=>{
 assert.match(content,/_DOWNLOAD_MANIFEST\.json/);
 assert.match(content,/requestedImages: images\.length/);
 assert.match(content,/failedImages: failedImages\.map/);
 assert.match(content,/_FAILED_IMAGES\.txt/);
});
test('mobile controls retain coarse/mobile-safe touch targets',()=>{
 assert.match(content,/min-height:44px!important/);
 assert.match(content,/env\(safe-area-inset-right\)/);
 assert.match(content,/env\(safe-area-inset-bottom\)/);
});
test('listing discovery is mutation driven rather than interval polling',()=>{
 assert.match(content,/new MutationObserver/);
 assert.doesNotMatch(content,/setInterval\s*\(/);
});
test('manifest and package version converge',()=>assert.equal(manifest.version,'1.11.0'));
test('XPI build is byte reproducible',()=>{
 execFileSync('python3',[path.join(ext,'build.py')],{cwd:root,stdio:'pipe'});
 const xpi=path.join(ext,'dist','manga-site-media-downloader-1.11.0.xpi'); const first=sha(xpi);
 const now=new Date(); fs.utimesSync(path.join(ext,'src','content.js'),now,now);
 execFileSync('python3',[path.join(ext,'build.py')],{cwd:root,stdio:'pipe'});
 assert.equal(sha(xpi),first);
 const sums=read('extensions/manga-site-media-downloader/dist/SHA256SUMS').trim().split(/\s+/)[0]; assert.equal(sums,first);
});
