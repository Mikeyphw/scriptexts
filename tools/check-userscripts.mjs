import { spawnSync } from "node:child_process";
import process from "node:process";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const npm = process.platform === "win32" ? "npm.cmd" : "npm";
const steps = [
  ["validation regression tests", process.execPath, ["--test", "--test-concurrency=1", "tools/tests/*.test.mjs"]],
  ["content-site-modernizer", npm, ["--prefix", "userscripts/builders/content-site-modernizer", "run", "check"]],
  ["manga-reader-modernizer", npm, ["--prefix", "userscripts/builders/manga-reader-modernizer", "run", "check"]],
  ["myreadingmanga-reimagined", npm, ["--prefix", "userscripts/builders/myreadingmanga-reimagined", "run", "check"]],
  ["sims-cc-download-basket", npm, ["--prefix", "userscripts/builders/sims-cc-download-basket", "run", "check"]],
  ["lpsg-media-gallery-unlocker", npm, ["--prefix", "userscripts/builders/lpsg-media-gallery-unlocker", "run", "check"]],
  ["telegram-media-downloader", npm, ["run", "test:telegram"]],
  ["poast-timeline-metadata-reset", npm, ["run", "seal:poast"]],
  ["repository static checks", process.execPath, ["tools/check-repo.mjs"]],
];

for (const [name, command, args] of steps) {
  console.log(`\n=== userscript check: ${name} ===`);
  const result = spawnSync(command, args, { cwd: root, stdio: "inherit", env: process.env });
  if (result.error) {
    console.error(`${name}: ${result.error.message}`);
    process.exit(1);
  }
  if (result.status !== 0) {
    console.error(`${name}: FAILED (${result.status ?? "signal"})`);
    process.exit(result.status || 1);
  }
}

console.log(`\nUserscript aggregate check: PASS (${steps.length} validation stages).`);
