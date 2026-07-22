import { mkdir, readFile, writeFile, rm } from 'node:fs/promises';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { spawnSync } from 'node:child_process';
import builder from './scripts.config.mjs';
import { runtime } from './src/core/runtime.mjs';

const root = resolve(fileURLToPath(new URL('.', import.meta.url)));
const repoRoot = resolve(root, '../../..');
const checkOnly = process.argv.includes('--check');
const RAW_BASE = 'https://raw.githubusercontent.com/Mikeyphw/scriptexts/main';
const HOME_BASE = 'https://github.com/Mikeyphw/scriptexts/tree/main';

function metaLines(profile, outputRel) {
  const lines = [
    '// ==UserScript==',
    `// @name         ${profile.name}`,
    `// @namespace    https://github.com/Mikeyphw/scriptexts/userscripts/${profile.id}`,
    `// @homepageURL  ${HOME_BASE}/${relative(repoRoot, root).replaceAll('\\', '/')}`,
    `// @supportURL   https://github.com/Mikeyphw/scriptexts/issues`,
    `// @updateURL    ${RAW_BASE}/${outputRel.replace(/\.user\.js$/, '.meta.js')}`,
    `// @downloadURL  ${RAW_BASE}/${outputRel}`,
    `// @version      ${profile.version}`,
    `// @description  ${profile.description}`,
    `// @author       Mikeyphw`,
  ];
  for (const match of profile.matches || []) lines.push(`// @match        ${match}`);
  for (const grant of profile.grants || []) lines.push(`// @grant        ${grant}`);
  if (profile.runAt) lines.push(`// @run-at       ${profile.runAt}`);
  if (profile.noFrames) lines.push('// @noframes');
  lines.push('// ==/UserScript==');
  return lines.join('\n');
}

function stripMeta(text) {
  return text.replace(/^\s*\/\/\s*==UserScript==[\s\S]*?\/\/\s*==\/UserScript==\s*/m, '').trimStart();
}

async function buildScript(profile) {
  const outPath = resolve(root, profile.output.userScript);
  const rel = relative(repoRoot, outPath).replaceAll('\\', '/');
  const header = metaLines(profile, rel);
  let body;
  if (profile.source) {
    const src = await readFile(resolve(root, profile.source), 'utf8');
    body = stripMeta(src);
  } else {
    const css = await readFile(resolve(root, profile.css || 'src/core/styles.css'), 'utf8');
    body = `(() => {\n  'use strict';\n  const PROFILE = ${JSON.stringify(profile.client, null, 2)};\n  const CSS_TEXT = ${JSON.stringify(css)};\n  const install = ${runtime};\n  install(PROFILE, CSS_TEXT);\n})();\n`;
  }
  return { outPath, rel, user: `${header}\n\n${body.endsWith('\n') ? body : `${body}\n`}`, meta: `${header}\n` };
}

const built = [];
for (const profile of builder.scripts) built.push(await buildScript(profile));

if (!checkOnly) await rm(resolve(root, builder.distDir), { recursive: true, force: true });

let failed = false;
for (const item of built) {
  const metaPath = item.outPath.toString().replace(/\.user\.js$/, '.meta.js');
  if (checkOnly) {
    const [currentUser, currentMeta] = await Promise.all([
      readFile(item.outPath, 'utf8').catch(() => ''),
      readFile(metaPath, 'utf8').catch(() => '')
    ]);
    if (currentUser !== item.user || currentMeta !== item.meta) {
      console.error(`Out of date: ${item.rel}`);
      failed = true;
    }
  } else {
    await mkdir(dirname(item.outPath), { recursive: true });
    await writeFile(item.outPath, item.user, 'utf8');
    await writeFile(metaPath, item.meta, 'utf8');
    console.log(`built ${item.rel}`);
  }
  const syntax = spawnSync(process.execPath, ['--check', item.outPath], { encoding: 'utf8' });
  if (syntax.status !== 0) {
    console.error(syntax.stderr || syntax.stdout);
    failed = true;
  }
}

if (failed) process.exit(1);
