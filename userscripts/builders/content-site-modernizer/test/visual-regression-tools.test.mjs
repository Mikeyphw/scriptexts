import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFile } from 'node:fs/promises';

const builderRoot = new URL('../', import.meta.url);
const repoRoot = new URL('../../../', builderRoot);
const rootPackage = JSON.parse(await readFile(new URL('package.json', repoRoot), 'utf8'));
const manifest = JSON.parse(await readFile(new URL('repo-manifest.json', repoRoot), 'utf8'));
const config = JSON.parse(await readFile(new URL('smoke.config.json', builderRoot), 'utf8'));
const runner = await readFile(new URL('tools/smoke/run-content-site-visual.py', repoRoot), 'utf8');
const requirements = await readFile(new URL('requirements-smoke.txt', repoRoot), 'utf8');

test('visual regression runner is opt-in and config-checkable without a browser', () => {
  assert.match(requirements, /playwright>=/);
  assert.match(requirements, /Pillow>=/);
  for (const marker of [
    '--check-config',
    '--capture',
    '--compare',
    '--update',
    '--fail-on-visual-diff',
    '--executable',
    'content-site-visual-regression.md',
    'visual-baseline-manifest.json',
    'compare_images',
    'maybe_write_thumbnail',
    'inject_visual_stability',
    'Pillow is not installed',
    'Playwright'
  ]) assert.ok(runner.includes(marker), `missing ${marker}`);

  execFileSync('python3', ['-Werror', '-m', 'py_compile', 'tools/smoke/run-content-site-visual.py'], {
    cwd: repoRoot,
    stdio: 'pipe'
  });
  const check = execFileSync('python3', [
    'tools/smoke/run-content-site-visual.py',
    '--builder', 'content-site-modernizer',
    '--check-config'
  ], { cwd: repoRoot, encoding: 'utf8' });
  assert.match(check, /visual smoke config ok: 7 sites/);
});

test('root package exposes visual regression commands', () => {
  assert.equal(rootPackage.scripts['smoke:content-sites:visual:list'], 'python3 tools/smoke/run-content-site-visual.py --builder content-site-modernizer --list');
  assert.equal(rootPackage.scripts['smoke:content-sites:visual:check'], 'python3 tools/smoke/run-content-site-visual.py --builder content-site-modernizer --check-config');
  assert.equal(rootPackage.scripts['smoke:content-sites:visual:capture'], 'python3 tools/smoke/run-content-site-visual.py --builder content-site-modernizer --all --matrix --capture');
  assert.equal(rootPackage.scripts['smoke:content-sites:visual:compare'], 'python3 tools/smoke/run-content-site-visual.py --builder content-site-modernizer --all --matrix --compare');
  assert.equal(rootPackage.scripts['smoke:content-sites:visual:focused'], 'python3 tools/smoke/run-content-site-visual.py --builder content-site-modernizer --site gayteam --site putinho --site str8upgayporn --matrix --compare');
  assert.ok(!rootPackage.dependencies, 'visual smoke should not add npm dependencies');
});

test('smoke config and manifest describe visual regression policy', () => {
  assert.equal(config.visualRegression.enabledByFlagOnly, true);
  assert.equal(config.visualRegression.baselineDir, 'tools/smoke/visual-baselines/content-site-modernizer');
  assert.equal(config.visualRegression.outputDir, 'smoke-results/content-site-modernizer-visual');
  assert.equal(config.visualRegression.report, 'content-site-visual-regression.md');
  assert.deepEqual(config.visualRegression.defaultFixtures, ['home']);
  assert.deepEqual(config.visualRegression.focusedSites, ['gayteam', 'putinho', 'str8upgayporn']);
  assert.deepEqual(config.visualRegression.viewports, ['mobile', 'desktop']);
  assert.equal(config.visualRegression.nonFailingByDefault, true);
  assert.equal(config.visualRegression.thresholdRatio, 0.015);
  assert.deepEqual(config.visualRegression.checks, ['fixtureScreenshot', 'acceptedBaselineCompare', 'thresholdRatio', 'thumbnailArtifacts', 'diffArtifacts']);

  const project = manifest.projects.find((item) => item.path === 'userscripts/builders/content-site-modernizer');
  assert.equal(project.smoke.visual_script, 'npm run smoke:content-sites:visual:compare');
  assert.equal(project.smoke.visual_capture_script, 'npm run smoke:content-sites:visual:capture');
  assert.equal(project.smoke.focused_visual_script, 'npm run smoke:content-sites:visual:focused');
  assert.equal(project.smoke.visual_baseline_dir, 'tools/smoke/visual-baselines/content-site-modernizer');
  assert.equal(manifest.content_site_visual_regression_policy.scope, 'content-site-modernizer');
  assert.equal(manifest.content_site_visual_regression_policy.normalValidation, 'browser-free');
});
