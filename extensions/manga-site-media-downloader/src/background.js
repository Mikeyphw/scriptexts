const IMAGE_HOSTS = [
  "i1.myreadingmanga.info",
  "i2.myreadingmanga.info",
  "i3.myreadingmanga.info",
  "i4.myreadingmanga.info",
  "i5.myreadingmanga.info",
  "i6.myreadingmanga.info",
  "mangalotus.com",
  "www.mangalotus.com",
  "yaoimangaonline.com",
  "www.yaoimangaonline.com",
  "baramangaonline.com",
  "www.baramangaonline.com",
];

const PAGE_ORIGINS = [
  "https://myreadingmanga.info",
  "https://www.myreadingmanga.info",
  "https://mangalotus.com",
  "https://www.mangalotus.com",
  "https://baramangaonline.com",
  "https://www.baramangaonline.com",
  "https://yaoimangaonline.com",
  "https://www.yaoimangaonline.com",
];
const PAGE_ORIGIN = PAGE_ORIGINS[0];
const LOG_KEY = "mrmDebugLog";
const LOG_LIMIT = 250;
const AUTO_DOWNLOAD_TAB_IDS = new Set();
const PENDING_METADATA_TAB_JOBS = new Map();
const PENDING_COVER_GENERATION_URLS = new Set();
const PENDING_GOOGLE_OAUTH_SESSIONS = new Map();

const LAST_SUPPORTED_TAB_CONTEXT_KEY = "mrmLastSupportedTabContext";
const DOWNLOAD_QUEUE_KEY = "mrmDownloadQueue";
const LIBRARY_KEY = "mrmLibraryItems";
const GOOGLE_DRIVE_AUTH_KEY = "mrmGoogleDriveAuth";
const GOOGLE_DRIVE_SCOPE = "https://www.googleapis.com/auth/drive.appdata";
const GOOGLE_DRIVE_SYNC_HISTORY_KEY = "mrmGoogleDriveSyncHistory";
const BUNDLED_GOOGLE_DRIVE_DESKTOP_CLIENT_ID = "1045970260428-l071ieen89j7cqbpq86def3cdkr3pptf.apps.googleusercontent.com";
const BUNDLED_GOOGLE_DRIVE_CLIENT_ID = BUNDLED_GOOGLE_DRIVE_DESKTOP_CLIENT_ID;

function normalizeQueueUrl(url) {
  try {
    const parsed = new URL(String(url || ""));
    parsed.hash = "";
    return parsed.toString();
  } catch {
    return String(url || "").split("#")[0];
  }
}

function createQueueIdFromUrl(url) {
  try {
    const parsed = new URL(String(url || ""));
    parsed.hash = "";
    return `${parsed.hostname.replace(/^www\./, "")}:${parsed.pathname}`.replace(/[^a-z0-9:_/-]+/gi, "-").toLowerCase();
  } catch {
    return `queued:${Date.now()}`;
  }
}

function cleanQueueTitle(value, fallback = "") {
  return String(value || fallback || "")
    .replace(/Download\s*CBZ/gi, " ")
    .replace(/Add\s*to\s*Queue/gi, " ")
    .replace(/Generate\s*cover\s*only/gi, " ")
    .replace(/Downloaded\s*✓?/gi, " ")
    .replace(/Queued\s*✓?/gi, " ")
    .replace(/Saved\s*✓?/gi, " ")
    .replace(/Retry\s*Add/gi, " ")
    .replace(/Save\s*to\s*Library/gi, " ")
    .replace(/\bSave\b/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeQueueItem(raw = {}) {
  const url = normalizeQueueUrl(raw.url || raw.href || "");
  if (!/^https?:\/\//i.test(url)) {
    throw new Error("Queue item is missing a valid URL.");
  }
  const host = new URL(url).hostname.replace(/^www\./, "");
  return {
    id: raw.id || createQueueIdFromUrl(url),
    title: cleanQueueTitle(raw.title || raw.displayTitle || "", url) || url,
    url,
    host,
    thumbnailUrl: String(raw.thumbnailUrl || raw.coverUrl || ""),
    status: String(raw.status || "pending"),
    phase: String(raw.phase || "pending"),
    progress: Number(raw.progress || 0),
    progressLabel: String(raw.progressLabel || ""),
    currentImage: Number(raw.currentImage || 0),
    totalImages: Number(raw.totalImages || 0),
    addedAt: Number(raw.addedAt || Date.now()),
    updatedAt: raw.updatedAt || null,
    lastProgressAt: raw.lastProgressAt || null,
    lastError: null,
  };
}

async function getDownloadQueueItems() {
  const result = await browser.storage.local.get([DOWNLOAD_QUEUE_KEY]);
  return Array.isArray(result[DOWNLOAD_QUEUE_KEY]) ? result[DOWNLOAD_QUEUE_KEY] : [];
}

async function addDownloadQueueItem(rawItem) {
  const item = normalizeQueueItem(rawItem);
  const queue = await getDownloadQueueItems();
  const index = queue.findIndex((entry) => (
    entry.id === item.id || normalizeQueueUrl(entry.url) === normalizeQueueUrl(item.url)
  ));
  const nextItem = {
    ...item,
    addedAt: index >= 0 ? Number(queue[index].addedAt || item.addedAt || Date.now()) : Number(item.addedAt || Date.now()),
  };
  if (index >= 0) {
    const existing = queue[index] || {};
    const existingStatus = String(existing.status || "").toLowerCase();
    if (!rawItem?.forceRequeue && existingStatus && existingStatus !== "failed" && existingStatus !== "cancelled") {
      await debug("info", "Queue item already exists; leaving it unchanged", {
        url: existing.url || nextItem.url,
        title: existing.title || nextItem.title,
        status: existing.status || "",
        count: queue.length,
      });
      return { ok: true, item: existing, count: queue.length, existed: true, unchanged: true };
    }
    queue[index] = {
      ...existing,
      ...nextItem,
      status: "pending",
      phase: "queued",
      progress: 0,
      progressLabel: "Queued",
      lastError: null,
      updatedAt: Date.now(),
      lastProgressAt: Date.now(),
    };
  } else {
    queue.unshift(nextItem);
  }
  await browser.storage.local.set({ [DOWNLOAD_QUEUE_KEY]: queue });
  await debug("info", index >= 0 ? "Queue item re-queued" : "Queue item added", {
    url: nextItem.url,
    title: nextItem.title,
    count: queue.length,
    existed: index >= 0,
  });
  return { ok: true, item: index >= 0 ? queue[index] : nextItem, count: queue.length, existed: index >= 0 };
}

async function updateDownloadQueueItemByIdOrUrl(id, url, patch = {}) {
  const normalizedUrl = normalizeQueueUrl(url || "");
  const queue = await getDownloadQueueItems();
  const index = queue.findIndex((entry) => (
    (id && entry.id === id) || (normalizedUrl && normalizeQueueUrl(entry.url) === normalizedUrl)
  ));
  if (index < 0) {
    await debug("warn", "Queue status update skipped; item not found", { id: id || "", url: normalizedUrl });
    return { ok: false, error: "Queue item not found." };
  }

  const previousItem = queue[index];
  const previousStatus = String(previousItem?.status || "").toLowerCase();
  const nextStatus = String(patch?.status || previousStatus).toLowerCase();
  const now = Date.now();
  if (getQueueTerminalStateRank(previousStatus) >= 3 && getQueueTerminalStateRank(nextStatus) < 3) {
    await debug("verbose", "Ignored stale queue downgrade after completion", {
      id: previousItem?.id || id || "",
      url: previousItem?.url || normalizedUrl,
      previousStatus,
      nextStatus,
    });
    return { ok: true, item: previousItem, previousStatus, ignored: true };
  }
  const countUnchanged = Number(previousItem?.count || 0) === Number(patch?.count ?? previousItem?.count ?? 0);
  const progressUnchanged = Number(previousItem?.progress || 0) === Number(patch?.progress ?? previousItem?.progress ?? 0);
  const filenameUnchanged = String(previousItem?.filename || "") === String(patch?.filename ?? previousItem?.filename ?? "");
  const statusUnchanged = previousStatus === nextStatus;
  const recent = now - Number(previousItem?.updatedAt || previousItem?.lastProgressAt || 0) < 2500;
  if (statusUnchanged && ["completed", "failed"].includes(nextStatus) && countUnchanged && progressUnchanged && filenameUnchanged) {
    return { ok: true, item: previousItem, previousStatus, ignored: true, duplicateTerminal: true };
  }
  if (statusUnchanged && countUnchanged && progressUnchanged && recent && !["completed", "failed", "packing", "saving"].includes(nextStatus)) {
    return { ok: true, item: previousItem, previousStatus, throttled: true };
  }
  if (statusUnchanged && filenameUnchanged && recent && ["downloading", "fetching"].includes(nextStatus) && Math.abs(Number(patch?.count ?? previousItem?.count ?? 0) - Number(previousItem?.count || 0)) <= 1) {
    return { ok: true, item: previousItem, previousStatus, throttled: true, progressOnly: true };
  }
  queue[index] = {
    ...queue[index],
    ...patch,
    updatedAt: patch.updatedAt || now,
  };
  await browser.storage.local.set({ [DOWNLOAD_QUEUE_KEY]: queue });
  const shouldLogUpdate = !statusUnchanged || !filenameUnchanged || !countUnchanged || !progressUnchanged || !recent || ["completed", "failed", "packing", "saving"].includes(nextStatus);
  if (shouldLogUpdate) {
    await debug("info", "Queue item status updated", {
      id: queue[index].id,
      url: queue[index].url,
      status: queue[index].status || "",
      filename: queue[index].filename || "",
      count: queue[index].count || 0,
    });
  }
  return {
    ok: true,
    item: queue[index],
    previousItem,
    previousStatus: String(previousItem?.status || "").toLowerCase(),
    count: queue.length
  };
}

const QUEUE_ACTIVE_STATUSES = new Set(["opening", "started", "downloading", "fetching", "packing", "saving"]);
const QUEUE_TERMINAL_STATUSES = new Set(["completed", "done", "failed", "cancelled"]);
const BACKGROUND_QUEUE_LOCKS = new Set();
let backgroundQueueTimer = null;
let backgroundQueueProcessing = false;

function isSupportedDirectQueueUrl(urlString) {
  try {
    const host = new URL(String(urlString || "")).hostname.replace(/^www\./, "");
    return ["baramangaonline.com", "mangalotus.com", "yaoimangaonline.com", "nhentai.net"].includes(host);
  } catch {
    return false;
  }
}

function getQueueItemKey(item = {}) {
  return String(item.id || normalizeQueueUrl(item.url || ""));
}

function isQueueItemActive(item = {}) {
  const status = String(item.status || "pending").toLowerCase();
  return QUEUE_ACTIVE_STATUSES.has(status) || BACKGROUND_QUEUE_LOCKS.has(getQueueItemKey(item));
}

function isQueueItemEligible(item = {}, selectedOnly = false) {
  const status = String(item.status || "pending").toLowerCase();
  if (selectedOnly && item.selected === false) return false;
  if (status === "completed" || status === "done" || status === "cancelled") return false;
  if (isQueueItemActive(item)) return false;
  return ["", "pending", "queued", "failed"].includes(status);
}

async function getMrmSettings() {
  const result = await browser.storage.local.get(["mrmSettings"]);
  return result.mrmSettings || {};
}

function getQueueConcurrencyFromSettings(settings = {}) {
  const value = Number(settings.queueConcurrency || 1);
  if (!Number.isFinite(value)) return 1;
  return Math.max(1, Math.min(4, Math.floor(value)));
}


function getPerHostConcurrencyFromSettings(settings = {}) {
  const androidSafeMode = !!settings.androidSafeMode;
  const rawValue = Number(settings.queuePerHostConcurrency || (androidSafeMode ? 1 : 2));
  if (!Number.isFinite(rawValue)) return androidSafeMode ? 1 : 2;
  return Math.max(1, Math.min(4, Math.floor(rawValue)));
}

function getQueueTerminalStateRank(status = "") {
  const value = String(status || "").toLowerCase();
  if (["completed", "done"].includes(value)) return 3;
  if (["failed", "cancelled"].includes(value)) return 2;
  return 0;
}

function isNetworkLikelyWifiForBackground() {
  const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
  if (!connection) return true;
  const type = String(connection.type || connection.effectiveType || "").toLowerCase();
  if (!type) return true;
  if (type.includes("wifi") || type.includes("ethernet")) return true;
  if (type.includes("cellular") || type.includes("2g") || type.includes("3g") || type.includes("4g") || type.includes("5g")) return false;
  return true;
}


function getQueueItemHost(item = {}) {
  try {
    return new URL(String(item.url || "")).hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
}

async function waitForTabReady(tabId, timeoutMs = 15000) {
  const startedAt = Date.now();
  while ((Date.now() - startedAt) < timeoutMs) {
    try {
      const tab = await browser.tabs.get(tabId);
      if ((tab.status || "") === "complete") return true;
    } catch {
      return false;
    }
    await new Promise((resolve) => setTimeout(resolve, 300));
  }
  return false;
}

async function waitForDirectWorkerReceiver(tabId, attempts = 12) {
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    try {
      const response = await browser.tabs.sendMessage(tabId, { type: "GET_MRM_DATA" });
      if (response && typeof response === "object") return true;
    } catch {}
    await new Promise((resolve) => setTimeout(resolve, 350));
  }
  return false;
}

function shouldAvoidCreatingWorkerTabForItem(item = {}) {
  const host = getQueueItemHost(item);
  return host === "yaoimangaonline.com";
}

async function ensureDirectQueueWorkerTab(item = {}, preferredTabId = null) {
  const existing = await findDirectQueueWorkerTab(item, preferredTabId);
  if (existing?.id) return { tab: existing, created: false };

  const targetUrl = String(item.url || "");
  if (!targetUrl) return { tab: null, created: false };

  if (shouldAvoidCreatingWorkerTabForItem(item)) {
    await debug("info", "Skipped creating direct queue worker tab for same-site-only host", {
      url: targetUrl,
      host: getQueueItemHost(item),
    });
    return { tab: null, created: false, sameSiteOnly: true };
  }

  const createOptions = { url: targetUrl, active: false };
  if (preferredTabId) createOptions.openerTabId = preferredTabId;

  let createdTab = null;
  try {
    createdTab = await browser.tabs.create(createOptions);
  } catch (error) {
    delete createOptions.openerTabId;
    try {
      createdTab = await browser.tabs.create(createOptions);
    } catch (fallbackError) {
      await debug("warn", "Could not create direct queue worker tab", {
        url: targetUrl,
        error: String(fallbackError?.message || fallbackError || error?.message || error),
      });
      return { tab: null, created: false };
    }
  }

  if (!createdTab?.id) return { tab: null, created: false };

  await waitForTabReady(createdTab.id, 20000);
  const ready = await waitForDirectWorkerReceiver(createdTab.id, 18);
  if (!ready) {
    await debug("warn", "Created direct queue worker tab but content receiver was not ready", {
      url: targetUrl,
      tabId: createdTab.id,
    });
  }
  return { tab: createdTab, created: true, ready };
}

async function recoverStaleQueueItems(queue = []) {
  const now = Date.now();
  let changed = false;
  const nextQueue = queue.map((item) => {
    const status = String(item?.status || "").toLowerCase();
    if (!QUEUE_ACTIVE_STATUSES.has(status)) return item;
    if (BACKGROUND_QUEUE_LOCKS.has(getQueueItemKey(item))) return item;
    const lastProgressAt = Number(item?.lastProgressAt || item?.updatedAt || item?.startedAt || 0);
    if (!lastProgressAt) return item;
    const staleMs = now - lastProgressAt;
    const limitMs = status === "packing" || status === "saving" ? 180000 : 120000;
    if (staleMs < limitMs) return item;
    changed = true;
    return {
      ...item,
      status: "failed",
      phase: "failed",
      progressLabel: "Recovered from stalled queue state",
      updatedAt: now,
      lastProgressAt: now,
      lastError: item?.lastError || `Queue item stalled in ${status} and was released for retry.`,
    };
  });
  if (changed) {
    await browser.storage.local.set({ [DOWNLOAD_QUEUE_KEY]: nextQueue });
    await debug("warn", "Recovered stalled queue items", {
      recovered: nextQueue.filter((entry, index) => entry !== queue[index]).length,
    });
    return nextQueue;
  }
  return queue;
}


async function findDirectQueueWorkerTab(item = {}, preferredTabId = null) {
  const targetHost = getQueueItemHost(item);

  function isUsableTab(tab) {
    if (!tab?.id || !/^https?:/i.test(tab.url || "") || !targetHost) return false;
    try {
      const host = new URL(tab.url).hostname.replace(/^www\./, "");
      return host === targetHost;
    } catch {
      return false;
    }
  }

  if (preferredTabId) {
    try {
      const tab = await browser.tabs.get(preferredTabId);
      if (isUsableTab(tab)) return tab;
    } catch {}
  }

  const candidates = await browser.tabs.query({});
  const sameHost = candidates.filter(isUsableTab);
  return sameHost.find((tab) => tab.active) || sameHost[0] || null;
}

async function startQueueItemInBackground(item, options = {}) {
  const key = getQueueItemKey(item);
  if (!key) return { ok: false, error: "Queue item has no key." };
  if (BACKGROUND_QUEUE_LOCKS.has(key)) {
    await debug("verbose", "Queue item start skipped because it is already locked", { id: item.id || "", url: item.url || "" });
    return { ok: true, skipped: true, locked: true };
  }

  const latestQueue = await getDownloadQueueItems();
  const latest = latestQueue.find((entry) => getQueueItemKey(entry) === key || normalizeQueueUrl(entry.url) === normalizeQueueUrl(item.url));
  if (!latest || !isQueueItemEligible(latest, !!options.selectedOnly)) {
    await debug("verbose", "Queue item start skipped because it is no longer eligible", {
      id: item.id || "",
      url: item.url || "",
      status: latest?.status || "",
    });
    return { ok: true, skipped: true };
  }

  BACKGROUND_QUEUE_LOCKS.add(key);
  try {
    await updateDownloadQueueItemByIdOrUrl(latest.id || item.id || "", latest.url || item.url || "", {
      status: "opening",
      phase: "opening",
      progress: 1,
      progressLabel: "Opening…",
      currentImage: 0,
      totalImages: 0,
      lastError: null,
      startedAt: latest.startedAt || Date.now(),
      updatedAt: Date.now(),
      lastProgressAt: Date.now(),
    });

    if (isMyReadingMangaUrl(latest.url)) {
      const response = await openQueuedDownloadTabFromBackground(latest.url, options.preferredTabId || null);
      await updateDownloadQueueItemByIdOrUrl(latest.id || item.id || "", latest.url || item.url || "", {
        status: "started",
        phase: "started",
        progress: 5,
        progressLabel: "Started in background tab",
        updatedAt: Date.now(),
        lastProgressAt: Date.now(),
        lastError: null,
      });
      return response;
    }

    if (!isSupportedDirectQueueUrl(latest.url)) {
      throw new Error("Unsupported direct queued download host.");
    }

    const workerInfo = await ensureDirectQueueWorkerTab(latest, options.preferredTabId || null);
    const workerTab = workerInfo?.tab || null;
    if (!workerTab?.id) {
      await updateDownloadQueueItemByIdOrUrl(latest.id || item.id || "", latest.url || item.url || "", {
        status: "pending",
        phase: "waiting",
        progressLabel: "Waiting for a same-site worker tab",
        lastError: "Could not find or create a tab for the same supported site.",
        updatedAt: Date.now(),
        lastProgressAt: Date.now(),
      });
      return { ok: false, waiting: true, error: "Could not find or create a tab for the same supported site." };
    }

    if (workerInfo?.created && workerInfo?.ready === false) {
      await updateDownloadQueueItemByIdOrUrl(latest.id || item.id || "", latest.url || item.url || "", {
        status: "pending",
        phase: "waiting",
        progressLabel: "Waiting for worker tab to finish loading",
        lastError: null,
        updatedAt: Date.now(),
        lastProgressAt: Date.now(),
      });
      scheduleBackgroundQueueProcess("worker-tab-wait", { preferredTabId: workerTab.id });
      return { ok: false, waiting: true, error: "Worker tab is still loading." };
    }

    await debug("info", "Background queue starting direct download without opening post tab", {
      id: latest.id || item.id || "",
      url: latest.url,
      host: getQueueItemHost(latest),
      workerTabId: workerTab.id,
      createdWorkerTab: !!workerInfo?.created,
    });

    let response = null;
    let sendError = null;
    for (let attempt = 1; attempt <= 3; attempt += 1) {
      try {
        response = await browser.tabs.sendMessage(workerTab.id, {
          type: "MRM_DIRECT_DOWNLOAD_URL",
          queueItemId: latest.id || item.id || "",
          url: latest.url,
          title: latest.title || "",
        });
        sendError = null;
        break;
      } catch (error) {
        sendError = error;
        await waitForDirectWorkerReceiver(workerTab.id, 4);
      }
    }

    if (sendError) {
      const sameSiteOnlyHost = shouldAvoidCreatingWorkerTabForItem(latest);
      if (sameSiteOnlyHost) {
        await updateDownloadQueueItemByIdOrUrl(latest.id || item.id || "", latest.url || item.url || "", {
          status: "pending",
          phase: "waiting",
          progressLabel: "Waiting for an open supported site tab",
          lastError: "Open the source site tab and keep it loaded to continue this queue item.",
          updatedAt: Date.now(),
          lastProgressAt: Date.now(),
        }).catch(() => null);
        return { ok: false, waiting: true, error: String(sendError?.message || sendError) };
      }
      throw sendError;
    }
    if (!response?.ok) throw new Error(response?.error || "Queued direct download failed.");

    if (workerInfo?.created) {
      browser.tabs.remove(workerTab.id).catch(() => null);
    }

    await updateDownloadQueueItemByIdOrUrl(latest.id || item.id || "", latest.url || item.url || "", {
      status: "completed",
      phase: "completed",
      progress: 100,
      progressLabel: "Completed",
      currentImage: response.count || latest.currentImage || 0,
      totalImages: response.count || latest.totalImages || 0,
      completedAt: Date.now(),
      updatedAt: Date.now(),
      lastProgressAt: Date.now(),
      lastError: null,
      filename: response.filename || "",
      count: response.count || 0,
    });
    return { ok: true, item: latest, response };
  } catch (error) {
    const errorMessage = String(error?.message || error);
    const receiverMissing = /Receiving end does not exist/i.test(errorMessage);
    const sameSiteOnlyHost = shouldAvoidCreatingWorkerTabForItem(item);
    if (receiverMissing && sameSiteOnlyHost) {
      await updateDownloadQueueItemByIdOrUrl(item.id || "", item.url || "", {
        status: "pending",
        phase: "waiting",
        progressLabel: "Waiting for an open supported site tab",
        lastError: "Open the source site tab and keep it loaded to continue this queue item.",
        updatedAt: Date.now(),
        lastProgressAt: Date.now(),
      }).catch(() => null);
      await debug("warn", "Background queue item returned to waiting state", { id: item.id || "", url: item.url || "", error: errorMessage });
      return { ok: false, waiting: true, error: errorMessage };
    }
    await updateDownloadQueueItemByIdOrUrl(item.id || "", item.url || "", {
      status: "failed",
      phase: "failed",
      progressLabel: "Failed",
      lastError: errorMessage,
      updatedAt: Date.now(),
      lastProgressAt: Date.now(),
    }).catch(() => null);
    await debug("error", "Background queue item failed", { id: item.id || "", url: item.url || "", error: errorMessage });
    return { ok: false, error: errorMessage };
  } finally {
    BACKGROUND_QUEUE_LOCKS.delete(key);
  }
}

async function processDownloadQueueInBackground(options = {}) {
  if (backgroundQueueProcessing) {
    await debug("verbose", "Background queue process skipped because another process is active", { reason: options.reason || "" });
    return { ok: true, skipped: true, processing: true };
  }

  const settings = await getMrmSettings();
  if (options.autoStart && !settings.queueAutoStartEnabled) return { ok: true, skipped: true, disabled: true };
  if (options.autoStart && settings.queuePauseAfterCurrentEnabled) return { ok: true, skipped: true, paused: true };
  if (settings.queueWifiOnly && !isNetworkLikelyWifiForBackground()) {
    await debug("warn", "Background queue auto-start skipped because Wi-Fi-only mode is enabled", {});
    return { ok: false, skipped: true, error: "Wi-Fi-only queue mode is enabled." };
  }

  backgroundQueueProcessing = true;
  try {
    let queue = await getDownloadQueueItems();
    queue = await recoverStaleQueueItems(queue);
    const activeCount = queue.filter(isQueueItemActive).length;
    const concurrency = getQueueConcurrencyFromSettings(settings);
    const availableSlots = Math.max(0, concurrency - activeCount);
    if (!availableSlots) return { ok: true, started: 0, activeCount, concurrency };

    const eligibleItems = queue.filter((item) => isQueueItemEligible(item, !!options.selectedOnly));
    const perHostConcurrency = getPerHostConcurrencyFromSettings(settings);
    const activeByHost = new Map();
    for (const item of queue.filter(isQueueItemActive)) {
      const hostKey = String(item.host || "").toLowerCase();
      if (!hostKey) continue;
      activeByHost.set(hostKey, (activeByHost.get(hostKey) || 0) + 1);
    }
    const candidates = [];
    for (const item of eligibleItems) {
      if (candidates.length >= availableSlots) break;
      const hostKey = String(item.host || "").toLowerCase();
      const used = (activeByHost.get(hostKey) || 0);
      if (used >= perHostConcurrency) continue;
      activeByHost.set(hostKey, used + 1);
      candidates.push(item);
    }
    if (!candidates.length) return { ok: true, started: 0, activeCount, concurrency, perHostConcurrency };

    await debug("info", "Background queue processing started", {
      reason: options.reason || "",
      selectedOnly: !!options.selectedOnly,
      candidates: candidates.length,
      activeCount,
      concurrency,
      perHostConcurrency,
    });

    const runnable = (settings.queuePauseAfterCurrentEnabled || settings.androidSafeMode) ? candidates.slice(0, 1) : candidates;
    const results = await Promise.allSettled(runnable.map((item) => startQueueItemInBackground(item, options)));
    const started = results.filter((result) => result.status === "fulfilled" && result.value?.ok && !result.value?.skipped).length;
    return { ok: true, started };
  } finally {
    backgroundQueueProcessing = false;
  }
}

function scheduleBackgroundQueueProcess(reason = "queue-change", options = {}) {
  clearTimeout(backgroundQueueTimer);
  backgroundQueueTimer = setTimeout(() => {
    processDownloadQueueInBackground({ ...options, reason, autoStart: true }).catch((error) => {
      debug("error", "Background queue auto-start failed", { reason, error: String(error?.message || error) });
    });
  }, 500);
}

async function openQueuedDownloadTabFromBackground(urlString, sourceTabId = null) {
  const url = new URL(urlString);
  if (!isMyReadingMangaUrl(url.toString())) {
    await debug("warn", "Skipped queued background tab for non-MyReadingManga host", { url: url.toString() });
    return { ok: false, error: "Non-MyReadingManga queued downloads must use direct download, not a background tab." };
  }

  url.hash = "mrm-download-cbz";
  const createOptions = { url: url.toString(), active: false };
  if (sourceTabId) createOptions.openerTabId = sourceTabId;

  let created;
  try {
    created = await browser.tabs.create(createOptions);
  } catch (error) {
    delete createOptions.openerTabId;
    created = await browser.tabs.create(createOptions);
    await debug("warn", "Created queued download tab without openerTabId", { error: String(error?.message || error) });
  }

  if (created.id) AUTO_DOWNLOAD_TAB_IDS.add(created.id);

  const androidBackgroundTabFix = await isAndroidBackgroundTabFixEnabled();
  const restored = androidBackgroundTabFix ? await restoreActiveTab(sourceTabId) : false;
  await debug("info", "Opened queued download tab", { tabId: created.id, url: created.url, restored, androidBackgroundTabFix });
  return { ok: true, tabId: created.id, restored, androidBackgroundTabFix };
}





function normalizeGoogleDriveOAuthMode() {
  return "desktop-pkce";
}

function getGoogleDriveOAuthMode() {
  return "desktop-pkce";
}

function getDefaultGoogleDriveClientIdForMode() {
  return BUNDLED_GOOGLE_DRIVE_DESKTOP_CLIENT_ID;
}

function sanitizeGoogleClientSecret(secret = "") {
  return String(secret || "").trim();
}

async function getStoredGoogleDriveClientSecret() {
  try {
    const result = await browser.storage.local.get(["mrmSettings"]);
    return sanitizeGoogleClientSecret(result.mrmSettings?.googleDriveClientSecret || "");
  } catch {
    return "";
  }
}

async function getGoogleDriveRedirectUrlForMode() {
  return getFallbackOAuthRedirectUrl();
}


function sanitizeDownloadFilename(filename, fallback = "download.cbz") {
  let value = String(filename || fallback).normalize("NFKD");
  value = value
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[\u0000-\u001f\u007f-\u009f]/g, "")
    .replace(/\.cbz\.zip$/i, ".cbz")
    .replace(/\.zip$/i, "")
    .replace(/\.cbz$/i, "")
    .replace(/[^A-Za-z0-9._-]+/g, "-")
    .replace(/[-_.]{2,}/g, "-")
    .replace(/^[.-]+/g, "")
    .replace(/[.-]+$/g, "");
  if (!value || /^(con|prn|aux|nul|com[1-9]|lpt[1-9])(?:\.|$)/i.test(value)) value = "download";
  value = value.slice(0, 120).replace(/[.-]+$/g, "") || "download";
  return `${value}.cbz`;
}

async function isVerboseDebugEnabled() {
  try {
    const result = await browser.storage.local.get(["mrmSettings"]);
    const settings = result.mrmSettings || {};
    return !!(settings.debugMode && settings.verboseDebugMode);
  } catch {
    return false;
  }
}

async function verbose(message, meta = null) {
  if (!(await isVerboseDebugEnabled())) return;
  await appendBackgroundLog("verbose", message, meta);
}

async function appendBackgroundLog(level, message, meta = null) {
  try {
    const result = await browser.storage.local.get([LOG_KEY]);
    const items = Array.isArray(result[LOG_KEY]) ? result[LOG_KEY] : [];
    items.unshift({
      id: `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      timestamp: new Date().toISOString(),
      source: "BACKGROUND",
      level,
      message,
      meta,
    });
    if (items.length > LOG_LIMIT) items.length = LOG_LIMIT;
    await browser.storage.local.set({ [LOG_KEY]: items });
  } catch {}
}

async function sha1Hex(value) {
  const bytes = new TextEncoder().encode(String(value || ""));
  const digest = await crypto.subtle.digest("SHA-1", bytes);
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

function getConfiguredExtensionId() {
  const manifest = browser.runtime.getManifest?.() || {};
  return (
    manifest.browser_specific_settings?.gecko?.id ||
    manifest.applications?.gecko?.id ||
    browser.runtime.id ||
    ""
  );
}

async function getFallbackOAuthRedirectUrl() {
  const extensionId = getConfiguredExtensionId();
  if (!extensionId) {
    throw new Error("Could not derive Firefox OAuth redirect URL because the extension ID is unavailable.");
  }

  const hash = await sha1Hex(extensionId);
  return `http://127.0.0.1/mozoauth2/${hash}/`;
}

async function getIdentityRedirectUrl() {
  if (browser.identity?.getRedirectURL) {
    try {
      return browser.identity.getRedirectURL();
    } catch (error) {
      await debug("warn", "browser.identity.getRedirectURL failed; using loopback OAuth redirect fallback", {
        error: String(error?.message || error),
        android: isAndroidRuntime(),
      });
    }
  }

  const redirectUrl = await getFallbackOAuthRedirectUrl();
  await debug("info", "Using Firefox loopback OAuth redirect fallback", {
    redirectUrl,
    android: isAndroidRuntime(),
    reason: "identity.getRedirectURL unavailable",
  });
  return redirectUrl;
}

function base64UrlEncodeBytes(bytes) {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function createPkceCodeVerifier() {
  const bytes = new Uint8Array(64);
  crypto.getRandomValues(bytes);
  return base64UrlEncodeBytes(bytes);
}

async function createPkceCodeChallenge(verifier) {
  const data = new TextEncoder().encode(verifier);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return base64UrlEncodeBytes(new Uint8Array(digest));
}

async function createGoogleDrivePkceSession(clientId, redirectUrl, state = "") {
  const codeVerifier = createPkceCodeVerifier();
  const codeChallenge = await createPkceCodeChallenge(codeVerifier);
  const sessionId = state || createGoogleOAuthSessionId();
  const authUrl = buildGoogleDriveOAuthUrl(clientId, redirectUrl, sessionId, codeChallenge);

  return {
    sessionId,
    codeVerifier,
    codeChallenge,
    authUrl,
  };
}

function buildGoogleDriveOAuthUrl(clientId, redirectUrl, state = "", codeChallenge = "") {
  const url = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  url.searchParams.set("client_id", clientId);
  url.searchParams.set("redirect_uri", redirectUrl);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", GOOGLE_DRIVE_SCOPE);
  url.searchParams.set("include_granted_scopes", "true");
  url.searchParams.set("access_type", "offline");
  url.searchParams.set("prompt", "consent");
  if (state) url.searchParams.set("state", state);
  if (codeChallenge) {
    url.searchParams.set("code_challenge", codeChallenge);
    url.searchParams.set("code_challenge_method", "S256");
  }
  return url.toString();
}

function buildGoogleDriveTokenOAuthUrl(clientId, redirectUrl, state = "") {
  const url = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  url.searchParams.set("client_id", clientId);
  url.searchParams.set("redirect_uri", redirectUrl);
  url.searchParams.set("response_type", "token");
  url.searchParams.set("scope", GOOGLE_DRIVE_SCOPE);
  url.searchParams.set("include_granted_scopes", "true");
  url.searchParams.set("prompt", "consent");
  if (state) url.searchParams.set("state", state);
  return url.toString();
}


function isAndroidRuntime() {
  return /Android/i.test(navigator?.userAgent || "");
}

function isOAuthRedirectUrl(url, redirectUrl) {
  const value = String(url || "");
  const expected = String(redirectUrl || "");
  return !!value && !!expected && value.startsWith(expected);
}

async function launchGoogleDriveOAuthInTab(authUrl, redirectUrl) {
  if (!browser.tabs?.create || !browser.tabs?.onUpdated) {
    throw new Error("Manual OAuth tab flow is unavailable because tabs APIs are missing.");
  }

  await debug("info", "Google Drive OAuth manual tab flow started", {
    redirectUrl,
    android: isAndroidRuntime(),
  });

  return new Promise((resolve, reject) => {
    let authTabId = null;
    let settled = false;

    const cleanup = () => {
      try {
        browser.tabs.onUpdated.removeListener(onUpdated);
      } catch {}
      clearTimeout(timeoutId);
    };

    const finish = async (resultUrl) => {
      if (settled) return;
      settled = true;
      cleanup();

      if (authTabId !== null) {
        try {
          await browser.tabs.remove(authTabId);
        } catch {}
      }

      resolve(resultUrl);
    };

    const fail = async (error) => {
      if (settled) return;
      settled = true;
      cleanup();
      reject(error);
    };

    const onUpdated = (tabId, changeInfo, tab) => {
      if (tabId !== authTabId) return;

      const candidateUrl = changeInfo?.url || tab?.url || "";
      if (!isOAuthRedirectUrl(candidateUrl, redirectUrl)) return;

      finish(candidateUrl);
    };

    const timeoutId = setTimeout(() => {
      fail(new Error("Google OAuth tab flow timed out before the redirect returned."));
    }, 5 * 60 * 1000);

    browser.tabs.onUpdated.addListener(onUpdated);

    browser.tabs
      .create({ url: authUrl, active: true })
      .then((tab) => {
        authTabId = tab?.id ?? null;
        return debug("info", "Google Drive OAuth tab opened", {
          tabId: authTabId,
          android: isAndroidRuntime(),
        });
      })
      .catch((error) => {
        fail(new Error(`Could not open Google OAuth tab: ${String(error?.message || error)}`));
      });
  });
}

async function launchGoogleDriveOAuth(authUrl, redirectUrl) {
  if (isAndroidRuntime()) {
    return launchGoogleDriveOAuthInTab(authUrl, redirectUrl);
  }

  if (!browser.identity?.launchWebAuthFlow) {
    return launchGoogleDriveOAuthInTab(authUrl, redirectUrl);
  }

  try {
    return await browser.identity.launchWebAuthFlow({
      url: authUrl,
      interactive: true,
    });
  } catch (error) {
    const message = String(error?.message || error);
    await debug("warn", "Google Drive OAuth launchWebAuthFlow failed; falling back to tab flow", {
      error: message,
      android: isAndroidRuntime(),
    });
    return launchGoogleDriveOAuthInTab(authUrl, redirectUrl);
  }
}


function parseOAuthRedirectResult(redirectResult) {
  const value = String(redirectResult || "");
  const hash = value.includes("#") ? value.slice(value.indexOf("#") + 1) : "";
  const query = value.includes("?") ? value.slice(value.indexOf("?") + 1).split("#")[0] : "";
  const params = new URLSearchParams(hash || query);

  const error = params.get("error");
  if (error) {
    throw new Error(`${error}: ${params.get("error_description") || "OAuth authorization failed."}`);
  }

  const accessToken = params.get("access_token");
  if (accessToken) {
    const expiresIn = Number(params.get("expires_in") || 3600);
    return {
      accessToken,
      tokenType: params.get("token_type") || "Bearer",
      scope: params.get("scope") || GOOGLE_DRIVE_SCOPE,
      expiresAt: Date.now() + Math.max(60, expiresIn - 30) * 1000,
      state: params.get("state") || "",
      authFlow: "token",
    };
  }

  const code = params.get("code");
  if (!code) {
    throw new Error("OAuth redirect did not include an authorization code or access token.");
  }

  return {
    code,
    state: params.get("state") || "",
    scope: params.get("scope") || GOOGLE_DRIVE_SCOPE,
    authFlow: "pkce",
  };
}


function parseGoogleTokenResponse(body, fallbackScope = GOOGLE_DRIVE_SCOPE) {
  const expiresIn = Number(body.expires_in || 3600);
  return {
    accessToken: body.access_token,
    refreshToken: body.refresh_token || "",
    tokenType: body.token_type || "Bearer",
    scope: body.scope || fallbackScope,
    expiresAt: Date.now() + Math.max(60, expiresIn - 30) * 1000,
  };
}

async function exchangeGoogleDriveAuthorizationCode({ code, clientId, redirectUrl, codeVerifier, clientSecret = "" }) {
  if (!codeVerifier) {
    throw new Error("Missing PKCE code verifier. Generate a new sign-in URL and try again.");
  }

  const body = new URLSearchParams();
  body.set("client_id", clientId);
  body.set("code", code);
  body.set("code_verifier", codeVerifier);
  body.set("grant_type", "authorization_code");
  body.set("redirect_uri", redirectUrl);
  const cleanClientSecret = sanitizeGoogleClientSecret(clientSecret || await getStoredGoogleDriveClientSecret());
  if (cleanClientSecret) {
    body.set("client_secret", cleanClientSecret);
  }

  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });

  const text = await response.text();
  let parsed = {};
  try {
    parsed = text ? JSON.parse(text) : {};
  } catch {
    throw new Error(`Google token exchange returned invalid JSON: HTTP ${response.status}`);
  }

  if (!response.ok) {
    const detail = parsed.error_description || parsed.error || text;
    throw new Error(`Google token exchange failed: HTTP ${response.status}${detail ? ` - ${detail}` : ""}. Your Google OAuth client requires a client secret for this PKCE token exchange. Paste the Desktop app client secret in Settings.`);
  }

  if (!parsed.access_token) {
    throw new Error("Google token exchange succeeded but did not return an access token.");
  }

  return parseGoogleTokenResponse(parsed);
}

async function refreshGoogleDriveAccessToken(auth) {
  if (!auth?.refreshToken) {
    throw new Error("Google Drive authorization expired and no refresh token is available. Reconnect Google Drive from Settings.");
  }

  const body = new URLSearchParams();
  body.set("client_id", auth.clientId || BUNDLED_GOOGLE_DRIVE_CLIENT_ID);
  body.set("refresh_token", auth.refreshToken);
  body.set("grant_type", "refresh_token");
  const cleanClientSecret = sanitizeGoogleClientSecret(auth.clientSecret || await getStoredGoogleDriveClientSecret());
  if (cleanClientSecret) {
    body.set("client_secret", cleanClientSecret);
  }

  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });

  const text = await response.text();
  let parsed = {};
  try {
    parsed = text ? JSON.parse(text) : {};
  } catch {
    throw new Error(`Google token refresh returned invalid JSON: HTTP ${response.status}`);
  }

  if (!response.ok) {
    const detail = parsed.error_description || parsed.error || text;
    throw new Error(`Google token refresh failed: HTTP ${response.status}${detail ? ` - ${detail}` : ""}. Reconnect Google Drive from Settings.`);
  }

  if (!parsed.access_token) {
    throw new Error("Google token refresh succeeded but did not return an access token.");
  }

  const refreshed = parseGoogleTokenResponse(parsed, auth.scope || GOOGLE_DRIVE_SCOPE);
  return {
    ...auth,
    connected: true,
    accessToken: refreshed.accessToken,
    tokenType: refreshed.tokenType,
    scope: refreshed.scope,
    expiresAt: refreshed.expiresAt,
    refreshToken: refreshed.refreshToken || auth.refreshToken,
    refreshedAt: Date.now(),
  };
}

async function storeGoogleDriveAuthFromToken(token, clientId, extra = {}) {
  const previous = await browser.storage.local.get([GOOGLE_DRIVE_AUTH_KEY]);
  const previousAuth = previous[GOOGLE_DRIVE_AUTH_KEY] || {};
  const auth = {
    connected: true,
    provider: "google-drive",
    accessToken: token.accessToken,
    refreshToken: token.refreshToken || previousAuth.refreshToken || "",
    tokenType: token.tokenType,
    scope: token.scope,
    expiresAt: token.expiresAt,
    connectedAt: previousAuth.connectedAt || Date.now(),
    updatedAt: Date.now(),
    clientId,
    authFlow: extra.authFlow || "token",
    clientSecret: sanitizeGoogleClientSecret(extra.clientSecret || previousAuth.clientSecret || ""),
    ...extra,
  };

  await browser.storage.local.set({ [GOOGLE_DRIVE_AUTH_KEY]: auth });
  return auth;
}

async function testGoogleDriveAppDataAccess(accessToken) {
  const url = new URL("https://www.googleapis.com/drive/v3/files");
  url.searchParams.set("spaces", "appDataFolder");
  url.searchParams.set("pageSize", "1");
  url.searchParams.set("fields", "files(id,name),kind");

  const response = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  const text = await response.text();
  if (!response.ok) {
    let detail = text;
    try {
      detail = JSON.parse(text)?.error?.message || text;
    } catch {}
    throw new Error(`Drive AppData access failed: HTTP ${response.status}${detail ? ` - ${detail}` : ""}`);
  }

  let body = {};
  try {
    body = text ? JSON.parse(text) : {};
  } catch {
    throw new Error("Drive AppData access returned invalid JSON.");
  }

  return {
    ok: true,
    kind: body.kind || "",
    visibleFiles: Array.isArray(body.files) ? body.files.length : 0,
  };
}

async function runGoogleDriveOAuthTest(clientId, requestedMode = "auto", clientSecret = "") {
  const authMode = "desktop-pkce";
  const cleanClientId = sanitizeGoogleClientId(getDefaultGoogleDriveClientIdForMode("desktop-pkce", clientId));
  if (!browser.identity?.launchWebAuthFlow) {
    await debug("warn", "browser.identity.launchWebAuthFlow unavailable; using manual OAuth tab flow", {
      android: isAndroidRuntime(),
      authMode,
    });
  }

  const redirectUrl = await getGoogleDriveRedirectUrlForMode(authMode);
  let authUrl = "";
  let pkce = null;
  if (authMode === "desktop-pkce") {
    pkce = await createGoogleDrivePkceSession(cleanClientId, redirectUrl);
    authUrl = pkce.authUrl;
  } else {
    authUrl = buildGoogleDriveTokenOAuthUrl(cleanClientId, redirectUrl, createGoogleOAuthSessionId());
  }

  await debug("info", "Google Drive OAuth test started", {
    redirectUrl,
    scope: GOOGLE_DRIVE_SCOPE,
    authMode,
    codeChallengeMethod: authMode === "desktop-pkce" ? "S256" : null,
  });

  const redirectResult = await launchGoogleDriveOAuth(authUrl, redirectUrl);
  const authorization = parseOAuthRedirectResult(redirectResult);
  let token = null;

  if (authorization.accessToken) {
    token = authorization;
  } else {
    token = await exchangeGoogleDriveAuthorizationCode({
      code: authorization.code,
      clientId: cleanClientId,
      redirectUrl,
      codeVerifier: pkce?.codeVerifier || "",
      clientSecret,
    });
  }

  const appDataAccess = await testGoogleDriveAppDataAccess(token.accessToken);

  await storeGoogleDriveAuthFromToken(token, cleanClientId, {
    manualRedirect: false,
    refreshTokenAvailable: !!token.refreshToken,
    authFlow: "pkce",
    clientTypeHint: "desktop-app",
    clientSecret: sanitizeGoogleClientSecret(clientSecret),
  });

  await debug("info", "Google Drive OAuth test succeeded", {
    scope: token.scope,
    expiresAt: new Date(token.expiresAt).toISOString(),
    hasRefreshToken: !!token.refreshToken,
    appDataAccess,
    authMode,
  });

  return {
    ok: true,
    connected: true,
    scope: token.scope,
    expiresAt: new Date(token.expiresAt).toISOString(),
    refreshTokenAvailable: !!token.refreshToken,
    appDataAccess,
    redirectUrl,
    authFlow: "pkce",
    clientTypeHint: "desktop-app",
    note: "Using Desktop app PKCE flow only. Refresh token is available when Google returns one.",
  };
}

async function completeGoogleDriveOAuthFromManualRedirect(redirectUrl, clientId = "", requestedMode = "auto", clientSecret = "") {
  const value = String(redirectUrl || "").trim();
  if (!value) throw new Error("Redirect URL is required.");

  const stored = await browser.storage.local.get(["mrmGoogleDrivePendingPkceOAuth"]);
  const pending = stored.mrmGoogleDrivePendingPkceOAuth || {};
  const authMode = pending.authMode || getGoogleDriveOAuthMode(clientId, requestedMode);
  const cleanClientId = sanitizeGoogleClientId(getDefaultGoogleDriveClientIdForMode("desktop-pkce", clientId));
  const expectedRedirectUrl = pending.redirectUrl || await getGoogleDriveRedirectUrlForMode(authMode);
  if (!isOAuthRedirectUrl(value, expectedRedirectUrl)) {
    throw new Error("The pasted URL does not match this extension's OAuth redirect URL.");
  }

  const authorization = parseOAuthRedirectResult(value);
  const codeVerifier = pending.codeVerifier || "";
  const redirectForExchange = pending.redirectUrl || expectedRedirectUrl;

  if (authorization.state && pending.sessionId && authorization.state !== pending.sessionId) {
    throw new Error("The pasted redirect URL belongs to a different Google sign-in session. Generate a new sign-in URL and try again.");
  }

  let token = null;
  if (authorization.accessToken) {
    token = authorization;
  } else {
    token = await exchangeGoogleDriveAuthorizationCode({
      code: authorization.code,
      clientId: cleanClientId,
      redirectUrl: redirectForExchange,
      codeVerifier,
      clientSecret: clientSecret || pending.clientSecret,
    });
  }
  const appDataAccess = await testGoogleDriveAppDataAccess(token.accessToken);

  await storeGoogleDriveAuthFromToken(token, cleanClientId, {
    manualRedirect: true,
    refreshTokenAvailable: !!token.refreshToken,
    authFlow: "pkce",
    clientTypeHint: "desktop-app",
    clientSecret: sanitizeGoogleClientSecret(clientSecret || pending.clientSecret),
  });
  await browser.storage.local.remove(["mrmGoogleDrivePendingPkceOAuth"]);

  await debug("info", "Google Drive PKCE manual redirect succeeded", {
    scope: token.scope,
    expiresAt: new Date(token.expiresAt).toISOString(),
    appDataAccess,
    hasRefreshToken: !!token.refreshToken,
  });

  return {
    ok: true,
    connected: true,
    provider: "google-drive",
    scope: token.scope,
    expiresAt: new Date(token.expiresAt).toISOString(),
    refreshTokenAvailable: !!token.refreshToken,
    appDataAccess,
    redirectUrl: expectedRedirectUrl,
    authFlow: "pkce",
  };
}

async function getGoogleDriveOAuthStatus() {
  const result = await browser.storage.local.get([GOOGLE_DRIVE_AUTH_KEY]);
  let auth = result[GOOGLE_DRIVE_AUTH_KEY] || {};
  const expired = !!auth.expiresAt && Number(auth.expiresAt) <= Date.now();

  if (auth.connected && auth.accessToken && expired && auth.refreshToken) {
    try {
      auth = await refreshGoogleDriveAccessToken(auth);
      await browser.storage.local.set({ [GOOGLE_DRIVE_AUTH_KEY]: auth });
      await debug("info", "Google Drive access token refreshed during status check", {
        expiresAt: new Date(auth.expiresAt).toISOString(),
      });
    } catch (error) {
      await debug("warn", "Google Drive access token refresh failed during status check", {
        error: String(error?.message || error),
      });
    }
  }

  const connected = !!auth.connected && !!auth.accessToken && Number(auth.expiresAt || 0) > Date.now();

  return {
    ok: true,
    connected,
    provider: "google-drive",
    scope: auth.scope || GOOGLE_DRIVE_SCOPE,
    expiresAt: auth.expiresAt ? new Date(auth.expiresAt).toISOString() : null,
    expired: !!auth.expiresAt && Number(auth.expiresAt) <= Date.now(),
    authFlow: auth.authFlow || "unknown",
    refreshTokenAvailable: !!auth.refreshToken,
  };
}

async function disconnectGoogleDriveOAuthTest() {
  await browser.storage.local.remove([GOOGLE_DRIVE_AUTH_KEY]);
  await debug("info", "Google Drive OAuth test token disconnected");
  return { ok: true, connected: false };
}


function createGoogleOAuthSessionId() {
  return `oauth_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

function sanitizeGoogleClientId(clientId) {
  const cleanClientId = String(clientId || BUNDLED_GOOGLE_DRIVE_CLIENT_ID || "").trim();
  if (!cleanClientId) throw new Error("Google OAuth client ID is required.");
  if (!/\.apps\.googleusercontent\.com$/i.test(cleanClientId)) {
    throw new Error("Client ID should look like: 1234567890-example.apps.googleusercontent.com");
  }
  return cleanClientId;
}

async function prepareGoogleDriveOAuthTabSession(clientId, requestedMode = "auto", clientSecret = "") {
  const authMode = "desktop-pkce";
  const cleanClientId = sanitizeGoogleClientId(getDefaultGoogleDriveClientIdForMode("desktop-pkce", clientId));
  const redirectUrl = await getGoogleDriveRedirectUrlForMode(authMode);
  let sessionId = createGoogleOAuthSessionId();
  let authUrl = "";
  let codeVerifier = "";
  let codeChallenge = "";
  if (authMode === "desktop-pkce") {
    const pkce = await createGoogleDrivePkceSession(cleanClientId, redirectUrl, sessionId);
    authUrl = pkce.authUrl;
    codeVerifier = pkce.codeVerifier;
    codeChallenge = pkce.codeChallenge;
    sessionId = pkce.sessionId;
  } else {
    authUrl = buildGoogleDriveTokenOAuthUrl(cleanClientId, redirectUrl, sessionId);
  }
  const session = {
    id: sessionId,
    status: "prepared",
    clientId: cleanClientId,
    redirectUrl,
    authUrl,
    codeVerifier,
    codeChallenge,
    authMode,
    clientSecret: sanitizeGoogleClientSecret(clientSecret),
    tabId: null,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    result: null,
    error: null,
  };
  PENDING_GOOGLE_OAUTH_SESSIONS.set(sessionId, session);
  await browser.storage.local.set({
    mrmGoogleDrivePendingPkceOAuth: {
      sessionId,
      clientId: cleanClientId,
      redirectUrl,
      codeVerifier,
      clientSecret: sanitizeGoogleClientSecret(clientSecret),
      authMode,
      createdAt: Date.now(),
    },
  });
  await debug("info", "Google Drive OAuth page-initiated session prepared", {
    sessionId,
    redirectUrl,
    android: isAndroidRuntime(),
    authMode,
    codeChallengeMethod: authMode === "desktop-pkce" ? "S256" : null,
  });
  return { ok: true, sessionId, redirectUrl, authUrl, scope: GOOGLE_DRIVE_SCOPE, authFlow: authMode };
}

async function registerGoogleDriveOAuthTabSession(sessionId, tabId) {
  const session = PENDING_GOOGLE_OAUTH_SESSIONS.get(String(sessionId || ""));
  if (!session) throw new Error("OAuth session was not found or expired.");
  session.tabId = Number(tabId || 0) || null;
  session.status = "waiting";
  session.updatedAt = Date.now();
  await debug("info", "Google Drive OAuth tab registered", {
    sessionId: session.id,
    tabId: session.tabId,
    android: isAndroidRuntime(),
  });
  return { ok: true, sessionId: session.id, tabId: session.tabId, status: session.status };
}

function getGoogleDriveOAuthTabSessionStatus(sessionId) {
  const session = PENDING_GOOGLE_OAUTH_SESSIONS.get(String(sessionId || ""));
  if (!session) return { ok: false, status: "missing", error: "OAuth session was not found or expired." };
  return {
    ok: true,
    sessionId: session.id,
    status: session.status,
    error: session.error,
    result: session.result,
    createdAt: session.createdAt,
    updatedAt: session.updatedAt,
  };
}

async function completeGoogleDriveOAuthTabSession(session, redirectResult) {
  if (!session || session.status === "connected" || session.status === "failed") return;
  try {
    const authorization = parseOAuthRedirectResult(redirectResult);
    if (authorization.state && authorization.state !== session.id) {
      throw new Error("OAuth state mismatch. Generate a new Google sign-in URL and try again.");
    }

    let token = null;
    if (authorization.accessToken) {
      token = authorization;
    } else {
      token = await exchangeGoogleDriveAuthorizationCode({
        code: authorization.code,
        clientId: session.clientId,
        redirectUrl: session.redirectUrl,
        codeVerifier: session.codeVerifier,
        clientSecret: session.clientSecret,
      });
    }
    const appDataAccess = await testGoogleDriveAppDataAccess(token.accessToken);

    await storeGoogleDriveAuthFromToken(token, session.clientId, {
      refreshTokenAvailable: !!token.refreshToken,
      authFlow: "desktop-pkce",
      clientTypeHint: "desktop-app",
      clientSecret: sanitizeGoogleClientSecret(session.clientSecret),
    });
    await browser.storage.local.remove(["mrmGoogleDrivePendingPkceOAuth"]);

    session.status = "connected";
    session.updatedAt = Date.now();
    session.result = {
      connected: true,
      provider: "google-drive",
      scope: token.scope,
      expiresAt: new Date(token.expiresAt).toISOString(),
      refreshTokenAvailable: !!token.refreshToken,
      appDataAccess,
      redirectUrl: session.redirectUrl,
      authFlow: "desktop-pkce",
    };
    session.error = null;

    await debug("info", "Google Drive PKCE OAuth page-initiated session connected", {
      sessionId: session.id,
      tabId: session.tabId,
      scope: token.scope,
      expiresAt: new Date(token.expiresAt).toISOString(),
      hasRefreshToken: !!token.refreshToken,
      appDataAccess,
    });
  } catch (error) {
    session.status = "failed";
    session.updatedAt = Date.now();
    session.error = String(error?.message || error);
    await debug("error", "Google Drive PKCE OAuth page-initiated session failed", {
      sessionId: session.id,
      tabId: session.tabId,
      error: session.error,
    });
  } finally {
    if (session.tabId) {
      try {
        await browser.tabs.remove(session.tabId);
      } catch {}
    }
  }
}

function findGoogleDriveOAuthSessionForTab(tabId, url) {
  const value = String(url || "");
  for (const session of PENDING_GOOGLE_OAUTH_SESSIONS.values()) {
    if (session.status === "connected" || session.status === "failed") continue;
    if (session.tabId && Number(session.tabId) !== Number(tabId)) continue;
    if (isOAuthRedirectUrl(value, session.redirectUrl)) return session;
  }
  return null;
}

browser.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  const candidateUrl = changeInfo?.url || tab?.url || "";
  const session = findGoogleDriveOAuthSessionForTab(tabId, candidateUrl);
  if (!session) return;
  completeGoogleDriveOAuthTabSession(session, candidateUrl);
});

setInterval(() => {
  const cutoff = Date.now() - 10 * 60 * 1000;
  for (const [sessionId, session] of PENDING_GOOGLE_OAUTH_SESSIONS.entries()) {
    if (session.updatedAt < cutoff) {
      PENDING_GOOGLE_OAUTH_SESSIONS.delete(sessionId);
    }
  }
}, 60 * 1000);


const GOOGLE_DRIVE_FILES = {
  library: "library.json",
  queue: "queue.json",
  settings: "settings.json",
  syncState: "sync-state.json",
};

let GOOGLE_DRIVE_AUTO_SYNC_TIMER = null;
let GOOGLE_DRIVE_SYNC_RUNNING = false;

function getDeviceId() {
  return `device-${String(navigator.userAgent || "browser")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^A-Za-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase()
    .slice(0, 42) || "browser"}`;
}

async function getGoogleDriveAccessToken() {
  const result = await browser.storage.local.get([GOOGLE_DRIVE_AUTH_KEY]);
  let auth = result[GOOGLE_DRIVE_AUTH_KEY] || {};
  if (!auth.connected || !auth.accessToken) {
    throw new Error("Google Drive is not connected. Sign in from Settings first.");
  }
  if (Number(auth.expiresAt || 0) <= Date.now() + 15000) {
    auth = await refreshGoogleDriveAccessToken(auth);
    await browser.storage.local.set({ [GOOGLE_DRIVE_AUTH_KEY]: auth });
    await debug("info", "Google Drive access token refreshed before API request", {
      expiresAt: new Date(auth.expiresAt).toISOString(),
    });
  }
  return auth.accessToken;
}

async function driveRequest(path, options = {}) {
  const accessToken = await getGoogleDriveAccessToken();
  const response = await fetch(`https://www.googleapis.com/drive/v3/${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      ...(options.headers || {}),
    },
  });
  const text = await response.text();
  if (!response.ok) {
    let detail = text;
    try {
      detail = JSON.parse(text)?.error?.message || text;
    } catch {}
    throw new Error(`Google Drive request failed: HTTP ${response.status}${detail ? ` - ${detail}` : ""}`);
  }
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

async function findAppDataFileId(name) {
  const params = new URLSearchParams({
    spaces: "appDataFolder",
    fields: "files(id,name,modifiedTime)",
    q: `name='${String(name).replace(/'/g, "\\'")}' and trashed=false`,
  });
  const body = await driveRequest(`files?${params.toString()}`);
  return Array.isArray(body?.files) && body.files[0] ? body.files[0].id : null;
}

async function uploadAppDataJson(name, payload) {
  const accessToken = await getGoogleDriveAccessToken();
  const existingId = await findAppDataFileId(name);
  const metadata = { name, parents: existingId ? undefined : ["appDataFolder"] };
  const boundary = `mrm_sync_${Date.now()}_${Math.random().toString(36).slice(2)}`;
  const body = [
    `--${boundary}`,
    "Content-Type: application/json; charset=UTF-8",
    "",
    JSON.stringify(metadata),
    `--${boundary}`,
    "Content-Type: application/json; charset=UTF-8",
    "",
    JSON.stringify(payload, null, 2),
    `--${boundary}--`,
    "",
  ].join("\r\n");

  const url = existingId
    ? `https://www.googleapis.com/upload/drive/v3/files/${encodeURIComponent(existingId)}?uploadType=multipart&fields=id,name,modifiedTime`
    : "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,modifiedTime";
  const response = await fetch(url, {
    method: existingId ? "PATCH" : "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": `multipart/related; boundary=${boundary}`,
    },
    body,
  });
  const text = await response.text();
  if (!response.ok) {
    let detail = text;
    try {
      detail = JSON.parse(text)?.error?.message || text;
    } catch {}
    throw new Error(`Google Drive upload failed for ${name}: HTTP ${response.status}${detail ? ` - ${detail}` : ""}`);
  }
  return text ? JSON.parse(text) : { name };
}

async function downloadAppDataJson(name) {
  const fileId = await findAppDataFileId(name);
  if (!fileId) return null;
  return driveRequest(`files/${encodeURIComponent(fileId)}?alt=media`);
}

function normalizeSyncUrl(rawUrl) {
  try {
    const url = new URL(rawUrl);
    url.hash = "";
    ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content", "fbclid", "gclid", "mrm_metadata_job"].forEach((key) => url.searchParams.delete(key));
    url.pathname = url.pathname.replace(/\/+$/, "/");
    return url.toString();
  } catch {
    return String(rawUrl || "").trim();
  }
}

function normalizeSyncArray(values) {
  return Array.from(new Set((Array.isArray(values) ? values : []).map((value) => String(value || "").trim()).filter(Boolean)));
}

function mergeLibraryItemsForSync(localItems = [], remoteItems = []) {
  const byKey = new Map();

  function put(item, source) {
    if (!item || typeof item !== "object") return;
    const key = normalizeSyncUrl(item.canonicalUrl || item.url || item.id || "");
    if (!key) return;
    const existing = byKey.get(key);
    if (!existing) {
      byKey.set(key, { ...item });
      return;
    }

    const newer = Number(item.updatedAt || 0) >= Number(existing.updatedAt || 0) ? item : existing;
    const older = newer === item ? existing : item;
    byKey.set(key, {
      ...older,
      ...newer,
      id: existing.id || item.id,
      addedAt: Math.min(Number(existing.addedAt || Date.now()), Number(item.addedAt || Date.now())),
      favorite: !!(existing.favorite || item.favorite),
      rating: Math.max(Number(existing.rating || 0), Number(item.rating || 0)),
      notes: existing.notes && item.notes && existing.notes !== item.notes
        ? `${existing.notes}\n\n---- Synced note ----\n${item.notes}`
        : (existing.notes || item.notes || ""),
      downloaded: !!(existing.downloaded || item.downloaded),
      downloadCount: Math.max(Number(existing.downloadCount || 0), Number(item.downloadCount || 0)),
      lastDownloadedAt: Math.max(Number(existing.lastDownloadedAt || 0), Number(item.lastDownloadedAt || 0)) || null,
      queued: !!(existing.queued || item.queued),
      languages: normalizeSyncArray([...(existing.languages || []), ...(item.languages || [])]),
      artists: normalizeSyncArray([...(existing.artists || []), ...(item.artists || [])]),
      circles: normalizeSyncArray([...(existing.circles || []), ...(item.circles || [])]),
      tags: normalizeSyncArray([...(existing.tags || []), ...(item.tags || [])]),
      categories: normalizeSyncArray([...(existing.categories || []), ...(item.categories || [])]),
      coverDataUrl: existing.coverDataUrl || item.coverDataUrl || "",
      coverUrl: newer.coverUrl || older.coverUrl || "",
      thumbnailUrl: newer.thumbnailUrl || older.thumbnailUrl || "",
      updatedAt: Math.max(Number(existing.updatedAt || 0), Number(item.updatedAt || 0), Date.now()),
    });
  }

  localItems.forEach((item) => put(item, "local"));
  remoteItems.forEach((item) => put(item, "remote"));
  return Array.from(byKey.values()).sort((a, b) => Number(b.addedAt || 0) - Number(a.addedAt || 0));
}

function mergeQueueItemsForSync(localItems = [], remoteItems = []) {
  const byKey = new Map();
  [...localItems, ...remoteItems].forEach((item) => {
    if (!item || typeof item !== "object") return;
    const key = normalizeSyncUrl(item.url || item.canonicalUrl || item.id || "");
    if (!key) return;
    const existing = byKey.get(key) || {};
    byKey.set(key, {
      ...existing,
      ...item,
      addedAt: Math.min(Number(existing.addedAt || Date.now()), Number(item.addedAt || Date.now())),
      status: existing.status === "done" || item.status === "done" ? "done" : (item.status || existing.status || "pending"),
    });
  });
  return Array.from(byKey.values()).sort((a, b) => Number(b.addedAt || 0) - Number(a.addedAt || 0));
}

async function createLocalDriveSyncSnapshot() {
  const result = await browser.storage.local.get([
    LIBRARY_KEY,
    DOWNLOAD_QUEUE_KEY,
    "mrmSettings",
    "mrmLibrarySettings",
    "mrmSyncSettings",
  ]);
  return {
    type: "mrm-drive-sync-snapshot",
    schemaVersion: 1,
    deviceId: getDeviceId(),
    snapshotId: `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`,
    createdAt: Date.now(),
    libraryItems: Array.isArray(result[LIBRARY_KEY]) ? result[LIBRARY_KEY] : [],
    downloadQueue: Array.isArray(result[DOWNLOAD_QUEUE_KEY]) ? result[DOWNLOAD_QUEUE_KEY] : [],
    settings: {
      mrmSettings: result.mrmSettings || {},
      librarySettings: result.mrmLibrarySettings || {},
      syncSettings: result.mrmSyncSettings || {},
    },
  };
}

async function pushGoogleDriveSync() {
  const snapshot = await createLocalDriveSyncSnapshot();
  const [libraryFile, queueFile, settingsFile, stateFile] = await Promise.all([
    uploadAppDataJson(GOOGLE_DRIVE_FILES.library, {
      type: "mrm-library-export",
      version: 1,
      updatedAt: Date.now(),
      deviceId: snapshot.deviceId,
      libraryItems: snapshot.libraryItems,
    }),
    uploadAppDataJson(GOOGLE_DRIVE_FILES.queue, {
      type: "mrm-queue-export",
      version: 1,
      updatedAt: Date.now(),
      deviceId: snapshot.deviceId,
      downloadQueue: snapshot.downloadQueue,
    }),
    uploadAppDataJson(GOOGLE_DRIVE_FILES.settings, {
      type: "mrm-settings-export",
      version: 1,
      updatedAt: Date.now(),
      deviceId: snapshot.deviceId,
      settings: snapshot.settings,
    }),
    uploadAppDataJson(GOOGLE_DRIVE_FILES.syncState, {
      type: "mrm-sync-state",
      version: 1,
      lastSyncAt: Date.now(),
      deviceId: snapshot.deviceId,
      knownDevices: {
        [snapshot.deviceId]: {
          name: /Android/i.test(navigator.userAgent || "") ? "Firefox Android" : "Firefox Desktop",
          lastSeenAt: Date.now(),
        },
      },
      deleted: { libraryItemIds: [], queueItemIds: [] },
    }),
  ]);
  await browser.storage.local.set({
    mrmSyncSettings: {
      ...((await browser.storage.local.get(["mrmSyncSettings"])).mrmSyncSettings || {}),
      provider: "google-drive",
      enabled: true,
      lastSyncAt: Date.now(),
      lastSyncStatus: "push-ok",
      lastSyncError: null,
    },
  });
  await debug("info", "Google Drive push completed", {
    libraryItems: snapshot.libraryItems.length,
    queueItems: snapshot.downloadQueue.length,
  });
  await recordGoogleDriveSyncEvent("push-ok", { libraryItems: snapshot.libraryItems.length, queueItems: snapshot.downloadQueue.length });
  return { ok: true, action: "push", libraryItems: snapshot.libraryItems.length, queueItems: snapshot.downloadQueue.length, files: { libraryFile, queueFile, settingsFile, stateFile } };
}

async function pullGoogleDriveSync() {
  const local = await createLocalDriveSyncSnapshot();
  const [remoteLibrary, remoteQueue, remoteSettings] = await Promise.all([
    downloadAppDataJson(GOOGLE_DRIVE_FILES.library),
    downloadAppDataJson(GOOGLE_DRIVE_FILES.queue),
    downloadAppDataJson(GOOGLE_DRIVE_FILES.settings),
  ]);

  const backupKey = `mrmSyncBackup_${Date.now()}`;
  const backupIndexStorage = await browser.storage.local.get(["mrmSyncBackupIndex"]);
  const backupIndex = Array.isArray(backupIndexStorage.mrmSyncBackupIndex) ? backupIndexStorage.mrmSyncBackupIndex : [];
  backupIndex.unshift({ key: backupKey, createdAt: Date.now(), libraryItems: local.libraryItems.length, queueItems: local.downloadQueue.length });
  await browser.storage.local.set({
    [backupKey]: local,
    mrmSyncBackupIndex: backupIndex.slice(0, 5),
  });

  const remoteLibraryItems = Array.isArray(remoteLibrary?.libraryItems) ? remoteLibrary.libraryItems : [];
  const remoteQueueItems = Array.isArray(remoteQueue?.downloadQueue) ? remoteQueue.downloadQueue : [];
  const mergedLibraryItems = mergeLibraryItemsForSync(local.libraryItems, remoteLibraryItems);
  const mergedQueueItems = mergeQueueItemsForSync(local.downloadQueue, remoteQueueItems);

  const nextSettings = {
    ...local.settings,
    ...(remoteSettings?.settings || {}),
    mrmSettings: { ...(local.settings.mrmSettings || {}), ...(remoteSettings?.settings?.mrmSettings || {}) },
    librarySettings: { ...(local.settings.librarySettings || {}), ...(remoteSettings?.settings?.librarySettings || {}) },
    syncSettings: { ...(local.settings.syncSettings || {}), ...(remoteSettings?.settings?.syncSettings || {}) },
  };

  await browser.storage.local.set({
    [LIBRARY_KEY]: mergedLibraryItems,
    [DOWNLOAD_QUEUE_KEY]: mergedQueueItems,
    mrmSettings: nextSettings.mrmSettings,
    mrmLibrarySettings: nextSettings.librarySettings,
    mrmSyncSettings: {
      ...nextSettings.syncSettings,
      provider: "google-drive",
      enabled: true,
      lastSyncAt: Date.now(),
      lastSyncStatus: "pull-ok",
      lastSyncError: null,
    },
  });

  await debug("info", "Google Drive pull completed", {
    localLibraryItems: local.libraryItems.length,
    remoteLibraryItems: remoteLibraryItems.length,
    mergedLibraryItems: mergedLibraryItems.length,
    localQueueItems: local.downloadQueue.length,
    remoteQueueItems: remoteQueueItems.length,
    mergedQueueItems: mergedQueueItems.length,
  });
  await recordGoogleDriveSyncEvent("pull-ok", { libraryItems: mergedLibraryItems.length, queueItems: mergedQueueItems.length });

  return {
    ok: true,
    action: "pull",
    remoteFound: !!(remoteLibrary || remoteQueue || remoteSettings),
    libraryItems: mergedLibraryItems.length,
    queueItems: mergedQueueItems.length,
  };
}

async function runGoogleDriveSyncNow() {
  if (GOOGLE_DRIVE_SYNC_RUNNING) {
    return { ok: true, action: "sync", skipped: true, reason: "Sync already running." };
  }
  GOOGLE_DRIVE_SYNC_RUNNING = true;
  try {
    const pull = await pullGoogleDriveSync();
    const push = await pushGoogleDriveSync();
    await browser.storage.local.set({
      mrmSyncSettings: {
        ...((await browser.storage.local.get(["mrmSyncSettings"])).mrmSyncSettings || {}),
        provider: "google-drive",
        enabled: true,
        lastSyncAt: Date.now(),
        lastSyncStatus: "sync-ok",
        lastSyncError: null,
      },
    });
    await debug("info", "Google Drive sync completed", { pull, push });
    await recordGoogleDriveSyncEvent("sync-ok", { pull, push });
    return { ok: true, action: "sync", pull, push };
  } catch (error) {
    const errorMessage = String(error?.message || error);
    await browser.storage.local.set({
      mrmSyncSettings: {
        ...((await browser.storage.local.get(["mrmSyncSettings"])).mrmSyncSettings || {}),
        provider: "google-drive",
        lastSyncAt: Date.now(),
        lastSyncStatus: "sync-failed",
        lastSyncError: errorMessage,
      },
    });
    await debug("error", "Google Drive sync failed", { error: errorMessage });
    throw error;
  } finally {
    GOOGLE_DRIVE_SYNC_RUNNING = false;
  }
}

async function getGoogleDriveSyncStatus() {
  const [oauth, data] = await Promise.all([
    getGoogleDriveOAuthStatus(),
    browser.storage.local.get(["mrmSyncSettings"]),
  ]);
  return {
    ok: true,
    oauth,
    syncSettings: data.mrmSyncSettings || {},
    files: GOOGLE_DRIVE_FILES,
  };
}

async function setGoogleDriveAutoSyncSettings(patch = {}) {
  const result = await browser.storage.local.get(["mrmSyncSettings"]);
  const current = result.mrmSyncSettings || {};
  const next = {
    ...current,
    provider: "google-drive",
    enabled: !!patch.enabled,
    autoSyncOnStartup: !!patch.autoSyncOnStartup,
    autoSyncOnLibraryChange: !!patch.autoSyncOnLibraryChange,
    autoSyncDelaySeconds: Math.max(10, Math.min(900, Number(patch.autoSyncDelaySeconds || current.autoSyncDelaySeconds || 60))),
  };
  await browser.storage.local.set({ mrmSyncSettings: next });
  await debug("info", "Google Drive auto-sync settings updated", next);
  return { ok: true, syncSettings: next };
}

async function scheduleGoogleDriveAutoSyncFromStorage(reason = "storage-change") {
  const result = await browser.storage.local.get(["mrmSyncSettings"]);
  const syncSettings = result.mrmSyncSettings || {};
  if (!syncSettings.enabled || !syncSettings.autoSyncOnLibraryChange) return;
  clearTimeout(GOOGLE_DRIVE_AUTO_SYNC_TIMER);
  GOOGLE_DRIVE_AUTO_SYNC_TIMER = setTimeout(async () => {
    try {
      await debug("info", "Google Drive auto-sync started", { reason });
      await runGoogleDriveSyncNow();
    } catch (error) {
      await debug("warn", "Google Drive auto-sync failed", { reason, error: String(error?.message || error) });
    }
  }, 1000 * Math.max(10, Math.min(900, Number(syncSettings.autoSyncDelaySeconds || 60))));
}

browser.storage.onChanged.addListener((changes, areaName) => {
  if (areaName !== "local") return;
  if (!changes[LIBRARY_KEY] && !changes[DOWNLOAD_QUEUE_KEY] && !changes.mrmSettings && !changes.mrmLibrarySettings) return;
  scheduleGoogleDriveAutoSyncFromStorage("local-data-change");
});

(async () => {
  try {
    const result = await browser.storage.local.get(["mrmSyncSettings", GOOGLE_DRIVE_AUTH_KEY]);
    const syncSettings = result.mrmSyncSettings || {};
    const auth = result[GOOGLE_DRIVE_AUTH_KEY] || {};
    if (syncSettings.enabled && syncSettings.autoSyncOnStartup && auth.connected) {
      setTimeout(() => runGoogleDriveSyncNow().catch((error) => debug("warn", "Google Drive startup auto-sync failed", { error: String(error?.message || error) })), 5000);
    }
  } catch {}
})();




function blobToDataUrl(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(reader.error || new Error("Could not read cover blob."));
    reader.readAsDataURL(blob);
  });
}

async function cacheCoverDataUrl(coverUrl, pageUrl = "") {
  const url = String(coverUrl || "").trim();
  if (!url || /^data:/i.test(url)) return url;

  const response = await fetch(url, {
    credentials: "include",
    cache: "force-cache",
    referrer: pageUrl || undefined,
  });

  if (!response.ok) {
    throw new Error(`Cover fetch failed: HTTP ${response.status}`);
  }

  const blob = await response.blob();
  const type = String(blob.type || "").toLowerCase();
  if (type && !type.startsWith("image/")) {
    throw new Error(`Cover fetch returned non-image content: ${type}`);
  }

  if (blob.size > 1536 * 1024) {
    throw new Error(`Cover image is too large to cache: ${blob.size} bytes`);
  }

  return blobToDataUrl(blob);
}

async function enrichMetadataWithCachedCover(metadata, reason = "metadata-refresh") {
  if (!metadata || metadata.coverDataUrl) return metadata;
  const coverUrl = metadata.thumbnailUrl || metadata.coverUrl || "";
  if (!coverUrl) return metadata;

  try {
    const coverDataUrl = await cacheCoverDataUrl(coverUrl, metadata.canonicalUrl || metadata.url || "");
    await debug("info", "Library cover cached locally", {
      reason,
      url: metadata.canonicalUrl || metadata.url || "",
      coverUrl,
      bytes: coverDataUrl.length,
    });
    return { ...metadata, coverDataUrl };
  } catch (error) {
    await debug("warn", "Library cover cache failed; keeping remote URL", {
      reason,
      url: metadata.canonicalUrl || metadata.url || "",
      coverUrl,
      error: String(error?.message || error),
    });
    return metadata;
  }
}


function getQueueBadgeCount(queue) {
  if (!Array.isArray(queue)) return 0;
  return queue.filter((item) => {
    const status = String(item?.status || "pending").toLowerCase();
    return !["completed", "done"].includes(status);
  }).length;
}

function formatBadgeText(count) {
  if (!count) return "";
  return count > 99 ? "99+" : String(count);
}

async function updateQueueBadge(queue = null) {
  try {
    let items = queue;
    if (!Array.isArray(items)) {
      const result = await browser.storage.local.get([DOWNLOAD_QUEUE_KEY]);
      items = Array.isArray(result[DOWNLOAD_QUEUE_KEY]) ? result[DOWNLOAD_QUEUE_KEY] : [];
    }

    const count = getQueueBadgeCount(items);
    await browser.browserAction.setBadgeText({ text: formatBadgeText(count) });
    await browser.browserAction.setBadgeBackgroundColor({ color: count ? "#ff7a33" : "#000000" });
  } catch (error) {
    console.warn("[MRM] Could not update queue badge:", error);
  }
}

browser.storage.onChanged.addListener((changes, areaName) => {
  if (areaName !== "local" || !changes[DOWNLOAD_QUEUE_KEY]) return;
  updateQueueBadge(changes[DOWNLOAD_QUEUE_KEY].newValue);
});

browser.runtime.onInstalled.addListener(() => updateQueueBadge());
browser.runtime.onStartup?.addListener?.(() => {
  updateQueueBadge();
  scheduleBackgroundQueueProcess("startup", {});
});
updateQueueBadge();
scheduleBackgroundQueueProcess("background-load", {});




function normalizeDownloadFilename(filename, extension = "cbz") {
  const ext = String(extension || "cbz").replace(/^\.+/, "") || "cbz";
  if (ext.toLowerCase() === "cbz") return sanitizeDownloadFilename(filename);
  let value = sanitizeDownloadFilename(String(filename || `download.${ext}`).replace(/\.cbz$/i, `.${ext}`));
  value = value.replace(/\.cbz$/i, "");
  return `${value}.${ext}`;
}

function sanitizeZipEntryName(name) {
  const raw = String(name || "page.jpg").replace(/[\\/:*?"<>|[\]{}()+]+/g, "_");
  const parts = raw.split(".");
  const ext = parts.length > 1 ? parts.pop().replace(/[^A-Za-z0-9]/g, "").slice(0, 8) : "jpg";
  const base = sanitizeDownloadFilename(parts.join(".") || "page", "page").replace(/\.cbz$/i, "");
  return `${base}.${ext || "jpg"}`;
}

function asAndroidSafeArchiveBlob(blob) {
  return new Blob([blob], { type: "application/octet-stream" });
}


function isAndroidDevice() {
  return /Android/i.test(navigator.userAgent || "");
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function getCurrentActiveTab(windowId = null) {
  const query = { active: true, currentWindow: true };
  if (typeof windowId === "number") {
    delete query.currentWindow;
    query.windowId = windowId;
  }
  const [tab] = await browser.tabs.query(query);
  return tab || null;
}

async function restoreActiveTab(tabId) {
  if (!tabId) return false;

  try {
    await delay(150);
    await browser.tabs.update(tabId, { active: true });
    return true;
  } catch (error) {
    await debug("warn", "Could not restore original active tab", {
      tabId,
      error: String(error?.message || error),
    });
    return false;
  }
}

function isImageHost(urlString) {
  try {
    const u = new URL(urlString);
    return IMAGE_HOSTS.includes(u.hostname);
  } catch {
    return false;
  }
}

function isMyReadingMangaUrl(urlString) {
  try {
    return new URL(urlString).hostname.replace(/^www\./, "") === "myreadingmanga.info";
  } catch {
    return false;
  }
}

async function isDebugEnabled() {
  try {
    const result = await browser.storage.local.get(["mrmSettings"]);
    return !!result.mrmSettings?.debugMode;
  } catch {
    return false;
  }
}

async function isAndroidBackgroundTabFixEnabled() {
  try {
    const result = await browser.storage.local.get(["mrmSettings"]);
    const value = result.mrmSettings?.androidBackgroundTabFix;

    if (typeof value === "boolean") {
      return value;
    }

    return isAndroidDevice();
  } catch {
    return isAndroidDevice();
  }
}

async function debug(level, message, meta = null) {
  if (!(await isDebugEnabled())) return;
  const prefix = `[MRM Debug][Background] ${message}`;
  const fn = level === "error" ? console.error : level === "warn" ? console.warn : console.log;
  fn(prefix, meta ?? "");
  await appendBackgroundLog(level, message, meta);
}


async function recordGoogleDriveSyncEvent(status, meta = {}) {
  try {
    const result = await browser.storage.local.get([GOOGLE_DRIVE_SYNC_HISTORY_KEY]);
    const history = Array.isArray(result[GOOGLE_DRIVE_SYNC_HISTORY_KEY]) ? result[GOOGLE_DRIVE_SYNC_HISTORY_KEY] : [];
    history.unshift({
      id: `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      timestamp: new Date().toISOString(),
      status,
      ...meta,
    });
    await browser.storage.local.set({ [GOOGLE_DRIVE_SYNC_HISTORY_KEY]: history.slice(0, 50) });
  } catch {}
}


function normalizeLibraryUrl(rawUrl) {
  try {
    const url = new URL(rawUrl);
    url.hash = "";
    ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content", "fbclid", "gclid"].forEach((key) => url.searchParams.delete(key));
    url.pathname = url.pathname.replace(/\/+$/, "/");
    return url.toString();
  } catch {
    return String(rawUrl || "").trim();
  }
}

async function markLibraryDownloadedByUrl(rawUrl, patch = {}) {
  const result = await browser.storage.local.get([LIBRARY_KEY, DOWNLOAD_QUEUE_KEY]);
  const items = Array.isArray(result[LIBRARY_KEY]) ? result[LIBRARY_KEY] : [];
  const normalizedUrl = normalizeLibraryUrl(rawUrl);
  let changed = false;
  const nextItems = items.map((item) => {
    const itemUrl = normalizeLibraryUrl(item.canonicalUrl || item.url || "");
    const altUrl = normalizeLibraryUrl(item.url || "");
    if (itemUrl !== normalizedUrl && altUrl !== normalizedUrl) return item;
    changed = true;
    return {
      ...item,
      downloaded: true,
      downloadCount: Number(item.downloadCount || 0) + 1,
      lastDownloadedAt: Date.now(),
      pageCount: patch.pageCount || item.pageCount || null,
      coverDataUrl: item.coverDataUrl || patch.coverDataUrl || "",
      coverFallbackSource: item.coverDataUrl ? item.coverFallbackSource || "" : patch.coverFallbackSource || item.coverFallbackSource || "",
      updatedAt: Date.now(),
    };
  });

  let queueChanged = false;
  const queue = Array.isArray(result[DOWNLOAD_QUEUE_KEY]) ? result[DOWNLOAD_QUEUE_KEY] : [];
  const nextQueue = queue.map((item) => {
    const itemUrl = normalizeQueueUrl(item.url || "");
    if (itemUrl !== normalizedUrl) return item;
    const status = String(item.status || "").toLowerCase();
    if (["completed", "done", "cancelled"].includes(status)) return item;
    queueChanged = true;
    return {
      ...item,
      status: "completed",
      phase: "completed",
      progress: 100,
      progressLabel: "Completed",
      completedAt: Date.now(),
      updatedAt: Date.now(),
      lastProgressAt: Date.now(),
      lastError: null,
      count: Number(patch.pageCount || item.count || 0),
      totalImages: Number(patch.pageCount || item.totalImages || item.count || 0),
      currentImage: Number(patch.pageCount || item.currentImage || item.count || 0),
      filename: String(item.filename || patch.filename || ""),
    };
  });

  if (changed || queueChanged) {
    if (patch.coverDataUrl) PENDING_COVER_GENERATION_URLS.delete(normalizedUrl);
    const nextStorage = {};
    if (changed) nextStorage[LIBRARY_KEY] = nextItems;
    if (queueChanged) nextStorage[DOWNLOAD_QUEUE_KEY] = nextQueue;
    await browser.storage.local.set(nextStorage);
    await debug("info", "Marked Library item downloaded", {
      url: normalizedUrl,
      coverFallbackSaved: !!patch.coverDataUrl,
      coverFallbackSource: patch.coverFallbackSource || "",
      queueCompleted: queueChanged,
    });
    if (queueChanged) {
      scheduleBackgroundQueueProcess("library-download-marked", {});
    }
  }
  return { ok: true, changed: changed || queueChanged };
}


async function updateLibraryCoverByUrl(rawUrl, patch = {}) {
  const result = await browser.storage.local.get([LIBRARY_KEY]);
  const items = Array.isArray(result[LIBRARY_KEY]) ? result[LIBRARY_KEY] : [];
  const normalizedUrl = normalizeLibraryUrl(rawUrl);
  let changed = false;
  const nextItems = items.map((item) => {
    const itemUrl = normalizeLibraryUrl(item.canonicalUrl || item.url || "");
    const altUrl = normalizeLibraryUrl(item.url || "");
    if (itemUrl !== normalizedUrl && altUrl !== normalizedUrl) return item;
    if (!patch.coverDataUrl && !patch.coverUrl && !patch.thumbnailUrl) return item;
    changed = true;
    return {
      ...item,
      pageCount: patch.pageCount || item.pageCount || null,
      coverUrl: item.coverUrl || patch.coverUrl || "",
      thumbnailUrl: item.thumbnailUrl || patch.thumbnailUrl || patch.coverUrl || "",
      coverDataUrl: item.coverDataUrl || patch.coverDataUrl || "",
      coverFallbackSource: item.coverDataUrl ? item.coverFallbackSource || "" : patch.coverFallbackSource || item.coverFallbackSource || "",
      updatedAt: Date.now(),
      lastCheckedAt: Date.now(),
    };
  });
  if (changed) {
    PENDING_COVER_GENERATION_URLS.delete(normalizedUrl);
    await browser.storage.local.set({ [LIBRARY_KEY]: nextItems });
    await debug("info", "Updated Library item cover", {
      url: normalizedUrl,
      coverSaved: !!patch.coverDataUrl,
      coverFallbackSource: patch.coverFallbackSource || "",
    });
  }
  return { ok: true, changed };
}

async function openLibraryCoverGenerationTab(message, sender) {
  const sourceTab = sender.tab || (await getCurrentActiveTab());
  const sourceTabId = sourceTab?.id || null;
  const rawUrl = message.item?.url || message.item?.canonicalUrl || message.url;
  const normalizedCoverUrl = normalizeLibraryUrl(rawUrl);

  if (PENDING_COVER_GENERATION_URLS.has(normalizedCoverUrl)) {
    await debug("info", "Library cover-only generation already pending", {
      url: normalizedCoverUrl,
      itemId: message.item?.id || "",
    });
    return { ok: true, pending: true };
  }

  PENDING_COVER_GENERATION_URLS.add(normalizedCoverUrl);
  window.setTimeout(() => PENDING_COVER_GENERATION_URLS.delete(normalizedCoverUrl), 120000);

  const url = new URL(rawUrl);
  url.hash = "mrm-generate-cover";
  const createOptions = { url: url.toString(), active: false };
  if (sourceTabId) createOptions.openerTabId = sourceTabId;

  try {
    let created;
    try {
      created = await browser.tabs.create(createOptions);
    } catch (error) {
      delete createOptions.openerTabId;
      created = await browser.tabs.create(createOptions);
      await debug("warn", "Created Library cover-only generation tab without openerTabId", { error: String(error?.message || error) });
    }

    if (created.id) AUTO_DOWNLOAD_TAB_IDS.add(created.id);

    const androidBackgroundTabFix = await isAndroidBackgroundTabFixEnabled();
    const restored = androidBackgroundTabFix ? await restoreActiveTab(sourceTabId) : false;
    await debug("info", "Opened Library cover-only generation tab", {
      tabId: created.id,
      url: created.url,
      restored,
      androidBackgroundTabFix,
      itemId: message.item?.id || "",
      coverOnly: true,
    });
    return { ok: true, tabId: created.id, restored, androidBackgroundTabFix, coverOnly: true };
  } catch (error) {
    PENDING_COVER_GENERATION_URLS.delete(normalizedCoverUrl);
    throw error;
  }
}


async function openLibraryDownloadTab(message, sender) {
  const sourceTab = sender.tab || (await getCurrentActiveTab());
  const sourceTabId = sourceTab?.id || null;
  const url = new URL(message.item?.url || message.url);
  url.hash = "mrm-download-cbz";
  const createOptions = { url: url.toString(), active: false };
  if (sourceTabId) createOptions.openerTabId = sourceTabId;

  let created;
  try {
    created = await browser.tabs.create(createOptions);
  } catch (error) {
    delete createOptions.openerTabId;
    created = await browser.tabs.create(createOptions);
    await debug("warn", "Created Library download tab without openerTabId", { error: String(error?.message || error) });
  }

  if (created.id) AUTO_DOWNLOAD_TAB_IDS.add(created.id);

  const androidBackgroundTabFix = await isAndroidBackgroundTabFixEnabled();
  const restored = androidBackgroundTabFix ? await restoreActiveTab(sourceTabId) : false;
  await debug("info", "Opened Library download tab", { tabId: created.id, url: created.url, restored, androidBackgroundTabFix });
  return { ok: true, tabId: created.id, restored, androidBackgroundTabFix };
}


function safeMetadataJobKey() {
  return `${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}


async function injectMetadataRunnerForTab(tabId, jobId, reason = "tab-complete") {
  if (!tabId || !jobId || !PENDING_METADATA_TAB_JOBS.has(jobId)) return false;

  try {
    await debug("info", "Injecting metadata extraction runner", { tabId, jobId, reason });
    const files = [
      "scripts/mrm-common.js",
      "scripts/library-store.js",
      "scripts/metadata-extractor.js",
      "scripts/metadata-tab-runner.js",
    ];

    for (const file of files) {
      await browser.tabs.executeScript(tabId, { file, runAt: "document_idle" });
    }

    return true;
  } catch (error) {
    await debug("error", "Metadata runner injection failed", {
      tabId,
      jobId,
      reason,
      error: String(error?.message || error),
    });
    return false;
  }
}

browser.tabs.onUpdated.addListener((tabId, changeInfo) => {
  if (changeInfo.status !== "complete") return;

  for (const [jobId, job] of PENDING_METADATA_TAB_JOBS.entries()) {
    if (job.tabId !== tabId || job.runnerInjected) continue;
    job.runnerInjected = true;
    window.setTimeout(() => {
      injectMetadataRunnerForTab(tabId, jobId, "tabs.onUpdated.complete");
    }, 1000);
  }
});

async function openMetadataExtractionTab(message, sender) {
  const sourceTab = sender.tab || (await getCurrentActiveTab());
  const sourceTabId = sourceTab?.id || null;
  const url = new URL(message.url);
  const jobId = safeMetadataJobKey();
  url.searchParams.set("mrm_metadata_job", jobId);
  url.hash = `mrm-extract-metadata=${encodeURIComponent(jobId)}`;

  const timeoutMs = Number(message.timeoutMs || 90000);
  const createOptions = { url: url.toString(), active: false };
  if (sourceTabId) createOptions.openerTabId = sourceTabId;

  return new Promise(async (resolve) => {
    let timeoutId = null;

    const cleanup = async (tabId = null) => {
      if (timeoutId) clearTimeout(timeoutId);
      PENDING_METADATA_TAB_JOBS.delete(jobId);
      if (tabId) {
        setTimeout(() => {
          browser.tabs.remove(tabId).catch(() => {});
        }, 750);
      }
    };

    PENDING_METADATA_TAB_JOBS.set(jobId, {
      tabId: null,
      runnerInjected: false,
      resolve: async (payload, tabId) => {
        await cleanup(tabId);
        resolve(payload);
      },
    });

    timeoutId = setTimeout(async () => {
      await cleanup();
      await debug("error", "Metadata extraction tab timed out", { url: message.url, jobId });
      resolve({ ok: false, error: "Metadata extraction timed out." });
    }, timeoutMs);

    try {
      let created;
      try {
        created = await browser.tabs.create(createOptions);
      } catch (error) {
        delete createOptions.openerTabId;
        created = await browser.tabs.create(createOptions);
        await debug("warn", "Created metadata extraction tab without openerTabId", { error: String(error?.message || error) });
      }

      const job = PENDING_METADATA_TAB_JOBS.get(jobId);
      if (job) job.tabId = created.id;

      const androidBackgroundTabFix = await isAndroidBackgroundTabFixEnabled();
      const restored = androidBackgroundTabFix ? await restoreActiveTab(sourceTabId) : false;
      await debug("info", "Opened metadata extraction tab", { tabId: created.id, url: created.url, restored, androidBackgroundTabFix, jobId });

      window.setTimeout(() => {
        const pendingJob = PENDING_METADATA_TAB_JOBS.get(jobId);
        if (!pendingJob || pendingJob.runnerInjected) return;
        pendingJob.runnerInjected = true;
        injectMetadataRunnerForTab(created.id, jobId, "post-create-fallback");
      }, 4500);
    } catch (error) {
      await cleanup();
      await debug("error", "Could not open metadata extraction tab", { url: message.url, error: String(error?.message || error), jobId });
      resolve({ ok: false, error: String(error?.message || error) });
    }
  });
}

browser.runtime.onMessage.addListener((message, sender) => {
  verbose("Runtime message received", { type: message?.type || "", senderTabId: sender?.tab?.id || null });
  if (!message || !message.type) return undefined;

  if (message.type === "MRM_GET_OAUTH_REDIRECT_URL") {

if (message.type === "MRM_GET_PAGE_CONTEXT") {
  return Promise.resolve({
    ok: true,
    tabId: sender?.tab?.id ?? null,
    windowId: sender?.tab?.windowId ?? null,
    url: sender?.tab?.url || "",
    title: sender?.tab?.title || "",
  });
}

    return (async () => {
      const authMode = getGoogleDriveOAuthMode(message.clientId, message.oauthMode || "auto");
      const clientId = sanitizeGoogleClientId(getDefaultGoogleDriveClientIdForMode(authMode, message.clientId));
      const redirectUrl = await getGoogleDriveRedirectUrlForMode(authMode);
      await debug("info", "OAuth redirect URL requested", { redirectUrl, authMode });
      return { ok: true, redirectUrl, authFlow: authMode };
    })().catch((error) => ({ ok: false, error: String(error?.message || error) }));
  }

  if (message.type === "MRM_GOOGLE_DRIVE_OAUTH_PREPARE_TAB") {
    return prepareGoogleDriveOAuthTabSession(message.clientId, message.oauthMode || "auto", message.clientSecret || "").catch(async (error) => {
      const errorMessage = String(error?.message || error);
      await debug("error", "Google Drive OAuth page-initiated prepare failed", { error: errorMessage });
      return { ok: false, error: errorMessage };
    });
  }

  if (message.type === "MRM_GOOGLE_DRIVE_OAUTH_REGISTER_TAB") {
    return registerGoogleDriveOAuthTabSession(message.sessionId, message.tabId).catch(async (error) => {
      const errorMessage = String(error?.message || error);
      await debug("error", "Google Drive OAuth page-initiated tab register failed", { error: errorMessage });
      return { ok: false, error: errorMessage };
    });
  }

  if (message.type === "MRM_GOOGLE_DRIVE_OAUTH_SESSION_STATUS") {
    return Promise.resolve(getGoogleDriveOAuthTabSessionStatus(message.sessionId));
  }

  if (message.type === "MRM_GOOGLE_DRIVE_OAUTH_TEST") {
    return runGoogleDriveOAuthTest(message.clientId, message.oauthMode || "auto", message.clientSecret || "").catch(async (error) => {
      const errorMessage = String(error?.message || error);
      await debug("error", "Google Drive OAuth test failed", { error: errorMessage });
      return { ok: false, error: errorMessage };
    });
  }

  if (message.type === "MRM_GOOGLE_DRIVE_OAUTH_STATUS") {
    return getGoogleDriveOAuthStatus().catch((error) => ({ ok: false, error: String(error?.message || error) }));
  }

  if (message.type === "MRM_GOOGLE_DRIVE_COMPLETE_MANUAL_REDIRECT") {
    return completeGoogleDriveOAuthFromManualRedirect(message.redirectUrl, message.clientId, message.oauthMode || "auto", message.clientSecret || "").catch(async (error) => {
      const errorMessage = String(error?.message || error);
      await debug("error", "Google Drive OAuth manual redirect failed", { error: errorMessage });
      return { ok: false, error: errorMessage };
    });
  }

  if (message.type === "MRM_GOOGLE_DRIVE_DISCONNECT") {
    return disconnectGoogleDriveOAuthTest().catch((error) => ({ ok: false, error: String(error?.message || error) }));
  }

  if (message.type === "MRM_GOOGLE_DRIVE_SYNC_STATUS") {
    return getGoogleDriveSyncStatus().catch((error) => ({ ok: false, error: String(error?.message || error) }));
  }

  if (message.type === "MRM_GOOGLE_DRIVE_FORCE_PUSH_LOCAL") {
    return pushGoogleDriveSync().catch((error) => ({ ok: false, error: String(error?.message || error) }));
  }

  if (message.type === "MRM_GOOGLE_DRIVE_FORCE_PULL_REMOTE") {
    return pullGoogleDriveSync().catch((error) => ({ ok: false, error: String(error?.message || error) }));
  }

  if (message.type === "MRM_GOOGLE_DRIVE_PUSH_LOCAL") {
    return pushGoogleDriveSync().catch(async (error) => {
      const errorMessage = String(error?.message || error);
      await debug("error", "Google Drive push failed", { error: errorMessage });
      return { ok: false, error: errorMessage };
    });
  }

  if (message.type === "MRM_GOOGLE_DRIVE_PULL_REMOTE") {
    return pullGoogleDriveSync().catch(async (error) => {
      const errorMessage = String(error?.message || error);
      await debug("error", "Google Drive pull failed", { error: errorMessage });
      return { ok: false, error: errorMessage };
    });
  }

  if (message.type === "MRM_GOOGLE_DRIVE_SYNC_NOW") {
    return runGoogleDriveSyncNow().catch((error) => ({ ok: false, error: String(error?.message || error) }));
  }

  if (message.type === "MRM_GOOGLE_DRIVE_AUTO_SYNC_SETTINGS") {
    return setGoogleDriveAutoSyncSettings(message.settings || {}).catch((error) => ({ ok: false, error: String(error?.message || error) }));
  }



  if (message.type === "MRM_SET_LAST_SUPPORTED_TAB_CONTEXT") {
    return (async () => {
      const payload = {
        tabId: sender?.tab?.id ?? null,
        windowId: sender?.tab?.windowId ?? null,
        url: sender?.tab?.url || message.url || "",
        title: sender?.tab?.title || message.title || "",
        host: (() => {
          try { return new URL(sender?.tab?.url || message.url || "").hostname.replace(/^www\./, ""); }
          catch { return ""; }
        })(),
        updatedAt: Date.now(),
      };
      if (!payload.url) return { ok: false, error: "Missing URL" };
      await browser.storage.local.set({ [LAST_SUPPORTED_TAB_CONTEXT_KEY]: payload });
      return { ok: true, context: payload };
    })().catch((error) => ({ ok: false, error: String(error?.message || error) }));
  }

  if (message.type === "MRM_UPDATE_DOWNLOAD_QUEUE_ITEM") {
    return (async () => {
      const result = await updateDownloadQueueItemByIdOrUrl(message.id || "", message.url || "", message.patch || {});
      const status = String(message.patch?.status || "").toLowerCase();
      const previousStatus = String(result?.previousStatus || "").toLowerCase();
      const settings = await getMrmSettings();
      if (
        result?.ok &&
        settings.queueAutoStartEnabled &&
        !settings.queuePauseAfterCurrentEnabled &&
        ["completed", "failed"].includes(status) &&
        status !== previousStatus
      ) {
        scheduleBackgroundQueueProcess("queue-item-finished", {});
      }
      return result;
    })().catch(async (error) => {
      const errorMessage = String(error?.message || error);
      await debug("error", "Queue status update failed", {
        id: message.id || "",
        url: message.url || "",
        error: errorMessage,
      });
      return { ok: false, error: errorMessage };
    });
  }

  if (message.type === "MRM_ADD_TO_DOWNLOAD_QUEUE") {
    return (async () => {
      const result = await addDownloadQueueItem(message.item || {});
      const settings = await getMrmSettings();
      if (settings.queueAutoStartEnabled && !settings.queuePauseAfterCurrentEnabled && result?.ok && !result?.unchanged) {
        scheduleBackgroundQueueProcess("queue-add", { preferredTabId: sender?.tab?.id || null });
      }
      return result;
    })().catch(async (error) => {
      const errorMessage = String(error?.message || error);
      await debug("error", "Queue add failed", {
        url: message.item?.url || "",
        title: message.item?.title || "",
        error: errorMessage,
      });
      return { ok: false, error: errorMessage };
    });
  }

  if (message.type === "MRM_PROCESS_DOWNLOAD_QUEUE") {
    return processDownloadQueueInBackground({
      selectedOnly: !!message.selectedOnly,
      preferredTabId: sender?.tab?.id || null,
      reason: message.reason || "manual",
      autoStart: false,
    }).catch(async (error) => {
      const errorMessage = String(error?.message || error);
      await debug("error", "Background queue process failed", { error: errorMessage, reason: message.reason || "" });
      return { ok: false, error: errorMessage };
    });
  }

  if (message.type === "MRM_OPEN_LIBRARY_PAGE") {
    return browser.tabs.create({ url: browser.runtime.getURL("library.html") }).then((tab) => ({ ok: true, tabId: tab.id }));
  }

  if (message.type === "MRM_LIBRARY_DOWNLOAD_ITEM") {
    return openLibraryDownloadTab(message, sender);
  }

  if (message.type === "MRM_LIBRARY_GENERATE_COVER_FROM_DOWNLOAD") {
    return openLibraryCoverGenerationTab(message, sender);
  }

  if (message.type === "MRM_EXTRACT_METADATA_IN_TAB") {
    return openMetadataExtractionTab(message, sender);
  }

  if (message.type === "MRM_METADATA_TAB_RESULT") {
    return (async () => {
      const jobId = String(message.jobId || "");
      const job = PENDING_METADATA_TAB_JOBS.get(jobId);
      if (!job) return { ok: false, error: "Metadata job not found." };
      const tabId = sender.tab?.id || null;
      let metadata = message.metadata || null;
      if (message.ok && metadata) {
        metadata = await enrichMetadataWithCachedCover(metadata, "metadata-tab-result");
      }
      await debug(message.ok ? "info" : "error", message.ok ? "Metadata extraction tab completed" : "Metadata extraction tab failed", {
        jobId,
        tabId,
        url: metadata?.canonicalUrl || metadata?.url || sender.tab?.url || "",
        error: message.error || null,
      });
      await job.resolve({ ok: !!message.ok, metadata, error: message.error || null }, tabId);
      return { ok: true };
    })();
  }

  if (message.type === "MRM_CACHE_COVER_DATA_URL") {
    return (async () => {
      const pageUrl = message.pageUrl || sender.tab?.url || "";
      try {
        const coverDataUrl = await cacheCoverDataUrl(message.coverUrl, pageUrl);
        await debug("info", "Library cover cached locally on request", {
          reason: message.reason || "manual",
          coverUrl: message.coverUrl || "",
          pageUrl,
          bytes: coverDataUrl.length,
        });
        return { ok: true, coverDataUrl };
      } catch (error) {
        const errorMessage = String(error?.message || error);

        if (isMyReadingMangaUrl(pageUrl)) {
          const fallback = await openLibraryCoverGenerationTab({
            url: pageUrl,
            item: {
              id: message.itemId || "",
              url: pageUrl,
              canonicalUrl: pageUrl,
            },
          }, sender).catch((fallbackError) => ({
            ok: false,
            error: String(fallbackError?.message || fallbackError),
          }));

          await debug(fallback?.ok ? "info" : "warn", fallback?.ok ? "Library cover cache switched to MRM cover-only fallback" : "Library cover-only fallback failed to start", {
            reason: message.reason || "manual",
            coverUrl: message.coverUrl || "",
            pageUrl,
            originalError: errorMessage,
            fallbackError: fallback?.error || "",
            pending: !!fallback?.pending,
            coverOnly: true,
          });

          return {
            ok: false,
            fallbackStarted: !!fallback?.ok,
            pending: !!fallback?.pending,
            coverOnly: true,
            error: errorMessage,
          };
        }

        await debug("warn", "Library cover cache request failed", {
          reason: message.reason || "manual",
          coverUrl: message.coverUrl || "",
          pageUrl,
          error: errorMessage,
        });
        return { ok: false, error: errorMessage };
      }
    })();
  }

  if (message.type === "MRM_MARK_LIBRARY_DOWNLOADED") {
    return markLibraryDownloadedByUrl(message.url, {
      pageCount: message.pageCount || null,
      coverDataUrl: message.coverDataUrl || "",
      coverFallbackSource: message.coverFallbackSource || "",
    });
  }

  if (message.type === "MRM_UPDATE_LIBRARY_COVER") {
    return updateLibraryCoverByUrl(message.url, {
      pageCount: message.pageCount || null,
      coverUrl: message.coverUrl || "",
      thumbnailUrl: message.thumbnailUrl || "",
      coverDataUrl: message.coverDataUrl || "",
      coverFallbackSource: message.coverFallbackSource || "",
    });
  }

  if (message.type === "MRM_OPEN_POST_DOWNLOAD_TAB") {
    return (async () => {
      const sourceTab = sender.tab || (await getCurrentActiveTab());
      const sourceTabId = sourceTab?.id || null;
      const url = new URL(message.url);

      if (!isMyReadingMangaUrl(url.toString())) {
        await debug("warn", "Skipped background post download tab for non-MyReadingManga host", { url: url.toString() });
        return { ok: false, error: "Background tab downloads are only used for myreadingmanga.info." };
      }

      url.hash = "mrm-download-cbz";

      const createOptions = {
        url: url.toString(),
        active: false,
      };

      if (sourceTabId) {
        createOptions.openerTabId = sourceTabId;
      }

      let created;
      try {
        created = await browser.tabs.create(createOptions);
      } catch (error) {
        delete createOptions.openerTabId;
        created = await browser.tabs.create(createOptions);
        await debug("warn", "Created download tab without openerTabId", {
          error: String(error?.message || error),
        });
      }

      if (created.id) {
        AUTO_DOWNLOAD_TAB_IDS.add(created.id);
      }

      const androidBackgroundTabFix = await isAndroidBackgroundTabFixEnabled();
      const restored = androidBackgroundTabFix ? await restoreActiveTab(sourceTabId) : false;
      await debug("info", "Opened background post download tab", {
        tabId: created.id,
        url: created.url,
        restored,
        androidBackgroundTabFix,
      });

      return { ok: true, tabId: created.id, restored, androidBackgroundTabFix };
    })();
  }


  if (message.type === "MRM_OPEN_QUEUED_DOWNLOAD_TAB") {
    return (async () => {
      const sourceTab = sender.tab || (await getCurrentActiveTab());
      return openQueuedDownloadTabFromBackground(message.url, sourceTab?.id || null);
    })();
  }



  if (message.type === "MRM_SAVE_BLOB_DOWNLOAD") {
    return (async () => {
      try {
        if (!message.blob || !message.filename) {
          return { ok: false, error: "Missing blob or filename" };
        }
        const filename = normalizeDownloadFilename(message.filename, "cbz");
        await verbose("Building background CBZ requested", { originalFilename: message.filename, sanitizedFilename: filename, fileCount: message.files.length });
        await verbose("Saving blob download requested", { originalFilename: message.filename, sanitizedFilename: filename });
        const archiveBlob = asAndroidSafeArchiveBlob(message.blob);
        const objectUrl = URL.createObjectURL(archiveBlob);
        try {
          const downloadId = await browser.downloads.download({
            url: objectUrl,
            filename,
            saveAs: false,
            conflictAction: "uniquify",
          });
          await debug("info", "Saved blob download", { filename, downloadId });
          return { ok: true, downloadId, filename };
        } finally {
          setTimeout(() => URL.revokeObjectURL(objectUrl), 30000);
        }
      } catch (error) {
        await debug("error", "Blob save failed", {
          filename: message.filename || "",
          sanitizedFilename: typeof filename !== "undefined" ? filename : normalizeDownloadFilename(message.filename || "download.cbz", "cbz"),
          error: String(error?.message || error),
        });
        return { ok: false, error: String(error?.message || error) };
      }
    })();
  }


  if (message.type === "MRM_BUILD_AND_SAVE_CBZ") {
    return (async () => {
      try {
        if (typeof JSZip === "undefined") {
          return { ok: false, error: "JSZip is not available in background context" };
        }
        if (!message.filename || !Array.isArray(message.files) || !message.files.length) {
          return { ok: false, error: "Missing archive files or filename" };
        }
        const zip = new JSZip();
        for (const file of message.files) {
          if (!file || !file.name || !file.data) continue;
          zip.file(sanitizeZipEntryName(file.name), file.data, { binary: true });
        }
        const filename = normalizeDownloadFilename(message.filename, "cbz");
        const blob = await zip.generateAsync({ type: "blob", mimeType: "application/octet-stream" });
        const archiveBlob = asAndroidSafeArchiveBlob(blob);
        const objectUrl = URL.createObjectURL(archiveBlob);
        try {
          const downloadId = await browser.downloads.download({
            url: objectUrl,
            filename,
            saveAs: false,
            conflictAction: "uniquify",
          });
          await debug("info", "Built and saved CBZ in background", {
            filename,
            fileCount: message.files.length,
            downloadId,
          });
          return { ok: true, downloadId, filename };
        } finally {
          setTimeout(() => URL.revokeObjectURL(objectUrl), 30000);
        }
      } catch (error) {
        await debug("error", "Background CBZ build failed", {
          filename: message.filename || "",
          sanitizedFilename: typeof filename !== "undefined" ? filename : normalizeDownloadFilename(message.filename || "download.cbz", "cbz"),
          error: String(error?.message || error),
        });
        return { ok: false, error: String(error?.message || error) };
      }
    })();
  }

  if (message.type === "MRM_APPEND_DEBUG") {
    return debug(message.level || "info", message.message || "", message.meta || null).then(() => ({ ok: true }));
  }

  if (message.type === "MRM_CLOSE_TAB_IF_BACKGROUND") {
    return (async () => {
      const tabId = sender.tab?.id;
      if (!tabId) return { ok: false, reason: "no-tab" };

      const tab = await browser.tabs.get(tabId);
      const isAutoDownloadTab = AUTO_DOWNLOAD_TAB_IDS.has(tabId) || new URL(tab.url || "about:blank").hash === "#mrm-download-cbz";

      if (tab.active && !isAutoDownloadTab) {
        await debug("info", "Skipped auto-close for active tab", { tabId, url: tab.url });
        return { ok: true, closed: false };
      }

      await browser.tabs.remove(tabId);
      AUTO_DOWNLOAD_TAB_IDS.delete(tabId);
      await debug("info", "Closed background download tab", { tabId, url: tab.url, isAutoDownloadTab });
      return { ok: true, closed: true };
    })();
  }

  return undefined;
});

browser.tabs.onRemoved.addListener((tabId) => {
  AUTO_DOWNLOAD_TAB_IDS.delete(tabId);
});

const requestIdToOrigin = new Map();

browser.webRequest.onBeforeSendHeaders.addListener(
  (details) => {
    if (!isImageHost(details.url)) return {};

    const headers = details.requestHeaders || [];
    let originValue;

    const lower = headers.map((h) => ({ name: h.name.toLowerCase(), value: h.value }));
    const hasReferer = lower.some((h) => h.name === "referer");
    const originHeader = lower.find((h) => h.name === "origin");
    if (originHeader && originHeader.value) {
      originValue = originHeader.value;
    }

    const pageUrl = details.originUrl || details.documentUrl || (PAGE_ORIGIN + "/");
    if (!hasReferer) {
      headers.push({ name: "Referer", value: pageUrl });
    }

    if (!originValue) {
      try {
        const o = new URL(pageUrl);
        originValue = o.origin;
        headers.push({ name: "Origin", value: originValue });
      } catch {}
    }

    if (originValue) {
      requestIdToOrigin.set(details.requestId, originValue);
    }

    return { requestHeaders: headers };
  },
  {
    urls: IMAGE_HOSTS.map((host) => `https://${host}/*`),
  },
  ["requestHeaders", "blocking"]
);

browser.webRequest.onHeadersReceived.addListener(
  (details) => {
    if (!isImageHost(details.url)) return {};

    const responseHeaders = details.responseHeaders || [];
    const filtered = responseHeaders.filter((h) => {
      const n = h.name.toLowerCase();
      return (
        n !== "access-control-allow-origin" &&
        n !== "access-control-allow-headers" &&
        n !== "access-control-allow-credentials" &&
        n !== "cross-origin-resource-policy"
      );
    });

    const originValue = requestIdToOrigin.get(details.requestId) || PAGE_ORIGIN;
    filtered.push({ name: "Access-Control-Allow-Origin", value: originValue });
    filtered.push({ name: "Access-Control-Allow-Credentials", value: "true" });
    filtered.push({ name: "Access-Control-Allow-Headers", value: "*" });
    requestIdToOrigin.delete(details.requestId);

    return { responseHeaders: filtered };
  },
  {
    urls: IMAGE_HOSTS.map((host) => `https://${host}/*`),
  },
  ["responseHeaders", "blocking"]
);

const cleanup = (details) => {
  requestIdToOrigin.delete(details.requestId);
};

browser.webRequest.onCompleted.addListener(cleanup, { urls: IMAGE_HOSTS.map((host) => `https://${host}/*`) });
browser.webRequest.onErrorOccurred.addListener(cleanup, { urls: IMAGE_HOSTS.map((host) => `https://${host}/*`) });