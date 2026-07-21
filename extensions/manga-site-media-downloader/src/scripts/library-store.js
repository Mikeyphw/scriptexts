(function () {
  "use strict";

  const LIBRARY_KEY = "mrmLibraryItems";
  const LIBRARY_SETTINGS_KEY = "mrmLibrarySettings";
  const SYNC_SETTINGS_KEY = "mrmSyncSettings";
  const DOWNLOAD_QUEUE_KEY = "mrmDownloadQueue";
  const EXPORT_TYPE = "mrm-library-export";
  const SNAPSHOT_TYPE = "mrm-sync-snapshot";

  const DEFAULT_LIBRARY_SETTINGS = {
    defaultSort: "addedAtDesc",
    cardSize: "medium",
    showDownloaded: true,
    showCovers: true,
  };

  const DEFAULT_SYNC_SETTINGS = {
    enabled: false,
    provider: "none",
    mode: "manual",
    syncLibrary: true,
    syncQueue: true,
    syncSettings: false,
    autoSyncOnStartup: false,
    autoSyncOnLibraryChange: false,
    backupBeforePull: true,
    lastSyncAt: null,
    lastSyncStatus: "never",
    lastSyncError: null,
  };

  function now() {
    return Date.now();
  }

  function normalizeHost(host) {
    return String(host || "").replace(/^www\./i, "").toLowerCase();
  }

  function normalizeUrl(rawUrl) {
    try {
      const url = new URL(rawUrl);
      url.hash = "";
      const removeParams = ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content", "fbclid", "gclid", "mrm_metadata_job"];
      removeParams.forEach((key) => url.searchParams.delete(key));
      url.pathname = url.pathname.replace(/\/+$/, "/");
      return url.toString();
    } catch {
      return String(rawUrl || "").trim();
    }
  }

  function slugify(value, fallback = "item") {
    const slug = String(value || fallback)
      .normalize("NFKD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^A-Za-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .toLowerCase();
    return slug || fallback;
  }

  function createLibraryId(url, title = "") {
    try {
      const parsed = new URL(url);
      const host = normalizeHost(parsed.hostname).replace(/[^a-z0-9]+/g, "-");
      const path = parsed.pathname.replace(/\/+$/, "").split("/").filter(Boolean).pop();
      return `${host}-${slugify(path || title || parsed.hostname)}`.slice(0, 180);
    } catch {
      return `library-${slugify(title || url || String(now()))}`.slice(0, 180);
    }
  }

  function uniqueStrings(values) {
    return Array.from(new Set((Array.isArray(values) ? values : [])
      .map((value) => String(value || "").trim())
      .filter(Boolean)));
  }

  function normalizeLibraryItem(raw = {}) {
    const sourceUrl = raw.canonicalUrl || raw.url || "";
    const canonicalUrl = normalizeUrl(sourceUrl);
    let host = normalizeHost(raw.host || "");
    try {
      host = host || normalizeHost(new URL(canonicalUrl).hostname);
    } catch {}

    const displayTitle = String(raw.displayTitle || raw.title || "Untitled").replace(/\s+/g, " ").trim() || "Untitled";
    const title = String(raw.title || displayTitle).replace(/\s+/g, " ").trim() || displayTitle;
    const timestamp = Number(raw.addedAt || now());

    return {
      id: raw.id || createLibraryId(canonicalUrl, title),
      schemaVersion: Number(raw.schemaVersion || 1),
      url: normalizeUrl(raw.url || canonicalUrl),
      canonicalUrl,
      host,
      siteName: raw.siteName || host || "Unknown site",
      title,
      displayTitle,
      sortTitle: raw.sortTitle || slugify(title, "untitled").replace(/-/g, " "),
      coverUrl: raw.coverUrl || "",
      thumbnailUrl: raw.thumbnailUrl || raw.coverUrl || "",
      coverDataUrl: raw.coverDataUrl || "",
      languages: uniqueStrings(raw.languages || raw.langs),
      artists: uniqueStrings(raw.artists || (raw.artist ? [raw.artist] : [])),
      circles: uniqueStrings(raw.circles || (raw.circle ? [raw.circle] : [])),
      tags: uniqueStrings(raw.tags),
      categories: uniqueStrings(raw.categories),
      sourceType: raw.sourceType || "post",
      contentType: raw.contentType || "doujinshi",
      pageCount: Number.isFinite(Number(raw.pageCount)) ? Number(raw.pageCount) : null,
      favorite: !!raw.favorite,
      rating: Math.max(0, Math.min(5, Number(raw.rating || 0))),
      notes: String(raw.notes || ""),
      downloaded: !!raw.downloaded,
      downloadCount: Math.max(0, Number(raw.downloadCount || 0)),
      lastDownloadedAt: raw.lastDownloadedAt || null,
      queued: !!raw.queued,
      addedAt: timestamp,
      updatedAt: Number(raw.updatedAt || timestamp),
      lastCheckedAt: raw.lastCheckedAt || null,
      metadataConfidence: {
        title: raw.metadataConfidence?.title || "medium",
        cover: raw.metadataConfidence?.cover || (raw.coverUrl ? "medium" : "low"),
        languages: raw.metadataConfidence?.languages || (raw.languages?.length ? "medium" : "low"),
        artists: raw.metadataConfidence?.artists || (raw.artists?.length ? "low" : "low"),
        circles: raw.metadataConfidence?.circles || (raw.circles?.length ? "low" : "low"),
        tags: raw.metadataConfidence?.tags || (raw.tags?.length ? "medium" : "low"),
      },
    };
  }

  function mergeLibraryItem(local, incoming) {
    if (!local) return normalizeLibraryItem(incoming);
    const next = normalizeLibraryItem({ ...local, ...incoming });
    next.id = local.id || incoming.id;
    next.addedAt = local.addedAt || incoming.addedAt || now();
    next.favorite = !!(local.favorite || incoming.favorite);
    next.rating = Math.max(Number(local.rating || 0), Number(incoming.rating || 0));
    next.notes = local.notes || incoming.notes || "";
    next.downloaded = !!(local.downloaded || incoming.downloaded);
    next.downloadCount = Math.max(Number(local.downloadCount || 0), Number(incoming.downloadCount || 0));
    next.lastDownloadedAt = Math.max(Number(local.lastDownloadedAt || 0), Number(incoming.lastDownloadedAt || 0)) || null;
    next.queued = !!(local.queued || incoming.queued);
    next.languages = uniqueStrings([...(local.languages || []), ...(incoming.languages || [])]);
    next.artists = uniqueStrings([...(local.artists || []), ...(incoming.artists || [])]);
    next.circles = uniqueStrings([...(local.circles || []), ...(incoming.circles || [])]);
    next.tags = uniqueStrings([...(local.tags || []), ...(incoming.tags || [])]);
    next.categories = uniqueStrings([...(local.categories || []), ...(incoming.categories || [])]);
    next.coverUrl = incoming.coverUrl || local.coverUrl || "";
    next.thumbnailUrl = incoming.thumbnailUrl || incoming.coverUrl || local.thumbnailUrl || local.coverUrl || "";
    next.coverDataUrl = incoming.coverDataUrl || local.coverDataUrl || "";
    next.updatedAt = Math.max(Number(local.updatedAt || 0), Number(incoming.updatedAt || 0), now());
    return next;
  }

  async function getLibraryItems() {
    const result = await browser.storage.local.get([LIBRARY_KEY]);
    return Array.isArray(result[LIBRARY_KEY]) ? result[LIBRARY_KEY].map(normalizeLibraryItem) : [];
  }

  async function setLibraryItems(items) {
    await browser.storage.local.set({ [LIBRARY_KEY]: (Array.isArray(items) ? items : []).map(normalizeLibraryItem) });
  }

  async function saveLibraryItem(item) {
    const normalized = normalizeLibraryItem(item);
    const items = await getLibraryItems();
    const key = normalizeUrl(normalized.canonicalUrl || normalized.url);
    const index = items.findIndex((entry) => entry.id === normalized.id || normalizeUrl(entry.canonicalUrl || entry.url) === key);
    const existed = index >= 0;
    const saved = existed ? mergeLibraryItem(items[index], normalized) : normalized;
    if (existed) items[index] = saved;
    else items.unshift(saved);
    await setLibraryItems(items);
    return { item: saved, existed, count: items.length };
  }

  async function removeLibraryItem(id) {
    const items = await getLibraryItems();
    await setLibraryItems(items.filter((item) => item.id !== id));
  }

  async function updateLibraryItem(id, patch) {
    const items = await getLibraryItems();
    const index = items.findIndex((item) => item.id === id);
    if (index < 0) return null;
    items[index] = mergeLibraryItem(items[index], { ...patch, id, updatedAt: now() });
    await setLibraryItems(items);
    return items[index];
  }

  async function findLibraryItemByUrl(url) {
    const normalized = normalizeUrl(url);
    const items = await getLibraryItems();
    return items.find((item) => normalizeUrl(item.canonicalUrl || item.url) === normalized || normalizeUrl(item.url) === normalized) || null;
  }

  async function markDownloadedByUrl(url, patch = {}) {
    const existing = await findLibraryItemByUrl(url);
    if (!existing) return null;
    return updateLibraryItem(existing.id, {
      downloaded: true,
      downloadCount: Number(existing.downloadCount || 0) + 1,
      lastDownloadedAt: now(),
      pageCount: patch.pageCount || existing.pageCount || null,
      ...patch,
    });
  }

  function parseImportPayload(payload) {
    const rawItems = Array.isArray(payload)
      ? payload
      : Array.isArray(payload?.libraryItems)
        ? payload.libraryItems
        : Array.isArray(payload?.items)
          ? payload.items
          : Array.isArray(payload?.downloadQueue)
            ? payload.downloadQueue
            : null;
    if (!rawItems) throw new Error("JSON must be an array or contain libraryItems/items/downloadQueue.");
    return rawItems.map(normalizeLibraryItem).filter((item) => item.url || item.canonicalUrl);
  }

  async function importLibraryItems(payload) {
    const incoming = parseImportPayload(payload);
    const current = await getLibraryItems();
    const byKey = new Map();
    current.forEach((item) => byKey.set(normalizeUrl(item.canonicalUrl || item.url), item));
    for (const item of incoming) {
      const key = normalizeUrl(item.canonicalUrl || item.url);
      byKey.set(key, mergeLibraryItem(byKey.get(key), item));
    }
    const merged = Array.from(byKey.values()).sort((a, b) => Number(b.addedAt || 0) - Number(a.addedAt || 0));
    await setLibraryItems(merged);
    return { imported: incoming.length, total: merged.length };
  }

  async function getSettings() {
    const result = await browser.storage.local.get([LIBRARY_SETTINGS_KEY, SYNC_SETTINGS_KEY]);
    return {
      librarySettings: { ...DEFAULT_LIBRARY_SETTINGS, ...(result[LIBRARY_SETTINGS_KEY] || {}) },
      syncSettings: { ...DEFAULT_SYNC_SETTINGS, ...(result[SYNC_SETTINGS_KEY] || {}) },
    };
  }

  async function getDownloadQueue() {
    const result = await browser.storage.local.get([DOWNLOAD_QUEUE_KEY]);
    return Array.isArray(result[DOWNLOAD_QUEUE_KEY]) ? result[DOWNLOAD_QUEUE_KEY] : [];
  }

  async function createExportPayload() {
    const [libraryItems, downloadQueue, settings] = await Promise.all([
      getLibraryItems(),
      getDownloadQueue(),
      getSettings(),
    ]);
    return {
      type: EXPORT_TYPE,
      version: 1,
      exportedAt: now(),
      libraryItems,
      downloadQueue,
      settings,
    };
  }

  async function createSyncSnapshot(deviceId = "") {
    const payload = await createExportPayload();
    return {
      type: SNAPSHOT_TYPE,
      schemaVersion: 1,
      deviceId: deviceId || `device-${slugify(navigator.userAgent || "browser").slice(0, 40)}`,
      snapshotId: `${now()}-${Math.random().toString(36).slice(2, 10)}`,
      createdAt: now(),
      libraryItems: payload.libraryItems,
      downloadQueue: payload.downloadQueue,
      settings: payload.settings,
      deleted: { libraryItemIds: [], queueItemIds: [] },
    };
  }

  window.MRMLibraryStore = {
    LIBRARY_KEY,
    LIBRARY_SETTINGS_KEY,
    SYNC_SETTINGS_KEY,
    DOWNLOAD_QUEUE_KEY,
    DEFAULT_LIBRARY_SETTINGS,
    DEFAULT_SYNC_SETTINGS,
    normalizeUrl,
    normalizeHost,
    createLibraryId,
    normalizeLibraryItem,
    mergeLibraryItem,
    getLibraryItems,
    setLibraryItems,
    saveLibraryItem,
    removeLibraryItem,
    updateLibraryItem,
    findLibraryItemByUrl,
    markDownloadedByUrl,
    parseImportPayload,
    importLibraryItems,
    createExportPayload,
    createSyncSnapshot,
    getSettings,
  };
})();