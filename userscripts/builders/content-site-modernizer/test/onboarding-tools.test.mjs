import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';
import { readFile } from 'node:fs/promises';

const builderRoot = new URL('../', import.meta.url);
const repoRoot = new URL('../../../', builderRoot);
const rootPackage = JSON.parse(await readFile(new URL('package.json', repoRoot), 'utf8'));
const manifest = JSON.parse(await readFile(new URL('repo-manifest.json', repoRoot), 'utf8'));
const generator = await readFile(new URL('tools/content-sites/new-site.mjs', repoRoot), 'utf8');
const refresh = await readFile(new URL('tools/content-sites/fixture-refresh.mjs', repoRoot), 'utf8');

test('root package exposes content-site onboarding and fixture refresh helpers', () => {
  assert.equal(rootPackage.scripts['content-sites:new'], 'node tools/content-sites/new-site.mjs');
  assert.equal(rootPackage.scripts['content-sites:new:dry-run'], 'node tools/content-sites/new-site.mjs --dry-run');
  assert.equal(rootPackage.scripts['content-sites:fixtures:plan'], 'node tools/content-sites/fixture-refresh.mjs --plan');
  assert.equal(rootPackage.scripts['content-sites:fixtures:apply'], 'node tools/content-sites/fixture-refresh.mjs --apply');
  assert.equal(manifest.content_site_onboarding_policy.scope, 'content-site-modernizer');
  assert.equal(manifest.content_site_onboarding_policy.generator, 'tools/content-sites/new-site.mjs');
  assert.equal(manifest.content_site_onboarding_policy.fixture_refresh, 'tools/content-sites/fixture-refresh.mjs');
});

test('site onboarding generator has safe contracts and dry-run JSON output', () => {
  for (const marker of [
    '--dry-run',
    '--force',
    '--home-fixture',
    '--post-fixture',
    'scripts.config.mjs',
    'smoke.config.json',
    'repo-manifest.json',
    'installContentSiteModernizer',
    'csm-bottomnav'
  ]) assert.ok(generator.includes(marker), `missing ${marker}`);

  const output = execFileSync(process.execPath, [
    'tools/content-sites/new-site.mjs',
    '--dry-run',
    '--json',
    '--id', 'example-site',
    '--name', 'Example Site Modern UI',
    '--host', 'example.test'
  ], { cwd: new URL('../../../', builderRoot), encoding: 'utf8' });
  const data = JSON.parse(output);
  assert.equal(data.ok, true);
  assert.equal(data.dryRun, true);
  assert.equal(data.site.siteId, 'example-site');
  assert.ok(data.files.includes('userscripts/builders/content-site-modernizer/src/profiles/example-site.mjs'));
  assert.ok(data.files.includes('userscripts/builders/content-site-modernizer/test/example-site-contract.test.mjs'));
});

test('fixture refresh planner and apply path are guarded', async () => {
  for (const marker of [
    '--plan',
    '--apply',
    '--allow-smoke-snapshot',
    '--dry-run',
    'refusing to apply a smoke HTML snapshot',
    '.refresh-backups',
    'content-site-smoke-results.json',
    'Safe apply command'
  ]) assert.ok(refresh.includes(marker), `missing ${marker}`);

  const plan = execFileSync(process.execPath, [
    'tools/content-sites/fixture-refresh.mjs',
    '--plan',
    '--json',
    '--results', 'does-not-exist.json'
  ], { cwd: new URL('../../../', builderRoot), encoding: 'utf8' });
  const data = JSON.parse(plan);
  assert.equal(data.ok, true);
  assert.equal(data.action, 'plan');
  assert.deepEqual(data.candidates, []);

  const tmp = await mkdtemp(join(tmpdir(), 'fixture-refresh-'));
  try {
    const source = join(tmp, 'fresh.html');
    await writeFile(source, '<!doctype html><html><body><main><article>Fresh fixture</article></main></body></html>\n', 'utf8');
    const apply = execFileSync(process.execPath, [
      'tools/content-sites/fixture-refresh.mjs',
      '--apply',
      '--json',
      '--dry-run',
      '--site', 'gayteam',
      '--fixture', 'home',
      '--source', source
    ], { cwd: new URL('../../../', builderRoot), encoding: 'utf8' });
    const record = JSON.parse(apply);
    assert.equal(record.ok, true);
    assert.equal(record.record.dryRun, true);
    assert.equal(record.record.site, 'gayteam');
    assert.match(record.record.backup, /\.refresh-backups\//);
  } finally {
    await rm(tmp, { recursive: true, force: true });
  }
});
