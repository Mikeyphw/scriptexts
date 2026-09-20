import { execFileSync } from 'node:child_process';
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, relative } from 'node:path';

const root = process.cwd();
const jsonMode = process.argv.includes('--json');
const checks = [];
const add = (name, ok, details='') => checks.push({name, ok: Boolean(ok), details});
const run = (name, cmd, args=[]) => {
  try { execFileSync(cmd,args,{cwd:root,stdio: jsonMode ? 'pipe' : 'inherit',env:process.env}); add(name,true); }
  catch (e) { add(name,false,`exit ${e.status ?? 1}`); }
};
const walk = (dir, out=[]) => { if (!existsSync(dir)) return out; for (const n of readdirSync(dir)) { const p=join(dir,n); statSync(p).isDirectory()?walk(p,out):out.push(p); } return out; };
const meta = p => { const t=readFileSync(p,'utf8'); const block=t.match(/\/\/ ==UserScript==[\s\S]*?\/\/ ==\/UserScript==/)?.[0]||''; const vals=k=>[...block.matchAll(new RegExp(`^//\\s+@${k}\\s+(.+)$`,'gm'))].map(m=>m[1].trim()); return {name:vals('name')[0]||relative(root,p), namespace:vals('namespace')[0]||'', matches:vals('match')}; };

run('aggregate userscript validation','npm',['run','check:userscripts']);
run('deterministic userscript build','npm',['run','build:userscripts']);
run('LPSG release seal','npm',['run','seal:lpsg']);
run('Sims release seal','npm',['run','seal:sims']);
run('Manga reader release seal','npm',['--prefix','userscripts/builders/manga-reader-modernizer','run','seal']);
run('Poast release seal','npm',['run','seal:poast']);
run('Bleeding Cool release seal','npm',['run','content-sites:bleedingcool:seal']);
run('content-site final seal','npm',['run','content-sites:seal']);

const retired = [
 'userscripts/builders/manga-reader-modernizer/src/original/myreadingmanga-modern-reader.user.js',
 'userscripts/builders/manga-reader-modernizer/src/original/myreadingmanga-modern-reader.meta.js',
 'userscripts/builders/manga-reader-modernizer/dist/myreadingmanga-modern-reader.user.js',
 'userscripts/builders/manga-reader-modernizer/dist/myreadingmanga-modern-reader.meta.js'
];
add('legacy MyReadingManga remains retired', retired.every(p=>!existsSync(join(root,p))), retired.filter(p=>existsSync(join(root,p))).join(', '));

const outputs = walk(join(root,'userscripts')).filter(p=>p.endsWith('.user.js') && (p.includes('/dist/') || p.includes('/standalone/')));
const records = outputs.map(p=>({path:relative(root,p),...meta(p)}));
const claims = new Map();
for (const r of records) for (const m of r.matches) { const key=`${r.namespace}\u0000${m}`; const a=claims.get(key)||[]; a.push(r.path); claims.set(key,a); }
const dup=[...claims.entries()].filter(([,v])=>v.length>1).map(([k,v])=>`${k.split('\u0000')[1]} => ${v.join(', ')}`);
add('install outputs have no duplicate namespace/@match claims',dup.length===0,dup.join('; '));
const mrmClaims=records.filter(r=>r.matches.some(m=>m.includes('myreadingmanga.info')));
add('MyReadingManga route has one canonical install artifact',mrmClaims.length===1 && mrmClaims[0].path.includes('myreadingmanga-reimagined'),mrmClaims.map(x=>x.path).join(', '));

const failed=checks.filter(c=>!c.ok);
const result={schema_version:1,status:failed.length?'fail':'pass',summary:`${checks.length-failed.length}/${checks.length} release checks passed`,checks};
if (jsonMode) console.log(JSON.stringify(result,null,2));
else { console.log(`\nScriptexts userscript release seal: ${failed.length?'FAIL':'PASS'}`); for (const c of checks) console.log(`${c.ok?'✓':'✗'} ${c.name}${c.details?` — ${c.details}`:''}`); }
process.exitCode=failed.length?1:0;
