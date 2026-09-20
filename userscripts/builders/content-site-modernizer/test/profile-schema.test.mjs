import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import builder from '../scripts.config.mjs';
import {
  DEFAULT_CAPABILITIES,
  DEFAULT_LAYOUT,
  DEFAULT_PERFORMANCE,
  PROFILE_SCHEMA_VERSION,
  validateBuilderConfig,
  validateProfile
} from '../src/core/profile-schema.mjs';

const builderRoot = new URL('../', import.meta.url);
const repoRoot = new URL('../../../', builderRoot);
const rootPackage = JSON.parse(await readFile(new URL('package.json', repoRoot), 'utf8'));
const builderPackage = JSON.parse(await readFile(new URL('package.json', builderRoot), 'utf8'));
const manifest = JSON.parse(await readFile(new URL('repo-manifest.json', repoRoot), 'utf8'));
const buildSource = await readFile(new URL('build.mjs', builderRoot), 'utf8');
const onboardingSource = await readFile(new URL('tools/content-sites/new-site.mjs', repoRoot), 'utf8');

test('content-site profiles validate and normalize through schema v1', () => {
  const profiles = validateBuilderConfig(builder);
  assert.equal(profiles.length, 7);
  for (const profile of profiles) {
    assert.equal(profile.client.schemaVersion, PROFILE_SCHEMA_VERSION, `${profile.id} should declare normalized schema version`);
    assert.equal(profile.client.id, profile.id);
    assert.ok(profile.output.userScript.endsWith(`${profile.id}.user.js`));
    assert.ok(profile.output.metaScript.endsWith(`${profile.id}.meta.js`));
    for (const key of Object.keys(DEFAULT_CAPABILITIES)) {
      assert.equal(typeof profile.client.capabilities[key], 'boolean', `${profile.id} capability ${key} should be boolean`);
    }
    for (const key of Object.keys(DEFAULT_LAYOUT)) {
      assert.ok(Object.hasOwn(profile.client.layout, key), `${profile.id} layout should include ${key}`);
    }
    for (const key of Object.keys(DEFAULT_PERFORMANCE)) {
      assert.ok(Object.hasOwn(profile.client.performance, key), `${profile.id} performance should include ${key}`);
    }
    assert.ok(Array.isArray(profile.client.selectors.feed.containers));
    assert.ok(Array.isArray(profile.client.selectors.feed.items));
    assert.ok(profile.client.nav.bottom.every((item) => item.action || item.href));
  }
});

test('schema derives site capabilities from profile shape', () => {
  const profiles = validateBuilderConfig(builder);
  const byId = new Map(profiles.map((profile) => [profile.id, profile]));
  assert.equal(byId.get('str8upgayporn-modern-ui').client.capabilities.sectionedFeed, true);
  assert.equal(byId.get('gayteam-modern-ui').client.capabilities.durationBadges, true);
  assert.equal(byId.get('justthegays-modern-ui').client.capabilities.durationBadges, true);
  assert.equal(byId.get('putinho-modern-ui').client.capabilities.loadMore, true);
  assert.equal(byId.get('menofporn-modern-ui').client.capabilities.loadMore, true);
  assert.equal(byId.get('aipt-comics-modern-reader').client.capabilities.loadMore, false);
});

test('invalid profiles fail with actionable messages', () => {
  const bad = structuredClone(builder.scripts[0]);
  bad.id = 'Bad Profile';
  bad.client.id = 'other-id';
  bad.client.nav.bottom = [{ id: 'x', label: 'Broken', action: 'launch-confetti-cannon' }];
  assert.throws(() => validateProfile(bad), /profile\.id must be kebab-case/);
  assert.throws(() => validateProfile(bad), /profile\.client\.id must match profile\.id|action/);
});

test('builder and onboarding tools use shared profile schema', () => {
  assert.match(buildSource, /validateBuilderConfig/);
  assert.match(buildSource, /profile-schema\.mjs/);
  assert.match(onboardingSource, /DEFAULT_CAPABILITIES/);
  assert.match(onboardingSource, /DEFAULT_LAYOUT/);
  assert.match(onboardingSource, /PROFILE_SCHEMA_VERSION/);
  assert.equal(rootPackage.scripts['content-sites:profiles:check'], 'npm --prefix userscripts/builders/content-site-modernizer run profiles:check');
  assert.equal(builderPackage.scripts['profiles:check'], 'node tools/check-profiles.mjs');
  assert.match(builderPackage.scripts.check, /profiles:check/);
});

test('profile check command is browser-free and reports all profiles', () => {
  const out = execFileSync('npm', ['--prefix', 'userscripts/builders/content-site-modernizer', 'run', 'profiles:check', '--silent'], {
    cwd: repoRoot,
    encoding: 'utf8'
  });
  assert.match(out, /content-site profile schema v1 ok: 7 profiles/);
  assert.match(out, /putinho-modern-ui 1\.1\.2/);
  assert.match(out, /menofporn-modern-ui 1\.5\.2/);
});

test('repo manifest records profile schema policy and current versions', () => {
  const project = manifest.projects.find((entry) => entry.path === 'userscripts/builders/content-site-modernizer');
  assert.equal(project.source_model, 'shared-profile-runtime-builder');
  assert.equal(project.profile_schema.version, PROFILE_SCHEMA_VERSION);
  assert.equal(project.profile_schema.check_script, 'npm run content-sites:profiles:check');
  assert.equal(project.profile_schema.normalization, 'build-time defaults plus explicit capability map');
  assert.equal(project.versions['aipt-comics-modern-reader'], '0.1.4');
  assert.equal(project.versions['bleeding-cool-modern-reader'], '0.1.6');
  assert.equal(project.versions['menofporn-modern-ui'], '1.5.2');
  assert.equal(project.versions['putinho-modern-ui'], '1.1.2');
  assert.equal(project.versions['gayteam-modern-ui'], '1.0.5');
  assert.equal(project.versions['justthegays-modern-ui'], '1.0.3');
  assert.equal(project.versions['str8upgayporn-modern-ui'], '1.0.4');
  assert.equal(manifest.content_site_profile_schema_policy.scope, 'content-site-modernizer');
  assert.equal(manifest.content_site_profile_schema_policy.normalValidation, 'browser-free');
});
