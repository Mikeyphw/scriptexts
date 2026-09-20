import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';

const root = resolve(fileURLToPath(new URL('.', import.meta.url)), '..');
const jsonMode = process.argv.includes('--json');
const checks = [];
function run(label, command, args) {
  const result = spawnSync(command, args, { cwd: root, encoding: 'utf8' });
  checks.push({ label, ok: result.status === 0, output: `${result.stdout || ''}${result.stderr || ''}`.trim() });
  return result.status === 0;
}

run('generated output reproducibility', process.execPath, ['build.mjs', '--check']);
run('generated userscript syntax', process.execPath, ['--check', 'dist/bleeding-cool-modern-reader.user.js']);
run('Bleeding Cool regression suite', process.execPath, ['--test',
  'test/bleeding-cool-article-correctness.test.mjs',
  'test/bleeding-cool-article-cleanup.test.mjs',
  'test/bleeding-cool-feed-mobile.test.mjs',
  'test/bleeding-cool-release-seal.test.mjs',
  'test/profile-schema.test.mjs'
]);
run('profile schema validation', process.execPath, ['tools/check-profiles.mjs']);

const generated = await readFile(resolve(root, 'dist/bleeding-cool-modern-reader.user.js'));
const sha256 = createHash('sha256').update(generated).digest('hex');
const ok = checks.every((check) => check.ok);
const payload = { ok, script: 'bleeding-cool-modern-reader', version: '0.1.7', generated: 'dist/bleeding-cool-modern-reader.user.js', sha256, checks };

if (jsonMode) console.log(JSON.stringify(payload, null, 2));
else {
  console.log(`Bleeding Cool release seal: ${ok ? 'PASS' : 'FAIL'}`);
  console.log(`Generated: ${payload.generated}`);
  console.log(`SHA-256: ${sha256}`);
  for (const check of checks) console.log(`${check.ok ? '✓' : '✗'} ${check.label}`);
  if (!ok) {
    for (const check of checks.filter((item) => !item.ok)) {
      console.error(`\n[${check.label}]\n${check.output}`);
    }
  }
}
if (!ok) process.exit(1);
