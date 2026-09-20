import test from "node:test";
import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const builder = join(here, "..");
const repo = join(builder, "..", "..", "..");
const legacy = [
  "src/original/myreadingmanga-modern-reader.user.js",
  "src/original/myreadingmanga-modern-reader.meta.js",
  "dist/myreadingmanga-modern-reader.user.js",
  "dist/myreadingmanga-modern-reader.meta.js",
];

async function exists(path) {
  try { await access(path); return true; } catch { return false; }
}

test("legacy MyReadingManga artifacts remain retired", async () => {
  for (const path of legacy) assert.equal(await exists(join(builder, path)), false, `${path} must stay retired`);
  const build = await readFile(join(builder, "build.mjs"), "utf8");
  assert.doesNotMatch(build, /myreadingmanga-modern-reader/);
  assert.match(build, /yaoimangaonline-modern-reader/);
  assert.match(build, /baramangaonline-modern-reader/);
});

test("MyReadingManga Reimagined is the only active MyReadingManga route", async () => {
  const canonicalPath = join(repo, "userscripts/builders/myreadingmanga-reimagined/dist/myreadingmanga-reimagined.user.js");
  const canonical = await readFile(canonicalPath, "utf8");
  assert.match(canonical, /@match\s+https:\/\/myreadingmanga\.info\/\*/);

  const manifest = JSON.parse(await readFile(join(repo, "repo-manifest.json"), "utf8"));
  const manga = manifest.projects.find((p) => p.path === "userscripts/builders/manga-reader-modernizer");
  assert.ok(manga);
  assert.equal(manga.install_artifacts.some((path) => path.includes("myreadingmanga-modern-reader")), false);
  assert.equal(Object.hasOwn(manga.versions || {}, "myreadingmanga"), false);

  const reimagined = manifest.projects.find((p) => p.path === "userscripts/builders/myreadingmanga-reimagined");
  assert.ok(reimagined);
  assert.match(reimagined.legacy_coexistence || "", /canonical|retired/i);
});
