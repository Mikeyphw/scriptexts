export const PROFILE_SCHEMA_VERSION = 1;

export const DEFAULT_CAPABILITIES = Object.freeze({
  feed: true,
  article: true,
  drawer: true,
  bottomNav: true,
  savedState: true,
  viewedState: true,
  searchDrawer: true,
  loadMore: false,
  pagination: false,
  pageTual: true,
  sectionedFeed: false,
  durationBadges: false,
  accessibilityChrome: true,
  visualRegression: true
});

export const DEFAULT_LAYOUT = Object.freeze({
  desktopMaxWidth: 1360,
  articleMaxWidth: 790,
  cardImageRatio: '16 / 9',
  hideSidebars: false,
  hideOriginalChrome: false,
  rebuildFeedGrid: true,
  normalizeCards: false,
  requireCardImage: false,
  hideFeedRemainder: false,
  showFeedLoadMore: false,
  preserveFeedSections: false,
  maxPaginationLinks: 18,
  hideArticleRemainder: false,
  imageFit: 'cover',
  minCardTextLength: 18
});

export const DEFAULT_PERFORMANCE = Object.freeze({
  lowResource: false,
  disableMutationObserver: false,
  mutationDebounceMs: 250,
  maxFeedCards: 0,
  initialFeedCards: 0,
  feedBatchSize: 12,
  feedRootSelector: ''
});

export const DEFAULT_SELECTORS = Object.freeze({
  page: Object.freeze({
    header: 'header,#masthead,.site-header,.header,.top-bar,.topbar',
    nav: 'nav,.main-navigation,.site-navigation,.menu,.navbar',
    main: 'main,#main,.site-main,#content,.content,.main-content',
    sidebar: 'aside,.sidebar,#secondary,.widget-area,[class*="sidebar"]'
  }),
  feed: Object.freeze({
    containers: Object.freeze(['main', '#content', '.site-main', 'body']),
    exclude: '.csm-source-hidden',
    items: Object.freeze(['article']),
    title: 'h1,h2,h3,.entry-title,.post-title,.title,a[title]',
    summary: '',
    category: '',
    duration: '',
    pagination: '.pagination,.nav-links,.page-numbers,.wp-pagenavi',
    date: 'time,.date,.posted-on,.entry-date'
  }),
  article: Object.freeze({
    root: 'article,main,#content,.entry-content,.post-content',
    comments: '#comments,.comments-area,#respond'
  }),
  ads: Object.freeze([])
});

export const ALLOWED_GRANTS = Object.freeze([
  'GM_addStyle',
  'GM_getValue',
  'GM_setValue',
  'GM_deleteValue',
  'GM_registerMenuCommand'
]);

export const NAV_ACTIONS = Object.freeze([
  'go-home',
  'open-browse',
  'open-search',
  'filter-saved',
  'open-settings',
  'history-back',
  'toggle-save',
  'jump-comments',
  'scroll-top'
]);

const SEMVER = /^\d+\.\d+\.\d+(?:[-+][0-9A-Za-z.-]+)?$/;
const KEBAB = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function isPlainObject(value) {
  return value && typeof value === 'object' && !Array.isArray(value);
}

function compactSelector(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

function selectorArray(value) {
  if (Array.isArray(value)) return value.filter(compactSelector);
  if (compactSelector(value)) return [value];
  return [];
}

function mergeSelectors(selectors = {}) {
  return {
    page: { ...DEFAULT_SELECTORS.page, ...(selectors.page || {}) },
    feed: { ...DEFAULT_SELECTORS.feed, ...(selectors.feed || {}) },
    article: { ...DEFAULT_SELECTORS.article, ...(selectors.article || {}) },
    ads: Array.isArray(selectors.ads) ? selectors.ads : []
  };
}

export function deriveCapabilities(client = {}) {
  const feed = client.selectors?.feed || {};
  const layout = client.layout || {};
  return {
    ...DEFAULT_CAPABILITIES,
    loadMore: layout.showFeedLoadMore === true,
    pagination: compactSelector(feed.pagination),
    sectionedFeed: layout.preserveFeedSections === true || selectorArray(feed.sections).length > 0,
    durationBadges: compactSelector(feed.duration)
  };
}

export function normalizeProfile(profile) {
  const next = clone(profile);
  next.grants = next.grants || [...ALLOWED_GRANTS];
  next.runAt = next.runAt || 'document-end';
  next.noFrames = next.noFrames !== false;
  next.css = next.css || 'src/core/styles.css';
  next.client = next.client || {};
  next.client.schemaVersion = next.client.schemaVersion || PROFILE_SCHEMA_VERSION;
  next.client.layout = { ...DEFAULT_LAYOUT, ...(next.client.layout || {}) };
  next.client.performance = { ...DEFAULT_PERFORMANCE, ...(next.client.performance || {}) };
  next.client.selectors = mergeSelectors(next.client.selectors || {});
  next.client.capabilities = {
    ...deriveCapabilities(next.client),
    ...(next.client.capabilities || {})
  };
  return next;
}

function fail(errors, message) {
  errors.push(message);
}

function requireString(errors, value, path) {
  if (typeof value !== 'string' || !value.trim()) fail(errors, `${path} must be a non-empty string`);
}

function requireBoolean(errors, value, path) {
  if (typeof value !== 'boolean') fail(errors, `${path} must be a boolean`);
}

function validateNav(errors, items, path) {
  if (!Array.isArray(items)) return fail(errors, `${path} must be an array`);
  const ids = new Set();
  for (const [index, item] of items.entries()) {
    const itemPath = `${path}[${index}]`;
    if (!isPlainObject(item)) {
      fail(errors, `${itemPath} must be an object`);
      continue;
    }
    requireString(errors, item.id, `${itemPath}.id`);
    requireString(errors, item.label, `${itemPath}.label`);
    if (ids.has(item.id)) fail(errors, `${itemPath}.id duplicates ${item.id}`);
    ids.add(item.id);
    if (item.href !== undefined) requireString(errors, item.href, `${itemPath}.href`);
    if (item.action !== undefined && !NAV_ACTIONS.includes(item.action)) fail(errors, `${itemPath}.action ${JSON.stringify(item.action)} is not allowed`);
    if (item.href === undefined && item.action === undefined) fail(errors, `${itemPath} must define href or action`);
  }
}

function validateSelectors(errors, selectors, path) {
  for (const section of ['page', 'feed', 'article']) {
    if (!isPlainObject(selectors[section])) fail(errors, `${path}.${section} must be an object`);
  }
  if (!Array.isArray(selectors.ads)) fail(errors, `${path}.ads must be an array`);
  if (!selectorArray(selectors.feed.items).length) fail(errors, `${path}.feed.items must define at least one selector`);
  if (!selectorArray(selectors.feed.containers).length) fail(errors, `${path}.feed.containers must define at least one selector`);
  for (const key of ['title', 'pagination']) {
    if (!compactSelector(selectors.feed[key])) fail(errors, `${path}.feed.${key} must be a selector string`);
  }
}

function validateCapabilities(errors, capabilities, path) {
  for (const key of Object.keys(DEFAULT_CAPABILITIES)) {
    requireBoolean(errors, capabilities[key], `${path}.${key}`);
  }
}

export function validateProfile(profile, options = {}) {
  const errors = [];
  const normalized = normalizeProfile(profile);
  requireString(errors, normalized.id, 'profile.id');
  if (normalized.id && !KEBAB.test(normalized.id)) fail(errors, `profile.id must be kebab-case, got ${normalized.id}`);
  requireString(errors, normalized.name, 'profile.name');
  requireString(errors, normalized.version, 'profile.version');
  if (normalized.version && !SEMVER.test(normalized.version)) fail(errors, `profile.version must be semver-ish, got ${normalized.version}`);
  requireString(errors, normalized.description, 'profile.description');
  if (!Array.isArray(normalized.matches) || !normalized.matches.length) fail(errors, 'profile.matches must be a non-empty array');
  else for (const [index, match] of normalized.matches.entries()) {
    requireString(errors, match, `profile.matches[${index}]`);
    if (typeof match === 'string' && !/^https:\/\//.test(match)) fail(errors, `profile.matches[${index}] must use https://`);
  }
  if (!Array.isArray(normalized.grants)) fail(errors, 'profile.grants must be an array');
  else for (const grant of normalized.grants) if (!ALLOWED_GRANTS.includes(grant)) fail(errors, `profile.grants contains unsupported grant ${grant}`);
  if (!isPlainObject(normalized.output)) fail(errors, 'profile.output must be an object');
  else {
    requireString(errors, normalized.output.userScript, 'profile.output.userScript');
    requireString(errors, normalized.output.metaScript, 'profile.output.metaScript');
    if (normalized.output.userScript && !normalized.output.userScript.endsWith('.user.js')) fail(errors, 'profile.output.userScript must end with .user.js');
    if (normalized.output.metaScript && !normalized.output.metaScript.endsWith('.meta.js')) fail(errors, 'profile.output.metaScript must end with .meta.js');
  }
  const client = normalized.client;
  requireString(errors, client.id, 'profile.client.id');
  requireString(errors, client.name, 'profile.client.name');
  requireString(errors, client.shortName, 'profile.client.shortName');
  requireString(errors, client.mark, 'profile.client.mark');
  requireString(errors, client.storagePrefix, 'profile.client.storagePrefix');
  requireString(errors, client.home, 'profile.client.home');
  requireString(errors, client.searchPath, 'profile.client.searchPath');
  if (client.id !== normalized.id) fail(errors, `profile.client.id must match profile.id (${normalized.id})`);
  if (!Array.isArray(client.articleHints) || !client.articleHints.length) fail(errors, 'profile.client.articleHints must be a non-empty array');
  validateCapabilities(errors, client.capabilities, 'profile.client.capabilities');
  validateSelectors(errors, client.selectors, 'profile.client.selectors');
  if (!isPlainObject(client.nav)) fail(errors, 'profile.client.nav must be an object');
  else {
    validateNav(errors, client.nav.primary, 'profile.client.nav.primary');
    validateNav(errors, client.nav.bottom, 'profile.client.nav.bottom');
    validateNav(errors, client.nav.articleBottom, 'profile.client.nav.articleBottom');
  }
  if (client.capabilities.sectionedFeed && !selectorArray(client.selectors.feed.sections).length) {
    fail(errors, 'sectionedFeed capability requires selectors.feed.sections');
  }
  if (client.capabilities.durationBadges && !compactSelector(client.selectors.feed.duration)) {
    fail(errors, 'durationBadges capability requires selectors.feed.duration');
  }
  if (options.strictOutputs && normalized.output.userScript.replace(/^dist\//, '').replace(/\.user\.js$/, '') !== normalized.id) {
    fail(errors, 'profile.output.userScript should use the profile id as output slug');
  }
  if (errors.length) {
    const error = new Error(`invalid content-site profile ${profile?.id || '<unknown>'}:\n- ${errors.join('\n- ')}`);
    error.errors = errors;
    throw error;
  }
  return normalized;
}

export function validateBuilderConfig(builder) {
  const errors = [];
  if (!builder || builder.id !== 'content-site-modernizer') errors.push('builder.id must be content-site-modernizer');
  if (!Array.isArray(builder?.scripts) || !builder.scripts.length) errors.push('builder.scripts must be a non-empty array');
  const ids = new Set();
  const outputs = new Set();
  const normalized = [];
  for (const profile of builder?.scripts || []) {
    try {
      const item = validateProfile(profile, { strictOutputs: true });
      normalized.push(item);
      if (ids.has(item.id)) errors.push(`duplicate profile id ${item.id}`);
      ids.add(item.id);
      for (const output of [item.output.userScript, item.output.metaScript]) {
        if (outputs.has(output)) errors.push(`duplicate output ${output}`);
        outputs.add(output);
      }
    } catch (error) {
      errors.push(error.message);
    }
  }
  if (errors.length) throw new Error(`invalid content-site builder config:\n- ${errors.join('\n- ')}`);
  return normalized;
}
