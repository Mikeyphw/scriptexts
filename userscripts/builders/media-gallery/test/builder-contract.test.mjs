import test from "node:test"; import assert from "node:assert/strict"; import fs from "node:fs"; import path from "node:path"; import {fileURLToPath} from "node:url";
const here=path.dirname(fileURLToPath(import.meta.url)); const root=path.resolve(here,"..");
const profile=JSON.parse(fs.readFileSync(path.join(root,"sites/lpsg.json"),"utf8"));
test("media gallery builder exposes a site profile instead of hardcoding future sites",()=>{assert.equal(profile.id,"lpsg");assert.equal(profile.adapter.engine,"xenforo-thread");assert.ok(Array.isArray(profile.adapter.media));});
const lpsgRoot=path.resolve(root,profile.builderRoot); const modules=JSON.parse(fs.readFileSync(path.join(lpsgRoot,"modules.json"),"utf8")); const source=modules.map(n=>fs.readFileSync(path.join(lpsgRoot,"src",n),"utf8")).join("");
test("ZIP starts without forcing raw diagnostics open",()=>{const start=source.indexOf("function downloadAllAsZip"); const run=source.indexOf("function updateToastProgressOnly",start); assert.ok(start>0&&run>start); assert.equal(source.slice(start,run).includes("setDebugPanelVisible(true)"),false);});
test("friendly ZIP job center is persistent and diagnostics remain opt-in",()=>{for(const token of ["pg-zip-job-summary","ZIP_JOB_STORAGE_KEY","saveZipJobSummary(","restoreZipJobSummary(","Gallery Debug"]) assert.ok(source.includes(token),token);});
test("ZIP job center distinguishes completion, cancellation, failure and partial problems",()=>{for(const token of ['status: "complete"','"cancelled" : "failed"','Completed with problems','Retry failed items']) assert.ok(source.includes(token),token);});

const coomerProfile=JSON.parse(fs.readFileSync(path.join(root,"sites/coomer.json"),"utf8"));
const coomerFixture=fs.readFileSync(path.join(root,"test/fixtures/coomer-profile.html"),"utf8");
const coomerSource=fs.readFileSync(path.join(root,coomerProfile.source),"utf8");
test("Coomer adapter is a real second media-gallery target",()=>{assert.equal(coomerProfile.adapter.engine,"coomer-profile");assert.equal(coomerProfile.adapter.pagination,"offset-50");assert.match(coomerSource,/post-card/);assert.match(coomerSource,/mediaFromPost/);});
test("captured Coomer fixture seals profile cards and offset pagination",()=>{assert.ok((coomerFixture.match(/post-card post-card--preview/g)||[]).length>=50);assert.match(coomerFixture,/Showing 1 - 50 of 346/);assert.match(coomerFixture,/\?o=50/);});
test("Coomer runtime scans post pages for original CDN media instead of archiving thumbnails",()=>{assert.match(coomerSource,/coomer\.st/);assert.match(coomerSource,/\\\/data\\\//);assert.match(coomerSource,/await request\(post/);assert.doesNotMatch(coomerSource,/thumbnail\\\/data.*urls\.push/);});
test("Coomer inherits friendly persistent ZIP-job semantics with diagnostics opt-in",()=>{for(const token of ["Creating ZIP","Completed with problems","ZIP cancelled","ZIP could not finish","localStorage.setItem(KEY","Diagnostics"])assert.ok(coomerSource.includes(token),token);});
test("Coomer ZIP has bounded concurrency/retries and cancellation",()=>{assert.match(coomerSource,/pool\(posts,4/);assert.match(coomerSource,/a<=3/);assert.match(coomerSource,/AbortController/);assert.match(coomerSource,/state\.abort\?\.abort/);});

test("Coomer hotfix accepts current CDN subdomains and embedded /data/ originals",()=>{
  for(const token of ['endsWith(".coomer.st")','/\\/data\\//i','matchAll(/https?:\\/\\/','data-original','srcset']) assert.ok(coomerSource.includes(token),token);
});
test("Coomer discovery is incremental and has an explicit zero-media recovery state",()=>{
  for(const token of ['addMedia(media)','No media could be extracted','Open diagnostics','Retry','state.scan.postsDone++']) assert.ok(coomerSource.includes(token),token);
});
test("Coomer mobile gallery is a full-screen application rather than the prototype modal",()=>{
  for(const token of ['inset:0','mg-tabs','mg-bottom','mg-status','mg-thumb','env(safe-area-inset-bottom)','prefers-reduced-motion']) assert.ok(coomerSource.includes(token),token);
  assert.ok(coomerSource.includes('launch.hidden=true'));
});
test("Coomer gallery auto-scans on open and exposes image/video filtering",()=>{
  assert.ok(coomerSource.includes('if(!state.scanStarted)scanAll()'));
  assert.ok(coomerSource.includes('data-filter="image"'));
  assert.ok(coomerSource.includes('data-filter="video"'));
});
test("Coomer post fixture seals image, video and lazy original shapes",()=>{
  const fixture=fs.readFileSync(path.join(root,"test/fixtures/coomer-post.html"),"utf8");
  assert.match(fixture,/n1\.coomer\.st\/data\//);
  assert.match(fixture,/n4\.coomer\.st\/data\//);
  assert.match(fixture,/\.mp4/);
  assert.match(fixture,/data-original=/);
});
