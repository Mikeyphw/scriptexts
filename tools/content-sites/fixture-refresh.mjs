#!/usr/bin/env node
import { copyFile, mkdir, readFile, stat, writeFile } from 'node:fs/promises';
import { basename, dirname, join, resolve } from 'node:path';
import process from 'node:process';

const REPO_ROOT = resolve(new URL('..', import.meta.url).pathname, '..');
const BUILDER_ROOT = 'userscripts/builders/content-site-modernizer';
const DEFAULT_RESULTS = 'smoke-results/content-site-modernizer/content-site-smoke-results.json';

function parseArgs(argv) {
  const args = { plan: false, apply: false, json: false, force: false, dryRun: false, allowSmokeSnapshot: false };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--plan') args.plan = true;
    else if (arg === '--apply') args.apply = true;
    else if (arg === '--json') args.json = true;
    else if (arg === '--force') args.force = true;
    else if (arg === '--dry-run') args.dryRun = true;
    else if (arg === '--allow-smoke-snapshot') args.allowSmokeSnapshot = true;
    else if (arg.startsWith('--')) {
      const key = arg.slice(2).replace(/-([a-z])/g, (_, c) => c.toUpperCase());
      const value = argv[i + 1];
      if (!value || value.startsWith('--')) throw new Error(`${arg} requires a value`);
      args[key] = value;
      i += 1;
    } else throw new Error(`unexpected argument: ${arg}`);
  }
  if (!args.plan && !args.apply) args.plan = true;
  return args;
}

async function exists(path) {
  try { await stat(path); return true; } catch { return false; }
}

async function readJsonIfExists(path) {
  if (!await exists(path)) return null;
  return JSON.parse(await readFile(path, 'utf8'));
}

async function loadConfig() {
  return JSON.parse(await readFile(join(REPO_ROOT, BUILDER_ROOT, 'smoke.config.json'), 'utf8'));
}

function fixtureTarget(config, siteId, fixtureId) {
  const site = config.sites.find((item) => item.id === siteId);
  if (!site) throw new Error(`unknown site ${siteId}`);
  const fixture = site.fixtures.find((item) => item.id === fixtureId);
  if (!fixture) throw new Error(`unknown fixture ${siteId}/${fixtureId}`);
  return fixture.path;
}

function collectCandidates(config, results) {
  const candidates = [];
  if (!results?.sites) return candidates;
  for (const siteResult of results.sites) {
    const siteConfig = config.sites.find((site) => site.id === siteResult.id);
    for (const fixtureResult of siteResult.fixtures || []) {
      const fixtureConfig = siteConfig?.fixtures?.find((fixture) => fixture.id === fixtureResult.id);
      const target = fixtureConfig?.path;
      if (!target) continue;
      const failed = fixtureResult.ok === false;
      const drift = fixtureResult.liveDrift?.severity && fixtureResult.liveDrift.severity !== 'ok';
      const baseline = fixtureResult.liveBaselineDrift?.severity && fixtureResult.liveBaselineDrift.severity !== 'ok';
      const snapshot = fixtureResult.htmlSnapshot;
      if (failed || drift || baseline || snapshot) {
        candidates.push({
          site: siteResult.id,
          fixture: fixtureResult.id,
          viewport: fixtureResult.viewport || null,
          target,
          htmlSnapshot: snapshot || null,
          error: fixtureResult.error || null,
          cards: fixtureResult.assertions?.cards ?? null,
          drift: fixtureResult.liveDrift || null,
          baseline: fixtureResult.liveBaselineDrift || null,
          reason: failed ? 'failed smoke fixture' : drift ? 'live drift' : baseline ? 'live baseline drift' : 'has retained snapshot'
        });
      }
    }
  }
  return candidates;
}

function renderPlan(candidates, resultsPath) {
  const lines = [];
  lines.push('# Content-site fixture refresh plan');
  lines.push('');
  lines.push(`Source results: \`${resultsPath}\``);
  lines.push('');
  if (!candidates.length) {
    lines.push('No refresh candidates found.');
    return `${lines.join('\n')}\n`;
  }
  for (const candidate of candidates) {
    lines.push(`## ${candidate.site}/${candidate.fixture}${candidate.viewport ? ` (${candidate.viewport})` : ''}`);
    lines.push('');
    lines.push(`- Reason: ${candidate.reason}`);
    lines.push(`- Target fixture: \`${candidate.target}\``);
    if (candidate.cards !== null) lines.push(`- Observed cards: ${candidate.cards}`);
    if (candidate.error) lines.push(`- Error: ${candidate.error.split('\n')[0]}`);
    if (candidate.htmlSnapshot) lines.push(`- Retained smoke snapshot: \`${candidate.htmlSnapshot}\``);
    lines.push('- Safe apply command:');
    lines.push('');
    lines.push('```bash');
    lines.push(`npm run content-sites:fixtures:apply -- --site ${candidate.site} --fixture ${candidate.fixture} --source /path/to/fresh-captured-source.html`);
    if (candidate.htmlSnapshot) {
      lines.push(`# Only if you intentionally want the retained smoke DOM snapshot:`);
      lines.push(`npm run content-sites:fixtures:apply -- --site ${candidate.site} --fixture ${candidate.fixture} --snapshot ${candidate.htmlSnapshot} --allow-smoke-snapshot`);
    }
    lines.push('```');
    lines.push('');
  }
  return `${lines.join('\n')}\n`;
}

async function applyRefresh(config, args) {
  if (!args.site || !args.fixture) throw new Error('--apply requires --site and --fixture');
  const targetRel = fixtureTarget(config, args.site, args.fixture);
  const target = join(REPO_ROOT, targetRel);
  let source = args.source || args.snapshot;
  let sourceKind = args.source ? 'source' : args.snapshot ? 'snapshot' : '';
  if (!source) {
    const resultsPath = join(REPO_ROOT, args.results || DEFAULT_RESULTS);
    const results = await readJsonIfExists(resultsPath);
    const candidate = collectCandidates(config, results).find((item) => item.site === args.site && item.fixture === args.fixture && item.htmlSnapshot);
    if (!candidate) throw new Error('no retained smoke snapshot found; pass --source or --snapshot explicitly');
    source = candidate.htmlSnapshot;
    sourceKind = 'snapshot';
  }
  if (sourceKind === 'snapshot' && !args.allowSmokeSnapshot) {
    throw new Error('refusing to apply a smoke HTML snapshot because it may contain injected modernized DOM; pass --allow-smoke-snapshot or use --source with a fresh capture');
  }
  const sourcePath = resolve(REPO_ROOT, source);
  if (!await exists(sourcePath)) throw new Error(`source file not found: ${source}`);
  if (!await exists(target)) throw new Error(`target fixture does not exist: ${targetRel}`);
  const stamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\..+$/, 'Z');
  const backup = join(REPO_ROOT, BUILDER_ROOT, 'test/fixtures/.refresh-backups', stamp, basename(target));
  if (!args.force && sourcePath === target) throw new Error('source and target are the same file');
  if (!args.dryRun) {
    await mkdir(dirname(backup), { recursive: true });
    await copyFile(target, backup);
    await copyFile(sourcePath, target);
  }
  const record = { dryRun: args.dryRun, refreshedAt: new Date().toISOString(), site: args.site, fixture: args.fixture, target: targetRel, source: sourcePath.replace(`${REPO_ROOT}/`, ''), backup: backup.replace(`${REPO_ROOT}/`, '') };
  const recordPath = join(REPO_ROOT, BUILDER_ROOT, 'test/fixtures/.refresh-backups', 'last-refresh.json');
  if (!args.dryRun) await writeFile(recordPath, `${JSON.stringify(record, null, 2)}\n`, 'utf8');
  return record;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const config = await loadConfig();
  if (args.apply) {
    const record = await applyRefresh(config, args);
    if (args.json) console.log(JSON.stringify({ ok: true, action: 'apply', record }, null, 2));
    else {
      console.log(`Refreshed ${record.site}/${record.fixture}`);
      console.log(`- target: ${record.target}`);
      console.log(`- source: ${record.source}`);
      console.log(`- backup: ${record.backup}`);
      console.log('Next: npm run build:content-sites && npm --prefix userscripts/builders/content-site-modernizer run test');
    }
    return;
  }
  const resultsPath = args.results || DEFAULT_RESULTS;
  const results = await readJsonIfExists(join(REPO_ROOT, resultsPath));
  const candidates = collectCandidates(config, results);
  if (args.json) console.log(JSON.stringify({ ok: true, action: 'plan', results: resultsPath, candidates }, null, 2));
  else process.stdout.write(renderPlan(candidates, resultsPath));
}

main().catch((error) => {
  console.error(`content-sites:fixture-refresh failed: ${error.message}`);
  process.exit(1);
});
