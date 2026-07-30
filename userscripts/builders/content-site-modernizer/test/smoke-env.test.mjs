import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFile } from 'node:fs/promises';

const builderRoot = new URL('../', import.meta.url);
const repoRoot = new URL('../../../', builderRoot);
const packageJson = JSON.parse(await readFile(new URL('package.json', repoRoot), 'utf8'));
const pyproject = await readFile(new URL('pyproject.toml', repoRoot), 'utf8');
const devtoolToml = await readFile(new URL('.devtool.toml', repoRoot), 'utf8');
const wrapper = await readFile(new URL('tools/smoke/with-smoke-env.sh', repoRoot), 'utf8');
const activate = await readFile(new URL('tools/smoke/activate-smoke-env.sh', repoRoot), 'utf8');
const runner = await readFile(new URL('tools/smoke/run-content-site-smoke.py', repoRoot), 'utf8');
const visualRunner = await readFile(new URL('tools/smoke/run-content-site-visual.py', repoRoot), 'utf8');
const manifest = JSON.parse(await readFile(new URL('repo-manifest.json', repoRoot), 'utf8'));


test('repo-wide smoke Python environment prefers uv and has venv fallback', async () => {
  assert.match(pyproject, /name = "scriptexts-smoke-tools"/);
  assert.match(pyproject, /\[dependency-groups\]/);
  assert.match(pyproject, /smoke = \[/);
  assert.match(pyproject, /playwright>=1\.48/);
  assert.match(pyproject, /Pillow>=10\.0/);
  assert.match(pyproject, /manager = "uv"/);
  assert.match(pyproject, /venv = "\.venv-smoke"/);

  assert.match(devtoolToml, /\[targets\.smoke-python\]/);
  assert.match(devtoolToml, /type = "python"/);
  assert.match(devtoolToml, /manager = "uv"/);
  assert.match(devtoolToml, /environment = "\.venv-smoke"/);

  // Devtool applies overlay files through rsync/zip paths that may normalize
  // executable bits. Root npm scripts intentionally invoke the wrapper through
  // `bash`, so the contract is parseable/invokable shell, not file mode.
  assert.match(packageJson.scripts['smoke:env:doctor'], /^bash tools\/smoke\/with-smoke-env\.sh/);
  assert.match(wrapper, /uv venv --python/);
  assert.match(wrapper, /uv pip install --python/);
  assert.match(wrapper, /venv\+pip/);
  assert.match(wrapper, /PLAYWRIGHT_BROWSERS_PATH/);
  assert.match(wrapper, /PLAYWRIGHT_EXECUTABLE_PATH/);
  assert.match(wrapper, /exec "\$@"/);

  assert.match(activate, /smoke-env-deactivate/);
  assert.match(activate, /VIRTUAL_ENV/);
  assert.match(activate, /_SMOKE_ENV_OLD_PATH/);
});

test('root package exposes managed smoke commands', () => {
  assert.equal(packageJson.scripts['smoke:env:doctor'], 'bash tools/smoke/with-smoke-env.sh --doctor');
  assert.equal(packageJson.scripts['smoke:env:sync'], 'bash tools/smoke/with-smoke-env.sh --sync');
  assert.equal(packageJson.scripts['smoke:env:install-browsers'], 'bash tools/smoke/with-smoke-env.sh --install-browsers');
  assert.equal(packageJson.scripts['smoke:with-env'], 'bash tools/smoke/with-smoke-env.sh --');
  assert.equal(packageJson.scripts['smoke:content-sites:interactions:managed'], 'bash tools/smoke/with-smoke-env.sh -- npm run smoke:content-sites:interactions --');
  assert.equal(packageJson.scripts['smoke:content-sites:pagetual:managed'], 'bash tools/smoke/with-smoke-env.sh -- npm run smoke:content-sites:pagetual:focused --');
  assert.equal(packageJson.scripts['smoke:content-sites:a11y:managed'], 'bash tools/smoke/with-smoke-env.sh -- npm run smoke:content-sites:a11y:focused --');
  assert.equal(packageJson.scripts['smoke:content-sites:visual:managed'], 'bash tools/smoke/with-smoke-env.sh -- npm run smoke:content-sites:visual:focused --');
});

test('smoke runners respect managed browser executable environment and report real launch errors', () => {
  assert.match(runner, /def resolve_browser_executable/);
  assert.match(runner, /def describe_browser_executable/);
  assert.match(runner, /PLAYWRIGHT_EXECUTABLE_PATH/);
  assert.match(wrapper, /for candidate in chromium chromium-browser google-chrome-stable google-chrome/);
  assert.match(runner, /missing\)/);
  assert.match(runner, /not executable\)/);
  assert.match(runner, /using \{browser_executable_description\}/);
  assert.match(runner, /Attempted executable:/);
  assert.match(runner, /Launch error:/);
  assert.match(runner, /could not launch Playwright browser/);
  assert.match(visualRunner, /def resolve_browser_executable/);
  assert.match(visualRunner, /def describe_browser_executable/);
  assert.match(visualRunner, /PLAYWRIGHT_EXECUTABLE_PATH/);
  assert.match(wrapper, /PLAYWRIGHT_EXECUTABLE_PATH="\$\(command -v "\$candidate"\)"/);
  assert.match(visualRunner, /using \{browser_executable_description\}/);
  assert.match(visualRunner, /Attempted executable:/);
  assert.match(visualRunner, /Launch error:/);
});

test('PageTual and fixture-smoke repairs are locked', () => {
  assert.match(runner, /csm-smoke-\$\{label \|\| 'next'\}-\$\{index\}/);
  assert.match(runner, /csm-smoke-link/);
  assert.match(runner, /url\.pathname = `\$\{clean\}-\$\{linkSuffix\}\/`/);
  assert.match(runner, /wedata\\\.net\/databases\/AutoPagerize\/items_all\\\.json/);
  assert.match(runner, /fill_first_visible/);
  assert.match(runner, /visible_feed_status_text/);
  assert.match(runner, /open_drawer_for_smoke/);
  assert.match(runner, /should_run_pagetual_contract/);
  assert.match(runner, /inject-real-pagetual/);
  assert.match(runner, /simulated-events-only/);
  assert.match(runner, /navigationWarning/);
  assert.match(runner, /\[data-csm-feed-status-text\]/);
});

test('managed smoke shell helpers parse without launching browsers', () => {
  execFileSync('bash', ['-n', 'tools/smoke/with-smoke-env.sh'], { cwd: repoRoot });
  execFileSync('bash', ['-n', 'tools/smoke/activate-smoke-env.sh'], { cwd: repoRoot });
});

test('manifest documents smoke Python environment policy', () => {
  assert.equal(manifest.content_site_smoke_python_env_policy.manager, 'uv');
  assert.equal(manifest.content_site_smoke_python_env_policy.environment, '.venv-smoke');
  assert.equal(manifest.content_site_smoke_python_env_policy.devtool_target, 'smoke-python');
  const project = manifest.projects.find((item) => item.path === 'userscripts/builders/content-site-modernizer');
  assert.equal(project.smoke.python_manager, 'uv');
  assert.equal(project.smoke.env_wrapper, 'tools/smoke/with-smoke-env.sh');
  assert.equal(project.smoke.managed_interaction_script, 'npm run smoke:content-sites:interactions:managed');
});
