import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const projectDir = dirname(fileURLToPath(import.meta.url));
const projectPath = "userscripts/builders/myreadingmanga-reimagined";
const rawBase = "https://raw.githubusercontent.com/Mikeyphw/scriptexts/main";
const homeBase = "https://github.com/Mikeyphw/scriptexts/tree/main";
const config = JSON.parse(await readFile(join(projectDir, "src/config.json"), "utf8"));

const readSorted = async (relativeDir, suffix) => {
  const dir = join(projectDir, relativeDir);
  const names = (await readdir(dir)).filter((name) => name.endsWith(suffix)).sort();
  return Promise.all(names.map(async (name) => ({ name, content: await readFile(join(dir, name), "utf8") })));
};

const modules = await readSorted("src/modules", ".js");
const styles = await readSorted("src/styles", ".css");
if (!modules.length || !styles.length) throw new Error("Builder source is incomplete.");
for (const module of modules) {
  if (/^\s*(?:import|export)\s/m.test(module.content)) throw new Error(`${module.name}: runtime modules must remain bundle-local and dependency-free.`);
}

const slug = config.id;
const outfile = `dist/${slug}.user.js`;
const downloadPath = `${projectPath}/${outfile}`;
const metadata = [
  "// ==UserScript==",
  `// @name         ${config.name}`,
  `// @namespace    https://github.com/Mikeyphw/scriptexts/userscripts/${slug}`,
  `// @homepageURL  ${homeBase}/${projectPath}`,
  "// @supportURL   https://github.com/Mikeyphw/scriptexts/issues",
  `// @updateURL    ${rawBase}/${downloadPath.replace(/\.user\.js$/, ".meta.js")}`,
  `// @downloadURL  ${rawBase}/${downloadPath}`,
  `// @version      ${config.version}`,
  `// @description  ${config.description}`,
  `// @run-at       ${config.runAt}`,
  ...config.matches.map((match) => `// @match        ${match}`),
  "// @grant        none",
  "// ==/UserScript==",
].join("\n");

const css = styles.map(({ name, content }) => `/* ${name} */\n${content.trim()}`).join("\n\n");
const runtime = modules.map(({ name, content }) => `  // module: ${name}\n${content.trim().split("\n").map((line) => `  ${line}`).join("\n")}`).join("\n\n");
const output = `${metadata}\n\n(() => {\n  \"use strict\";\n  const MRM = {\n    config: Object.freeze(${JSON.stringify(config)}),\n    css: ${JSON.stringify(css)},\n  };\n\n${runtime}\n})();\n`;

const artifacts = [
  { path: join(projectDir, outfile), content: output },
  { path: join(projectDir, outfile.replace(/\.user\.js$/, ".meta.js")), content: `${metadata}\n` },
];
const checkOnly = process.argv.includes("--check");
const digest = (value) => createHash("sha256").update(value, "utf8").digest("hex");

if (checkOnly) {
  const mismatches = [];
  for (const artifact of artifacts) {
    let actual;
    try {
      actual = await readFile(artifact.path, "utf8");
    } catch (error) {
      if (error?.code === "ENOENT") {
        mismatches.push(`${artifact.path}: missing generated artifact`);
        continue;
      }
      throw error;
    }
    if (actual !== artifact.content) {
      mismatches.push(`${artifact.path}: expected sha256 ${digest(artifact.content)}, found ${digest(actual)}`);
    }
  }
  if (mismatches.length) {
    throw new Error(`Generated artifacts are stale:\n- ${mismatches.join("\n- ")}\nRun npm run build and commit the regenerated dist files.`);
  }
  console.log(`verified ${artifacts.length} generated artifacts without rewriting dist`);
} else {
  await mkdir(join(projectDir, "dist"), { recursive: true });
  for (const artifact of artifacts) await writeFile(artifact.path, artifact.content, "utf8");
  console.log(`built ${projectPath}/${outfile}`);
}
