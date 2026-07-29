#!/usr/bin/env node
import { mkdir, readFile, writeFile, copyFile, stat } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import process from 'node:process';
import { DEFAULT_CAPABILITIES, DEFAULT_LAYOUT, DEFAULT_PERFORMANCE, PROFILE_SCHEMA_VERSION } from '../../userscripts/builders/content-site-modernizer/src/core/profile-schema.mjs';

// Supported fixture-copy flags: --home-fixture and --post-fixture.
const DEFAULT_BUILDER = 'content-site-modernizer';
const REPO_ROOT = resolve(new URL('..', import.meta.url).pathname, '..');

function parseArgs(argv) {
  const args = { dryRun: false, force: false, json: false, version: '1.0.0' };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--dry-run') args.dryRun = true;
    else if (arg === '--force') args.force = true;
    else if (arg === '--json') args.json = true;
    else if (arg.startsWith('--')) {
      const key = arg.slice(2).replace(/-([a-z])/g, (_, c) => c.toUpperCase());
      const value = argv[i + 1];
      if (!value || value.startsWith('--')) throw new Error(`${arg} requires a value`);
      args[key] = value;
      i += 1;
    } else throw new Error(`unexpected argument: ${arg}`);
  }
  return args;
}

function kebab(value, field) {
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value || '')) {
    throw new Error(`${field} must be lowercase kebab-case, got ${JSON.stringify(value)}`);
  }
  return value;
}

function hostMatches(host) {
  const bare = host.replace(/^https?:\/\//, '').replace(/^www\./, '').replace(/\/$/, '');
  if (!/^[a-z0-9.-]+\.[a-z]{2,}$/i.test(bare)) throw new Error(`host must look like a domain, got ${JSON.stringify(host)}`);
  return [`https://${bare}/*`, `https://www.${bare}/*`];
}

function camel(value) {
  return value.replace(/-([a-z0-9])/g, (_, c) => c.toUpperCase()).replace(/^[0-9]/, '_$&');
}

async function exists(path) {
  try { await stat(path); return true; } catch { return false; }
}

async function readJson(path) {
  return JSON.parse(await readFile(path, 'utf8'));
}

async function writeJson(path, value, dryRun) {
  const text = `${JSON.stringify(value, null, 2)}\n`;
  if (!dryRun) await writeFile(path, text, 'utf8');
}

function profileSource({ siteId, profileId, name, shortName, mark, version, host, matches, description, outputSlug, searchPath }) {
  return `export default ${JSON.stringify({
    id: profileId,
    name,
    version,
    description,
    matches,
    grants: ['GM_addStyle', 'GM_getValue', 'GM_setValue', 'GM_deleteValue', 'GM_registerMenuCommand'],
    runAt: 'document-end',
    noFrames: true,
    css: 'src/core/styles.css',
    output: {
      userScript: `dist/${outputSlug}.user.js`,
      metaScript: `dist/${outputSlug}.meta.js`
    },
    client: {
      schemaVersion: PROFILE_SCHEMA_VERSION,
      id: profileId,
      name,
      shortName,
      mark,
      storagePrefix: profileId,
      home: '/',
      searchPath,
      capabilities: {
        ...DEFAULT_CAPABILITIES,
        loadMore: true,
        pagination: true,
        durationBadges: true
      },
      layout: {
        ...DEFAULT_LAYOUT,
        desktopMaxWidth: 1320,
        articleMaxWidth: 980,
        hideSidebars: true,
        hideOriginalChrome: true,
        normalizeCards: true,
        hideFeedRemainder: true,
        showFeedLoadMore: true,
        minCardTextLength: 4
      },
      performance: {
        ...DEFAULT_PERFORMANCE,
        lowResource: true,
        initialFeedCards: 48,
        feedBatchSize: 48,
        feedRootSelector: 'main'
      },
      articleHints: [
        'body.single, body.single-post, body.video-page',
        'article',
        '.entry-content,.post-content,.article-content,.video-content',
        'path:^/(?!category/|tag/|page/|search/|feed/)[^/?#]+/?$'
      ],
      selectors: {
        page: {
          header: 'header,.site-header,#header',
          nav: 'nav,.site-nav,.menu,#menu',
          main: 'main,#content,.site-main,.content',
          sidebar: 'aside,.sidebar,#sidebar,.widget-area'
        },
        feed: {
          containers: ['main', '#content', '.site-main', 'body'],
          exclude: ".csm-source-hidden,[class*='advert'],[id*='advert'],[class*='ads'],[id*='ads'],iframe,script,style",
          items: ['article', '.post', '.post-item', '.card'],
          title: 'h1,h2,h3,.entry-title,.post-title,.title,a[title]',
          category: '.cat-links a,.post-categories a,.category a,.tag a',
          duration: '.duration,.time,.video-duration',
          pagination: '.pagination,.nav-links,.page-numbers,.wp-pagenavi',
          date: 'time,.date,.posted-on,.entry-date'
        },
        article: {
          root: 'article,.post,.entry-content,.post-content,main,#content',
          comments: '#comments,.comments-area,.commentlist,#respond'
        },
        ads: [
          "[class*=\'advert\']",
          "[id*=\'advert\']",
          "[class*=\'ads\']",
          "[id*=\'ads\']",
          'ins.adsbygoogle',
          "iframe[src*=\'doubleclick\']",
          "iframe[src*=\'googlesyndication\']",
          "script[src*=\'googlesyndication\']"
        ]
      },
      nav: {
        primary: [
          { id: 'home', label: 'Home', href: '/' },
          { id: 'latest', label: 'Latest', href: '/' },
          { id: 'search', label: 'Search', href: searchPath }
        ],
        bottom: [
          { id: 'home', label: 'Home', action: 'go-home' },
          { id: 'browse', label: 'Browse', action: 'open-browse' },
          { id: 'search', label: 'Search', action: 'open-search' },
          { id: 'saved', label: 'Saved', action: 'filter-saved' },
          { id: 'more', label: 'More', action: 'open-settings' }
        ],
        articleBottom: [
          { id: 'back', label: 'Back', action: 'history-back' },
          { id: 'save', label: 'Save', action: 'toggle-save' },
          { id: 'comments', label: 'Comments', action: 'jump-comments' },
          { id: 'top', label: 'Top', action: 'scroll-top' },
          { id: 'more', label: 'More', action: 'open-settings' }
        ]
      }
    }
  }, null, 2)};\n`;
}

function placeholderHome(name, host) {
  return `<!doctype html>\n<html lang="en">\n<head><meta charset="utf-8"><title>${name} fixture home</title></head>\n<body>\n<header><nav><a href="/">Home</a></nav></header>\n<main>\n  <article class="post"><a href="https://${host}/sample-one/"><img src="https://${host}/sample-one.jpg" alt="Sample one"><h2>${name} sample story one</h2></a><time>2026-01-01</time></article>\n  <article class="post"><a href="https://${host}/sample-two/"><img src="https://${host}/sample-two.jpg" alt="Sample two"><h2>${name} sample story two</h2></a><time>2026-01-02</time></article>\n  <article class="post"><a href="https://${host}/sample-three/"><img src="https://${host}/sample-three.jpg" alt="Sample three"><h2>${name} sample story three</h2></a><time>2026-01-03</time></article>\n  <nav class="pagination"><a href="/page/2/">Next</a></nav>\n</main>\n</body>\n</html>\n`;
}

function placeholderPost(name, host) {
  return `<!doctype html>\n<html lang="en">\n<head><meta charset="utf-8"><title>${name} fixture post</title></head>\n<body>\n<header><nav><a href="/">Home</a></nav></header>\n<main>\n  <article class="post"><h1>${name} sample post</h1><img src="https://${host}/sample-post.jpg" alt="Sample post"><div class="entry-content"><p>Fixture article content for ${name}.</p></div></article>\n  <section id="comments"><h2>Comments</h2></section>\n</main>\n</body>\n</html>\n`;
}

function jsString(value) {
  return JSON.stringify(value);
}

function contractTestSource({ siteId, profilePath, homePath, postPath, outputPath, name, host }) {
  const lines = [
    "import test from 'node:test';",
    "import assert from 'node:assert/strict';",
    "import { readFile } from 'node:fs/promises';",
    '',
    "const root = new URL('../', import.meta.url);",
    `const profileText = await readFile(new URL(${jsString(profilePath)}, root), 'utf8');`,
    `const home = await readFile(new URL(${jsString(homePath)}, root), 'utf8');`,
    `const post = await readFile(new URL(${jsString(postPath)}, root), 'utf8');`,
    `const built = await readFile(new URL(${jsString(outputPath)}, root), 'utf8').catch(() => '');`,
    '',
    `test(${jsString(`${name} onboarding fixture keeps basic feed contracts`)}, () => {`,
    '  assert.match(home, /<article/i);',
    '  assert.match(home, /<img/i);',
    '  assert.match(home, /pagination/i);',
    '});',
    '',
    `test(${jsString(`${name} onboarding fixture keeps basic post contracts`)}, () => {`,
    '  assert.match(post, /<article/i);',
    '  assert.match(post, /<h1/i);',
    '});',
    '',
    `test(${jsString(`${name} profile targets shared content-site runtime`)}, () => {`,
    "  const combined = `${profileText}\n${built}`;",
    '  for (const marker of [',
    `    ${jsString(`${siteId}-modern-ui`)},`,
    `    ${jsString(`${host}/*`)},`,
    "    'installContentSiteModernizer',",
    "    'csm-bottomnav'",
    '  ]) assert.ok(combined.includes(marker), `missing ${marker}`);',
    '});',
    ''
  ];
  return `${lines.join('\n')}\n`;
}

async function copyOrWrite(path, source, fallback, dryRun, force) {
  if (await exists(path) && !force) throw new Error(`${path} already exists; pass --force to overwrite`);
  if (dryRun) return;
  await mkdir(dirname(path), { recursive: true });
  if (source) await copyFile(resolve(source), path);
  else await writeFile(path, fallback, 'utf8');
}

async function updateScriptsConfig(builderRoot, siteId, dryRun) {
  const path = join(builderRoot, 'scripts.config.mjs');
  const before = await readFile(path, 'utf8');
  const varName = camel(siteId);
  if (before.includes(`src/profiles/${siteId}.mjs`)) return false;
  let after = `import ${varName} from './src/profiles/${siteId}.mjs';\n${before}`;
  after = after.replace(/scripts:\s*\[([^\]]*)\]/m, (match, list) => `scripts: [${list.trim()}${list.trim() ? ', ' : ''}${varName}]`);
  if (!dryRun) await writeFile(path, after, 'utf8');
  return true;
}

async function updateSmokeConfig(builderRoot, repoRel, item, dryRun) {
  const path = join(builderRoot, 'smoke.config.json');
  const config = await readJson(path);
  if (config.sites.some((site) => site.id === item.siteId)) return false;
  config.sites.push({
    id: item.siteId,
    name: item.name,
    script: `${repoRel}/dist/${item.outputSlug}.user.js`,
    drawer: { openSelector: '[data-action="open-browse"]' },
    fixtures: [
      { id: 'home', path: `${repoRel}/test/fixtures/${item.siteId}-home.html`, simulatePageTual: true, expect: { minCards: 3, selectors: ['.csm-topbar', '.csm-feed-grid'] } },
      { id: 'post', path: `${repoRel}/test/fixtures/${item.siteId}-post.html`, assertDrawer: false, expect: { minCards: 0, selectors: ['.csm-topbar', '.csm-article'] } }
    ],
    pagetual: {
      fixture: `${repoRel}/test/fixtures/${item.siteId}-home.html`,
      sourceSelector: 'article, .post, .post-item, .card',
      appendTargetSelector: 'main, #content, .site-main, body',
      expectMinAddedCards: 1,
      maxDuplicateCardGrowth: 0
    },
    live: {
      url: `https://${item.host}/`,
      allowConsoleErrors: true,
      assertDrawer: true,
      assertInteractions: false,
      expect: { minCards: 1 }
    }
  });
  await writeJson(path, config, dryRun);
  return true;
}

async function updateRepoManifest(repoRoot, item, dryRun) {
  const path = join(repoRoot, 'repo-manifest.json');
  const manifest = await readJson(path);
  const project = manifest.projects.find((entry) => entry.path === 'userscripts/builders/content-site-modernizer');
  if (!project) throw new Error('repo-manifest missing content-site-modernizer project');
  for (const rel of [`dist/${item.outputSlug}.user.js`, `dist/${item.outputSlug}.meta.js`]) {
    if (!project.install_artifacts.includes(rel)) project.install_artifacts.push(rel);
  }
  project.versions[item.outputSlug] = item.version;
  project.onboarding_tools = project.onboarding_tools || {};
  project.onboarding_tools.new_site = 'npm run content-sites:new';
  project.onboarding_tools.fixture_refresh = 'npm run content-sites:fixtures:plan';
  await writeJson(path, manifest, dryRun);
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const builder = args.builder || DEFAULT_BUILDER;
  if (builder !== DEFAULT_BUILDER) throw new Error(`unsupported builder: ${builder}`);
  const siteId = kebab(args.id, '--id');
  const host = args.host?.replace(/^https?:\/\//, '').replace(/^www\./, '').replace(/\/$/, '');
  const matches = hostMatches(host || '');
  const profileId = `${siteId}-modern-ui`;
  const outputSlug = profileId;
  const name = args.name || `${siteId.split('-').map((part) => part[0].toUpperCase() + part.slice(1)).join(' ')} Modern UI`;
  const shortName = args.shortName || name.replace(/ Modern UI$/, '').split(/\s+/).slice(0, 2).join(' ');
  const mark = (args.mark || shortName.replace(/[^A-Za-z0-9]/g, '').slice(0, 2).toUpperCase() || 'CS').slice(0, 4);
  const description = args.description || `Modern dark mobile-first interface for ${host}.`;
  const searchPath = args.searchPath || '/?s=';
  const builderRoot = join(REPO_ROOT, 'userscripts/builders/content-site-modernizer');
  const builderRel = 'userscripts/builders/content-site-modernizer';
  const item = { siteId, profileId, outputSlug, name, shortName, mark, version: args.version, host, matches, description, searchPath };
  const files = {
    profile: join(builderRoot, 'src/profiles', `${siteId}.mjs`),
    home: join(builderRoot, 'test/fixtures', `${siteId}-home.html`),
    post: join(builderRoot, 'test/fixtures', `${siteId}-post.html`),
    test: join(builderRoot, 'test', `${siteId}-contract.test.mjs`)
  };
  const plan = [
    files.profile,
    files.home,
    files.post,
    files.test,
    join(builderRoot, 'scripts.config.mjs'),
    join(builderRoot, 'smoke.config.json'),
    join(REPO_ROOT, 'repo-manifest.json')
  ].map((path) => path.replace(`${REPO_ROOT}/`, ''));

  if (!args.dryRun) {
    await copyOrWrite(files.profile, null, profileSource(item), false, args.force);
    await copyOrWrite(files.home, args.homeFixture, placeholderHome(name, host), false, args.force);
    await copyOrWrite(files.post, args.postFixture, placeholderPost(name, host), false, args.force);
    await copyOrWrite(files.test, null, contractTestSource({ siteId, profilePath: `src/profiles/${siteId}.mjs`, homePath: `test/fixtures/${siteId}-home.html`, postPath: `test/fixtures/${siteId}-post.html`, outputPath: `dist/${outputSlug}.user.js`, name, host }), false, args.force);
  }
  await updateScriptsConfig(builderRoot, siteId, args.dryRun);
  await updateSmokeConfig(builderRoot, builderRel, item, args.dryRun);
  await updateRepoManifest(REPO_ROOT, item, args.dryRun);

  const result = { ok: true, dryRun: args.dryRun, site: item, files: plan };
  if (args.json) console.log(JSON.stringify(result, null, 2));
  else {
    console.log(`${args.dryRun ? 'Would add' : 'Added'} ${name} (${siteId}) to ${builder}`);
    for (const path of plan) console.log(`- ${path}`);
    if (!args.dryRun) console.log('Next: run npm run build:content-sites && npm --prefix userscripts/builders/content-site-modernizer run test');
  }
}

main().catch((error) => {
  console.error(`content-sites:new failed: ${error.message}`);
  process.exit(1);
});
