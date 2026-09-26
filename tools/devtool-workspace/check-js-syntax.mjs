#!/usr/bin/env node
import { spawnSync } from 'node:child_process';

const files = process.argv.slice(2);
if (!files.length) {
  console.error('usage: check-js-syntax.mjs <file> [file ...]');
  process.exit(2);
}
for (const file of files) {
  const result = spawnSync(process.execPath, ['--check', file], { stdio: 'inherit' });
  if (result.status !== 0) process.exit(result.status || 1);
  console.log(`✓ syntax ${file}`);
}
