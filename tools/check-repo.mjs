import { execFileSync } from 'node:child_process';
import { readdir, readFile, stat } from 'node:fs/promises';
import { extname, join, relative, resolve } from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
const errors = [];
const notes = [];
const RAW_BASE = 'https://raw.githubusercontent.com/Mikeyphw/scriptexts/main';

async function exists(path) {
  try { await stat(path); return true; } catch { return false; }
}

async function walk(dir) {
  const out = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    if (entry.name === 'node_modules' || entry.name === '.git') continue;
    const path = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...await walk(path));
    else out.push(path);
  }
  return out;
}

async function hasTrackedFilesOrRuntimeArtifacts(path) {
  if (!await exists(path)) return false;
  const stats = await stat(path);
  if (!stats.isDirectory()) return true;
  const files = await walk(path);
  return files.length > 0;
}

function fieldsFromUserscript(text) {
  const block = text.match(/\/\/\s*==UserScript==([\s\S]*?)\/\/\s*==\/UserScript==/);
  if (!block) return null;
  const values = new Map();
  for (const line of block[1].split(/\r?\n/)) {
    const match = line.match(/^\s*\/\/\s*@([A-Za-z0-9:_-]+)\s+(.+)$/);
    if (!match) continue;
    if (!values.has(match[1])) values.set(match[1], []);
    values.get(match[1]).push(match[2].trim());
  }
  return values;
}

function one(fields, name) {
  return fields.get(name)?.[0] || '';
}

function isKebab(value) {
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value);
}

const manifest = JSON.parse(await readFile(join(root, 'repo-manifest.json'), 'utf8'));
for (const project of manifest.projects) {
  const base = join(root, project.path);
  if (!await exists(base)) errors.push(`Missing project: ${project.path}`);
  const slug = project.path.split('/').pop();
  if (!isKebab(slug)) errors.push(`${project.path}: project slug must be lowercase kebab-case`);
  if (project.builder && !await exists(join(base, project.builder))) errors.push(`${project.path}: missing builder ${project.builder}`);
  for (const artifact of project.install_artifacts || []) {
    if (!await exists(join(base, artifact))) errors.push(`${project.path}: missing install artifact ${artifact}`);
  }
}

const files = await walk(root);
for (const path of files.filter((item) => extname(item) === '.json')) {
  try { JSON.parse(await readFile(path, 'utf8')); }
  catch (error) { errors.push(`${relative(root, path)}: invalid JSON: ${error.message}`); }
}

for (const path of files.filter((item) => item.endsWith('.user.js'))) {
  const rel = relative(root, path).replaceAll('\\', '/');
  const text = await readFile(path, 'utf8');
  const fields = fieldsFromUserscript(text);
  if (!fields) { errors.push(`${rel}: missing userscript metadata block`); continue; }
  const name = one(fields, 'name');
  const version = one(fields, 'version');
  const namespace = one(fields, 'namespace');
  const updateURL = one(fields, 'updateURL');
  const downloadURL = one(fields, 'downloadURL');
  if (!name) errors.push(`${rel}: missing @name`);
  if (!/^\d+(?:\.\d+)+(?:[-+][0-9A-Za-z.-]+)?$/.test(version)) errors.push(`${rel}: invalid or missing @version (${version || 'empty'})`);
  const slug = rel.split('/').pop().replace(/\.user\.js$/, '');
  if (namespace !== `https://github.com/Mikeyphw/scriptexts/userscripts/${slug}`) errors.push(`${rel}: unexpected @namespace ${namespace || 'missing'}`);
  if (downloadURL !== `${RAW_BASE}/${rel}`) errors.push(`${rel}: unexpected @downloadURL ${downloadURL || 'missing'}`);
  if (updateURL !== `${RAW_BASE}/${rel.replace(/\.user\.js$/, '.meta.js')}`) errors.push(`${rel}: unexpected @updateURL ${updateURL || 'missing'}`);
  const metaRel = rel.replace(/\.user\.js$/, '.meta.js');
  if (!await exists(join(root, metaRel))) errors.push(`${rel}: missing generated meta file ${metaRel}`);
  notes.push(`${name} ${version}`);
  try { execFileSync(process.execPath, ['--check', path], { stdio: 'pipe' }); }
  catch (error) { errors.push(`${rel}: JavaScript syntax check failed\n${error.stderr?.toString() || error.message}`); }
}

for (const path of files.filter((item) => item.endsWith('.js') && !item.endsWith('.user.js') && !item.endsWith('.meta.js') && !item.endsWith('.min.js'))) {
  const rel = relative(root, path);
  try { execFileSync(process.execPath, ['--check', path], { stdio: 'pipe' }); }
  catch (error) { errors.push(`${rel}: JavaScript syntax check failed\n${error.stderr?.toString() || error.message}`); }
}

const mopPath = join(root, 'userscripts/builders/content-site-modernizer/dist/menofporn-modern-ui.user.js');
const mop = await readFile(mopPath, 'utf8');
for (const marker of ['function hideFeedAds', 'function hideEmptyPostAdBlocks', 'mop-reading-progress', '-webkit-line-clamp: unset !important']) {
  if (!mop.includes(marker)) errors.push(`MenOfPorn source is missing regression marker: ${marker}`);
}

const bcPath = join(root, 'userscripts/builders/content-site-modernizer/dist/bleeding-cool-modern-reader.user.js');
if (!await exists(bcPath)) errors.push('Bleeding Cool generated userscript is missing.');
else {
  const bc = await readFile(bcPath, 'utf8');
  for (const marker of ['Bleeding Cool Modern Reader', 'installContentSiteModernizer', 'bleedingcool.com/*', 'csm-bottomnav']) {
    if (!bc.includes(marker)) errors.push(`Bleeding Cool source is missing marker: ${marker}`);
  }
}

const aiptPath = join(root, 'userscripts/builders/content-site-modernizer/dist/aipt-comics-modern-reader.user.js');
if (!await exists(aiptPath)) errors.push('AIPT Comics generated userscript is missing.');
else {
  const aipt = await readFile(aiptPath, 'utf8');
  for (const marker of ['AIPT Comics Modern Reader', 'installContentSiteModernizer', 'aiptcomics.com/*', 'csm-bottomnav']) {
    if (!aipt.includes(marker)) errors.push(`AIPT Comics source is missing marker: ${marker}`);
  }
}

for (const project of manifest.projects.filter((item) => item.type === 'firefox-extension')) {
  const src = join(root, project.path, 'src');
  if (await exists(join(src, 'META-INF'))) errors.push(`${project.path}/src: must not contain stale META-INF signatures`);
  const manifestPath = join(src, 'manifest.json');
  const data = JSON.parse(await readFile(manifestPath, 'utf8'));
  const id = data?.browser_specific_settings?.gecko?.id;
  const expected = `${project.path.split('/').pop()}@mikeyphw.scriptexts`;
  if (id !== expected) errors.push(`${project.path}: expected Firefox ID ${expected}, got ${id || 'missing'}`);
  if (project.firefox_extension_id !== expected) errors.push(`${project.path}: manifest record expected ${expected}, got ${project.firefox_extension_id || 'missing'}`);
}

const forbiddenPaths = [
  'userscripts/standalone/menofporn-modern-ui',
  'extensions/mrm-suite-downloader',
  'extensions/stardew-nexus-queue',
  'userscripts/builders/manga-modern-ui',
  'userscripts/standalone/100-search-engines-clean-dark-ui',
  'userscripts/standalone/lpsg-video-unlocker-improved-gallery',
  'userscripts/standalone/poast-nitter-reset-timeline-metadata',
  'userscripts/standalone/telegram-media-downloader-userscript'
];
for (const forbidden of forbiddenPaths) {
  if (await hasTrackedFilesOrRuntimeArtifacts(join(root, forbidden))) errors.push(`obsolete path still present: ${forbidden}`);
}

if (errors.length) {
  console.error(`Repository check failed with ${errors.length} issue(s):`);
  for (const error of errors) console.error(`\n- ${error}`);
  process.exit(1);
}

console.log(`Repository check passed: ${files.length} files inspected.`);
for (const note of [...new Set(notes)].sort()) console.log(`- ${note}`);
