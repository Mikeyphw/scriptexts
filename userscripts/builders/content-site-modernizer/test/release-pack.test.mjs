import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';

const builderRoot = new URL('../', import.meta.url);
const repoRoot = new URL('../../../', builderRoot);
const rootPackage = JSON.parse(await readFile(new URL('package.json', repoRoot), 'utf8'));
const builderPackage = JSON.parse(await readFile(new URL('userscripts/builders/content-site-modernizer/package.json', repoRoot), 'utf8'));
const manifest = JSON.parse(await readFile(new URL('repo-manifest.json', repoRoot), 'utf8'));
const toolText = await readFile(new URL('tools/content-sites/release-pack.mjs', repoRoot), 'utf8');
const project = manifest.projects.find((item) => item.path === 'userscripts/builders/content-site-modernizer');

function runReleasePack(...args) {
  return spawnSync(process.execPath, ['tools/content-sites/release-pack.mjs', ...args], {
    cwd: repoRoot,
    encoding: 'utf8'
  });
}

test('root and builder package expose content-site release pack commands', () => {
  assert.equal(rootPackage.scripts['content-sites:release-pack'], 'node tools/content-sites/release-pack.mjs');
  assert.equal(rootPackage.scripts['content-sites:release-pack:check'], 'node tools/content-sites/release-pack.mjs --check --json');
  assert.equal(builderPackage.scripts['release-pack'], 'node ../../../tools/content-sites/release-pack.mjs --builder content-site-modernizer');
  assert.equal(builderPackage.scripts['release-pack:check'], 'node ../../../tools/content-sites/release-pack.mjs --builder content-site-modernizer --check');
  assert.equal(project.release_pack.tool, 'tools/content-sites/release-pack.mjs');
  assert.equal(project.release_pack.output, 'release/content-site-modernizer/content-site-modernizer-userscripts.zip');
  assert.equal(manifest.content_site_release_pack_policy.scope, 'content-site-modernizer');
});

test('release pack dry-run emits machine-readable manifest without writing output', () => {
  const result = runReleasePack('--check', '--json', '--skip-build-check');
  assert.equal(result.status, 0, result.stderr || result.stdout);
  const payload = JSON.parse(result.stdout);
  assert.equal(payload.ok, true);
  assert.equal(payload.dryRun, true);
  assert.equal(payload.builder, 'content-site-modernizer');
  assert.equal(payload.counts.scripts, 7);
  assert.equal(payload.counts.files, 14);
  assert.ok(payload.files.includes('manifest.json'));
  assert.ok(payload.files.includes('checksums.sha256'));
  assert.ok(payload.files.includes('RELEASE_INDEX.md'));
  assert.ok(payload.files.includes('scripts/putinho-modern-ui.user.js'));
  assert.ok(payload.files.includes('meta/menofporn-modern-ui.meta.js'));
});

test('release pack writer creates a real zip with install artifacts', async () => {
  const tmp = await mkdtemp(join(tmpdir(), 'content-site-release-pack-'));
  try {
    const out = join(tmp, 'pack.zip');
    const result = runReleasePack('--out', out, '--json', '--skip-build-check');
    assert.equal(result.status, 0, result.stderr || result.stdout);
    const payload = JSON.parse(result.stdout);
    assert.equal(payload.ok, true);
    assert.equal(payload.dryRun, false);
    assert.match(payload.sha256, /^[a-f0-9]{64}$/);
    const zip = await readFile(out);
    assert.equal(zip.subarray(0, 4).toString('hex'), '504b0304');
    const text = zip.toString('latin1');
    assert.match(text, /scripts\/gayteam-modern-ui\.user\.js/);
    assert.match(text, /meta\/str8upgayporn-modern-ui\.meta\.js/);
    assert.match(text, /manifest\.json/);
    assert.match(text, /checksums\.sha256/);
    assert.match(text, /RELEASE_INDEX\.md/);
  } finally {
    await rm(tmp, { recursive: true, force: true });
  }
});

test('release pack implementation is dependency-free and documents zip contents', () => {
  for (const marker of [
    'function writeZip',
    'function crc32',
    'manifest.json',
    'checksums.sha256',
    'RELEASE_INDEX.md',
    'scripts/',
    'meta/',
    '--skip-build-check'
  ]) assert.ok(toolText.includes(marker), `missing ${marker}`);
  assert.doesNotMatch(toolText, /from ['"](?:adm-zip|jszip|yazl|archiver)['"]/);
});
