import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import yaoiProfile from "./src/sites/yaoimangaonline/profile.mjs";
import baraProfile from "./src/sites/baramangaonline/profile.mjs";

const ROOT = dirname(fileURLToPath(import.meta.url));
const RAW_BASE = "https://raw.githubusercontent.com/Mikeyphw/scriptexts/main";
const HOME_BASE = "https://github.com/Mikeyphw/scriptexts/tree/main";
const projectPath = "userscripts/builders/manga-reader-modernizer";
const checkMode = process.argv.includes("--check");

const builds = [yaoiProfile, baraProfile];

function parseMetadataBlock(raw) {
  const match = raw.match(/\/\/\s*==UserScript==[\s\S]*?\/\/\s*==\/UserScript==/m);
  if (!match) return null;
  const lines = match[0].split(/\r?\n/);
  const fields = new Map();
  for (const line of lines) {
    const m = line.match(/^\s*\/\/\s*@([a-zA-Z0-9:_-]+)\s+(.+?)\s*$/);
    if (!m) continue;
    const [, key, value] = m;
    if (!fields.has(key)) fields.set(key, []);
    fields.get(key).push(value);
  }
  return { raw: match[0], fields };
}

function scriptSlug(outfile) {
  return outfile.split('/').pop().replace(/\.user\.js$/, '');
}

function buildMetadata(raw, cfg) {
  const parsed = parseMetadataBlock(raw);
  if (!parsed) throw new Error("Source script has no UserScript metadata block.");
  const getAll = (key, fallback = []) => parsed.fields.get(key) || fallback;
  const getOne = (key, fallback = "") => (getAll(key)[0] || fallback);
  const slug = scriptSlug(cfg.outfile);
  const downloadPath = `${projectPath}/${cfg.outfile}`;
  const ordered = [
    ["name", getOne("name", "Userscript")],
    ["namespace", `https://github.com/Mikeyphw/scriptexts/userscripts/${slug}`],
    ["homepageURL", `${HOME_BASE}/${projectPath}`],
    ["supportURL", "https://github.com/Mikeyphw/scriptexts/issues"],
    ["updateURL", `${RAW_BASE}/${downloadPath.replace(/\.user\.js$/, ".meta.js")}`],
    ["downloadURL", `${RAW_BASE}/${downloadPath}`],
    ["version", getOne("version", "1.0.0")],
    ["description", getOne("description", "Built userscript")],
    ["run-at", getOne("run-at", "document-idle")],
  ];
  const matches = getAll("match");
  const grants = getAll("grant", ["none"]);
  let block = `// ==UserScript==\n`;
  for (const [key, value] of ordered) block += `// @${key.padEnd(12)} ${value}\n`;
  for (const value of matches) block += `// @match        ${value}\n`;
  for (const value of grants) block += `// @grant        ${value}\n`;
  block += `// ==/UserScript==`;
  return block;
}

function stripMetadata(raw) {
  return raw.replace(/^\s*\/\/\s*==UserScript==[\s\S]*?\/\/\s*==\/UserScript==\s*/m, "");
}

function metaFromUserscript(raw) {
  const match = raw.match(/^\s*\/\/\s*==UserScript==[\s\S]*?\/\/\s*==\/UserScript==/m);
  if (!match) throw new Error("Built userscript has no metadata block.");
  return `${match[0].trim()}\n`;
}

async function verifyOrWrite(relativePath, expected) {
  const target = join(ROOT, relativePath);
  if (checkMode) {
    let current;
    try { current = await readFile(target, "utf8"); }
    catch { throw new Error(`Missing generated artifact: ${relativePath}`); }
    if (current !== expected) throw new Error(`Generated artifact is stale: ${relativePath}`);
    return;
  }
  await writeFile(target, expected, "utf8");
}

await mkdir(join(ROOT, "dist"), { recursive: true });

for (const cfg of builds) {
  const raw = await readFile(join(ROOT, cfg.entry), "utf8");
  const metadata = buildMetadata(raw, cfg);
  const cleaned = stripMetadata(raw);
  const built = `${metadata}\n\n${cleaned}`;
  const meta = metaFromUserscript(built);
  await verifyOrWrite(cfg.outfile, built);
  await verifyOrWrite(cfg.outfile.replace(/\.user\.js$/, ".meta.js"), meta);
  console.log(`${checkMode ? "verified" : "built"} ${cfg.outfile}`);
}

console.log(`${checkMode ? "verified" : "built"} ${builds.length} supported manga reader targets; legacy MyReadingManga is retired.`);
