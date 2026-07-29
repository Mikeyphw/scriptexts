import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const repoRoot = resolve(new URL('../../../../', import.meta.url).pathname);

function runSeal(...args) {
  return spawnSync(process.execPath, ['tools/content-sites/final-seal.mjs', ...args], {
    cwd: repoRoot,
    encoding: 'utf8'
  });
}

test('content-site final seal reports a complete shared-runtime builder', () => {
  const result = runSeal('--skip-build-check');
  assert.equal(result.status, 0, result.stderr || result.stdout);
  assert.match(result.stdout, /content-site final seal ok: 7 profiles, 14 outputs, 7 smoke sites/);
  assert.match(result.stdout, /✓ all profiles are shared-runtime/);
  assert.match(result.stdout, /✓ root script content-sites:seal/);
  assert.match(result.stdout, /✓ builder script seal/);
  assert.match(result.stdout, /- menofporn-modern-ui 1\.5\.2/);
  assert.match(result.stdout, /- putinho-modern-ui 1\.1\.2/);
});

test('content-site final seal has machine-readable JSON mode', () => {
  const result = runSeal('--json', '--skip-build-check');
  assert.equal(result.status, 0, result.stderr || result.stdout);
  const payload = JSON.parse(result.stdout);
  assert.equal(payload.ok, true);
  assert.equal(payload.builder, 'content-site-modernizer');
  assert.equal(payload.counts.profiles, 7);
  assert.equal(payload.counts.outputs, 14);
  assert.equal(payload.counts.smokeSites, 7);
  assert.equal(payload.profiles.some((profile) => profile.id === 'str8upgayporn-modern-ui'), true);
});

test('content-site final seal is documented in repo and builder docs', async () => {
  const files = [
    'README.md',
    'docs/REPOSITORY_LAYOUT.md',
    'docs/RELEASE_WORKFLOW.md',
    'userscripts/builders/content-site-modernizer/README.md',
    'userscripts/builders/content-site-modernizer/docs/FINAL_SEAL.md'
  ];
  for (const file of files) {
    const text = await readFile(resolve(repoRoot, file), 'utf8');
    assert.match(text, /Content-site final seal|content-sites:seal|Final seal/);
  }
});
