MRM.storage = (() => {
  const key = `${MRM.config.storagePrefix}:preferences`;
  const readKey = `${MRM.config.storagePrefix}:read-posts`;
  const progressKey = `${MRM.config.storagePrefix}:reader-progress`;
  const facetCacheKey = `${MRM.config.storagePrefix}:facet-directory`;
  const readerCachePrefix = `${MRM.config.storagePrefix}:reader-pages:`;
  const defaults = Object.freeze({
    uiEnabled: true,
    dock: "right",
    accent: "#9b7cff",
    border: { header: false, cards: true, pagination: false, reader: false, panel: true, chips: true },
    grid: { density: "balanced", desktop: 5, tablet: 4, mobile: 2, gap: 18, ratio: 0.714, coverFit: "contain" },
    filters: { query: "", hideRead: false, onlyEnglish: false, sort: "default", include: {}, exclude: { tag: ["cuntboy", "ai", "shota"] } },
    reader: { view: "strip", width: "comfort", fit: "width", direction: "ltr", thumbnails: true, autoHideToolbar: true },
  });
  const clone = (value) => JSON.parse(JSON.stringify(value));
  const merge = (base, incoming) => {
    if (!incoming || typeof incoming !== "object" || Array.isArray(incoming)) return base;
    const out = { ...base };
    for (const [name, value] of Object.entries(incoming)) {
      if (value && typeof value === "object" && !Array.isArray(value) && base[name] && typeof base[name] === "object") out[name] = merge(base[name], value);
      else out[name] = value;
    }
    return out;
  };
  const parse = (raw, fallback) => {
    try { return raw ? JSON.parse(raw) : fallback; } catch { return fallback; }
  };
  let preferences = merge(clone(defaults), parse(localStorage.getItem(key), {}));
  let readPosts = parse(localStorage.getItem(readKey), {});
  let readerProgress = parse(localStorage.getItem(progressKey), {});
  const persist = () => localStorage.setItem(key, JSON.stringify(preferences));
  const persistRead = () => localStorage.setItem(readKey, JSON.stringify(readPosts));
  const persistProgress = () => localStorage.setItem(progressKey, JSON.stringify(readerProgress));
  const trimEntries = (records, limit) => Object.fromEntries(Object.entries(records)
    .sort((a, b) => (b[1].updatedAt || b[1].readAt || 0) - (a[1].updatedAt || a[1].readAt || 0))
    .slice(0, limit));
  const update = (patch) => {
    preferences = merge(preferences, patch);
    persist();
    MRM.events.dispatchEvent(new CustomEvent("preferences", { detail: preferences }));
    return preferences;
  };
  const replaceFilters = (filters) => {
    preferences = { ...preferences, filters: clone(filters) };
    persist();
    MRM.events.dispatchEvent(new CustomEvent("preferences", { detail: preferences }));
    return preferences;
  };
  const markRead = (url, title = "") => {
    const normalized = MRM.util.canonicalUrl(url);
    if (!normalized) return;
    readPosts[normalized] = { title: MRM.util.text(title), readAt: Date.now() };
    readPosts = trimEntries(readPosts, 5000);
    persistRead();
    MRM.events.dispatchEvent(new CustomEvent("read-history", { detail: { url: normalized, read: true } }));
  };
  const unmarkRead = (url, options = {}) => {
    const normalized = MRM.util.canonicalUrl(url);
    if (!normalized) return;
    delete readPosts[normalized];
    if (options.clearProgress !== false) delete readerProgress[normalized];
    persistRead();
    persistProgress();
    MRM.events.dispatchEvent(new CustomEvent("read-history", { detail: { url: normalized, read: false } }));
    MRM.events.dispatchEvent(new CustomEvent("reader-progress", { detail: { url: normalized, progress: null } }));
  };
  const isRead = (url) => Boolean(readPosts[MRM.util.canonicalUrl(url)]);
  const getReaderProgress = (url) => readerProgress[MRM.util.canonicalUrl(url)] || null;
  const setReaderProgress = (url, title, pageIndex, pageCount) => {
    const normalized = MRM.util.canonicalUrl(url);
    const total = Math.max(1, Number(pageCount) || 1);
    const index = MRM.util.clamp(Number(pageIndex) || 0, 0, total - 1);
    if (!normalized) return null;
    const previous = readerProgress[normalized];
    const completed = index >= total - 1;
    if (previous?.pageIndex === index && previous?.pageCount === total && previous?.completed === completed) return previous;
    const progress = {
      title: MRM.util.text(title),
      pageIndex: index,
      pageCount: total,
      percent: Math.round(((index + 1) / total) * 100),
      completed,
      updatedAt: Date.now(),
    };
    readerProgress[normalized] = progress;
    readerProgress = trimEntries(readerProgress, 2000);
    persistProgress();
    if (completed && !isRead(normalized)) markRead(normalized, title);
    MRM.events.dispatchEvent(new CustomEvent("reader-progress", { detail: { url: normalized, progress } }));
    return progress;
  };
  const clearRead = () => {
    readPosts = {};
    readerProgress = {};
    localStorage.removeItem(readKey);
    localStorage.removeItem(progressKey);
    MRM.events.dispatchEvent(new Event("read-history"));
    MRM.events.dispatchEvent(new Event("reader-progress"));
  };
  const getFacetCache = () => {
    const cached = parse(localStorage.getItem(facetCacheKey), null);
    if (!cached || Date.now() - cached.savedAt > 14 * 24 * 60 * 60 * 1000) return null;
    return cached.value;
  };
  const setFacetCache = (value) => localStorage.setItem(facetCacheKey, JSON.stringify({ savedAt: Date.now(), value }));
  const readerCacheKey = (url) => `${readerCachePrefix}${encodeURIComponent(MRM.util.canonicalUrl(url))}`;
  const getReaderCache = (url) => {
    try {
      const cached = parse(sessionStorage.getItem(readerCacheKey(url)), null);
      if (!cached || Date.now() - cached.savedAt > 30 * 60 * 1000 || !Array.isArray(cached.pages) || !cached.pages.length) return null;
      return cached;
    } catch { return null; }
  };
  const setReaderCache = (url, title, pages) => {
    try {
      const compactPages = pages.slice(0, 1000).map(({ src, alt, width, height }) => ({ src, alt, width, height }));
      sessionStorage.setItem(readerCacheKey(url), JSON.stringify({ savedAt: Date.now(), title: MRM.util.text(title), pages: compactPages }));
    } catch { /* Session storage can be unavailable in hardened contexts. */ }
  };
  return {
    defaults,
    get preferences() { return preferences; },
    get readPosts() { return readPosts; },
    get readerProgress() { return readerProgress; },
    update,
    replaceFilters,
    markRead,
    unmarkRead,
    isRead,
    getReaderProgress,
    setReaderProgress,
    clearRead,
    getFacetCache,
    setFacetCache,
    getReaderCache,
    setReaderCache,
  };
})();
