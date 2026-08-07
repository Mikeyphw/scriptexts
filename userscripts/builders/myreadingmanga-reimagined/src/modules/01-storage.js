MRM.storage = (() => {
  const key = `${MRM.config.storagePrefix}:preferences`;
  const readKey = `${MRM.config.storagePrefix}:read-posts`;
  const progressKey = `${MRM.config.storagePrefix}:reader-progress`;
  const savedKey = `${MRM.config.storagePrefix}:saved-posts`;
  const facetCacheKey = `${MRM.config.storagePrefix}:facet-directory`;
  const readerCachePrefix = `${MRM.config.storagePrefix}:reader-pages:`;
  const defaults = Object.freeze({
    uiEnabled: true,
    dock: "right",
    accent: "#9b7cff",
    border: { header: false, cards: true, pagination: false, reader: false, panel: true, chips: true },
    grid: { density: "balanced", desktop: 5, tablet: 4, mobile: 2, gap: 18, ratio: 0.714, coverFit: "contain" },
    filters: { query: "", hideRead: false, onlyEnglish: false, onlySaved: false, sort: "default", include: {}, exclude: { tag: ["cuntboy", "ai", "shota"] } },
    reader: { view: "strip", width: "comfort", fit: "width", direction: "ltr", thumbnails: true, autoHideToolbar: true },
    readerProfiles: { desktop: {}, mobile: {} },
    savedViews: [],
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
  let savedPosts = parse(localStorage.getItem(savedKey), {});
  const persist = () => localStorage.setItem(key, JSON.stringify(preferences));
  const persistRead = () => localStorage.setItem(readKey, JSON.stringify(readPosts));
  const persistProgress = () => localStorage.setItem(progressKey, JSON.stringify(readerProgress));
  const persistSaved = () => localStorage.setItem(savedKey, JSON.stringify(savedPosts));
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
  const isSaved = (url) => Boolean(savedPosts[MRM.util.canonicalUrl(url)]);
  const savePost = (url, title = "", image = "") => {
    const normalized = MRM.util.canonicalUrl(url);
    if (!normalized) return null;
    savedPosts[normalized] = { title: MRM.util.text(title), image: String(image || ""), savedAt: Date.now(), updatedAt: Date.now() };
    savedPosts = trimEntries(savedPosts, 2000);
    persistSaved();
    MRM.events.dispatchEvent(new CustomEvent("saved-posts", { detail: { url: normalized, saved: true } }));
    return savedPosts[normalized];
  };
  const unsavePost = (url) => {
    const normalized = MRM.util.canonicalUrl(url);
    if (!normalized || !savedPosts[normalized]) return;
    delete savedPosts[normalized];
    persistSaved();
    MRM.events.dispatchEvent(new CustomEvent("saved-posts", { detail: { url: normalized, saved: false } }));
  };
  const toggleSaved = (url, title = "", image = "") => isSaved(url) ? (unsavePost(url), false) : Boolean(savePost(url, title, image));
  const readerDevice = () => matchMedia("(max-width: 760px)").matches ? "mobile" : "desktop";
  const readerPreferences = () => ({ ...preferences.reader, ...(preferences.readerProfiles?.[readerDevice()] || {}) });
  const updateReaderPreferences = (patch) => {
    const device = readerDevice();
    const profiles = preferences.readerProfiles || { desktop: {}, mobile: {} };
    const nextProfile = { ...(profiles[device] || {}), ...patch };
    preferences = { ...preferences, readerProfiles: { ...profiles, [device]: nextProfile } };
    persist();
    MRM.events.dispatchEvent(new CustomEvent("preferences", { detail: preferences }));
    return readerPreferences();
  };
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
  const saveView = (name, filters = preferences.filters) => {
    const cleanName = MRM.util.text(name).slice(0, 48);
    if (!cleanName) return null;
    const view = { id: `view-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, name: cleanName, filters: clone(filters) };
    preferences = { ...preferences, savedViews: [...(preferences.savedViews || []).filter((item) => item.name !== cleanName), view].slice(-12) };
    persist();
    MRM.events.dispatchEvent(new CustomEvent("preferences", { detail: preferences }));
    return view;
  };
  const deleteView = (id) => {
    preferences = { ...preferences, savedViews: (preferences.savedViews || []).filter((item) => item.id !== id) };
    persist();
    MRM.events.dispatchEvent(new CustomEvent("preferences", { detail: preferences }));
  };
  const applyView = (view) => view?.filters && replaceFilters(clone(view.filters));
  const clearRead = () => {
    readPosts = {};
    readerProgress = {};
    localStorage.removeItem(readKey);
    localStorage.removeItem(progressKey);
    MRM.events.dispatchEvent(new Event("read-history"));
    MRM.events.dispatchEvent(new Event("reader-progress"));
  };
  const clearSaved = () => {
    savedPosts = {};
    localStorage.removeItem(savedKey);
    MRM.events.dispatchEvent(new Event("saved-posts"));
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
    get savedPosts() { return savedPosts; },
    update,
    replaceFilters,
    markRead,
    unmarkRead,
    isRead,
    isSaved,
    savePost,
    unsavePost,
    toggleSaved,
    readerDevice,
    readerPreferences,
    updateReaderPreferences,
    getReaderProgress,
    setReaderProgress,
    saveView,
    deleteView,
    applyView,
    clearRead,
    clearSaved,
    getFacetCache,
    setFacetCache,
    getReaderCache,
    setReaderCache,
  };
})();
