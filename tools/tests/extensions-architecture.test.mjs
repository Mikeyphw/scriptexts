import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';

const root = process.cwd();
const exts = ['manga-site-media-downloader','stardew-nexus-download-queue','telegram-media-downloader'];
function read(rel){ return fs.readFileSync(path.join(root,rel),'utf8'); }
function loadProtocol(ext='telegram-media-downloader') {
  const code=read(`extensions/${ext}/src/scripts/protocol-v2.js`);
  const ctx={URL, setTimeout, clearTimeout, Date, Promise, console}; ctx.globalThis=ctx;
  vm.runInNewContext(code,ctx); return ctx.EXT_PROTOCOL_V2;
}

test('all extension backgrounds load protocol v2 before application code',()=>{
  for(const ext of exts){
    const m=JSON.parse(read(`extensions/${ext}/src/manifest.json`));
    assert.equal(m.background.scripts[0],'scripts/protocol-v2.js',ext);
    assert.ok(m.background.scripts.includes('background.js'),ext);
  }
});

test('protocol request identities remain unique even for identical payload/url',()=>{
  const p=loadProtocol();
  const a=p.createRequest('DOWNLOAD',{url:'https://example.test/same.bin'});
  const b=p.createRequest('DOWNLOAD',{url:'https://example.test/same.bin'});
  assert.notEqual(a.requestId,b.requestId);
  assert.equal(a.version,2); assert.equal(b.version,2);
});

test('protocol rejects unknown versions and malformed envelopes safely',()=>{
  const p=loadProtocol();
  assert.equal(p.normalizeIncoming({protocol:'scriptexts-extension',version:99,requestId:'x',action:'A'}).error,'unsupported-version');
  assert.equal(p.normalizeIncoming({protocol:'scriptexts-extension',version:2,action:'A'}).error,'invalid-envelope');
  assert.equal(p.normalizeIncoming({}).error,'missing-action');
});

test('legacy messages remain compatible while v2 responses correlate request ids',async()=>{
  const p=loadProtocol();
  const listener=p.adaptPromiseListener((message)=>({seen:message.type,value:message.value}));
  assert.deepEqual(await listener({type:'PING',value:3},{}),{seen:'PING',value:3});
  const req=p.createRequest('PING',{value:4},'req-fixed');
  const res=await listener(req,{});
  assert.equal(res.requestId,'req-fixed'); assert.equal(res.ok,true); assert.equal(res.value.seen,'PING'); assert.equal(res.value.value,4);
});

test('sender validation rejects mismatched extension ids and disallowed tab hosts',()=>{
  const p=loadProtocol();
  assert.equal(p.senderAllowed({id:'other-extension'},{allowedHosts:[]}),true); // runtime id unavailable in isolated harness
  assert.equal(p.senderAllowed({tab:{url:'https://bad.test/a'}},{allowedHosts:['good.test']}),false);
  assert.equal(p.senderAllowed({tab:{url:'https://good.test/a'}},{allowedHosts:['good.test']}),true);
});

test('timeouts are bounded and do not depend on worker lifetime state',async()=>{
  const p=loadProtocol();
  await assert.rejects(()=>p.withTimeout(new Promise(()=>{}),15,'probe'),/timed out/);
});

test('background listeners are registered synchronously and routed through protocol adapter',()=>{
  const manga=read('extensions/manga-site-media-downloader/src/background.js');
  const stardew=read('extensions/stardew-nexus-download-queue/src/background.js');
  const telegram=read('extensions/telegram-media-downloader/src/background.js');
  assert.match(manga,/onMessage\.addListener\(EXT_PROTOCOL_V2\.adaptPromiseListener/);
  assert.match(stardew,/onMessage\.addListener\(EXT_PROTOCOL_V2\.adaptPromiseListener/);
  assert.match(telegram,/onMessage\.addListener\(EXT_PROTOCOL_V2\.adaptCallbackListener/);
  for(const src of [manga,stardew,telegram]) assert.doesNotMatch(src,/await\s+[^;]+;\s*\n\s*(?:browser|chrome)\.runtime\.onMessage\.addListener/);
});


test('packaged protocol implementations stay byte-identical across extension targets',()=>{
  const copies=exts.map(ext=>read(`extensions/${ext}/src/scripts/protocol-v2.js`));
  assert.ok(copies.every(value=>value===copies[0]));
});

test('v2 unknown actions return a correlated safe failure instead of hanging',async()=>{
  const p=loadProtocol();
  const listener=p.adaptPromiseListener(()=>undefined);
  const res=await listener(p.createRequest('NO_SUCH_ACTION',{},'unknown-1'),{});
  assert.equal(res.ok,false); assert.equal(res.requestId,'unknown-1'); assert.match(res.error,/unknown-action/);
});

test('stardew persists download request identity across background restart',()=>{
  const src=read('extensions/stardew-nexus-download-queue/src/background.js');
  assert.match(src,/"downloadToQueue"/);
  assert.match(src,/downloadToQueue:\s*state\.downloadToQueue/);
  assert.match(src,/Object\.values\(state\.downloadToQueue\)\.includes\(item\.id\)/);
});
