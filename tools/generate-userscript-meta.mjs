import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
const RAW_BASE = 'https://raw.githubusercontent.com/Mikeyphw/scriptexts/main';
const HOME_BASE = 'https://github.com/Mikeyphw/scriptexts/tree/main';
const issueUrl = 'https://github.com/Mikeyphw/scriptexts/issues';

function metadataBlock(text) {
  const match = text.match(/^\s*\/\/\s*==UserScript==[\s\S]*?\/\/\s*==\/UserScript==/m);
  if (!match) throw new Error('Missing userscript metadata block.');
  return match[0].trim();
}

function stripField(block, field) {
  return block.replace(new RegExp(`^\\s*//\\s*@${field}\\s+.+(?:\\r?\\n)?`, 'gm'), '');
}

function installProjectPath(rel) {
  const parts = rel.split('/');
  if (parts[0] === 'userscripts' && parts[1] === 'standalone') return parts.slice(0, 3).join('/');
  if (parts[0] === 'userscripts' && parts[1] === 'builders') return parts.slice(0, 3).join('/');
  return dirname(rel);
}

function rewriteBlock(block, rel) {
  const slug = rel.split('/').pop().replace(/\.user\.js$/, '');
  let out = block.trim();
  for (const field of ['namespace', 'homepageURL', 'supportURL', 'updateURL', 'downloadURL']) {
    out = stripField(out, field).trim();
  }
  const lines = out.split(/\r?\n/);
  let idx = lines.findIndex((line) => /^\s*\/\/\s*@name\s+/.test(line));
  idx = idx < 0 ? 1 : idx + 1;
  lines.splice(idx, 0,
    `// @namespace    https://github.com/Mikeyphw/scriptexts/userscripts/${slug}`,
    `// @homepageURL  ${HOME_BASE}/${installProjectPath(rel)}`,
    `// @supportURL   ${issueUrl}`,
    `// @updateURL    ${RAW_BASE}/${rel.replace(/\.user\.js$/, '.meta.js')}`,
    `// @downloadURL  ${RAW_BASE}/${rel}`,
  );
  return lines.join('\n');
}

async function* walk(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    if (entry.name === 'node_modules' || entry.name === '.git') continue;
    const path = join(dir, entry.name);
    if (entry.isDirectory()) yield* walk(path);
    else yield path;
  }
}

function isInstallableUserscript(rel) {
  if (!rel.endsWith('.user.js')) return false;
  if (rel.startsWith('userscripts/standalone/')) return true;
  return /^userscripts\/builders\/[^/]+\/dist\//.test(rel);
}

const files = [];
for await (const path of walk(join(root, 'userscripts'))) {
  const rel = relative(root, path).replaceAll('\\', '/');
  if (isInstallableUserscript(rel)) files.push(path);
}

for (const path of files.sort()) {
  const rel = relative(root, path).replaceAll('\\', '/');
  const raw = await readFile(path, 'utf8');
  const block = metadataBlock(raw);
  const rewritten = rewriteBlock(block, rel);
  const next = raw.replace(block, rewritten);
  if (next !== raw) await writeFile(path, next, 'utf8');
  const metaPath = path.replace(/\.user\.js$/, '.meta.js');
  await mkdir(dirname(metaPath), { recursive: true });
  await writeFile(metaPath, `${rewritten}\n`, 'utf8');
  console.log(`metadata ${rel}`);
}
