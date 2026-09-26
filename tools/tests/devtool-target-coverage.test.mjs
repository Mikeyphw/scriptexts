import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const readRepo = (rel) => fs.readFileSync(path.join(repoRoot, rel), 'utf8');
const config = readRepo('.devtool.toml');
const wrapperGuide = readRepo('docs/WRAPPER.md');

const targets = [
  'workspace',
  'root',
  'content-site-modernizer',
  'manga-reader-modernizer',
  'myreadingmanga-reimagined',
  'sims-cc-download-basket',
  'lpsg-media-gallery-unlocker',
  'poast-timeline-metadata-reset',
  'coomer-media-gallery',
  'search-engines-clean-dark-ui',
  'telegram-media-downloader-userscript',
  'manga-site-media-downloader',
  'stardew-nexus-download-queue',
  'telegram-media-downloader-extension',
  'smoke-python',
];

const releaseTargets = targets.filter((name) => !['workspace', 'smoke-python'].includes(name));

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function section(name) {
  const marker = `[${name}]`;
  const start = config.indexOf(marker);
  assert.notEqual(start, -1, `missing section ${marker}`);
  const rest = config.slice(start + marker.length);
  const next = rest.search(/\n\[[^\]]+\]/);
  return next === -1 ? rest : rest.slice(0, next);
}

for (const name of targets) {
  test(`Devtool target exists: ${name}`, () => {
    assert.match(config, new RegExp(`\\[targets\\.${escapeRegex(name)}\\]`));
  });
}

test('workspace is the repository default, not LPSG', () => {
  assert.match(config, /\[workspace\][\s\S]*?default_target\s*=\s*"workspace"/);
  assert.match(config, /\[wrapper\][\s\S]*?default_command\s*=\s*"validate"/);
  const validate = section('wrapper.commands.validate');
  assert.match(validate, /target\s*=\s*"workspace"/);
  assert.doesNotMatch(validate, /lpsg-media-gallery-unlocker/);
});

test('wrapper exposes repository and scoped workflows', () => {
  for (const name of [
    'restore', 'build', 'test', 'check', 'validate', 'seal', 'package', 'smoke',
    'userscripts', 'extensions', 'lpsg', 'content-sites', 'changed',
  ]) {
    assert.match(config, new RegExp(`\\[wrapper\\.commands\\.${escapeRegex(name)}\\]`));
  }
  assert.match(config, /\[wrapper\.commands\.changed\.options\.affected\][\s\S]*?--affected/);
  assert.match(config, /\[wrapper\.commands\.changed\.options\.base\][\s\S]*?--affected-base/);
  assert.match(config, /\[wrapper\.commands\.changed\.options\.head\][\s\S]*?--affected-head/);
});

test('workspace uses cross-target workflow composition', () => {
  for (const name of releaseTargets.filter((name) => name !== 'root')) {
    assert.match(config, new RegExp(`target:${escapeRegex(name)}#validate`));
  }
  assert.match(config, /target:root#seal/);
  assert.match(config, /\[workspace\.scheduler\][\s\S]*?parallel\s*=\s*true/);
  assert.match(config, /max_parallel_nodes\s*=\s*3/);
});

test('release targets own TLJs and the common lifecycle', () => {
  for (const name of releaseTargets) {
    assert.match(config, new RegExp(`\\[targets\\.${escapeRegex(name)}\\.jobs\\.`));
    assert.match(config, new RegExp(`\\[targets\\.${escapeRegex(name)}\\.workflows\\]`));
  }
});

test('workspace groups model repository ownership', () => {
  for (const name of ['builders', 'standalone', 'extensions', 'userscripts', 'release', 'ci', 'smoke', 'all']) {
    assert.match(config, new RegExp(`(?:^|\\n)${escapeRegex(name)}\\s*=`, 'm'));
  }
});

test('generated userscript targets register artifacts', () => {
  for (const name of [
    'content-site-modernizer',
    'manga-reader-modernizer',
    'myreadingmanga-reimagined',
    'sims-cc-download-basket',
    'lpsg-media-gallery-unlocker',
    'poast-timeline-metadata-reset',
    'coomer-media-gallery',
    'search-engines-clean-dark-ui',
    'telegram-media-downloader-userscript',
  ]) {
    assert.match(config, new RegExp(`\\[targets\\.${escapeRegex(name)}\\.artifacts\\]`));
  }
});

test('metadata join only owns installable userscript outputs', () => {
  const generator = readRepo('tools/generate-userscript-meta.mjs');
  assert.match(generator, /userscripts\/standalone\//);
  assert.match(generator, /builders\\\/\[\^\/\]\+\\\/dist/);
  assert.doesNotMatch(section('targets.root.jobs.metadata'), /userscripts\/\*\*\/\*\.user\.js/);
});

test('Devtool TLJs do not hide lifecycle work inside npm scripts', () => {
  assert.doesNotMatch(config, /command\s*=\s*\[\s*"npm"\s*,\s*"run"/);
  assert.doesNotMatch(config, /action\s*=\s*"(?:build|test)"/);
  assert.match(config, /content-site-modernizer\.jobs\.reproducibility/);
  assert.match(config, /manga-reader-modernizer\.jobs\.syntax/);
  assert.match(config, /sims-cc-download-basket\.jobs\.syntax/);
});

test('extension targets register build artifacts', () => {
  for (const name of [
    'manga-site-media-downloader',
    'stardew-nexus-download-queue',
    'telegram-media-downloader-extension',
  ]) {
    assert.match(config, new RegExp(`\\[targets\\.${escapeRegex(name)}\\.artifacts\\]`));
  }
  assert.match(config, /patterns\s*=\s*\["\*\.xpi",\s*"SHA256SUMS"\]/);
});

test('wrapper documentation describes repository-first behavior', () => {
  assert.match(wrapperGuide, /repository-oriented/i);
  assert.match(wrapperGuide, /LPSG is one target/i);
  assert.match(wrapperGuide, /affected/i);
  assert.match(wrapperGuide, /target-local jobs/i);
  assert.match(wrapperGuide, /wrapper seal/i);
});
