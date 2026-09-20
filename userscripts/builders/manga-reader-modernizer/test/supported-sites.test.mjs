import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import yaoi from "../src/sites/yaoimangaonline/profile.mjs";
import bara from "../src/sites/baramangaonline/profile.mjs";
const ROOT=dirname(dirname(fileURLToPath(import.meta.url)));
const profiles=[yaoi,bara];
const read=(p)=>readFile(join(ROOT,p),"utf8");

test("supported sites use modular per-site profiles and canonical sources", async()=>{
  assert.deepEqual(profiles.map(p=>p.id),["yaoimangaonline","baramangaonline"]);
  for(const p of profiles){ const src=await read(p.entry); assert.match(src,new RegExp(p.host.replaceAll('.', '\\.'))); assert.ok(!p.entry.includes("src/original")); assert.doesNotMatch(src, /src\/original/); }
});

test("long chapter fixtures preserve at least 30 ordered reader pages", async()=>{
  for(const p of profiles){ const html=await read(p.fixture); const pages=[...html.matchAll(/page-(\d{3})\.jpg/g)].map(m=>Number(m[1])); assert.equal(pages.length,30); assert.deepEqual(pages,[...Array(30)].map((_,i)=>i+1)); assert.match(html,/rel="prev"/); assert.match(html,/rel="next"/); }
});

test("reader images have explicit failure state and user retry", async()=>{
  for(const p of profiles){ const src=await read(p.entry); assert.match(src,/function installReaderImageRetry\(/); assert.match(src,/addEventListener\("error"/); assert.match(src,/readerRetryState = "failed"/); assert.match(src,/Tap image to retry/); assert.match(src,/mrm_retry=/); assert.match(src,/installReaderImageRetry\(img, image\.src/); }
});

test("mobile and wide-mobile reader contracts remain present", async()=>{
  const y=await read(yaoi.entry), b=await read(bara.entry);
  assert.match(y,/isMobileViewport/); assert.match(y,/visualViewport|innerWidth/);
  assert.match(b,/MOBILE_BREAKPOINT/); assert.match(b,/isMobileView/);
  for(const src of [y,b]){ assert.match(src,/isWideMobileDevice/); assert.match(src,/any-pointer: coarse/); assert.match(src,/Android/i); assert.match(src,/maxTouchPoints/); assert.match(src,/reader-page/); }
});

test("reader navigation, thumbnails and adjacent-post controls survive modernization", async()=>{
  for(const p of profiles){ const src=await read(p.entry); assert.match(src,/Thumbnail strip/); assert.match(src,/Previous|prev/i); assert.match(src,/Next|next/i); assert.match(src,/fullscreen/i); assert.match(src,/tapzone/i); }
});

test("generated outputs remain self-contained and route-owned", async()=>{
  for(const p of profiles){ const out=await read(p.outfile); assert.match(out,/==UserScript==/); assert.match(out,new RegExp(`@match\\s+https:\\/\\/${p.host.replaceAll('.', '\\.')}`)); assert.match(out,/installReaderImageRetry/); }
});
