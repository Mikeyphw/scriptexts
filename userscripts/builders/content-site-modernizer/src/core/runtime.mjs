import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

export const runtime = readFileSync(
  fileURLToPath(new URL('./runtime.template.js', import.meta.url)),
  'utf8'
).trim();
