(() => {
  if (globalThis.TMD_COMMON) return;

  const ACTIONS = {
    GET_SETTINGS: "GET_SETTINGS",
    SET_SETTINGS: "SET_SETTINGS",
    APPEND_LOG: "APPEND_LOG",
    GET_LOGS: "GET_LOGS",
    CLEAR_LOGS: "CLEAR_LOGS",
    UPSERT_MEDIA_BATCH: "UPSERT_MEDIA_BATCH",
    GET_CHAT_MEDIA: "GET_CHAT_MEDIA",
    GET_ALL_INDEX_SUMMARY: "GET_ALL_INDEX_SUMMARY",
    DOWNLOAD_URL: "DOWNLOAD_URL",
    CANCEL_DOWNLOAD: "CANCEL_DOWNLOAD",
    GET_DOWNLOAD_JOBS: "GET_DOWNLOAD_JOBS",
    CLEAR_CHAT_INDEX: "CLEAR_CHAT_INDEX",
    CLEAR_ALL_INDEX: "CLEAR_ALL_INDEX",
    EXPORT_CHAT_INDEX: "EXPORT_CHAT_INDEX",
    OPEN_LIBRARY: "OPEN_LIBRARY",
    TAB_COLLECT_NOW: "TAB_COLLECT_NOW",
    TAB_HARVEST_MORE: "TAB_HARVEST_MORE",
    TAB_OPEN_BROWSER: "TAB_OPEN_BROWSER",
    TAB_TOGGLE_DEBUG_PANEL: "TAB_TOGGLE_DEBUG_PANEL",
  };

  const CONFIG = {
    version: "3.5.1",
    storage: {
      settings: "tmd:settings",
      logs: "tmd:logs",
      downloadJobs: "tmd:download-jobs",
      chatPrefix: "tmd:chat:",
    },
    maxLogs: 600,
    maxIndexEntriesPerChat: 4000,
    selectors: {
      activeMediaTab: ".search-super-tab-container.search-super-container-media.tabs-tab.active",
      mediaGrid: ".search-super-content-media-grid",
      mediaTiles: ".search-super-content-media-grid .grid-item.media-container.search-super-item, .search-super-content-media-grid .grid-item.media-container, .search-super-content-media-grid .search-super-item",
      messageBubble: ".bubble[data-mid], .Message[data-mid], .message[data-mid], [data-mid].bubble",
      viewerVideo: ".media-viewer-whole video, #MediaViewer video, .VideoPlayer video, #stories-viewer video, #StoryViewer video",
      viewerImage: ".media-viewer-whole img, #MediaViewer img, .MediaViewerContent img, #stories-viewer img, #StoryViewer img",
      viewerActionsK: ".media-viewer-topbar .media-viewer-buttons",
      viewerActionsZ: "#MediaViewer .MediaViewerActions",
      viewerVideoControlsZ: ".VideoPlayerControls .buttons",
      viewerVideoControlsK: ".default__controls.ckin__controls .bottom-controls .right-controls",
      excludedNodes: ".reactions, .reaction, .Reactions, .emoji, .emoticon, .sticker, .avatar, .reply-markup, .message-meta, .media-actions, .document-icon",
    },
  };

  const ext = (() => {
    if (typeof browser !== "undefined") return browser;
    const wrap = (fn, ctx) => (...args) => new Promise((resolve, reject) => {
      try {
        fn.call(ctx, ...args, (result) => {
          const err = chrome.runtime?.lastError;
          if (err) reject(new Error(err.message));
          else resolve(result);
        });
      } catch (error) {
        reject(error);
      }
    });
    return {
      runtime: {
        sendMessage: wrap(chrome.runtime.sendMessage, chrome.runtime),
        openOptionsPage: wrap(chrome.runtime.openOptionsPage, chrome.runtime),
        getURL: chrome.runtime.getURL.bind(chrome.runtime),
      },
      tabs: {
        query: wrap(chrome.tabs.query, chrome.tabs),
        sendMessage: wrap(chrome.tabs.sendMessage, chrome.tabs),
        create: wrap(chrome.tabs.create, chrome.tabs),
      },
      storage: {
        local: {
          get: wrap(chrome.storage.local.get, chrome.storage.local),
          set: wrap(chrome.storage.local.set, chrome.storage.local),
          remove: wrap(chrome.storage.local.remove, chrome.storage.local),
        },
      },
      downloads: {
        download: wrap(chrome.downloads.download, chrome.downloads),
        cancel: wrap(chrome.downloads.cancel, chrome.downloads),
      },
    };
  })();

  const utils = {
    debounce(fn, ms) {
      let timer = 0;
      return (...args) => {
        clearTimeout(timer);
        timer = setTimeout(() => fn(...args), ms);
      };
    },
    sleep(ms) { return new Promise((resolve) => setTimeout(resolve, ms)); },
    randomId() { return `${Math.random().toString(36).slice(2)}_${Date.now()}`; },
    hashCode(text) {
      const value = String(text || "");
      let hash = 0;
      for (let i = 0; i < value.length; i += 1) hash = ((hash << 5) - hash + value.charCodeAt(i)) | 0;
      return Math.abs(hash >>> 0).toString(36);
    },
    safeJsonParse(text, fallback) { try { return JSON.parse(text); } catch { return fallback; } },
    sanitizeFileName(name, fallback = "download.bin") {
      const clean = String(name || fallback).replace(/[\/\\:*?"<>|]+/g, "_").replace(/\s+/g, " ").trim().slice(0, 180);
      return clean || fallback;
    },
    createEl(tag, props = {}) {
      const el = document.createElement(tag);
      Object.entries(props).forEach(([key, value]) => {
        if (key === "className") el.className = value;
        else if (key === "text") el.textContent = value;
        else if (key === "dataset" && value && typeof value === "object") {
          Object.entries(value).forEach(([dataKey, dataValue]) => el.setAttribute(`data-${dataKey}`, String(dataValue)));
        }
        else if (key in el) el[key] = value;
        else el.setAttribute(key, value);
      });
      return el;
    },
    escape(text) {
      return String(text || "").replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#39;");
    },
    isTinyNode(node) {
      if (!(node instanceof Element)) return false;
      const rect = node.getBoundingClientRect?.();
      return !!rect && (rect.width < 80 || rect.height < 80);
    },
    isExcludedNode(node) {
      return node instanceof Element && Boolean(node.closest(CONFIG.selectors.excludedNodes));
    },
    ensureRelativePosition(node) {
      if (node instanceof Element && getComputedStyle(node).position === "static") node.style.position = "relative";
    },
    uniqBy(items, keyFn) {
      const seen = new Set();
      return items.filter((item) => {
        const key = keyFn(item);
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
    },
    formatTimestamp(ts) {
      try { return new Date(ts).toLocaleTimeString(); } catch { return String(ts || ""); }
    },
  };

  globalThis.TMD_COMMON = { ACTIONS, CONFIG, utils, ext };
})();
