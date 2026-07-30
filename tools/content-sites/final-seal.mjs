#!/usr/bin/env node
import { readFile, stat } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const args = new Set(process.argv.slice(2));
const jsonMode = args.has('--json');
const skipBuildCheck = args.has('--skip-build-check');
const builderId = valueAfter('--builder') || 'content-site-modernizer';

function valueAfter(name) {
  const index = process.argv.indexOf(name);
  return index === -1 ? '' : process.argv[index + 1] || '';
}

async function exists(path) {
  try { await stat(path); return true; } catch { return false; }
}

async function readJson(path) {
  return JSON.parse(await readFile(path, 'utf8'));
}

async function findRepoRoot(start = process.cwd()) {
  let current = resolve(start);
  while (current !== dirname(current)) {
    if (await exists(join(current, 'repo-manifest.json')) && await exists(join(current, 'package.json'))) return current;
    current = dirname(current);
  }
  throw new Error('could not find repository root from current directory');
}

function runNode(repoRoot, command, options = {}) {
  const result = spawnSync(process.execPath, command, {
    cwd: repoRoot,
    encoding: 'utf8',
    stdio: options.capture ? 'pipe' : 'pipe'
  });
  return {
    ok: result.status === 0,
    status: result.status,
    stdout: result.stdout || '',
    stderr: result.stderr || '',
    command: `${process.execPath} ${command.join(' ')}`
  };
}

function userscriptFields(text) {
  const block = text.match(/\/\/\s*==UserScript==([\s\S]*?)\/\/\s*==\/UserScript==/);
  if (!block) return null;
  const fields = new Map();
  for (const line of block[1].split(/\r?\n/)) {
    const match = line.match(/^\s*\/\/\s*@([A-Za-z0-9:_-]+)\s+(.+)$/);
    if (!match) continue;
    if (!fields.has(match[1])) fields.set(match[1], []);
    fields.get(match[1]).push(match[2].trim());
  }
  return fields;
}

function one(fields, key) {
  return fields?.get(key)?.[0] || '';
}

function push(checks, name, ok, details = '') {
  checks.push({ name, ok: Boolean(ok), details });
}

function failText(result) {
  return `${result.command}\n${result.stdout}${result.stderr}`.trim();
}

async function main() {
  const repoRoot = await findRepoRoot();
  const builderRoot = join(repoRoot, 'userscripts/builders', builderId);
  const builder = (await import(pathToFileURL(join(builderRoot, 'scripts.config.mjs')).href)).default;
  const schema = await import(pathToFileURL(join(builderRoot, 'src/core/profile-schema.mjs')).href);
  const profiles = schema.validateBuilderConfig(builder);
  const smoke = await readJson(join(builderRoot, 'smoke.config.json'));
  const repoPackage = await readJson(join(repoRoot, 'package.json'));
  const builderPackage = await readJson(join(builderRoot, 'package.json'));
  const manifest = await readJson(join(repoRoot, 'repo-manifest.json'));
  const project = manifest.projects.find((item) => item.path === `userscripts/builders/${builderId}`);
  const runtimeText = await readFile(join(builderRoot, 'src/core/runtime.template.js'), 'utf8');
  const smokeRunnerText = await readFile(join(repoRoot, 'tools/smoke/run-content-site-smoke.py'), 'utf8');
  const validatorText = await readFile(join(repoRoot, '.devtool-artifact/validate.sh'), 'utf8').catch(() => '');
  const checks = [];

  push(checks, 'builder id', builder.id === builderId, builder.id);
  push(checks, 'profile count', profiles.length === 7, `${profiles.length} profiles`);
  push(checks, 'profile schema version', profiles.every((profile) => profile.client.schemaVersion === schema.PROFILE_SCHEMA_VERSION), `v${schema.PROFILE_SCHEMA_VERSION}`);
  push(checks, 'all profiles are shared-runtime', profiles.every((profile) => !profile.source), 'no active profile.source entries');

  const outputSet = new Set();
  const smokeSites = new Map((smoke.sites || []).map((site) => [site.id, site]));
  const smokeSitesByScript = new Map((smoke.sites || []).map((site) => [site.script, site]));
  const scriptNames = new Set();
  for (const profile of profiles) {
    const userPath = join(builderRoot, profile.output.userScript);
    const metaPath = join(builderRoot, profile.output.metaScript);
    const userExists = await exists(userPath);
    const metaExists = await exists(metaPath);
    push(checks, `${profile.id} generated userscript`, userExists, profile.output.userScript);
    push(checks, `${profile.id} generated meta`, metaExists, profile.output.metaScript);
    outputSet.add(profile.output.userScript);
    outputSet.add(profile.output.metaScript);
    scriptNames.add(profile.name);

    if (userExists) {
      const userText = await readFile(userPath, 'utf8');
      const fields = userscriptFields(userText);
      push(checks, `${profile.id} metadata block`, Boolean(fields), profile.name);
      push(checks, `${profile.id} metadata version`, one(fields, 'version') === profile.version, `${one(fields, 'version')} == ${profile.version}`);
      push(checks, `${profile.id} runtime payload`, userText.includes('const PROFILE = {') && userText.includes('install(PROFILE, CSS_TEXT)'), 'shared runtime install');
      push(checks, `${profile.id} normalized capabilities`, userText.includes('"capabilities"') && userText.includes('"schemaVersion"'), 'normalized profile emitted');
    }
    if (metaExists) {
      const metaText = await readFile(metaPath, 'utf8');
      push(checks, `${profile.id} meta header only`, metaText.includes('// ==UserScript==') && !metaText.includes('const PROFILE ='), profile.output.metaScript);
    }

    const expectedSmokeScript = `userscripts/builders/${builderId}/${profile.output.userScript}`;
    const smokeSite = smokeSites.get(profile.id) || smokeSitesByScript.get(expectedSmokeScript);
    push(checks, `${profile.id} smoke site`, Boolean(smokeSite), 'smoke.config.json');
    if (smokeSite) {
      push(checks, `${profile.id} smoke script path`, smokeSite.script === expectedSmokeScript, smokeSite.script || 'missing');
      push(checks, `${profile.id} home fixture`, Boolean((smokeSite.fixtures || []).find((fixture) => fixture.id === 'home')), 'home');
      push(checks, `${profile.id} live url`, /^https:\/\//.test(smokeSite.live?.url || ''), smokeSite.live?.url || 'missing');
    }
  }

  push(checks, 'smoke site count matches profiles', smokeSites.size === profiles.length, `${smokeSites.size} smoke sites`);
  push(checks, 'manifest project exists', Boolean(project), 'repo-manifest.json');
  if (project) {
    const manifestArtifacts = new Set(project.install_artifacts || []);
    push(checks, 'manifest artifact coverage', [...outputSet].every((output) => manifestArtifacts.has(output)), `${manifestArtifacts.size} manifest artifacts`);
    push(checks, 'manifest version coverage', profiles.every((profile) => project.versions?.[profile.output.userScript.replace(/^dist\//, '').replace(/\.user\.js$/, '')] === profile.version), 'versions map');
    push(checks, 'manifest final seal policy', Boolean(project.final_seal), 'project.final_seal');
    push(checks, 'manifest release pack policy', Boolean(project.release_pack), 'project.release_pack');
  }

  const requiredRootScripts = [
    'build:content-sites',
    'content-sites:profiles:check',
    'content-sites:seal',
    'content-sites:seal:json',
    'content-sites:release-pack',
    'content-sites:release-pack:check',
    'content-sites:new',
    'content-sites:fixtures:plan',
    'smoke:content-sites:pagetual',
    'smoke:content-sites:a11y',
    'smoke:content-sites:visual:compare',
    'smoke:content-sites:live:baseline:compare'
  ];
  for (const script of requiredRootScripts) push(checks, `root script ${script}`, Boolean(repoPackage.scripts?.[script]), 'package.json');
  for (const script of ['build', 'check', 'test', 'profiles:check', 'seal', 'release-pack', 'release-pack:check']) push(checks, `builder script ${script}`, Boolean(builderPackage.scripts?.[script]), 'builder package.json');

  push(checks, 'PageTual candidate marker compatibility', runtimeText.includes('data-csm-page-tual-candidate="1"') && runtimeText.includes('data-csm-pagetual-candidate="1"') && runtimeText.includes('csmPageTualCandidate'), 'new and legacy markers');
  push(checks, 'PageTual hidden-root inclusion', runtimeText.includes('hasPageTualCandidate') && runtimeText.includes('(!isExcluded(explicitRoot) || hasPageTualCandidate(explicitRoot))'), 'hidden roots with marked candidates are scanned');
  push(checks, 'PageTual source selection starvation guard', runtimeText.includes('if (node.dataset.csmCard) continue') && runtimeText.includes('selectCardNodes(candidates, currentFeedLinkSet(), { allowHiddenSource: true, limit: 0 })'), 'skip enhanced cards and select raw candidates');
  push(checks, 'PageTual direct ingest path', runtimeText.includes('const ingestPageTualCandidates') && runtimeText.includes('grid.append(item);') && runtimeText.includes('enhanceCard(item);') && runtimeText.includes("reconcileFeed({ reason: 'pagetual' })"), 'insert event ingests raw candidates immediately');
  push(checks, 'PageTual inserted-root marking', runtimeText.includes('root instanceof HTMLElement && root.matches?.(sel)') && runtimeText.includes('markNode(root)'), 'inserted root can be the candidate');
  push(checks, 'PageTual smoke growth wait', smokeRunnerText.includes('def pagetual_growth_timeout') && smokeRunnerText.includes('growthTimeoutMs", 12000'), 'longer wait window for browser smoke');
  push(checks, 'PageTual env fallback', smokeRunnerText.includes('os.environ.get("PAGETUAL_SCRIPT")'), 'empty --pagetual falls back to PAGETUAL_SCRIPT');
  push(checks, 'PageTual ingest summary marker', smokeRunnerText.includes('PageTual ingest: simulated insert -> raw candidates selected -> modern cards appended'), 'Markdown summary explains ingest path');
  push(checks, 'PageTual managed validator gate', validatorText.includes('PLAYWRIGHT_SMOKE=1') && validatorText.includes('PAGETUAL_SCRIPT') && validatorText.includes('smoke:content-sites:interactions:managed'), 'optional browser smoke gate');

  const docs = [
    ['README.md', 'Content-site final seal'],
    ['docs/REPOSITORY_LAYOUT.md', 'Content-site final seal'],
    ['docs/RELEASE_WORKFLOW.md', 'content-sites:seal'],
    [`userscripts/builders/${builderId}/README.md`, 'Final seal'],
    [`userscripts/builders/${builderId}/docs/FINAL_SEAL.md`, 'Content-site final seal']
  ];
  for (const [rel, marker] of docs) {
    const path = join(repoRoot, rel);
    const text = await readFile(path, 'utf8').catch(() => '');
    push(checks, `docs marker ${rel}`, text.includes(marker), marker);
  }

  if (!skipBuildCheck) {
    const buildCheck = runNode(repoRoot, [`userscripts/builders/${builderId}/build.mjs`, '--check'], { capture: true });
    push(checks, 'generated output freshness', buildCheck.ok, buildCheck.ok ? 'build.mjs --check' : failText(buildCheck));
    const profileCheck = runNode(builderRoot, ['tools/check-profiles.mjs'], { capture: true });
    push(checks, 'profile checker command', profileCheck.ok && profileCheck.stdout.includes(`${profiles.length} profiles`), profileCheck.ok ? profileCheck.stdout.trim().split(/\r?\n/)[0] : failText(profileCheck));
    const releasePackCheck = runNode(repoRoot, ['tools/content-sites/release-pack.mjs', '--check', '--json', '--skip-build-check'], { capture: true });
    push(checks, 'release pack check command', releasePackCheck.ok && releasePackCheck.stdout.includes('"ok": true'), releasePackCheck.ok ? 'release-pack --check' : failText(releasePackCheck));
  }

  const ok = checks.every((check) => check.ok);
  const result = {
    ok,
    builder: builderId,
    profiles: profiles.map((profile) => ({
      id: profile.id,
      name: profile.name,
      version: profile.version,
      output: profile.output.userScript,
      capabilities: Object.entries(profile.client.capabilities).filter(([, enabled]) => enabled).map(([name]) => name)
    })),
    counts: {
      profiles: profiles.length,
      outputs: outputSet.size,
      smokeSites: smokeSites.size,
      checks: checks.length,
      failedChecks: checks.filter((check) => !check.ok).length
    },
    checks
  };

  if (jsonMode) {
    console.log(JSON.stringify(result, null, 2));
  } else {
    console.log(`content-site final seal ${ok ? 'ok' : 'failed'}: ${profiles.length} profiles, ${outputSet.size} outputs, ${smokeSites.size} smoke sites`);
    for (const check of checks) console.log(`${check.ok ? '✓' : '✗'} ${check.name}${check.details ? ` — ${check.details}` : ''}`);
    console.log('profiles:');
    for (const profile of result.profiles) console.log(`- ${profile.id} ${profile.version} (${profile.capabilities.length} capabilities)`);
  }

  if (!ok) process.exit(1);
}

main().catch((error) => {
  if (jsonMode) console.log(JSON.stringify({ ok: false, error: error.message }, null, 2));
  else console.error(error.stack || error.message);
  process.exit(1);
});
