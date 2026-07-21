import { mkdir, readFile, writeFile } from "node:fs/promises";

const RAW_BASE = "https://raw.githubusercontent.com/Mikeyphw/scriptexts/main";
const HOME_BASE = "https://github.com/Mikeyphw/scriptexts/tree/main";
const projectPath = "userscripts/builders/manga-reader-modernizer";

const builds = [
  { entry: "src/original/myreadingmanga-modern-reader.user.js", outfile: "dist/myreadingmanga-modern-reader.user.js" },
  { entry: "src/original/yaoimangaonline-modern-reader.user.js", outfile: "dist/yaoimangaonline-modern-reader.user.js" },
  { entry: "src/original/baramangaonline-modern-reader.user.js", outfile: "dist/baramangaonline-modern-reader.user.js" }
];

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
    ["version", getOne("version", "1.0.0")],
    ["description", getOne("description", "Built userscript")],
    ["homepageURL", `${HOME_BASE}/${projectPath}`],
    ["supportURL", "https://github.com/Mikeyphw/scriptexts/issues"],
    ["updateURL", `${RAW_BASE}/${downloadPath.replace(/\.user\.js$/, ".meta.js")}`],
    ["downloadURL", `${RAW_BASE}/${downloadPath}`],
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

await mkdir("dist", { recursive: true });

for (const cfg of builds) {
  const raw = await readFile(cfg.entry, "utf8");
  const metadata = buildMetadata(raw, cfg);
  const cleaned = stripMetadata(raw);
  const built = `${metadata}\n\n${cleaned}`;
  await writeFile(cfg.outfile, built, "utf8");
  await writeFile(cfg.outfile.replace(/\.user\.js$/, ".meta.js"), metaFromUserscript(built), "utf8");
  console.log(`built ${cfg.outfile}`);
}
