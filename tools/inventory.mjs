import { readFile } from 'node:fs/promises';
const manifest = JSON.parse(await readFile(new URL('../repo-manifest.json', import.meta.url), 'utf8'));
for (const project of manifest.projects) {
  console.log(`${project.type.padEnd(24)} ${project.path}`);
  for (const artifact of project.install_artifacts || []) console.log(`  artifact: ${artifact}`);
}
