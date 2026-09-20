import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const cleanupPolicy = readFileSync(
  fileURLToPath(new URL('./article-cleanup.runtime.js', import.meta.url)),
  'utf8'
).trim();
const feedLayoutPolicy = readFileSync(
  fileURLToPath(new URL('./feed-layout.runtime.js', import.meta.url)),
  'utf8'
).trim();
const runtimeTemplate = readFileSync(
  fileURLToPath(new URL('./runtime.template.js', import.meta.url)),
  'utf8'
).trim();

export const runtime = `(() => {
${cleanupPolicy}
${feedLayoutPolicy}
return ${runtimeTemplate};
})()`;
