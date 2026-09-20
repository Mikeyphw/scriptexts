import test from "node:test";
import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
async function exists(path) { try { await access(path); return true; } catch { return false; } }

const packageJson = JSON.parse(await readFile(join(root, "package.json"), "utf8"));
const checker = await readFile(join(root, "tools/check-userscripts.mjs"), "utf8");
const repoCheck = await readFile(join(root, "tools/check-repo.mjs"), "utf8");
const manifest = JSON.parse(await readFile(join(root, "repo-manifest.json"), "utf8"));

test("root check delegates to the aggregate userscript validation gate", () => {
  assert.equal(packageJson.scripts.check, "npm run check:userscripts");
  assert.equal(packageJson.scripts["check:userscripts"], "node tools/check-userscripts.mjs");
  assert.equal(packageJson.scripts["check:repo:static"], "node tools/check-repo.mjs");
  for (const id of [
    "content-site-modernizer",
    "manga-reader-modernizer",
    "myreadingmanga-reimagined",
    "sims-cc-download-basket",
    "lpsg-media-gallery-unlocker",
  ]) assert.match(checker, new RegExp(id));
  assert.match(checker, /tools\/check-repo\.mjs/);
});

test("aggregate build still includes every supported userscript builder", () => {
  const build = packageJson.scripts["build:userscripts"] || "";
  for (const script of ["build:content-sites", "build:manga", "build:mrm-reimagined", "build:sims", "build:lpsg"]) {
    assert.match(build, new RegExp(script.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  }
});

test("legacy MyReadingManga is absent from build outputs and manifest", async () => {
  const forbidden = [
    "userscripts/builders/manga-reader-modernizer/src/original/myreadingmanga-modern-reader.user.js",
    "userscripts/builders/manga-reader-modernizer/src/original/myreadingmanga-modern-reader.meta.js",
    "userscripts/builders/manga-reader-modernizer/dist/myreadingmanga-modern-reader.user.js",
    "userscripts/builders/manga-reader-modernizer/dist/myreadingmanga-modern-reader.meta.js",
  ];
  for (const rel of forbidden) assert.equal(await exists(join(root, rel)), false, `${rel} must remain absent`);
  const manga = manifest.projects.find((p) => p.path === "userscripts/builders/manga-reader-modernizer");
  assert.ok(manga);
  assert.equal(manga.install_artifacts.some((x) => x.includes("myreadingmanga-modern-reader")), false);
  assert.equal(Object.hasOwn(manga.versions || {}, "myreadingmanga"), false);
  assert.match(repoCheck, /myreadingmanga-modern-reader\.user\.js/);
});

test("Reimagined is documented as the canonical MyReadingManga implementation", () => {
  const project = manifest.projects.find((p) => p.path === "userscripts/builders/myreadingmanga-reimagined");
  assert.ok(project);
  assert.deepEqual(project.scope, ["myreadingmanga.info"]);
  assert.match(project.legacy_coexistence || "", /canonical/i);
  assert.match(project.legacy_coexistence || "", /retired/i);
});

test("LPSG fragments are validated through their deterministic builder, not parsed as standalone programs", () => {
  assert.match(repoCheck, /\.part\.js/);
  assert.match(checker, /lpsg-media-gallery-unlocker/);
});
