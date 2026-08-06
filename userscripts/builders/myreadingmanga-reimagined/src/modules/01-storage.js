MRM.storage = (() => {
  const key = `${MRM.config.storagePrefix}:preferences`;
  const readKey = `${MRM.config.storagePrefix}:read-posts`;
  const facetCacheKey = `${MRM.config.storagePrefix}:facet-directory`;
  const readerCachePrefix = `${MRM.config.storagePrefix}:reader-pages:`;
  const defaults = Object.freeze({
    uiEnabled: true,
    dock: "right",
    accent: "#9b7cff",
    border: { header: false, cards: true, pagination: false, reader: false, panel: true, chips: true },
    grid: { desktop: 6, tablet: 4, mobile: 2, gap: 16, ratio: 0.714 },
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
  const persist = () => localStorage.setItem(key, JSON.stringify(preferences));
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
    const entries = Object.entries(readPosts).sort((a, b) => b[1].readAt - a[1].readAt).slice(0, 5000);
    readPosts = Object.fromEntries(entries);
    localStorage.setItem(readKey, JSON.stringify(readPosts));
    MRM.events.dispatchEvent(new CustomEvent("read-history", { detail: { url: normalized } }));
  };
  const isRead = (url) => Boolean(readPosts[MRM.util.canonicalUrl(url)]);
  const clearRead = () => {
    readPosts = {};
    localStorage.removeItem(readKey);
    MRM.events.dispatchEvent(new Event("read-history"));
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
    update,
    replaceFilters,
    markRead,
    isRead,
    clearRead,
    getFacetCache,
    setFacetCache,
    getReaderCache,
    setReaderCache,
  };
})();
