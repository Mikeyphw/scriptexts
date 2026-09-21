import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
const ROOT=process.cwd();
const exts=['manga-site-media-downloader','stardew-nexus-download-queue','telegram-media-downloader'];
const read=p=>fs.readFileSync(path.join(ROOT,p),'utf8');
const manifest=n=>JSON.parse(read(`extensions/${n}/src/manifest.json`));

test('all extensions declare explicit Firefox identities and Android floor',()=>{for(const n of exts){const m=manifest(n);assert.ok(m.browser_specific_settings?.gecko?.id, n);assert.ok(m.browser_specific_settings?.gecko?.strict_min_version,n);assert.ok(m.browser_specific_settings?.gecko_android?.strict_min_version,n);}});
test('content-script matches stay inside declared site scope',()=>{for(const n of exts){const m=manifest(n);for(const c of m.content_scripts||[]) for(const x of c.matches||[]) assert.match(x,/^https:\/\//,`${n}: ${x}`);}});
test('web accessible resources are minimal and explicit',()=>{for(const n of exts){const m=manifest(n);for(const r of m.web_accessible_resources||[]) {assert.ok(!r.includes('*'),`${n}: wildcard WAR`);assert.ok(fs.existsSync(path.join(ROOT,`extensions/${n}/src`,r)),`${n}: missing ${r}`);}}});
test('protocol is loaded before background application code',()=>{for(const n of exts){const s=manifest(n).background?.scripts||[];assert.ok(s.includes('scripts/protocol-v2.js'),n);assert.ok(s.indexOf('scripts/protocol-v2.js')<s.indexOf('background.js'),n);}});
test('popup accessibility contracts are permanent',()=>{const t=read('extensions/telegram-media-downloader/src/popup.html');assert.match(t,/role="status"/);assert.match(t,/:focus-visible/);assert.match(t,/min-height:44px/);const s=read('extensions/stardew-nexus-download-queue/src/popup.html');assert.match(s,/aria-label="Refresh queue"/);assert.match(s,/aria-live="polite"/);assert.match(read('extensions/stardew-nexus-download-queue/src/popup.css'),/:focus-visible/);const m=read('extensions/manga-site-media-downloader/src/popup.html');assert.match(m,/:focus-visible/);});
test('extension source avoids executable-string primitives',()=>{for(const n of exts){for(const f of fs.readdirSync(path.join(ROOT,`extensions/${n}/src`),{recursive:true})) {if(typeof f!=='string'||!f.endsWith('.js')||f.endsWith('.min.js')) continue;const p=path.join(ROOT,`extensions/${n}/src`,f);const s=fs.readFileSync(p,'utf8');assert.doesNotMatch(s,/\beval\s*\(/,p);assert.doesNotMatch(s,/\bnew\s+Function\s*\(/,p);}}});
test('all extension packages build with matching SHA256SUMS',()=>{for(const n of exts){execFileSync('python3',[`extensions/${n}/build.py`],{cwd:ROOT,stdio:'pipe'});const m=manifest(n);const x=`${n}-${m.version}.xpi`;const line=read(`extensions/${n}/dist/SHA256SUMS`).trim();assert.match(line,new RegExp(`^[0-9a-f]{64}  ${x.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')}$`));assert.ok(fs.existsSync(path.join(ROOT,`extensions/${n}/dist/${x}`)));}});
test('no stale XPI versions remain after build',()=>{for(const n of exts){const m=manifest(n);assert.deepEqual(fs.readdirSync(path.join(ROOT,`extensions/${n}/dist`)).filter(x=>x.endsWith('.xpi')),[`${n}-${m.version}.xpi`]);}});
