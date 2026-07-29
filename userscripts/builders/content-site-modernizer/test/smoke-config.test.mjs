import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const builderRoot = new URL('../', import.meta.url);
const repoRoot = new URL('../../../', builderRoot);
const config = JSON.parse(await readFile(new URL('smoke.config.json', builderRoot), 'utf8'));
const runner = await readFile(new URL('tools/smoke/run-content-site-smoke.py', repoRoot), 'utf8');
const requirements = await readFile(new URL('requirements-smoke.txt', repoRoot), 'utf8');
const rootPackage = JSON.parse(await readFile(new URL('package.json', repoRoot), 'utf8'));
const liveBaseline = JSON.parse(await readFile(new URL('tools/smoke/live-baselines/content-site-modernizer-live-baseline.json', repoRoot), 'utf8'));

test('repo-wide Playwright smoke runner is opt-in and lazy imports Playwright', () => {
  assert.match(requirements, /playwright>=/);
  assert.ok(runner.includes('from playwright.sync_api import sync_playwright'), 'runner should support Playwright Python');
  assert.ok(runner.includes('except Exception as exc'), 'runner should emit setup help when Playwright is absent');
  assert.ok(runner.includes('--check-config'), 'runner should have a no-Playwright config check mode');
  assert.ok(runner.includes('--executable'), 'runner should support a system browser executable');
  assert.ok(runner.includes('--matrix'), 'runner should support viewport matrix runs');
  assert.ok(runner.includes('--live'), 'runner should support guarded live-site smoke mode');
  assert.ok(runner.includes('--live-drift'), 'runner should support report-only live drift checks');
  assert.ok(runner.includes('render_live_drift_report'), 'runner should render live shape drift reports');
  assert.ok(runner.includes('--fail-on-live-drift'), 'runner should optionally fail on severe live drift');
  assert.ok(runner.includes('--live-baseline-capture'), 'runner should capture accepted live baselines');
  assert.ok(runner.includes('--live-baseline-compare'), 'runner should compare accepted live baselines');
  assert.ok(runner.includes('--live-baseline-update'), 'runner should refresh accepted live baselines explicitly');
  assert.ok(runner.includes('--fail-on-live-baseline-drift'), 'runner should optionally fail on accepted live baseline drift');
  assert.ok(runner.includes('--pagetual-contract'), 'runner should expose PageTual contract v2 mode');
  assert.ok(runner.includes('--a11y-contract'), 'runner should expose accessibility contract mode');
  assert.ok(runner.includes('assert_accessibility_contract'), 'runner should exercise shared UI accessibility behavior');
  assert.ok(runner.includes('drawer focus escaped while tabbing'), 'runner should verify drawer focus trapping');
  assert.ok(runner.includes('search input lacks an accessible label'), 'runner should verify search input labels');
  assert.ok(runner.includes('assert_pagetual_contract_v2'), 'runner should exercise PageTual v2 behavior');
  assert.ok(runner.includes('duplicateHrefCount') || runner.includes('duplicate_href_count'), 'runner should detect duplicate PageTual card links');
  assert.ok(runner.includes('activeFilterAppend'), 'runner should test appends while filters are active');
  assert.ok(runner.includes('render_live_baseline_report'), 'runner should render accepted live baseline reports');
  assert.ok(runner.includes('--allow-live-pagetual'), 'runner should refuse PageTual injection on live pages without an explicit guard');
  assert.ok(runner.includes('install_live_network_guards'), 'runner should block noisy third-party live requests by default');
  assert.ok(runner.includes('--trace'), 'runner should retain Playwright traces on failure');
  assert.ok(runner.includes('content-site-smoke-summary.md'), 'runner should write a Markdown smoke summary');
  assert.ok(runner.includes('assert_interactions'), 'runner should exercise real UI interactions');
  assert.ok(runner.includes('assert_search_filter'), 'runner should type into search drawers and check visible card state');
  assert.ok(runner.includes('assert_card_action_toggles'), 'runner should verify saved/viewed card actions or viewed storage');
  assert.ok(runner.includes('assert_load_more'), 'runner should click shared load-more controls');
  assert.ok(runner.includes('click_first_visible'), 'runner should click the first visible UI control, not hidden desktop controls');
  assert.ok(runner.includes('neutralize_fixture_blockers'), 'runner should neutralize captured ad overlays before interaction clicks');
  assert.ok(runner.includes('is_ignored_console_error'), 'runner should ignore local fixture resource noise');
  assert.ok(runner.includes('start_static_server'), 'runner should serve fixtures over localhost by default');
  assert.ok(runner.includes('PLAYWRIGHT_SMOKE=1'), 'docs/help should advertise opt-in validation');
  assert.ok(runner.includes("window.postMessage({ command: 'pagetual', action: 'insert' }"), 'runner should simulate PageTual insert');
});

test('content-site-modernizer smoke config covers every generated site', () => {
  const expected = new Set([
    'aipt-comics',
    'bleeding-cool',
    'menofporn',
    'putinho',
    'gayteam',
    'justthegays',
    'str8upgayporn'
  ]);
  assert.equal(config.schemaVersion, 1);
  assert.equal(config.builder, 'content-site-modernizer');
  assert.ok(config.viewports.some((viewport) => viewport.id === 'mobile' && viewport.width === 390));
  assert.ok(config.viewports.some((viewport) => viewport.id === 'desktop' && viewport.width >= 1200));
  assert.deepEqual(config.defaultMatrixViewports, ['mobile', 'desktop']);
  assert.equal(config.evidence.markdown, 'content-site-smoke-summary.md');
  assert.equal(config.evidence.liveOutput, 'smoke-results/content-site-modernizer-live');
  assert.equal(config.liveSmoke.enabledByFlagOnly, true);
  assert.equal(config.liveSmoke.blocksThirdPartyByDefault, true);
  assert.equal(config.liveSmoke.driftReport.nonFailingByDefault, true);
  assert.equal(config.liveSmoke.driftReport.report, 'content-site-live-drift.md');
  assert.equal(config.liveSmoke.driftReport.failSeverity, 'high');
  assert.equal(config.liveSmoke.baseline.path, 'tools/smoke/live-baselines/content-site-modernizer-live-baseline.json');
  assert.equal(config.liveSmoke.baseline.report, 'content-site-live-baseline.md');
  assert.equal(config.liveSmoke.baseline.failSeverity, 'high');
  assert.equal(config.liveSmoke.baseline.nonFailingByDefault, true);
  assert.equal(liveBaseline.schemaVersion, 1);
  assert.equal(liveBaseline.builder, 'content-site-modernizer');
  assert.deepEqual(liveBaseline.entries, {});
  assert.equal(config.interactions.enabledByDefault, true);
  assert.deepEqual(config.interactions.checks, ['drawer', 'cardActions', 'searchFilter', 'loadMore', 'pagetualAppend']);
  assert.equal(config.accessibilityContract.enabledByFlagOnly, true);
  assert.deepEqual(config.accessibilityContract.focusedSites, ['gayteam', 'putinho', 'str8upgayporn']);
  assert.deepEqual(config.accessibilityContract.checks, [
    'visibleControlNames',
    'mobileDesktopControlVisibility',
    'drawerDialogSemantics',
    'drawerFocusTrap',
    'drawerEscapeClose',
    'searchInputLabel',
    'bottomNavLabels',
    'cardLinkNames',
    'articleProgressbarSemantics'
  ]);
  assert.equal(config.pagetualContract.version, 2);
  assert.equal(config.pagetualContract.enabledByFlagOnly, true);
  assert.deepEqual(config.pagetualContract.checks, ['multiAppend', 'duplicateLinks', 'activeFilterAppend', 'restoreAfterFilter']);
  assert.equal(config.pagetualContract.maxDuplicateCardGrowth, 0);
  assert.deepEqual(new Set(config.sites.map((site) => site.id)), expected);
  const men = config.sites.find((site) => site.id === 'menofporn');
  const putinho = config.sites.find((site) => site.id === 'putinho');
  assert.equal(men.fixtures[0].expect.cardSelector, '.csm-card', 'MenOfPorn smoke should use shared runtime cards');
  assert.equal(men.drawer.openSelector, '[data-action="open-browse"]', 'MenOfPorn smoke should use shared drawer actions');
  assert.equal(putinho.fixtures[0].expect.cardSelector, '.csm-card', 'Putinho smoke should use shared runtime cards');
  assert.equal(putinho.fixtures[0].expect.minCards, 1, 'Putinho fixture has one captured Jannah card before PageTual simulation');
  assert.equal(putinho.drawer.openSelector, '[data-action="open-browse"]', 'Putinho smoke should use shared drawer actions');
  const str8 = config.sites.find((site) => site.id === 'str8upgayporn');
  assert.ok(str8.pagetual.appendTargetSelector.includes('ul.posts-list'), 'STR8UP PageTual simulation should append into source section lists');
  for (const site of config.sites) {
    assert.match(site.script, /^userscripts\/builders\/content-site-modernizer\/dist\/.+\.user\.js$/);
    assert.ok(site.fixtures.length >= 1, `${site.id} should have at least one fixture`);
    assert.ok(site.pagetual?.fixture, `${site.id} should declare PageTual simulation fixture`);
    assert.match(site.live?.url || '', /^https:\/\//, `${site.id} should declare a guarded live smoke URL`);
    assert.equal(site.live.assertInteractions, false, `${site.id} live interactions should be opt-in`);
  }
});

test('root package exposes repo-wide smoke entry points without adding npm dependencies', () => {
  assert.equal(rootPackage.scripts['smoke:content-sites'], 'python3 tools/smoke/run-content-site-smoke.py --builder content-site-modernizer');
  assert.equal(rootPackage.scripts['smoke:content-sites:list'], 'python3 tools/smoke/run-content-site-smoke.py --builder content-site-modernizer --list');
  assert.equal(rootPackage.scripts['smoke:content-sites:matrix'], 'python3 tools/smoke/run-content-site-smoke.py --builder content-site-modernizer --all --matrix');
  assert.equal(rootPackage.scripts['smoke:content-sites:report'], 'python3 tools/smoke/run-content-site-smoke.py --builder content-site-modernizer --report smoke-results/content-site-modernizer/content-site-smoke-results.json');
  assert.equal(rootPackage.scripts['smoke:content-sites:interactions'], 'python3 tools/smoke/run-content-site-smoke.py --builder content-site-modernizer --site gayteam --site putinho --site str8upgayporn --matrix');
  assert.equal(rootPackage.scripts['smoke:content-sites:live'], 'python3 tools/smoke/run-content-site-smoke.py --builder content-site-modernizer --live --matrix');
  assert.equal(rootPackage.scripts['smoke:content-sites:live:focused'], 'python3 tools/smoke/run-content-site-smoke.py --builder content-site-modernizer --live --site gayteam --site putinho --site str8upgayporn --matrix');
  assert.equal(rootPackage.scripts['smoke:content-sites:live:drift'], 'python3 tools/smoke/run-content-site-smoke.py --builder content-site-modernizer --live --all --matrix --live-drift');
  assert.equal(rootPackage.scripts['smoke:content-sites:live:drift:focused'], 'python3 tools/smoke/run-content-site-smoke.py --builder content-site-modernizer --live --site gayteam --site putinho --site str8upgayporn --matrix --live-drift');
  assert.equal(rootPackage.scripts['smoke:content-sites:live:baseline:capture'], 'python3 tools/smoke/run-content-site-smoke.py --builder content-site-modernizer --live --all --matrix --live-drift --live-baseline-capture');
  assert.equal(rootPackage.scripts['smoke:content-sites:live:baseline:compare'], 'python3 tools/smoke/run-content-site-smoke.py --builder content-site-modernizer --live --all --matrix --live-drift --live-baseline-compare');
  assert.equal(rootPackage.scripts['smoke:content-sites:live:baseline:update'], 'python3 tools/smoke/run-content-site-smoke.py --builder content-site-modernizer --live --all --matrix --live-drift --live-baseline-update');
  assert.equal(rootPackage.scripts['smoke:content-sites:live:baseline:focused'], 'python3 tools/smoke/run-content-site-smoke.py --builder content-site-modernizer --live --site gayteam --site putinho --site str8upgayporn --matrix --live-drift --live-baseline-compare');
  assert.equal(rootPackage.scripts['smoke:content-sites:pagetual'], 'python3 tools/smoke/run-content-site-smoke.py --builder content-site-modernizer --all --matrix --pagetual-contract');
  assert.equal(rootPackage.scripts['smoke:content-sites:pagetual:focused'], 'python3 tools/smoke/run-content-site-smoke.py --builder content-site-modernizer --site gayteam --site putinho --site str8upgayporn --matrix --pagetual-contract');
  assert.equal(rootPackage.scripts['smoke:content-sites:a11y'], 'python3 tools/smoke/run-content-site-smoke.py --builder content-site-modernizer --all --matrix --a11y-contract');
  assert.equal(rootPackage.scripts['smoke:content-sites:a11y:focused'], 'python3 tools/smoke/run-content-site-smoke.py --builder content-site-modernizer --site gayteam --site putinho --site str8upgayporn --matrix --a11y-contract');
  assert.ok(!rootPackage.dependencies, 'smoke should use requirements-smoke.txt, not npm dependencies');
});
