import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";
import { buildTargets } from "./scripts.config.mjs";

const ROOT = dirname(fileURLToPath(import.meta.url));



const RAW_BASE = "https://raw.githubusercontent.com/Mikeyphw/scriptexts/main";
const HOME_BASE = "https://github.com/Mikeyphw/scriptexts/tree/main";
const PROJECT_PATH = "userscripts/builders/sims-cc-download-basket";

function removeMetadataField(block, field) {
  return block.replace(new RegExp(`^\\s*//\\s*@${field}\\s+.+(?:\\r?\\n)?`, 'gm'), '');
}

function upsertGeneratedMetadata(block, target) {
  const slug = target.outfile.split('/').pop().replace(/\.user\.js$/, '');
  const downloadPath = `${PROJECT_PATH}/${target.outfile}`;
  let out = block.trim();
  for (const field of ['namespace', 'homepageURL', 'supportURL', 'updateURL', 'downloadURL']) {
    out = removeMetadataField(out, field).trim();
  }
  const lines = out.split(/\r?\n/);
  let idx = lines.findIndex((line) => /^\s*\/\/\s*@name\s+/.test(line));
  idx = idx < 0 ? 1 : idx + 1;
  lines.splice(idx, 0,
    `// @namespace    https://github.com/Mikeyphw/scriptexts/userscripts/${slug}`,
    `// @homepageURL  ${HOME_BASE}/${PROJECT_PATH}`,
    `// @supportURL   https://github.com/Mikeyphw/scriptexts/issues`,
    `// @updateURL    ${RAW_BASE}/${downloadPath.replace(/\.user\.js$/, '.meta.js')}`,
    `// @downloadURL  ${RAW_BASE}/${downloadPath}`,
  );
  return lines.join('\n');
}

function metaFromUserscript(raw) {
  const match = raw.match(/^\s*\/\/\s*==UserScript==[\s\S]*?\/\/\s*==\/UserScript==/m);
  if (!match) throw new Error('Built userscript has no metadata block.');
  return `${match[0].trim()}\n`;
}



function specializeSiteBlocks(raw, activeSite) {
  return raw.replace(
    /^\s*\/\/\s*@sccb-site-begin\s+(mts|simblr|tsr)\s*$([\s\S]*?)^\s*\/\/\s*@sccb-site-end\s+\1\s*$/gm,
    (_whole, site, body) => site === activeSite ? body : ''
  );
}


const SITE_SIGNATURES = {
  mts: 'function rewriteMtsPageNavigation',
  simblr: 'function rewriteSimblrPage',
  tsr: 'function rewriteTsrPage',
};

function validateTargetSpecialization(raw, activeSite) {
  const expected = SITE_SIGNATURES[activeSite];
  if (!expected || !raw.includes(expected)) {
    throw new Error(`Target ${activeSite || 'unknown'} is missing its site implementation.`);
  }
  for (const [site, signature] of Object.entries(SITE_SIGNATURES)) {
    if (site !== activeSite && raw.includes(signature)) {
      throw new Error(`Target ${activeSite} unexpectedly includes ${site} implementation code.`);
    }
  }
}

function findDuplicateFunctionNames(raw) {
  const counts = new Map();
  const pattern = /^\s*(?:async\s+)?function\s+([A-Za-z_$][\w$]*)\s*\(/gm;
  for (const match of raw.matchAll(pattern)) counts.set(match[1], (counts.get(match[1]) || 0) + 1);
  return [...counts.entries()].filter(([, count]) => count > 1).map(([name, count]) => `${name}×${count}`);
}

function parseMetadataBlock(raw) {
  const match = raw.match(/\/\/\s*==UserScript==[\s\S]*?\/\/\s*==\/UserScript==/m);
  if (!match) throw new Error("Entry userscript has no UserScript metadata block.");
  return match[0].trim();
}

function stripMetadata(raw) {
  return raw.replace(/^\s*\/\/\s*==UserScript==[\s\S]*?\/\/\s*==\/UserScript==\s*/m, "");
}

function rewriteExports(raw) {
  return raw
    .replace(/^\s*export\s+function\s+/gm, "function ")
    .replace(/^\s*export\s+const\s+/gm, "const ")
    .replace(/^\s*export\s+let\s+/gm, "let ");
}

function extractImports(raw) {
  const imports = [];
  const cleaned = raw.replace(/^\s*import\s+[^'\"]+['\"](.+?)['\"];?\s*$/gm, (_line, spec) => {
    imports.push(spec);
    return "";
  });
  return { imports, cleaned };
}


function compactTemplateAfterMarker(raw, marker) {
  const markerIndex = raw.indexOf(marker);
  if (markerIndex < 0) return raw;
  const start = raw.indexOf('`', markerIndex + marker.length);
  if (start < 0) return raw;
  const part = readTemplateLiteral(raw, start);
  return raw.slice(0, start) + part.text + raw.slice(part.next);
}

function compactModuleCss(raw, file) {
  if (file.endsWith('src/core/design-system.js')) return compactTemplateAfterMarker(raw, 'return');
  if (file.endsWith('src/core/app.js')) return compactTemplateAfterMarker(raw, 'style.textContent =');
  if (file.endsWith('src/entry/sims-basket-thesimsresource.user.js')) return compactTemplateAfterMarker(raw, 'const css =');
  return raw;
}

async function inlineModule(file, target, seen = new Set()) {
  const abs = normalize(join(ROOT, file));
  if (seen.has(abs)) return "";
  seen.add(abs);

  const raw = await readFile(abs, "utf8");
  const source = stripMetadata(raw);
  const { imports, cleaned } = extractImports(source);

  let out = "";
  for (const spec of imports) {
    if (!spec.startsWith(".")) throw new Error(`Only relative imports are supported in userscript builds: ${spec}`);
    const next = normalize(join(dirname(abs), spec));
    const rel = next.slice(ROOT.length + 1);
    out += await inlineModule(rel, target, seen);
  }

  out += `\n// ---- ${file} ----\n`;
  const specialized = specializeSiteBlocks(rewriteExports(cleaned), target?.site);
  const optimized = compactModuleCss(specialized, file);
  out += optimized.trim() + "\n";
  return out;
}


function compactTemplateLiteralText(text) {
  return text
    .replace(/\/\*[\s\S]*?\*\//g, ' ')
    .replace(/\s*([{}:;,>+~])\s*/g, '$1')
    .replace(/\s+/g, ' ')
    .trim();
}

function readQuotedExpression(raw, start, quote) {
  let out = quote;
  let i = start + 1;
  for (; i < raw.length; i++) {
    const c = raw[i];
    out += c;
    if (c === '\\') {
      if (i + 1 < raw.length) out += raw[++i];
      continue;
    }
    if (c === quote) break;
  }
  return { text: out, next: i + 1 };
}

function readTemplateExpression(raw, start) {
  let out = '${';
  let i = start + 2;
  let depth = 1;
  for (; i < raw.length && depth > 0;) {
    const c = raw[i];
    if (c === '\'' || c === '"') {
      const part = readQuotedExpression(raw, i, c);
      out += part.text;
      i = part.next;
      continue;
    }
    if (c === '`') {
      const part = readTemplateLiteral(raw, i);
      out += part.text;
      i = part.next;
      continue;
    }
    if (c === '{') { depth++; out += c; i++; continue; }
    if (c === '}') { depth--; out += c; i++; continue; }
    out += /\s/.test(c) ? ' ' : c;
    i++;
  }
  return { text: out.replace(/\s+/g, ' '), next: i };
}

function readTemplateLiteral(raw, start) {
  let out = '`';
  let chunk = '';
  let i = start + 1;
  for (; i < raw.length;) {
    const c = raw[i];
    if (c === '\\') {
      chunk += c;
      if (i + 1 < raw.length) chunk += raw[i + 1];
      i += 2;
      continue;
    }
    if (c === '$' && raw[i + 1] === '{') {
      out += compactTemplateLiteralText(chunk);
      chunk = '';
      const expr = readTemplateExpression(raw, i);
      out += expr.text;
      i = expr.next;
      continue;
    }
    if (c === '`') {
      out += compactTemplateLiteralText(chunk) + '`';
      return { text: out, next: i + 1 };
    }
    chunk += c;
    i++;
  }
  return { text: out + chunk, next: i };
}

function compactOutput(raw) {
  return raw
    .replace(/^\s*\/\/ ---- .+? ----\s*$/gm, '')
    .replace(/^[\t ]+$/gm, '')
    .replace(/\n{3,}/g, '\n\n')
    .trimEnd() + '\n';
}


function formatBytesBuild(bytes) {
  if (bytes >= 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
  if (bytes >= 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${bytes} B`;
}

function buildStats(target, built, entryRaw) {
  const bytes = Buffer.byteLength(built, 'utf8');
  const lines = built.split(/\r?\n/).length;
  const cssBytes = [...built.matchAll(/`([^`]*(?:sccb|Sims CC|data-sccb)[^`]*)`/g)]
    .reduce((sum, match) => sum + Buffer.byteLength(match[1] || '', 'utf8'), 0);
  const matches = [...entryRaw.matchAll(/^\/\/\s*@match\s+(.+)$/gm)].map(match => match[1].trim());
  const metadataOk = /@name\s+/.test(entryRaw) && /@version\s+/.test(entryRaw) && matches.length > 0;
  return { name: target.name, site: target.site, outfile: target.outfile, lines, bytes, cssBytes, matches, metadataOk };
}

await mkdir(join(ROOT, "dist"), { recursive: true });

const report = [];

for (const target of buildTargets) {
  const entryRaw = await readFile(join(ROOT, target.entry), "utf8");
  const metadata = upsertGeneratedMetadata(parseMetadataBlock(entryRaw), target);
  const body = await inlineModule(target.entry, target);
  const duplicates = findDuplicateFunctionNames(body);
  if (duplicates.length) throw new Error(`${target.name}: duplicate function declarations: ${duplicates.join(', ')}`);
  validateTargetSpecialization(body, target.site);
  const rawBuilt = (`${metadata}\n\n(() => {\n  'use strict';\n${body}\n})();\n`).trimEnd() + '\n';
  const built = compactOutput(rawBuilt);
  await writeFile(join(ROOT, target.outfile), built, "utf8");
  await writeFile(join(ROOT, target.outfile.replace(/\.user\.js$/, '.meta.js')), metaFromUserscript(built), "utf8");
  const stats = buildStats(target, built, entryRaw);
  report.push(stats);
  const warning = stats.bytes > 512 * 1024 ? '  ⚠ large userscript' : '';
  const metadataStatus = stats.metadataOk ? 'metadata ok' : 'metadata missing';
  console.log(`built ${target.outfile} · ${stats.lines.toLocaleString()} lines · ${formatBytesBuild(stats.bytes)} · css/templates ${formatBytesBuild(stats.cssBytes)} · ${metadataStatus} · ${stats.matches.length} @match${warning}`);
}

console.log('\nBuild report');
console.log('------------');
for (const item of report) {
  console.log(`${item.name} [${item.site}]: ${item.outfile}`);
  console.log(`  size: ${formatBytesBuild(item.bytes)} · lines: ${item.lines.toLocaleString()} · css/templates: ${formatBytesBuild(item.cssBytes)}`);
  console.log(`  metadata: ${item.metadataOk ? 'ok' : 'check required'} · matches: ${item.matches.join(', ')}`);
}
console.log('target specialization: each output includes shared core plus only its selected site implementation');
console.log('syntax checks: run npm run check after build');
console.log('build report complete');
