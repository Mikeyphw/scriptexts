import {spawnSync} from 'node:child_process';
import fs from 'node:fs'; import path from 'node:path'; import crypto from 'node:crypto';
const ROOT=process.cwd(); const exts=['manga-site-media-downloader','stardew-nexus-download-queue','telegram-media-downloader'];
const run=(cmd,args)=>{const r=spawnSync(cmd,args,{cwd:ROOT,stdio:'inherit'});if(r.status!==0)process.exit(r.status??1)};
run('npm',['run','test:extensions:architecture']); run('npm',['run','test:extension:telegram']); run('node',['--test','tools/tests/manga-extension-convergence.test.mjs']); run('node',['--test','tools/tests/extensions-release-seal.test.mjs']);
for(const n of exts){run('python3',[`extensions/${n}/build.py`]); const m=JSON.parse(fs.readFileSync(`extensions/${n}/src/manifest.json`)); const x=path.join(ROOT,`extensions/${n}/dist/${n}-${m.version}.xpi`); const first=crypto.createHash('sha256').update(fs.readFileSync(x)).digest('hex'); run('python3',[`extensions/${n}/build.py`]); const second=crypto.createHash('sha256').update(fs.readFileSync(x)).digest('hex'); if(first!==second) throw new Error(`${n}: package is not reproducible`);}
console.log('Scriptexts extension release seal: PASS');
