(function () {
  "use strict";

  const LOG_KEY = "mrmDebugLog";
  const LOG_LIMIT = 250;
  const ACTIVE_JOBS_KEY = "mrmActiveJobs";


function isAndroidDevice() {
  return /Android/i.test(navigator.userAgent || "");
}

function getDefaultSettings() {
  return {
    useCookies: true,
    retryCount: 3,
    timeout: 30,
    debugMode: false,
    verboseDebugMode: false,
    cookieSource: "auto",
    cookies: [],
    autoRetrievedCookies: [],
    hideAIListing: true,
    hideDownloadedListing: false,
    hideQueuedListing: false,
    hideSavedListing: false,
    compactMobileUi: isAndroidDevice(),
    queueAutoStartEnabled: false,
    queuePauseAfterCurrentEnabled: false,
    queueConcurrency: 1,
    queueWifiOnly: false,
    androidBackgroundTabFix: isAndroidDevice(),
    stripPartSuffix: true,
    stripPageSuffix: false,
    includePageRangeInCbz: false,
    googleDriveClientId: "",
    googleDriveClientSecret: "",
    googleDriveOAuthMode: "desktop-pkce",
    googleDriveSyncEnabled: false,
    googleDriveAutoSyncOnStartup: false,
    googleDriveAutoSyncOnLibraryChange: false,
    googleDriveAutoSyncDelaySeconds: 60,
    androidSafeMode: isAndroidDevice(),
    queuePerHostConcurrency: isAndroidDevice() ? 1 : 2,
    settingsDensity: isAndroidDevice() ? "comfortable" : "comfortable",
    libraryCompactMode: isAndroidDevice(),
    pageToastEnabled: true,
    minimalQueueOverlay: true,
    minimalQueueOverlayActiveOnly: false,
  };
}


  function sanitizeFilename(filename, fallback = "download") {
    let value = String(filename || fallback).normalize("NFKD");
    value = value
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[\u0000-\u001f\u007f-\u009f]/g, "")
      .replace(/[^A-Za-z0-9._ -]+/g, "_")
      .replace(/\s+/g, " ")
      .replace(/_+/g, "_")
      .trim()
      .replace(/^\.+/g, "")
      .replace(/[. _-]+$/g, "");
    if (!value || /^(con|prn|aux|nul|com[1-9]|lpt[1-9])(?:\.|$)/i.test(value)) {
      value = fallback || "download";
    }
    value = String(value || fallback || "download").slice(0, 140).replace(/[. _-]+$/g, "");
    return value || "download";
  }


function normalizeLangTag(value) {
  const raw = String(value || "").trim().replace(/[\[\](){}]+/g, "");
  if (!raw) return "";
  const upper = raw.toUpperCase();
  if (["ENG", "EN", "ENGLISH"].includes(upper)) return "ENG";
  if (["JP", "JPN", "JAPANESE"].includes(upper)) return "JPN";
  if (["CH", "CHI", "CN", "ZH", "CHINESE"].includes(upper)) return "CHI";
  if (["KR", "KOR", "KOREAN"].includes(upper)) return "KOR";
  return upper.replace(/[^A-Z0-9+-]+/g, "").slice(0, 12);
}

function splitTitleMeta(rawTitle) {
  const source = String(rawTitle || "").replace(/\s+/g, " ").trim();
  const langs = [];
  let working = source;
  let matched = true;
  while (matched) {
    matched = false;
    const bracket = working.match(/^\s*[\[(]([A-Za-z][A-Za-z0-9 +\/-]{1,20})[\])]\s*/);
    if (bracket) {
      const tag = normalizeLangTag(bracket[1]);
      if (tag) langs.push(tag);
      working = working.slice(bracket[0].length).trim();
      matched = true;
      continue;
    }
    const prefix = working.match(/^\s*(ENG|ENGLISH|JPN|JAPANESE|JP|CHI|CHINESE|CN|ZH|KOR|KOREAN|KR)\s*[-_:]\s*/i);
    if (prefix) {
      const tag = normalizeLangTag(prefix[1]);
      if (tag) langs.push(tag);
      working = working.slice(prefix[0].length).trim();
      matched = true;
    }
  }
  const artistMatch = working.match(/^([^()\[\]{}]{2,120}?)\s*\(([^)]+)\)\s*[-–—:]\s*(.+)$/);
  if (artistMatch) {
    return {
      rawTitle: source,
      title: artistMatch[3].trim(),
      artist: `${artistMatch[1].trim()} (${artistMatch[2].trim()})`.trim(),
      langs: Array.from(new Set(langs)),
    };
  }
  const dashMatch = working.match(/^([^\-–—:]{2,120}?)\s*[-–—:]\s*(.+)$/);
  if (dashMatch) {
    const left = dashMatch[1].trim();
    const right = dashMatch[2].trim();
    const looksLikeArtist = /[A-Z\u00C0-\u024F\u3040-\u30ff\u3400-\u9fff]/.test(left) && left.split(/\s+/).length <= 8;
    return {
      rawTitle: source,
      title: right,
      artist: looksLikeArtist ? left : "",
      langs: Array.from(new Set(langs)),
    };
  }
  return {
    rawTitle: source,
    title: working || source || "Untitled",
    artist: "",
    langs: Array.from(new Set(langs)),
  };
}


function stripTrailingSinglePartSuffix(value) {
  return String(value || "")
    .replace(/[\s._-]+(?:part|pt)[\s._-]*0*1\s*$/i, "")
    .replace(/[\s._-]+$/g, "")
    .trim();
}

function buildArchiveBaseName(meta = {}) {
  const titleBits = splitTitleMeta(meta.title || meta.rawTitle || "");
  const langs = Array.from(new Set([...(Array.isArray(meta.langs) ? meta.langs : []), ...titleBits.langs].map(normalizeLangTag).filter(Boolean)));
  const artist = sanitizeFilename(meta.artist || titleBits.artist || "", "");
  const rawTitle = meta.cleanTitle || meta.titleOnly || titleBits.title || meta.title || "Untitled";
  const normalizedRawTitle = stripTrailingSinglePartSuffix(rawTitle) || rawTitle;
  const title = sanitizeFilename(normalizedRawTitle, "Untitled");
  const prefix = langs.length ? `[${langs.join("+")}] ` : "";
  return sanitizeFilename(`${prefix}${artist ? `${artist} - ` : ""}${title}`, title);
}

function buildPagedArchiveFilename(meta = {}, extension = "cbz") {
  const base = buildArchiveBaseName(meta);
  const page = String(meta.page || "").trim();
  const ext = String(extension || "cbz").replace(/^\.+/, "") || "cbz";
  const omitPageSuffix = !!meta.omitPageSuffix || (ext.toLowerCase() === "cbz" && (meta.singleArchive === true || (Array.isArray(meta.images) && meta.images.length > 0)) && page === "1");
  return sanitizeFilename(!omitPageSuffix && page ? `${base} - Page ${page}.${ext}` : `${base}.${ext}`);
}

  function clearChildren(node) {
    while (node && node.firstChild) node.removeChild(node.firstChild);
  }

  function createEl(tag, options = {}, children = []) {
    const el = document.createElement(tag);
    if (options.className) el.className = options.className;
    if (options.text != null) el.textContent = String(options.text);
    if (options.htmlNode instanceof Node) el.appendChild(options.htmlNode);
    if (options.attrs) {
      for (const [key, value] of Object.entries(options.attrs)) {
        if (value != null) el.setAttribute(key, String(value));
      }
    }
    if (options.dataset) {
      for (const [key, value] of Object.entries(options.dataset)) {
        el.dataset[key] = String(value);
      }
    }
    for (const child of children) {
      if (child == null) continue;
      el.appendChild(typeof child === "string" ? document.createTextNode(child) : child);
    }
    return el;
  }

  function ensureToastRoot() {
    let root = document.getElementById("mrm-toast-root");
    if (!root) {
      root = document.createElement("div");
      root.id = "mrm-toast-root";
      root.className = "mrm-toast-root";
      document.body.appendChild(root);
    }
    return root;
  }

  function showToast(message, type = "info", timeout = 3500) {
    const root = ensureToastRoot();
    const toast = document.createElement("div");
    toast.className = "mrm-toast " + (type ? `mrm-toast-${type}` : "");
    toast.textContent = String(message || "");
    root.appendChild(toast);
    const remove = () => {
      if (toast.parentNode) toast.parentNode.removeChild(toast);
    };
    setTimeout(remove, timeout);
    return toast;
  }

  async function fetchWithTimeout(url, options = {}, timeoutMs = 30000) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
    try {
      return await fetch(url, { ...options, signal: controller.signal });
    } finally {
      clearTimeout(timeoutId);
    }
  }

  function debounce(fn, wait = 250) {
    let timer = 0;
    return (...args) => {
      clearTimeout(timer);
      timer = setTimeout(() => fn(...args), wait);
    };
  }

  function formatCookieHeader(cookies) {
    return (cookies || [])
      .filter((cookie) => cookie && cookie.name)
      .map((cookie) => `${cookie.name}=${cookie.value || ""}`)
      .join("; ");
  }

  function maskValue(value, head = 16) {
    const text = String(value || "");
    if (text.length <= head) return text;
    return `${text.slice(0, head)}…`;
  }

  async function appendDebugLog(source, level, message, meta) {
    try {
      if (!browser?.storage?.local) return;
      const result = await browser.storage.local.get([LOG_KEY]);
      const items = Array.isArray(result[LOG_KEY]) ? result[LOG_KEY] : [];
      items.unshift({
        id: `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        timestamp: new Date().toISOString(),
        source: String(source || "APP"),
        level: String(level || "info"),
        message: String(message || ""),
        meta: meta ?? null,
      });
      if (items.length > LOG_LIMIT) items.length = LOG_LIMIT;
      await browser.storage.local.set({ [LOG_KEY]: items });
    } catch {}
  }

  async function clearDebugLog() {
    try {
      await browser.storage.local.remove(LOG_KEY);
    } catch {}
  }

  async function getDebugLog() {
    try {
      const result = await browser.storage.local.get([LOG_KEY]);
      return Array.isArray(result[LOG_KEY]) ? result[LOG_KEY] : [];
    } catch {
      return [];
    }
  }

  async function logDebug(enabled, source, level, message, meta) {
    const prefix = `[MRM Debug][${source}] ${message}`;
    if (enabled) {
      const fn = level === "error" ? console.error : level === "warn" ? console.warn : console.log;
      fn(prefix, meta ?? "");
      await appendDebugLog(source, level, message, meta);
    }
  }

  async function getDebugSettings() {
    try {
      const result = await browser.storage.local.get(["mrmSettings"]);
      const settings = result.mrmSettings || {};
      return {
        debugMode: !!settings.debugMode,
        verboseDebugMode: !!settings.verboseDebugMode,
      };
    } catch {
      return { debugMode: false, verboseDebugMode: false };
    }
  }

  async function isVerboseDebugEnabled() {
    const settings = await getDebugSettings();
    return !!(settings.debugMode && settings.verboseDebugMode);
  }

  async function logVerboseAction(source, message, meta) {
    if (!(await isVerboseDebugEnabled())) return;
    const payload = {
      url: typeof location !== "undefined" ? location.href : "",
      ...((meta && typeof meta === "object") ? meta : { detail: meta ?? null }),
    };
    await appendDebugLog(source || "APP", "verbose", message, payload);
  }

  function isStaleActiveJob(job) {
    const status = String(job?.status || "").toLowerCase();
    if (!["queued", "opening", "preparing", "downloading", "packing"].includes(status)) return false;
    const updatedAt = Date.parse(job?.updatedAt || job?.startedAt || "");
    if (!Number.isFinite(updatedAt)) return false;
    return Date.now() - updatedAt > 15 * 60 * 1000;
  }

  async function getActiveJobs() {
    try {
      const result = await browser.storage.local.get([ACTIVE_JOBS_KEY]);
      const jobs = Array.isArray(result[ACTIVE_JOBS_KEY]) ? result[ACTIVE_JOBS_KEY] : [];
      const freshJobs = jobs.filter((job) => !isStaleActiveJob(job));
      if (freshJobs.length !== jobs.length) {
        await saveActiveJobs(freshJobs);
        await logDebug("warn", "Cleared stale active download jobs", {
          removed: jobs.length - freshJobs.length,
        });
      }
      return freshJobs;
    } catch {
      return [];
    }
  }

  async function saveActiveJobs(jobs) {
    try {
      await browser.storage.local.set({ [ACTIVE_JOBS_KEY]: Array.isArray(jobs) ? jobs : [] });
    } catch {}
  }

  async function upsertActiveJob(job) {
    if (!job || !job.id) return;
    const jobs = await getActiveJobs();
    const idx = jobs.findIndex((entry) => entry.id === job.id);
    const record = { updatedAt: new Date().toISOString(), ...job };
    if (idx >= 0) jobs[idx] = { ...jobs[idx], ...record };
    else jobs.unshift(record);
    await saveActiveJobs(jobs.slice(0, 20));
  }

  async function removeActiveJob(jobId) {
    const jobs = await getActiveJobs();
    await saveActiveJobs(jobs.filter((entry) => entry.id !== jobId));
  }

  function clampPercent(value) {
    const num = Number(value);
    if (!Number.isFinite(num)) return 0;
    return Math.max(0, Math.min(100, num));
  }

  window.MRMCommon = {
    sanitizeFilename,
    clearChildren,
    createEl,
    showToast,
    fetchWithTimeout,
    debounce,
    formatCookieHeader,
    maskValue,
    appendDebugLog,
    clearDebugLog,
    getDebugLog,
    logDebug,
    getDebugSettings,
    isVerboseDebugEnabled,
    logVerboseAction,
    getActiveJobs,
    saveActiveJobs,
    upsertActiveJob,
    removeActiveJob,
    clampPercent,
    ACTIVE_JOBS_KEY,
    normalizeLangTag,
    splitTitleMeta,
    buildArchiveBaseName,
    buildPagedArchiveFilename,
    getDefaultSettings,
  };
})();