let currentDownload = null;
let downloadHistory = [];
let currentView = "main";
let historyQuickFilter = "all";
let debugQuickFilter = "all";
let queueQuickFilter = "all";
let mrmSettings = (window.MRMCommon.getDefaultSettings ? window.MRMCommon.getDefaultSettings() : {
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
  androidBackgroundTabFix: /Android/i.test(navigator.userAgent || ""),
  queueAutoStartEnabled: false,
  queuePauseAfterCurrentEnabled: false,
  queueConcurrency: 1,
  queueWifiOnly: false,
  compactMobileUi: /Android/i.test(navigator.userAgent || ""),
  stripPartSuffix: true,
  stripPageSuffix: false,
  includePageRangeInCbz: false,
});
let debugLogEntries = [];
let activeJobs = [];
let downloadQueue = [];
let isProcessingDownloadQueue = false;
const DOWNLOAD_QUEUE_KEY = "mrmDownloadQueue";
const LIBRARY_KEY = "mrmLibraryItems";

const { sanitizeFilename, clearChildren, createEl, showToast, fetchWithTimeout, getDebugLog, clearDebugLog, formatCookieHeader, maskValue, getActiveJobs, clampPercent, buildPagedArchiveFilename, getDefaultSettings = null, logVerboseAction = async () => {}, appendDebugLog = async () => {} } = window.MRMCommon;
let historyFilter = "all";
let queueSheetOpen = true;

const SUPPORTED_SITES = [
  { id: "myreadingmanga", title: "MyReadingManga", url: "https://myreadingmanga.info/", favicon: "https://myreadingmanga.info/favicon.ico" },
  { id: "mangalotus", title: "MangaLotus", url: "https://mangalotus.com/", favicon: "https://mangalotus.com/favicon.ico" },
  { id: "baramangaonline", title: "BaraMangaOnline", url: "https://baramangaonline.com/category/languages/english/", favicon: "https://baramangaonline.com/favicon.ico" },
  { id: "yaoimangaonline", title: "YaoiMangaOnline", url: "https://yaoimangaonline.com/bara-manga/", favicon: "https://yaoimangaonline.com/favicon.ico" },
  { id: "nhentai", title: "nhentai", url: "https://nhentai.net/", favicon: "https://nhentai.net/favicon.ico" },
];


function normalizeCbzFilename(filename) {
  let value = sanitizeFilename(String(filename || "download.cbz").replace(/\.cbz\.zip$/i, ".cbz").replace(/\.zip$/i, ""), "download");
  value = value.replace(/\.cbz$/i, "").replace(/[. _-]+$/g, "");
  return `${value || "download"}.cbz`;
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

function createAndroidSafeCbzBlob(blob) {
  return new Blob([blob], { type: "application/octet-stream" });
}

async function verbosePopup(message, meta = null) {
  if (!mrmSettings.debugMode || !mrmSettings.verboseDebugMode) return;
  await appendDebugLog("POPUP", "verbose", message, meta);
}



function getNamingSettings() {
  return {
    stripPartSuffix: mrmSettings.stripPartSuffix !== false,
    stripPageSuffix: !!mrmSettings.stripPageSuffix,
    includePageRangeInCbz: !!mrmSettings.includePageRangeInCbz,
  };
}

function normalizeArchiveTitleForDisplay(value) {
  let text = String(value || "").trim();
  const naming = getNamingSettings();
  if (naming.stripPartSuffix) {
    text = text.replace(/[\s._-]+(?:part|pt)[\s._-]*0*1\s*$/i, "");
  }
  if (naming.stripPageSuffix) {
    text = text.replace(/[\s._-]+page[\s._-]*0*1\s*$/i, "");
  }
  return text.replace(/[\s._-]+$/g, "").trim() || String(value || "").trim();
}

function getQueueStatusLabel(status, phase) {
  if (status === "opening") return "Opening";
  if (status === "started") return "Started";
  if (phase === "fetching") return "Fetching";
  if (phase === "packing") return "Packing";
  if (status === "completed") return "Done";
  if (status === "failed") return "Failed";
  return status ? status.charAt(0).toUpperCase() + status.slice(1) : "Queued";
}

function getQueueDiagnosticReason(item, activeJob, status) {
  if (!!mrmSettings.queueWifiOnly && !navigator.onLine) return "Waiting for network access.";
  if (!!mrmSettings.queueWifiOnly && navigator.connection && navigator.connection.type && navigator.connection.type !== "wifi") {
    return "Waiting for Wi‑Fi.";
  }
  if (status === "failed") return item.lastError || "Last run failed.";
  if (status === "started") return "Started in background tab.";
  if (status === "opening") return "Opening worker tab.";
  if (activeJob && isActiveDownloadJob(activeJob)) return "Actively downloading.";
  if (item.selected === false) return "Not selected for bulk start.";
  if (!mrmSettings.queueAutoStartEnabled) return "Auto-start disabled.";
  return "Ready.";
}

function getQueueCounts() {
  const counts = { queued: 0, running: 0, done: 0, failed: 0 };
  for (const item of downloadQueue) {
    const status = String(item.status || "pending").toLowerCase();
    if (["completed", "done"].includes(status)) counts.done += 1;
    else if (status === "failed") counts.failed += 1;
    else if (["opening", "started", "fetching", "packing", "downloading", "running", "active"].includes(status)) counts.running += 1;
    else counts.queued += 1;
  }
  return counts;
}

function applyCompactMode() {
  document.body.classList.toggle("mrm-compact-android", !!mrmSettings.compactMobileUi);
}

function createSummaryDetails(summaryText, open = false, id = "") {
  const details = document.createElement("details");
  details.className = "mrm-collapsible";
  details.open = open;
  if (id) details.id = id;
  const summary = document.createElement("summary");
  summary.textContent = summaryText;
  details.appendChild(summary);
  return details;
}

function ensureEnhancedPopupLayout() {
  const contentWrap = document.querySelector(".content-wrap .scroll-view");
  if (!contentWrap) {
    applyCompactMode();
    return;
  }

  let dashboard = document.getElementById("activeDownloadsDashboard");
  if (!dashboard) {
    dashboard = document.createElement("div");
    dashboard.id = "activeDownloadsDashboard";
    dashboard.className = "active-dashboard-strip";

    const headerRow = document.createElement("div");
    headerRow.className = "active-strip-row";

    const copyWrap = document.createElement("div");
    copyWrap.className = "active-strip-copy";

    const title = document.createElement("div");
    title.className = "section-title compact-strip-title";
    title.textContent = "Queue";

    const subtitle = document.createElement("div");
    subtitle.className = "section-subtitle compact-strip-subtitle";
    subtitle.id = "activeDashboardSummary";
    subtitle.textContent = "0 running · 0 queued · 0 done · 0 failed";

    copyWrap.append(title, subtitle);

    const statsContainer = document.createElement("div");
    statsContainer.id = "activeDashboardStats";
    statsContainer.className = "dashboard-stats compact-dashboard-stats";

    headerRow.append(copyWrap, statsContainer);
    dashboard.appendChild(headerRow);

    const shell = document.querySelector(".popup-app");
    const content = document.querySelector(".content-wrap");
    if (shell && content) {
      shell.insertBefore(dashboard, content);
    }

    const mainCard = document.querySelector("#mainContent .pane-card");
    if (mainCard && !mainCard.closest("details")) {
      const details = createSummaryDetails("Current page", true);
      mainCard.parentNode.insertBefore(details, mainCard);
      details.appendChild(mainCard);
    }

    const queueContent = document.getElementById("queueContent");
    const queueCard = queueContent?.querySelector(".pane-card");
    if (queueContent && queueCard && !queueCard.closest("details")) {
      queueContent.classList.add("queue-sheet");
      const details = createSummaryDetails("Queue", true, "queueSheetDetails");
      queueCard.parentNode.insertBefore(details, queueCard);
      details.appendChild(queueCard);
    }

    const historyCard = document.querySelector("#historyContent .pane-card");
    if (historyCard && !document.getElementById("historyFilterBar")) {
      const wrap = document.createElement("div");
      wrap.id = "historyFilterBar";
      wrap.className = "history-filter-bar";
      [
        ["all", "All", true],
        ["cbz", "CBZ", false],
        ["pdf", "PDF", false],
        ["success", "Success", false],
        ["failed", "Failed", false],
      ].forEach(([filter, label, active]) => {
        const button = document.createElement("button");
        button.type = "button";
        button.dataset.filter = filter;
        button.textContent = label;
        if (active) button.classList.add("is-active");
        wrap.appendChild(button);
      });
      historyCard.insertBefore(wrap, document.getElementById("historyList"));
      wrap.addEventListener("click", (event) => {
        const btn = event.target.closest("button[data-filter]");
        if (!btn) return;
        historyFilter = btn.dataset.filter || "all";
        wrap.querySelectorAll("button").forEach((node) => node.classList.toggle("is-active", node === btn));
        renderHistory();
      });
    }

    const queueActions = document.querySelector(".collapsible-action-panel .queue-actions");
    if (queueActions) {
      queueActions.classList.add("queue-actions-themed");
      const panel = queueActions.closest(".collapsible-action-panel");
      if (panel) {
        const summary = panel.querySelector("summary");
        if (summary) {
          summary.textContent = "Quick actions";
        }
      }
    }
  }

  applyCompactMode();
}

function updateDashboard() {
  const stats = document.getElementById("activeDashboardStats");
  const summary = document.getElementById("activeDashboardSummary");
  const counts = getQueueCounts();
  if (summary) {
    summary.textContent = `${counts.running} running · ${counts.queued} queued · ${counts.done} done · ${counts.failed} failed`;
  }
  if (stats) {
    stats.replaceChildren();
    [
      ["Run", counts.running, "is-running"],
      ["Queued", counts.queued, "is-queued"],
      ["Done", counts.done, "is-done"],
      ["Fail", counts.failed, "is-failed"],
    ].forEach(([label, value, className]) => {
      const chip = document.createElement("div");
      chip.className = `dashboard-stat compact-dashboard-stat ${className}`;
      const valueNode = document.createElement("strong");
      valueNode.textContent = String(value);
      const labelNode = document.createElement("span");
      labelNode.textContent = label;
      chip.append(valueNode, labelNode);
      stats.appendChild(chip);
    });
  }
  const pauseBtn = document.getElementById("dashboardPauseQueueBtn");
  if (pauseBtn) pauseBtn.textContent = mrmSettings.queuePauseAfterCurrentEnabled ? "Resume after current" : "Pause after current";
}

function toggleQueueSheet(force = true) {
  queueSheetOpen = typeof force === "boolean" ? force : true;
  const details = document.getElementById("queueSheetDetails");
  if (details) details.open = true;
  updateQueueSheetState();
  requestAnimationFrame(() => {
    document.getElementById("queueContent")?.scrollIntoView({ behavior: "smooth", block: "start" });
  });
}

function updateQueueSheetState() {
  const queueContent = document.getElementById("queueContent");
  const details = document.getElementById("queueSheetDetails");
  if (!queueContent) return;
  queueContent.classList.add("is-open");
  if (details) details.open = true;
}

// --- UTILITIES ---


function setNavButtonLabel(button, icon, label) {
  if (!button) return;
  const iconNode = button.querySelector(".nav-icon");
  const labelNode = button.querySelector(".nav-label");
  if (iconNode && labelNode) {
    iconNode.textContent = icon;
    labelNode.textContent = label;
    return;
  }
  button.textContent = `${icon} ${label}`;
}

function updateQueueCountLabels() {
  const downloadButton = document.getElementById("downloadTabBtn");
  if (!downloadButton) return;
  const count = downloadQueue.filter((item) => {
    const status = String(item.status || "pending").toLowerCase();
    return !["completed", "done"].includes(status);
  }).length;
  setNavButtonLabel(downloadButton, "⬇", count ? `Home (${count})` : "Home");
}


function setNavState(view) {
  const ids = ["downloadTabBtn", "libraryBtn", "sitesBtn", "historyBtn", "debugBtn", "settingsBtn", "bulkDownloadBtn"];
  for (const id of ids) {
    const el = document.getElementById(id);
    if (!el) continue;
    const isCombinedMain = id === "downloadTabBtn" && (view === "main" || view === "queue");
    const isLibrary = id === "libraryBtn" && view === "library";
    const isSites = id === "sitesBtn" && view === "sites";
    const isHistory = id === "historyBtn" && view === "history";
    const isDebug = id === "debugBtn" && view === "debug";
    el.classList.toggle("is-active", isCombinedMain || isLibrary || isSites || isHistory || isDebug);
  }
}


function setQuickChipState(containerId, attrName, selectedValue) {
  const root = document.getElementById(containerId);
  if (!root) return;
  root.querySelectorAll(`[${attrName}]`).forEach((chip) => {
    chip.classList.toggle("is-active", chip.getAttribute(attrName) === selectedValue);
  });
}

function bindQuickFilterRow(containerId, attrName, onSelect) {
  const root = document.getElementById(containerId);
  if (!root || root.dataset.bound === "1") return;
  root.dataset.bound = "1";
  root.addEventListener("click", (event) => {
    const target = event.target.closest(`[${attrName}]`);
    if (!target) return;
    onSelect(target.getAttribute(attrName));
  });
}


function applyQuickFilterCounts(containerId, attrName, counts = {}, labelMap = {}) {
  const root = document.getElementById(containerId);
  if (!root) return;
  root.querySelectorAll(`[${attrName}]`).forEach((chip) => {
    const value = chip.getAttribute(attrName) || "";
    const baseLabel = chip.dataset.baseLabel || chip.textContent.replace(/\s+\(\d+\)\s*$/, "").trim() || value;
    chip.dataset.baseLabel = baseLabel;
    const countValue = Number(counts[value] || 0);
    const label = labelMap[value] || baseLabel;
    chip.textContent = `${label} (${countValue})`;
  });
}

function buildQueueFilterCounts(items = [], active = []) {
  const counts = { all: 0, active: 0, pending: 0, packing: 0, done: 0, failed: 0 };
  const activeByUrl = new Map((active || []).map((job) => [normalizeQueueUrl(job.url || ""), job]));
  for (const item of (items || [])) {
    counts.all += 1;
    const activeJob = activeByUrl.get(normalizeQueueUrl(item?.url || ""));
    const status = String(activeJob?.status || item?.status || "pending").toLowerCase();
    const phase = String(activeJob?.phase || item?.phase || status).toLowerCase();
    const key = getQueueFilterKey(status, phase);
    counts[key] = (counts[key] || 0) + 1;
  }
  return counts;
}

let lastPopupToastQueueFingerprint = "";
function maybeToastQueueTransitions(previousQueue = [], nextQueue = []) {
  try {
    const prevById = new Map((previousQueue || []).map((item) => [String(item.id || normalizeQueueUrl(item.url || "")), item]));
    const nextById = new Map((nextQueue || []).map((item) => [String(item.id || normalizeQueueUrl(item.url || "")), item]));
    const pendingToasts = [];
    for (const [key, nextItem] of nextById.entries()) {
      const prevItem = prevById.get(key);
      const nextStatus = String(nextItem?.status || "").toLowerCase();
      const prevStatus = String(prevItem?.status || "").toLowerCase();
      const title = cleanQueueTitle(nextItem?.title || "Item", "Item");
      if (!prevItem) {
        pendingToasts.push({ key, type: "success", text: `Queued: ${title}` });
        continue;
      }
      if (prevStatus === nextStatus) continue;
      if (nextStatus === "completed" || nextStatus === "done") pendingToasts.push({ key, type: "success", text: `Downloaded: ${title}` });
      else if (nextStatus === "failed") pendingToasts.push({ key, type: "error", text: `Failed: ${title}` });
    }
    const fingerprint = pendingToasts.map((entry) => `${entry.key}:${entry.type}:${entry.text}`).join("|");
    if (!pendingToasts.length || fingerprint === lastPopupToastQueueFingerprint) return;
    lastPopupToastQueueFingerprint = fingerprint;
    pendingToasts.slice(-2).forEach((toast, index) => {
      setTimeout(() => showToast(toast.text, toast.type, 2600), index * 120);
    });
  } catch {}
}

function updateSiteChip(text, state = "ok") {
  const chipText = document.getElementById("siteChipText");
  const chip = document.getElementById("siteChip");
  if (chipText) chipText.textContent = text;
  if (chip) {
    chip.dataset.state = state;
    const dot = chip.querySelector(".status-dot");
    if (dot) {
      dot.style.background = state === "error" ? "#ff7c96" : state === "idle" ? "#8da2ff" : "#58d8a9";
      dot.style.boxShadow = state === "error" ? "0 0 0 3px rgba(255,109,125,.15)" : state === "idle" ? "0 0 0 3px rgba(103,167,255,.15)" : "0 0 0 3px rgba(56,211,159,.15)";
    }
  }
}



// Utility: Get cookies based on settings
function getCookiesToUse() {
  if (mrmSettings.cookieSource === "auto") {
    return (mrmSettings.autoRetrievedCookies && mrmSettings.autoRetrievedCookies.length > 0)
      ? mrmSettings.autoRetrievedCookies
      : [];
  }
  return (mrmSettings.cookies && mrmSettings.cookies.length > 0)
    ? mrmSettings.cookies
    : [];
}

// Utility: Get retry count
function getRetryCount() {
  return mrmSettings.retryCount || 3;
}

// Utility: Get timeout value
function getTimeout() {
  return (mrmSettings.timeout || 30) * 1000;
}

// Utility: Update element text content
window.alert = (message) => showToast(message, "warning");

function updateStatusText(id, text) {
  const el = document.getElementById(id);
  if (el) el.textContent = text;
}

// Utility: Set element display
function setElementDisplay(id, display) {
  const el = document.getElementById(id);
  if (el) el.style.display = display;
}

// Utility: Set element width
function setElementWidth(id, width) {
  const el = document.getElementById(id);
  if (el) el.style.width = width;
}

// Utility: Get file extension from blob
function getFileExtension(blob, fallback = 'jpg') {
  if (!blob.type) return fallback;
  const parts = blob.type.split('/');
  return parts[1] || fallback;
}

// Utility: Convert blob to base64
function blobToBase64(blob) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.readAsDataURL(blob);
  });
}

// Utility: Load image from source
function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

// --- CORE ---

document.addEventListener("click", async (event) => {
  const target = event.target?.closest?.("button, a, input, select");
  if (!target) return;
  await verbosePopup("Popup control activated", {
    tag: target.tagName,
    id: target.id || "",
    text: (target.textContent || target.value || "").trim().slice(0, 80),
    type: target.getAttribute("type") || "",
  });
});


document.addEventListener("DOMContentLoaded", async function () {
  await verbosePopup("Popup DOMContentLoaded", { userAgent: navigator.userAgent });
  await loadDownloadHistory();
  await loadDownloadQueue();
  await updateLibraryCountLabel();
  await loadSettings();
  await verbosePopup("Popup settings loaded", { debugMode: mrmSettings.debugMode, verboseDebugMode: mrmSettings.verboseDebugMode });
  await loadDebugLog();
  await loadActiveJobs();
  await checkPageContent();
  setupEventListeners();
  setupStorageListeners();
  updateQueueAutoStartButton();
  updateQueuePauseAfterCurrentButton();
  if (requestedPopupView === "queue") {
    showQueue();
  } else if (requestedPopupView === "sites") {
    showSites();
  } else if (requestedPopupView === "history") {
    showHistory();
  } else if (requestedPopupView === "debug") {
    showDebug();
  } else {
    updateUI();
  }
  ensureEnhancedPopupLayout();

  const version = await browser.runtime.getManifest().version;
  document.getElementById("version").textContent = `v${version}`;
});

async function loadDownloadHistory() {
  try {
    const result = await browser.storage.local.get(["downloadHistory"]);
    downloadHistory = result.downloadHistory || [];
  } catch (error) {
    console.error("[MRM] Error loading download history:", error);
    downloadHistory = [];
  }
}

async function saveDownloadHistory() {
  try {
    await browser.storage.local.set({ downloadHistory });
  } catch (error) {
    console.error("[MRM] Error saving download history:", error);
  }
}


async function loadDownloadQueue() {
  try {
    const result = await browser.storage.local.get([DOWNLOAD_QUEUE_KEY]);
    downloadQueue = Array.isArray(result[DOWNLOAD_QUEUE_KEY]) ? result[DOWNLOAD_QUEUE_KEY] : [];
  } catch (error) {
    console.error("[MRM] Error loading download queue:", error);
    downloadQueue = [];
  }
}

async function saveDownloadQueue(options = {}) {
  const latest = await browser.storage.local.get([DOWNLOAD_QUEUE_KEY]);
  const current = Array.isArray(latest[DOWNLOAD_QUEUE_KEY]) ? latest[DOWNLOAD_QUEUE_KEY] : [];
  const byKey = new Map();
  const put = (item) => {
    const key = normalizeQueueUrl(item?.url || "") || String(item?.id || "");
    if (!key) return;
    byKey.set(key, item);
  };
  current.forEach(put);
  if (options.replaceAll) byKey.clear();
  downloadQueue.forEach(put);
  const merged = Array.from(byKey.values()).sort((a, b) => Number(b.addedAt || 0) - Number(a.addedAt || 0));
  downloadQueue = merged;
  await browser.storage.local.set({ [DOWNLOAD_QUEUE_KEY]: downloadQueue });
  await verbosePopup("Queue saved", { total: downloadQueue.length });
}


function sanitizeQueueImportItem(item) {
  if (!item || typeof item !== "object") return null;
  const url = normalizeQueueUrl(item.url || "");
  if (!url || !/^https?:\/\//i.test(url)) return null;

  let host = "";
  try {
    host = new URL(url).hostname.replace(/^www\./, "");
  } catch {
    host = String(item.host || "");
  }

  return {
    id: item.id || createQueueId(url),
    title: cleanQueueTitle(item.title || "", "Untitled").slice(0, 300),
    url,
    host,
    thumbnailUrl: String(item.thumbnailUrl || ""),
    status: ["completed", "done"].includes(String(item.status || "").toLowerCase()) ? "completed" : "pending",
    addedAt: Number(item.addedAt || Date.now()),
    lastError: null,
    selected: item.selected !== false,
  };
}

function parseQueueImportPayload(payload) {
  const rawItems = Array.isArray(payload)
    ? payload
    : Array.isArray(payload?.downloadQueue)
      ? payload.downloadQueue
      : Array.isArray(payload?.items)
        ? payload.items
        : null;

  if (!rawItems) {
    throw new Error("JSON must be an array, or an object with downloadQueue/items.");
  }

  const items = rawItems.map(sanitizeQueueImportItem).filter(Boolean);
  if (!items.length) {
    throw new Error("No valid queue items found.");
  }

  return items;
}

async function exportDownloadQueue() {
  try {
    const payload = {
      exportedAt: new Date().toISOString(),
      version: browser.runtime.getManifest().version,
      downloadQueue,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const objectUrl = URL.createObjectURL(blob);
    const filename = `mrm-download-list-${new Date().toISOString().slice(0, 10)}.json`;

    try {
      await browser.downloads.download({
        url: objectUrl,
        filename,
        saveAs: true,
        conflictAction: "uniquify",
      });
      showToast("Download list exported.", "success");
    } finally {
      setTimeout(() => URL.revokeObjectURL(objectUrl), 30000);
    }
  } catch (error) {
    showToast(error?.message || "Could not export download list.", "error");
  }
}

function importDownloadQueueFromFile(file) {
  if (!file) return;

  const reader = new FileReader();
  reader.onload = async () => {
    try {
      const payload = JSON.parse(String(reader.result || ""));
      const importedItems = parseQueueImportPayload(payload);
      const byKey = new Map(downloadQueue.map((item) => [normalizeQueueUrl(item.url), item]));

      for (const item of importedItems) {
        const key = normalizeQueueUrl(item.url);
        byKey.set(key, { ...byKey.get(key), ...item, addedAt: byKey.get(key)?.addedAt || item.addedAt });
      }

      downloadQueue = Array.from(byKey.values()).sort((a, b) => Number(b.addedAt || 0) - Number(a.addedAt || 0));
      await saveDownloadQueue();
      renderQueue();
      showQueue();
      showToast(`Imported ${importedItems.length} item${importedItems.length === 1 ? "" : "s"}.`, "success");
    } catch (error) {
      showToast(error?.message || "Could not import download list.", "error");
    } finally {
      const input = document.getElementById("importQueueFileInput");
      if (input) input.value = "";
    }
  };
  reader.onerror = () => showToast("Could not read selected JSON file.", "error");
  reader.readAsText(file);
}



function createQueueId(url) {
  try {
    const parsed = new URL(url);
    parsed.hash = "";
    return `${parsed.hostname.replace(/^www\./, "")}:${parsed.pathname}`.replace(/[^a-z0-9:_/-]+/gi, "-").toLowerCase();
  } catch {
    return `queued:${Date.now()}`;
  }
}

function normalizeQueueUrl(url) {
  try {
    const parsed = new URL(url);
    parsed.hash = "";
    return parsed.href;
  } catch {
    return String(url || "");
  }
}

async function addQueueItem(item) {
  const normalizedUrl = normalizeQueueUrl(item.url);
  const nextItem = {
    id: item.id || createQueueId(normalizedUrl),
    title: cleanQueueTitle(item.title || "", "Untitled"),
    url: normalizedUrl,
    host: item.host || new URL(normalizedUrl).hostname.replace(/^www\./, ""),
    thumbnailUrl: item.thumbnailUrl || "",
    status: "pending",
    addedAt: item.addedAt || Date.now(),
    lastError: null,
    selected: item.selected !== false,
  };
  const index = downloadQueue.findIndex((entry) => entry.id === nextItem.id || normalizeQueueUrl(entry.url) === normalizedUrl);
  if (index >= 0) {
    downloadQueue[index] = { ...downloadQueue[index], ...nextItem, addedAt: downloadQueue[index].addedAt || nextItem.addedAt };
  } else {
    downloadQueue.unshift(nextItem);
  }
  await saveDownloadQueue();
  renderQueue();
  return nextItem;
}

async function updateQueueItem(id, patch) {
  downloadQueue = downloadQueue.map((item) => item.id === id ? { ...item, ...patch } : item);
  await saveDownloadQueue();
  renderQueue();
  updateQueueSheetState();
}

async function removeQueueItem(id) {
  downloadQueue = downloadQueue.filter((item) => item.id !== id);
  await saveDownloadQueue();
  renderQueue();
}


async function getCurrentTabData() {
  const tab = await resolveBestPopupTab();
  if (tab?.url) return tab;
  throw new Error("No active tab found.");
}

async function getCurrentPageLibraryMetadata() {
  const tab = await getCurrentTabData();
  if (!/^https?:\/\//i.test(tab.url || "")) throw new Error("Open a supported post page first.");
  let metadata = null;
  try {
    metadata = await browser.tabs.sendMessage(tab.id, { type: "GET_MRM_LIBRARY_METADATA" });
  } catch {}
  if (!metadata) {
    const url = tab.url.split("#")[0];
    const parsed = new URL(url);
    metadata = {
      url,
      canonicalUrl: url,
      host: parsed.hostname.replace(/^www\./, ""),
      siteName: parsed.hostname.replace(/^www\./, ""),
      title: tab.title || "Untitled",
      displayTitle: tab.title || "Untitled",
      coverUrl: tab.favIconUrl || "",
      thumbnailUrl: tab.favIconUrl || "",
      sourceType: "post",
      contentType: "doujinshi",
    };
  }
  return window.MRMLibraryStore.normalizeLibraryItem(metadata);
}

async function saveCurrentPageToLibrary() {
  try {
    const item = await getCurrentPageLibraryMetadata();
    const result = await window.MRMLibraryStore.saveLibraryItem(item);
    showToast(result.existed ? "Already in Library." : "Saved to Library.", "success");
    await appendDebugLog("POPUP", "info", "Current page saved to Library", { url: item.url, existed: result.existed });
  } catch (error) {
    showToast(error?.message || "Could not save to Library.", "error");
    await appendDebugLog("POPUP", "error", "Save current page to Library failed", { error: String(error?.message || error) });
  }
}

function openLibraryPage() {
  browser.tabs.create({ url: browser.runtime.getURL("library.html") });
  closePopupPage?.();
}

async function updateLibraryCountLabel() {
  try {
    const result = await browser.storage.local.get([LIBRARY_KEY]);
    const count = Array.isArray(result[LIBRARY_KEY]) ? result[LIBRARY_KEY].length : 0;
    const button = document.getElementById("libraryBtn");
    if (button) setNavButtonLabel(button, "📚", count ? `Library (${count})` : "Library");
  } catch {}
}

function showLibrary() {
  openLibraryPage();
}


async function addCurrentPageToQueue() {
  try {
    const tab = await getActiveTab();
    if (!tab?.url || !/(?:myreadingmanga\.info|(?:www\.)?mangalotus\.com|(?:www\.)?baramangaonline\.com|(?:www\.)?yaoimangaonline\.com|(?:www\.)?nhentai\.net)/.test(tab.url)) {
      showToast("Open a supported post or listing page first.", "warning");
      return;
    }

    let title = tab.title || "Untitled";
    try {
      const data = await getMRMData();
      title = data?.title || title;
    } catch {}

    await addQueueItem({
      title,
      url: tab.url,
      host: new URL(tab.url).hostname.replace(/^www\./, ""),
      selected: true,
    });
    showToast("Added page to download list.", "success");
    showQueue();
  } catch (error) {
    showToast(error?.message || "Could not add this page.", "error");
  }
}

function isMyReadingMangaQueueUrl(url) {
  try {
    return new URL(url).hostname.replace(/^www\./, "") === "myreadingmanga.info";
  } catch {
    return false;
  }
}

async function findDirectDownloadContentTab(item) {
  const host = new URL(item.url).hostname.replace(/^www\./, "");
  const [activeTab] = await browser.tabs.query({ active: true, currentWindow: true });
  if (activeTab?.id && /^https?:\/\//i.test(activeTab.url || "")) {
    try {
      const activeHost = new URL(activeTab.url).hostname.replace(/^www\./, "");
      if (activeHost === host) return activeTab;
    } catch {}
  }

  const tabs = await browser.tabs.query({ currentWindow: true });
  return tabs.find((tab) => {
    try {
      return /^https?:\/\//i.test(tab.url || "") && new URL(tab.url).hostname.replace(/^www\./, "") === host;
    } catch {
      return false;
    }
  }) || activeTab || null;
}


function getQueueItemById(id) {
  return downloadQueue.find((item) => item.id === id) || null;
}

function isQueueItemFinished(item) {
  const status = String(item?.status || "pending").toLowerCase();
  return ["completed", "done", "failed"].includes(status);
}

function isNetworkLikelyWifi() {
  const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
  if (!connection) return true;
  const type = String(connection.type || connection.effectiveType || "").toLowerCase();
  if (!type) return true;
  return type.includes("wifi") || type.includes("ethernet") || type.includes("4g") && !mrmSettings.queueWifiOnly;
}

function getQueueConcurrency() {
  return Math.max(1, Math.min(3, Number(mrmSettings.queueConcurrency || 1)));
}

async function setQueueConcurrency(value) {
  mrmSettings.queueConcurrency = Math.max(1, Math.min(3, Number(value || 1)));
  await browser.storage.local.set({ mrmSettings });
  updateQueueAdvancedControls();
}

async function setQueueWifiOnly(enabled) {
  mrmSettings.queueWifiOnly = !!enabled;
  await browser.storage.local.set({ mrmSettings });
  updateQueueAdvancedControls();
}

function updateQueueAdvancedControls() {
  const select = document.getElementById("queueConcurrencySelect");
  if (select) select.value = String(getQueueConcurrency());
  const wifi = document.getElementById("queueWifiOnlyToggle");
  if (wifi) wifi.checked = !!mrmSettings.queueWifiOnly;
}

async function retryFailedQueueItems() {
  let changed = false;
  downloadQueue = downloadQueue.map((item) => {
    if (String(item.status || "").toLowerCase() !== "failed") return item;
    changed = true;
    return {
      ...item,
      status: "pending",
      phase: "pending",
      progress: 0,
      currentImage: 0,
      totalImages: item.totalImages || item.count || 0,
      lastError: null,
      selected: true,
      updatedAt: Date.now(),
    };
  });
  if (changed) {
    await saveDownloadQueue();
    renderQueue();
    showToast("Failed items moved back to pending.", "success");
    scheduleQueueAutoStart("retry-failed");
  } else {
    showToast("No failed items to retry.", "warning");
  }
}

async function clearCompletedQueueItems() {
  const before = downloadQueue.length;
  downloadQueue = downloadQueue.filter((item) => !["completed", "done"].includes(String(item.status || "").toLowerCase()));
  await saveDownloadQueue();
  renderQueue();
  showToast(`Cleared ${before - downloadQueue.length} completed item(s).`, "success");
}

async function moveQueueItem(id, direction) {
  const index = downloadQueue.findIndex((item) => item.id === id);
  if (index < 0) return;
  const target = index + direction;
  if (target < 0 || target >= downloadQueue.length) return;
  const copy = [...downloadQueue];
  [copy[index], copy[target]] = [copy[target], copy[index]];
  downloadQueue = copy.map((item, orderIndex) => ({ ...item, queueOrder: orderIndex, updatedAt: Date.now() }));
  await saveDownloadQueue();
  renderQueue();
}

async function clearStuckDownloads() {
  const now = Date.now();
  const storage = await browser.storage.local.get(["mrmActiveJobs", DOWNLOAD_QUEUE_KEY]);
  const jobs = Array.isArray(storage.mrmActiveJobs) ? storage.mrmActiveJobs : [];
  const keptJobs = jobs.filter((job) => {
    const updated = Date.parse(job.updatedAt || job.lastProgressAt || job.startedAt || 0);
    return updated && now - updated < 15 * 60 * 1000;
  });
  if (!tab && storage.mrmLastSupportedTabContext?.url) {
    tab = {
      id: storage.mrmLastSupportedTabContext.tabId ?? null,
      url: storage.mrmLastSupportedTabContext.url || "",
      title: storage.mrmLastSupportedTabContext.title || "",
      active: true,
      windowId: storage.mrmLastSupportedTabContext.windowId ?? null,
    };
  }

  const queue = Array.isArray(storage[DOWNLOAD_QUEUE_KEY]) ? storage[DOWNLOAD_QUEUE_KEY] : downloadQueue;
  const cleanedQueue = queue.map((item) => {
    const status = String(item.status || "").toLowerCase();
    const updated = Number(item.lastProgressAt || item.updatedAt || item.startedAt || 0);
    if (["opening", "started", "downloading", "packing"].includes(status) && updated && now - updated > 15 * 60 * 1000) {
      return { ...item, status: "failed", phase: "failed", progressLabel: "Cleared as stale", lastError: "Stale download cleared manually.", updatedAt: now };
    }
    return item;
  });
  await browser.storage.local.set({ mrmActiveJobs: keptJobs, [DOWNLOAD_QUEUE_KEY]: cleanedQueue });
  activeJobs = keptJobs;
  downloadQueue = cleanedQueue;
  renderQueue();
  syncPopupProgressFromJobs();
  showToast("Stuck downloads cleared.", "success");
}

async function copyQueueDiagnostic() {
  const payload = {
    generatedAt: new Date().toISOString(),
    queue: downloadQueue,
    activeJobs,
    history: downloadHistory.slice(0, 20),
  };
  await navigator.clipboard.writeText(JSON.stringify(payload, null, 2));
  showToast("Queue diagnostic copied.", "success");
}

function exportDebugLogJson() {
  const blob = new Blob([JSON.stringify(debugLogEntries, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `mrm-debug-log-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}


async function setQueueAutoStartEnabled(enabled) {
  mrmSettings.queueAutoStartEnabled = !!enabled;
  await browser.storage.local.set({ mrmSettings });
  updateQueueAutoStartButton();
  await appendDebugLog("POPUP", "info", `Queue auto-start ${enabled ? "enabled" : "disabled"}`, { enabled: !!enabled });
  if (enabled) scheduleQueueAutoStart("toggle-enabled");
}

function updateQueueAutoStartButton() {
  const btn = document.getElementById("autoStartQueueBtn");
  if (!btn) return;
  btn.textContent = mrmSettings.queueAutoStartEnabled ? "Auto-start: On" : "Auto-start: Off";
  btn.classList.toggle("primary", !!mrmSettings.queueAutoStartEnabled);
  btn.setAttribute("aria-pressed", mrmSettings.queueAutoStartEnabled ? "true" : "false");
}

async function setQueuePauseAfterCurrentEnabled(enabled) {
  mrmSettings.queuePauseAfterCurrentEnabled = !!enabled;
  await browser.storage.local.set({ mrmSettings });
  updateQueuePauseAfterCurrentButton();
  await appendDebugLog("POPUP", "info", `Queue pause-after-current ${enabled ? "enabled" : "disabled"}`, { enabled: !!enabled });
}

function updateQueuePauseAfterCurrentButton() {
  const btn = document.getElementById("pauseAfterCurrentQueueBtn");
  if (!btn) return;
  btn.textContent = mrmSettings.queuePauseAfterCurrentEnabled ? "Pause after current: On" : "Pause after current: Off";
  btn.classList.toggle("primary", !!mrmSettings.queuePauseAfterCurrentEnabled);
  btn.setAttribute("aria-pressed", mrmSettings.queuePauseAfterCurrentEnabled ? "true" : "false");
}

let queueAutoStartTimer = null;

function scheduleQueueAutoStart(reason = "queue-change") {
  if (!mrmSettings.queueAutoStartEnabled || mrmSettings.queuePauseAfterCurrentEnabled || isProcessingDownloadQueue) return;
  if (mrmSettings.queueWifiOnly && !isNetworkLikelyWifi()) {
    appendDebugLog("POPUP", "warn", "Queue auto-start skipped because Wi‑Fi-only mode is enabled", {}).catch(() => {});
    return;
  }
  clearTimeout(queueAutoStartTimer);
  queueAutoStartTimer = setTimeout(async () => {
    try {
      await appendDebugLog("POPUP", "verbose", "Queue auto-start delegated to background", { reason });
      await browser.runtime.sendMessage({ type: "MRM_PROCESS_DOWNLOAD_QUEUE", selectedOnly: false, reason: `popup-${reason}` });
    } catch (error) {
      await appendDebugLog("POPUP", "error", "Queue auto-start delegation failed", { error: error?.message || String(error) });
    }
  }, 600);
}

async function openQueuedDownload(item) {
  await updateQueueItem(item.id, {
    status: "opening",
    phase: "opening",
    progress: 1,
    progressLabel: "Opening…",
    currentImage: 0,
    totalImages: 0,
    lastError: null,
    selected: item.selected !== false,
    startedAt: item.startedAt || Date.now(),
    updatedAt: Date.now(),
    lastProgressAt: Date.now(),
  });

  if (!isMyReadingMangaQueueUrl(item.url)) {
    const workerTab = await findDirectDownloadContentTab(item);
    if (!workerTab?.id) {
      throw new Error("Open a tab on the same supported site to start this queued direct download.");
    }

    await appendDebugLog("POPUP", "info", "Starting queued direct download without background tab", {
      id: item.id,
      url: item.url,
      host: item.host || "",
      workerTabId: workerTab.id,
    });

    const response = await browser.tabs.sendMessage(workerTab.id, {
      type: "MRM_DIRECT_DOWNLOAD_URL",
      queueItemId: item.id,
      url: item.url,
      title: item.title || "",
    });

    if (!response?.ok) throw new Error(response?.error || "Queued direct download failed.");

    await browser.runtime.sendMessage({
      type: "MRM_UPDATE_DOWNLOAD_QUEUE_ITEM",
      id: item.id,
      url: item.url,
      patch: {
        status: "completed",
        phase: "completed",
        progress: 100,
        progressLabel: "Completed",
        currentImage: response.count || item.currentImage || 0,
        totalImages: response.count || item.totalImages || 0,
        startedAt: item.startedAt || Date.now(),
        completedAt: Date.now(),
        updatedAt: Date.now(),
        lastProgressAt: Date.now(),
        lastError: null,
        filename: response.filename || "",
        count: response.count || 0,
      },
    }).catch(() => null);

    await loadDownloadQueue();
    renderQueue();
    return;
  }

  const response = await browser.runtime.sendMessage({ type: "MRM_OPEN_QUEUED_DOWNLOAD_TAB", url: item.url });
  if (!response?.ok) throw new Error(response?.error || "Could not open queued download tab.");
  await updateQueueItem(item.id, { status: "started", phase: "started", progress: 5, progressLabel: "Started in background tab", startedAt: Date.now(), updatedAt: Date.now(), lastProgressAt: Date.now(), lastError: null });
}

async function processDownloadQueue(selectedOnly = false) {
  if (isProcessingDownloadQueue) return;
  isProcessingDownloadQueue = true;
  try {
    const response = await browser.runtime.sendMessage({
      type: "MRM_PROCESS_DOWNLOAD_QUEUE",
      selectedOnly: !!selectedOnly,
      reason: selectedOnly ? "popup-selected" : "popup-all",
    });
    if (!response?.ok) throw new Error(response?.error || "Could not start queue.");
    await loadDownloadQueue();
    renderQueue();
    showToast(response.started ? `Started ${response.started} queued item(s).` : "Queue checked.", response.started ? "success" : "info");
  } catch (error) {
    showToast(error?.message || String(error), "error");
    await appendDebugLog("POPUP", "error", "Queue start failed", { error: error?.message || String(error) });
  } finally {
    isProcessingDownloadQueue = false;
  }
}

function closePopupPage() {
  window.close();
  browser.tabs.getCurrent()
    .then((tab) => tab?.id ? browser.tabs.remove(tab.id) : null)
    .catch(() => {});
}




async function loadActiveJobs() {
  try {
    activeJobs = await getActiveJobs();
  } catch (error) {
    console.error("[MRM] Error loading active jobs:", error);
    activeJobs = [];
  }
}

function setupStorageListeners() {
  browser.storage.onChanged.addListener(async (changes, areaName) => {
    if (areaName !== "local") return;
    if (changes.downloadHistory) {
      downloadHistory = Array.isArray(changes.downloadHistory.newValue) ? changes.downloadHistory.newValue : [];
      if (currentView === "history") renderHistory();
    }
    if (changes.mrmDownloadQueue) {
      const previousQueue = Array.isArray(changes.mrmDownloadQueue.oldValue) ? changes.mrmDownloadQueue.oldValue : downloadQueue;
      downloadQueue = Array.isArray(changes.mrmDownloadQueue.newValue) ? changes.mrmDownloadQueue.newValue : [];
      maybeToastQueueTransitions(previousQueue, downloadQueue);
      renderQueue();
    }
    if (changes.mrmLibraryItems) {
      updateLibraryCountLabel();
    }
    if (changes.mrmSettings) {
      mrmSettings = { ...mrmSettings, ...(changes.mrmSettings.newValue || {}) };
      updateUI();
    }
    if (changes.mrmActiveJobs) {
      activeJobs = Array.isArray(changes.mrmActiveJobs.newValue) ? changes.mrmActiveJobs.newValue : [];
      renderQueue();
      syncPopupProgressFromJobs();
    }
    if (changes.mrmDebugLog) {
      await loadDebugLog();
      if (currentView === "debug") renderDebugLog();
    }
  });
}

async function loadDebugLog() {
  try {
    debugLogEntries = await getDebugLog();
  } catch (error) {
    console.error("[MRM] Error loading debug log:", error);
    debugLogEntries = [];
  }
}


function redactCookieList(cookies = []) {
  if (!Array.isArray(cookies)) return [];
  return cookies.map((cookie) => ({
    name: String(cookie?.name || ""),
    domain: String(cookie?.domain || ""),
    path: String(cookie?.path || ""),
    secure: !!cookie?.secure,
    httpOnly: !!cookie?.httpOnly,
    sameSite: cookie?.sameSite || "",
    valueLength: String(cookie?.value || "").length,
    hasValue: !!cookie?.value,
  }));
}

function redactSettingsForReport(settings = {}) {
  return {
    ...settings,
    googleDriveClientSecret: settings.googleDriveClientSecret ? "[redacted]" : "",
    cookies: redactCookieList(settings.cookies),
    autoRetrievedCookies: redactCookieList(settings.autoRetrievedCookies),
  };
}

function redactQueueItemForReport(item = {}) {
  return {
    id: item.id || "",
    title: item.title || "",
    url: item.url || "",
    host: item.host || "",
    status: item.status || "",
    selected: !!item.selected,
    addedAt: item.addedAt || null,
    updatedAt: item.updatedAt || null,
    lastError: item.lastError || null,
    thumbnailUrl: item.thumbnailUrl ? "[redacted-thumbnail-url]" : "",
  };
}

function sanitizeLogEntryForReport(entry = {}) {
  const meta = entry.meta && typeof entry.meta === "object" ? { ...entry.meta } : entry.meta;
  if (meta && typeof meta === "object") {
    for (const key of Object.keys(meta)) {
      if (/cookie|authorization|token|password|secret/i.test(key)) {
        meta[key] = "[redacted]";
      }
    }
  }
  return {
    id: entry.id || "",
    timestamp: entry.timestamp || "",
    source: entry.source || "",
    level: entry.level || "",
    message: entry.message || "",
    meta,
  };
}

async function getManifestVersion() {
  try {
    const manifest = browser.runtime.getManifest();
    return manifest?.version || "";
  } catch {
    return "";
  }
}

async function buildDiagnosticReport() {
  let tab = await getActiveTab().catch(() => null);
  const storage = await browser.storage.local.get([
    "mrmSettings",
    DOWNLOAD_QUEUE_KEY,
    "mrmDownloadHistory",
    "mrmDebugLog",
    "mrmActiveJobs",
    LIBRARY_KEY,
    "mrmLibrarySettings",
    "mrmSyncSettings",
  ]).catch(() => ({}));

  const queue = Array.isArray(storage[DOWNLOAD_QUEUE_KEY]) ? storage[DOWNLOAD_QUEUE_KEY] : downloadQueue;
  const history = Array.isArray(storage.mrmDownloadHistory) ? storage.mrmDownloadHistory : downloadHistory;
  const logs = Array.isArray(storage.mrmDebugLog) ? storage.mrmDebugLog : debugLogEntries;
  const jobs = Array.isArray(storage.mrmActiveJobs) ? storage.mrmActiveJobs : activeJobs;
  const library = Array.isArray(storage[LIBRARY_KEY]) ? storage[LIBRARY_KEY] : [];

  return {
    generatedAt: new Date().toISOString(),
    extension: {
      name: "MRM+Lotus+Bara+nhentai DL",
      version: await getManifestVersion(),
    },
    environment: {
      userAgent: navigator.userAgent || "",
      platform: navigator.platform || "",
      language: navigator.language || "",
      isAndroid: /Android/i.test(navigator.userAgent || ""),
    },
    currentTab: tab ? {
      id: tab.id,
      url: tab.url || "",
      title: tab.title || "",
      active: !!tab.active,
      windowId: tab.windowId,
    } : null,
    settings: redactSettingsForReport(storage.mrmSettings || mrmSettings),
    queue: queue.map(redactQueueItemForReport),
    library: library.map((item) => ({
      id: item.id || "",
      title: item.displayTitle || item.title || "",
      url: item.url || "",
      canonicalUrl: item.canonicalUrl || "",
      host: item.host || "",
      siteName: item.siteName || "",
      coverUrl: item.coverUrl ? "[redacted-cover-url]" : "",
      thumbnailUrl: item.thumbnailUrl ? "[redacted-thumbnail-url]" : "",
      languages: item.languages || [],
      artists: item.artists || [],
      circles: item.circles || [],
      tags: item.tags || [],
      categories: item.categories || [],
      favorite: !!item.favorite,
      rating: item.rating || 0,
      notes: item.notes ? "[redacted-notes]" : "",
      downloaded: !!item.downloaded,
      downloadCount: item.downloadCount || 0,
      addedAt: item.addedAt || null,
      updatedAt: item.updatedAt || null,
    })),
    librarySettings: storage.mrmLibrarySettings || {},
    syncSettings: storage.mrmSyncSettings || {},
    activeJobs: jobs.map((job) => ({
      id: job.id || "",
      title: job.title || "",
      url: job.url || "",
      status: job.status || "",
      progress: job.progress ?? null,
      updatedAt: job.updatedAt || "",
      error: job.error || job.lastError || null,
    })),
    history: history.slice(0, 50).map((item) => ({
      id: item.id || "",
      title: item.title || "",
      url: item.url || "",
      type: item.type || "",
      status: item.status || "",
      timestamp: item.timestamp || "",
      filename: item.filename || "",
      count: item.count ?? null,
    })),
    logs: logs.map(sanitizeLogEntryForReport),
  };
}

async function copyTextToClipboard(text) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return;
  }
  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.setAttribute("readonly", "readonly");
  textarea.style.position = "fixed";
  textarea.style.opacity = "0";
  document.body.appendChild(textarea);
  textarea.select();
  document.execCommand("copy");
  textarea.remove();
}

async function copyDiagnosticReport() {
  try {
    await verbosePopup("Copy diagnostic report clicked");
    const report = await buildDiagnosticReport();
    await copyTextToClipboard(JSON.stringify(report, null, 2));
    showToast("Diagnostic report copied.", "success");
    await appendDebugLog("POPUP", "info", "Diagnostic report copied", {
      queueCount: report.queue.length,
      logCount: report.logs.length,
    });
  } catch (error) {
    showToast(`Could not copy report: ${error.message}`, "error");
    await appendDebugLog("POPUP", "error", "Diagnostic report copy failed", { error: String(error?.message || error) });
  }
}

async function exportDiagnosticReport() {
  try {
    await verbosePopup("Export diagnostic report clicked");
    const report = await buildDiagnosticReport();
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const filename = `mrm-diagnostic-report-${new Date().toISOString().replace(/[:.]/g, "-")}.json`;
    try {
      await browser.downloads.download({
        url,
        filename,
        saveAs: true,
        conflictAction: "uniquify",
      });
      showToast("Diagnostic report exported.", "success");
      await appendDebugLog("POPUP", "info", "Diagnostic report exported", {
        filename,
        queueCount: report.queue.length,
        logCount: report.logs.length,
      });
    } finally {
      setTimeout(() => URL.revokeObjectURL(url), 30000);
    }
  } catch (error) {
    showToast(`Could not export report: ${error.message}`, "error");
    await appendDebugLog("POPUP", "error", "Diagnostic report export failed", { error: String(error?.message || error) });
  }
}

async function copyDebugLog() {
  try {
    const logs = (await getDebugLog()).map(sanitizeLogEntryForReport);
    await copyTextToClipboard(JSON.stringify(logs, null, 2));
    showToast("Debug log copied.", "success");
    await verbosePopup("Debug log copied", { logCount: logs.length });
  } catch (error) {
    showToast(`Could not copy log: ${error.message}`, "error");
  }
}

async function clearStoredDebugLog() {
  try {
    await clearDebugLog();
    debugLogEntries = [];
    renderDebugLog();
    showToast("Debug log cleared.", "success");
    await appendDebugLog("POPUP", "info", "Debug log cleared");
    await loadDebugLog();
  } catch (error) {
    showToast(`Could not clear log: ${error.message}`, "error");
  }
}

function renderDebugLog() {
  const list = document.getElementById("debugLogList");
  const empty = document.getElementById("emptyDebugLog");
  if (!list || !empty) return;

  setQuickChipState("debugQuickFilters", "data-debug-filter", debugQuickFilter);
  applyQuickFilterCounts("debugQuickFilters", "data-debug-filter", {
    all: debugLogEntries.length,
    error: debugLogEntries.filter((entry) => String(entry?.level || "").toLowerCase() === "error").length,
    warn: debugLogEntries.filter((entry) => String(entry?.level || "").toLowerCase() === "warn").length,
    info: debugLogEntries.filter((entry) => String(entry?.level || "").toLowerCase() === "info").length,
    verbose: debugLogEntries.filter((entry) => String(entry?.level || "").toLowerCase() === "verbose").length,
  }, {
    all: "All",
    error: "Errors",
    warn: "Warnings",
    info: "Info",
    verbose: "Verbose",
  });
  clearChildren(list);
  const selectedSource = document.getElementById("debugSourceFilter")?.value || "";
  let visibleEntries = selectedSource
    ? debugLogEntries.filter((entry) => String(entry.source || "") === selectedSource)
    : debugLogEntries;
  if (debugQuickFilter && debugQuickFilter !== "all") {
    visibleEntries = visibleEntries.filter((entry) => String(entry.level || "").toLowerCase() === debugQuickFilter);
  }
  if (!visibleEntries.length) {
    empty.style.display = "block";
    return;
  }
  empty.style.display = "none";

  for (const item of visibleEntries.slice(0, 80)) {
    const card = createEl("div", { className: "queue-item wrap-anywhere" });
    card.appendChild(createEl("div", {
      className: "text-xs text-gray-500",
      text: `${new Date(item.timestamp).toLocaleTimeString()} • ${item.source} • ${item.level}`,
    }));
    card.appendChild(createEl("div", { className: "text-sm font-medium text-gray-900 wrap-anywhere", text: item.message || "" }));
    if (item.meta) {
      card.appendChild(createEl("div", {
        className: "text-xs text-gray-500 wrap-anywhere",
        text: typeof item.meta === "string" ? item.meta : JSON.stringify(item.meta),
      }));
    }
    list.appendChild(card);
  }
}

async function loadSettings() {
  try {
    const result = await browser.storage.local.get(["mrmSettings"]);
    if (result.mrmSettings) {
      mrmSettings = { ...(getDefaultSettings ? getDefaultSettings() : mrmSettings), ...mrmSettings, ...result.mrmSettings };
    }
    if (mrmSettings.debugMode) {
      console.log("[MRM] Settings loaded:", mrmSettings);
    }
  } catch (error) {
    console.error("[MRM] Error loading settings:", error);
  }
}

function getCookieHeaders() {
  if (!mrmSettings.useCookies) return {};

  const cookiesToUse = getCookiesToUse();
  if (cookiesToUse.length === 0) return {};

  const cookieString = cookiesToUse
    .map((cookie) => `${cookie.name}=${cookie.value}`)
    .join("; ");

  if (mrmSettings.debugMode) {
    console.log(`[MRM Debug] Using ${cookiesToUse.length} cookies (${mrmSettings.cookieSource})`);
  }

  return { Cookie: cookieString };
}

async function setCookiesInBrowser(url) {
  if (!mrmSettings.useCookies) {
    if (mrmSettings.debugMode) console.log(`[MRM Debug] Cookie usage disabled`);
    return;
  }

  const cookiesToUse = getCookiesToUse();
  if (cookiesToUse.length === 0) {
    if (mrmSettings.debugMode) console.log(`[MRM Debug] No cookies to set`);
    return;
  }

  const urlObj = new URL(url);
  if (mrmSettings.debugMode) {
    console.log(`[MRM Debug] Setting ${cookiesToUse.length} cookies for ${urlObj.origin}`);
  }

  for (const cookie of cookiesToUse) {
    try {
      // Try different domain configurations for better compatibility
      const domains = [
        cookie.domain, // Original domain
        urlObj.hostname, // Exact hostname
        `.${urlObj.hostname}`, // Domain with leading dot
        `.${urlObj.hostname.split(".").slice(-2).join(".")}`, // Parent domain
      ].filter(Boolean);

      let cookieSet = false;
      for (const domain of domains) {
        try {
          const cookieDetails = {
            url: url,
            name: cookie.name,
            value: cookie.value,
            domain: domain,
            path: cookie.path || "/",
            secure: cookie.secure || urlObj.protocol === "https:",
            httpOnly: cookie.httpOnly || false,
          };

          // Add partition key if available
          if (cookie.partitionKey) {
            cookieDetails.partitionKey = cookie.partitionKey;
          }

          await browser.cookies.set(cookieDetails);
          console.log(
            `[MRM Debug] Successfully set cookie: ${cookie.name} for domain: ${domain}`
          );
          cookieSet = true;
          break;
        } catch (domainError) {
          console.log(
            `[MRM Debug] Failed to set cookie ${cookie.name} for domain ${domain}:`,
            domainError.message
          );
        }
      }

      if (!cookieSet) {
        console.error(
          `[MRM Debug] Failed to set cookie ${cookie.name} for any domain`
        );
      }
    } catch (error) {
      console.error(`[MRM Debug] Failed to set cookie ${cookie.name}:`, error);
    }
  }
}

async function fetchWithSettings(url, options = {}) {
  await setCookiesInBrowser(url);

  const tab = await getActiveTab();
  const retryCount = getRetryCount();

  const pageFetchOptions = {
    method: (options && options.method) || "GET",
  };
  if (options && options.headers && options.headers.Referer) {
    pageFetchOptions.referrer = options.headers.Referer;
  }

  if (mrmSettings.debugMode) console.log(`[MRM Debug] (Page) Fetching ${url}`);

  let lastError;
  for (let attempt = 1; attempt <= retryCount; attempt++) {
    try {
      if (mrmSettings.debugMode) console.log(`[MRM Debug] (Page) Fetch attempt ${attempt} for ${url}`);
      const pageResponse = await Promise.race([
        browser.tabs.sendMessage(tab.id, {
          type: "PAGE_FETCH",
          url,
          options: pageFetchOptions,
          wantBody: true,
          responseType: "arraybuffer",
          timeoutMs: getTimeout(),
        }),
        new Promise((_, reject) => setTimeout(() => reject(new Error("Timed out waiting for page fetch.")), getTimeout()))
      ]);

      if (!pageResponse) throw new Error("No response from page context");

      if (!pageResponse.ok) {
        throw new Error(`HTTP error: ${pageResponse.status || 'Request failed'}`);
      }

      const headers = new Headers(pageResponse.headers || []);
      const contentType = headers.get("content-type") || "application/octet-stream";
      const blob = new Blob([pageResponse.body], { type: contentType });

      return {
        ok: true,
        status: pageResponse.status,
        headers,
        blob: async () => blob,
      };
    } catch (error) {
      lastError = error;
      console.error(`[MRM Debug] (Page) Fetch attempt ${attempt} failed:`, error.message);
      if (attempt < retryCount) {
        const waitTime = Math.pow(2, attempt - 1) * 1000;
        await new Promise((resolve) => setTimeout(resolve, waitTime));
      }
    }
  }

  if (mrmSettings.debugMode) console.log(`[MRM Debug] Falling back to extension-context fetch for ${url}`);

  const fallbackHeaders = {
        Accept: "image/webp,image/avif,image/*,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.5",
    DNT: "1",
    Connection: "keep-alive",
    ...(options.headers || {}),
  };

  const fallbackOptions = {
    ...options,
    headers: fallbackHeaders,
    credentials: "include",
    mode: "cors",
  };

  let lastFallbackError;
  for (let attempt = 1; attempt <= retryCount; attempt++) {
    try {
      if (mrmSettings.debugMode) console.log(`[MRM Debug] (Ext) Fetch attempt ${attempt} for ${url}`);
      const res = await fetchWithTimeout(url, fallbackOptions, getTimeout());
      if (!res.ok && mrmSettings.debugMode) {
        console.error(`[MRM Debug] (Ext) Response status: ${res.status}`);
      }
      return res;
    } catch (err) {
      lastFallbackError = err;
      console.error(`[MRM Debug] (Ext) Fetch attempt ${attempt} failed:`, err.message);
      if (attempt < retryCount) {
        const waitTime = Math.pow(2, attempt - 1) * 1000;
        await new Promise((resolve) => setTimeout(resolve, waitTime));
      }
    }
  }

  throw lastError || lastFallbackError || new Error("Fetch failed");
}

function addToHistory(download) {
  const historyItem = {
    id: Date.now(),
    title: download.title,
    url: download.url,
    type: download.type,
    timestamp: new Date().toISOString(),
    status: download.status || "completed",
    progress: download.progress || 100,
    count: download.count || 0,
    filename: download.filename || "",
    format: download.format || (download.type === "images" ? "cbz" : ""),
  };

  downloadHistory.unshift(historyItem);
  if (downloadHistory.length > 50) {
    downloadHistory = downloadHistory.slice(0, 50);
  }

  saveDownloadHistory();
}


function isSupportedPopupTabUrl(url) {
  return /^https?:\/\/(?:[^/]+\.)?(?:myreadingmanga\.info|mangalotus\.com|baramangaonline\.com|yaoimangaonline\.com|nhentai\.net)\//i.test(String(url || ""));
}

function isExtensionLikeUrl(url) {
  return /^(?:moz-extension|about|chrome):/i.test(String(url || ""));
}

async function getLastSupportedTabContext() {
  try {
    const storage = await browser.storage.local.get(["mrmLastSupportedTabContext"]);
    return storage.mrmLastSupportedTabContext || null;
  } catch {
    return null;
  }
}

function buildEmbeddedPopupTabFallback() {
  if (!embeddedPopupMode || !embeddedPopupPageUrl) return null;
  return {
    id: embeddedPopupPageTabId,
    windowId: embeddedPopupPageWindowId,
    url: embeddedPopupPageUrl,
    title: embeddedPopupPageTitle || "Embedded page",
  };
}

async function resolveBestPopupTab() {
  const embeddedTab = await resolveEmbeddedPopupTab();
  if (embeddedTab?.id && isSupportedPopupTabUrl(embeddedTab.url || "")) return embeddedTab;

  const embeddedFallback = buildEmbeddedPopupTabFallback();
  if (embeddedFallback?.id && isSupportedPopupTabUrl(embeddedFallback.url || "")) return embeddedFallback;

  const normalizedTarget = normalizePopupTabUrl(embeddedPopupPageUrl);
  const lastSupportedContext = await getLastSupportedTabContext();

  let activeTab = null;
  let activeTabs = [];
  let sameWindowTabs = [];
  let allTabs = [];
  try {
    activeTabs = await browser.tabs.query({ active: true, currentWindow: true });
    activeTab = activeTabs.find(Boolean) || null;
  } catch {}
  if (activeTab?.id && isSupportedPopupTabUrl(activeTab.url || "")) return activeTab;

  try {
    sameWindowTabs = await browser.tabs.query(
      embeddedPopupPageWindowId != null ? { windowId: embeddedPopupPageWindowId } : { currentWindow: true }
    );
  } catch {}

  if (normalizedTarget) {
    const exactInWindow = sameWindowTabs.find((tab) => normalizePopupTabUrl(tab.url || "") === normalizedTarget);
    if (exactInWindow) return exactInWindow;
  }

  const supportedInWindow = sameWindowTabs
    .filter((tab) => isSupportedPopupTabUrl(tab.url || ""))
    .sort((a, b) => Number(b.active) - Number(a.active));
  if (supportedInWindow[0]) return supportedInWindow[0];

  try {
    allTabs = await browser.tabs.query({});
  } catch {}

  if (normalizedTarget) {
    const exactGlobal = allTabs.find((tab) => normalizePopupTabUrl(tab.url || "") === normalizedTarget);
    if (exactGlobal) return exactGlobal;
  }

  if (lastSupportedContext?.tabId != null) {
    const exactLastById = allTabs.find((tab) => tab.id === lastSupportedContext.tabId);
    if (exactLastById && isSupportedPopupTabUrl(exactLastById.url || "")) return exactLastById;
  }
  if (lastSupportedContext?.url) {
    const exactLastByUrl = allTabs.find((tab) => normalizePopupTabUrl(tab.url || "") === normalizePopupTabUrl(lastSupportedContext.url || ""));
    if (exactLastByUrl && isSupportedPopupTabUrl(exactLastByUrl.url || "")) return exactLastByUrl;
  }

  const supportedGlobal = allTabs
    .filter((tab) => isSupportedPopupTabUrl(tab.url || ""))
    .sort((a, b) => {
      const aScore = Number(!!a.active) * 1000000000 + Number(a.lastAccessed || 0);
      const bScore = Number(!!b.active) * 1000000000 + Number(b.lastAccessed || 0);
      return bScore - aScore;
    });
  if (supportedGlobal[0]) return supportedGlobal[0];

  if (embeddedFallback?.url && isSupportedPopupTabUrl(embeddedFallback.url || "")) return embeddedFallback;
  if (activeTab?.id && !isExtensionLikeUrl(activeTab.url || "")) return activeTab;
  return embeddedFallback || activeTab || null;
}

async function getActiveTab() {
  return resolveBestPopupTab();
}
async function sendTabMessageWithRetry(tabId, message, attempts = 8, delayMs = 180) {
  let lastError = null;
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    try {
      return await browser.tabs.sendMessage(tabId, message);
    } catch (error) {
      lastError = error;
      const messageText = String(error?.message || error || "");
      const retryable = /Receiving end does not exist|Could not establish connection|message port closed/i.test(messageText);
      if (!retryable || attempt === attempts - 1) break;
      await new Promise((resolve) => window.setTimeout(resolve, delayMs));
    }
  }
  throw lastError || new Error("Could not message page tab");
}


async function getMRMData() {
  const tab = await getActiveTab();
  if (!tab?.id) {
    return {
      ok: true,
      url: embeddedPopupPageUrl || "",
      title: embeddedPopupPageTitle || "Embedded page",
      tabId: embeddedPopupPageTabId,
      windowId: embeddedPopupPageWindowId,
      isPostPage: false,
      isArchivePage: true,
      images: [],
      video: null,
      page: "1",
    };
  }
  return sendTabMessageWithRetry(tab.id, { type: "GET_MRM_DATA" });
}

let tabsUrl;

const popupQueryParams = new URLSearchParams(window.location.search || "");
const embeddedPopupPageUrl = String(popupQueryParams.get("pageUrl") || "").trim();
const embeddedPopupPageTitle = String(popupQueryParams.get("pageTitle") || "").trim();
const embeddedPopupPageTabId = Number.parseInt(String(popupQueryParams.get("pageTabId") || ""), 10) || null;
const embeddedPopupPageWindowId = Number.parseInt(String(popupQueryParams.get("pageWindowId") || ""), 10) || null;
const embeddedPopupMode = popupQueryParams.get("embedded") === "1";
const requestedPopupView = String(popupQueryParams.get("view") || "").trim().toLowerCase();

function normalizePopupTabUrl(url) {
  return String(url || "").split("#")[0];
}


async function resolveEmbeddedPopupTab() {
  if (!embeddedPopupMode) return null;
  try {
    if (embeddedPopupPageTabId != null) {
      try {
        const tab = await browser.tabs.get(embeddedPopupPageTabId);
        if (tab?.id) return tab;
      } catch {}
    }
    const tabs = await browser.tabs.query(embeddedPopupPageWindowId != null ? { windowId: embeddedPopupPageWindowId } : {});
    const normalizedTarget = normalizePopupTabUrl(embeddedPopupPageUrl);
    if (!normalizedTarget) return null;
    return tabs.find((tab) => normalizePopupTabUrl(tab.url || "") === normalizedTarget) || null;
  } catch {
    return null;
  }
}


function getTabsUrl(tabs) {
  for (const tab of tabs) {
    tabsUrl = tab.url;
  }
}

function onError(error) {
  console.error(`Error: ${error}`);
}

async function checkPageContent() {
  try {
    const tab = await getActiveTab();
    if (!tab || !/(?:myreadingmanga\.info|(?:www\.)?mangalotus\.com|(?:www\.)?baramangaonline\.com|(?:www\.)?yaoimangaonline\.com|(?:www\.)?nhentai\.net)/.test(tab.url || "")) {
      ["downloadImagesBtn", "downloadVideoBtn", "downloadAllBtn", "downloadCard"].forEach(id => setElementDisplay(id, "none"));
      setElementDisplay("addCurrentPageBtn", "none");
      setElementDisplay("noContentMessage", "block");
      updateStatusText("pageTitle", "No content selected");
      updateStatusText("statusText", "Navigate to a MyReadingManga, Manga Lotus, BaraMangaOnline, or nhentai gallery page");
      updateSiteChip("Open a supported site page", "idle");
      return;
    }

    const data = await getMRMData();
    const hasImages = Array.isArray(data?.images) && data.images.length > 0;
    const hasVideo = !!data?.video;
    const isArchive = !!data?.isArchivePage;
    const isPost = !!data?.isPostPage;

    updateStatusText("pageNumber", data?.page || "1");
    updateStatusText("pageTitle", data?.title || (isArchive ? "Archive page" : "Checking page…"));

    if (!isPost || isArchive || !(hasImages || hasVideo)) {
      ["downloadImagesBtn", "downloadVideoBtn", "downloadAllBtn", "downloadCard"].forEach(id => setElementDisplay(id, "none"));
      setElementDisplay("noContentMessage", "block");
      setElementDisplay("addCurrentPageBtn", "none");
      updateStatusText("pageTitle", isArchive ? "Listing page" : "No post selected");
      updateStatusText("statusText", isArchive ? "Use the card buttons on the listing page, or open Queue." : "Open a post page to download");
      updateSiteChip(isArchive ? "Listing page ignored" : "No post selected", "idle");
      if (isArchive && /Android/i.test(navigator.userAgent || "") && currentView === "main") {
        showQueue();
      }
      return;
    }

    setElementDisplay("noContentMessage", "none");
    setElementDisplay("addCurrentPageBtn", "block");
    const isVideo = data.contentType === "video";
    const isImages = data.contentType === "images";

    setElementDisplay("downloadVideoBtn", (isVideo || hasVideo) ? "block" : "none");
    setElementDisplay("downloadImagesBtn", (isImages || hasImages) ? "block" : "none");
    setElementDisplay("downloadAllBtn", (hasImages && hasVideo) ? "block" : "none");

    if (hasImages) {
      updateStatusText("imagesButtonText", "Download Images (CBZ)");
      updateStatusText("imageCount", data.images.length);
    }

    updateStatusText("statusText", "Ready");
    updateSiteChip((isVideo || hasVideo) && !(isImages || hasImages) ? "Video page ready" : "Post page ready", "ok");
  } catch (error) {
    console.error("[MRM] Error checking page content:", error);
    setElementDisplay("noContentMessage", "block");
    updateStatusText("statusText", "Error or not on a supported page");
    updateSiteChip("Could not read current tab", "error");
  }
}

//event listeners

function setupEventListeners() {
  document
    .getElementById("downloadImagesBtn")
    .addEventListener("click", handleDownloadClick);

  document
    .getElementById("downloadVideoBtn")
    .addEventListener("click", handleDownloadClick);

  document
    .getElementById("downloadAllBtn")
    .addEventListener("click", handleDownloadAllClick);

  document
    .getElementById("downloadBtn")
    .addEventListener("click", handleDownloadClick);

  document
    .getElementById("cancelBtn")
    .addEventListener("click", handleDeleteClick);

  document.getElementById("downloadTabBtn")?.addEventListener("click", showMain);

  document
    .getElementById("settingsBtn")
    .addEventListener("click", handleSettingsClick);

  document
    .getElementById("bulkDownloadBtn")
    .addEventListener("click", handleBulkDownloadClick);

    document.getElementById("libraryBtn")?.addEventListener("click", showLibrary);
  document.getElementById("openLibraryPageBtn")?.addEventListener("click", openLibraryPage);
  document.getElementById("saveCurrentPageLibraryBtn")?.addEventListener("click", saveCurrentPageToLibrary);
  document.getElementById("historyBtn")?.addEventListener("click", showHistory);
  document.getElementById("sitesBtn")?.addEventListener("click", showSites);
  document.getElementById("debugBtn")?.addEventListener("click", showDebug);
  bindQuickFilterRow("queueQuickFilters", "data-queue-filter", (value) => { queueQuickFilter = value || "all"; renderQueue(); setQuickChipState("queueQuickFilters", "data-queue-filter", queueQuickFilter); });
  bindQuickFilterRow("historyQuickFilters", "data-history-filter", (value) => { historyQuickFilter = value || "all"; renderHistory(); setQuickChipState("historyQuickFilters", "data-history-filter", historyQuickFilter); });
  bindQuickFilterRow("debugQuickFilters", "data-debug-filter", (value) => { debugQuickFilter = value || "all"; renderDebugLog(); setQuickChipState("debugQuickFilters", "data-debug-filter", debugQuickFilter); });

  document.getElementById("closePopupBtn")?.addEventListener("click", closePopupPage);
  document.getElementById("addCurrentPageBtn")?.addEventListener("click", addCurrentPageToQueue);
  document.getElementById("downloadSelectedQueueBtn")?.addEventListener("click", () => processDownloadQueue(true));
  document.getElementById("downloadAllQueueBtn")?.addEventListener("click", () => processDownloadQueue(false));
  document.getElementById("autoStartQueueBtn")?.addEventListener("click", () => {
    setQueueAutoStartEnabled(!mrmSettings.queueAutoStartEnabled);
  });
  document.getElementById("pauseAfterCurrentQueueBtn")?.addEventListener("click", () => {
    setQueuePauseAfterCurrentEnabled(!mrmSettings.queuePauseAfterCurrentEnabled);
  });
  document.getElementById("retryFailedQueueBtn")?.addEventListener("click", retryFailedQueueItems);
  document.getElementById("clearCompletedQueueBtn")?.addEventListener("click", clearCompletedQueueItems);
  document.getElementById("queueConcurrencySelect")?.addEventListener("change", (event) => setQueueConcurrency(event.target.value));
  document.getElementById("queueWifiOnlyToggle")?.addEventListener("change", (event) => setQueueWifiOnly(event.target.checked));
  document.getElementById("clearDoneQueueBtn")?.addEventListener("click", async () => {
    downloadQueue = downloadQueue.filter((item) => !["completed", "done"].includes(String(item.status || "").toLowerCase()));
    await saveDownloadQueue();
    renderQueue();
  });
  document.getElementById("clearQueueBtn")?.addEventListener("click", async () => {
    if (!confirm("Clear the full download list?")) return;
    downloadQueue = [];
    await saveDownloadQueue({ replaceAll: true });
    renderQueue();
  });

  document.getElementById("exportQueueBtn")?.addEventListener("click", exportDownloadQueue);
  document.getElementById("importQueueBtn")?.addEventListener("click", () => {
    document.getElementById("importQueueFileInput")?.click();
  });
  document.getElementById("importQueueFileInput")?.addEventListener("change", (event) => {
    importDownloadQueueFromFile(event.target.files?.[0]);
  });

  document.getElementById("copyDiagnosticReportBtn")?.addEventListener("click", copyDiagnosticReport);
  document.getElementById("exportDiagnosticReportBtn")?.addEventListener("click", exportDiagnosticReport);
  document.getElementById("copyDebugLogBtn")?.addEventListener("click", copyDebugLog);
  document.getElementById("copyQueueDiagnosticBtn")?.addEventListener("click", copyQueueDiagnostic);
  document.getElementById("clearStuckDownloadsBtn")?.addEventListener("click", clearStuckDownloads);
  document.getElementById("exportDebugLogBtn")?.addEventListener("click", exportDebugLogJson);
  document.getElementById("debugSourceFilter")?.addEventListener("change", renderDebugLog);
  document.getElementById("clearDebugLogBtn")?.addEventListener("click", clearStoredDebugLog);

  setNavState(currentView);


  document
    .getElementById("clearHistoryBtn")
    .addEventListener("click", clearHistory);
  document.getElementById("aboutBtn").addEventListener("click", () => {
    alert(
      "Download bulk images/videos from MRM. This tool is intended for downloading and archiving media from supported sites, including nhentai galleries. Please support the real artists and other works."
    );
  });
}

function showQueue() {
  currentView = "queue";
  queueSheetOpen = true;
  setNavState("queue");
  setElementDisplay("mainContent", "block");
  setElementDisplay("queueContent", "block");
  setElementDisplay("historyContent", "none");
  setElementDisplay("sitesContent", "none");
  setElementDisplay("debugContent", "none");
  renderQueue();
  updateQueueSheetState();
  requestAnimationFrame(() => {
    document.getElementById("queueContent")?.scrollIntoView({ behavior: "smooth", block: "start" });
  });
}

function showHistory() {
  currentView = "history";
  queueSheetOpen = false;
  setNavState("history");
  setElementDisplay("mainContent", "none");
  setElementDisplay("queueContent", "none");
  setElementDisplay("historyContent", "block");
  setElementDisplay("sitesContent", "none");
  setElementDisplay("debugContent", "none");
  renderHistory();
  updateQueueSheetState();
}

function showDebug() {
  currentView = "debug";
  queueSheetOpen = false;
  setNavState("debug");
  setElementDisplay("mainContent", "none");
  setElementDisplay("queueContent", "none");
  setElementDisplay("historyContent", "none");
  setElementDisplay("sitesContent", "none");
  setElementDisplay("debugContent", "block");
  renderDebugLog();
  updateQueueSheetState();
}

function showMain() {
  currentView = "main";
  queueSheetOpen = true;
  setNavState("main");
  setElementDisplay("mainContent", "block");
  setElementDisplay("queueContent", "block");
  setElementDisplay("historyContent", "none");
  setElementDisplay("sitesContent", "none");
  setElementDisplay("debugContent", "none");
  renderQueue();
}


function showSites() {
  currentView = "sites";
  queueSheetOpen = false;
  setNavState("sites");
  setElementDisplay("mainContent", "none");
  setElementDisplay("queueContent", "none");
  setElementDisplay("historyContent", "none");
  setElementDisplay("sitesContent", "block");
  setElementDisplay("debugContent", "none");
  renderSupportedSites();
  updateQueueSheetState();
}

function renderSupportedSites() {
  const grid = document.getElementById("sitesGrid");
  if (!grid) return;
  clearChildren(grid);
  for (const site of SUPPORTED_SITES) {
    const link = document.createElement("a");
    link.className = "site-link-card";
    link.href = site.url;
    link.dataset.url = site.url;
    link.title = `Open ${site.title}`;
    link.setAttribute("role", "button");

    const icon = document.createElement("img");
    icon.src = site.favicon;
    icon.alt = "";
    icon.loading = "lazy";
    icon.decoding = "async";

    const body = document.createElement("div");
    body.className = "site-link-body";
    const title = document.createElement("div");
    title.className = "site-link-title";
    title.textContent = site.title;
    const url = document.createElement("div");
    url.className = "site-link-url";
    url.textContent = site.url.replace(/^https?:\/\//, "");
    body.append(title, url);
    link.append(icon, body);

    link.addEventListener("click", async (event) => {
      event.preventDefault();
      try {
        await browser.tabs.create({ url: site.url });
        closePopupPage?.();
      } catch (error) {
        showToast(error?.message || `Could not open ${site.title}.`, "error");
      }
    });

    grid.appendChild(link);
  }
}

function updateUI() {
  updateQueueCountLabels();
  updateQueueAdvancedControls();
  setNavState(currentView);
  applyCompactMode();
  renderQueue();

  if (currentView === "history") {
    renderHistory();
  } else if (currentView === "sites") {
    renderSupportedSites();
  } else if (currentView === "debug") {
    renderDebugLog();
  }

  updateDashboard();
  updateQueueSheetState();
  syncPopupProgressFromJobs();
  syncLatestDownloadStatusCard();
}




function getQueueFilterGroupLabel(key) {
  return ({
    active: "Active",
    pending: "Pending",
    packing: "Packing",
    done: "Completed",
    failed: "Failed",
  })[key] || key;
}

function getQueueFilterKey(status, phase) {
  const statusValue = String(status || "").toLowerCase();
  const phaseValue = String(phase || "").toLowerCase();
  if (statusValue === "failed") return "failed";
  if (statusValue === "completed" || statusValue === "done") return "done";
  if (phaseValue === "packing" || statusValue === "packing" || phaseValue === "saving") return "packing";
  if (statusValue === "opening" || statusValue === "started" || statusValue === "downloading" || statusValue === "fetching" || phaseValue === "downloading" || phaseValue === "fetching") return "active";
  return "pending";
}

function appendQueueGroup(listRoot, title, items) {
  if (!items.length) return;
  const group = createEl("section", { className: "queue-group" });
  group.appendChild(createEl("div", { className: "queue-group-title", text: `${title} (${items.length})` }));
  items.forEach((node) => group.appendChild(node));
  listRoot.appendChild(group);
}


function renderQueue() {
  const queueList = document.getElementById("queueList");
  const emptyQueue = document.getElementById("emptyQueue");
  const queueSummary = document.getElementById("queueSummary");
  if (!queueList || !emptyQueue || !queueSummary) return;

  updateQueueCountLabels();
  updateDashboard();
  clearChildren(queueList);
  setQuickChipState("queueQuickFilters", "data-queue-filter", queueQuickFilter);

  const activeByUrl = new Map(
    activeJobs.map((job) => [normalizeQueueUrl(job.url || ""), job])
  );
  const historyByUrl = new Map(
    downloadHistory.map((entry) => [normalizeQueueUrl(entry.url || ""), entry])
  );
  const queued = [...downloadQueue].sort((a, b) => {
    const ao = Number.isFinite(Number(a.queueOrder)) ? Number(a.queueOrder) : Number.MAX_SAFE_INTEGER;
    const bo = Number.isFinite(Number(b.queueOrder)) ? Number(b.queueOrder) : Number.MAX_SAFE_INTEGER;
    if (ao !== bo) return ao - bo;
    return Number(b.addedAt || 0) - Number(a.addedAt || 0);
  });

  const pendingCount = queued.filter((item) => !["completed", "done", "failed"].includes(String(item.status || "pending").toLowerCase())).length;
  applyQuickFilterCounts("queueQuickFilters", "data-queue-filter", buildQueueFilterCounts(queued, activeJobs), {
    all: "All",
    active: "Active",
    pending: "Pending",
    packing: "Packing",
    done: "Done",
    failed: "Failed",
  });
  queueSummary.textContent = queued.length
    ? `${queued.length} saved item${queued.length === 1 ? "" : "s"} • ${pendingCount} pending`
    : "No saved downloads";

  if (!queued.length) {
    emptyQueue.style.display = "block";
    updateQueueSheetState();
    return;
  }

  const groups = { active: [], pending: [], packing: [], done: [], failed: [] };

  for (const item of queued) {
    const activeJob = activeByUrl.get(normalizeQueueUrl(item.url));
    const historyEntry = historyByUrl.get(normalizeQueueUrl(item.url));
    const historyStatus = String(historyEntry?.status || "").toLowerCase();
    const status = String(activeJob?.status || item.status || historyStatus || "pending").toLowerCase();
    const phase = String(activeJob?.phase || item.phase || status || "pending").toLowerCase();
    const filterKey = getQueueFilterKey(status, phase);
    if (queueQuickFilter !== "all" && queueQuickFilter !== filterKey) {
      continue;
    }

    const progress = activeJob ? Number(activeJob.progress || 0) : status === "completed" ? 100 : Number(item.progress || 0);
    const totalImages = Number(activeJob?.total || activeJob?.count || item.totalImages || item.count || 0);
    const currentImage = Number(activeJob?.completed || item.currentImage || 0);
    const labelParts = [];
    if (activeJob?.progressLabel || item.progressLabel) labelParts.push(activeJob?.progressLabel || item.progressLabel);
    else if (status === "completed") labelParts.push("Completed");
    else if (phase === "fetching" || phase === "downloading") labelParts.push(totalImages ? `Fetching ${currentImage}/${totalImages}` : "Fetching images");
    else if (phase === "packing") labelParts.push("Packing CBZ");
    else if (status === "started") labelParts.push("Started in background tab");
    else if (status === "opening") labelParts.push("Opening…");
    else labelParts.push(status);
    if (item.filename || historyEntry?.filename) labelParts.push(item.filename || historyEntry.filename);
    if (item.lastError) labelParts.push(item.lastError);
    const label = labelParts.filter(Boolean).join(" • ");
    const titleText = normalizeArchiveTitleForDisplay(cleanQueueTitle(item.title || "", "Untitled"));

    const wrapper = createEl("div", { className: `queue-card queue-card-rich is-${status}` });
    const top = createEl("div", { className: "queue-row-top" });

    const checkbox = createEl("input", {
      attrs: {
        type: "checkbox",
        checked: item.selected !== false ? "checked" : "",
        "aria-label": `Select ${titleText || "queued item"}`,
      },
    });
    checkbox.checked = item.selected !== false;
    checkbox.addEventListener("change", async () => {
      await updateQueueItem(item.id, { selected: checkbox.checked });
    });

    const left = createEl("div", { className: "min-w-0 flex-1" });
    left.appendChild(createEl("div", { className: "queue-title wrap-anywhere", text: titleText }));
    const badges = createEl("div", { className: "queue-badges" });
    badges.appendChild(createEl("span", { className: `pill ${status === "failed" ? "danger" : status === "completed" ? "success" : "info"}`, text: getQueueStatusLabel(status, phase) }));
    if (item.host) badges.appendChild(createEl("span", { className: "pill", text: item.host }));
    if (historyEntry?.format) badges.appendChild(createEl("span", { className: "pill", text: String(historyEntry.format).toUpperCase() }));
    left.appendChild(badges);
    left.appendChild(createEl("div", { className: "queue-meta wrap-anywhere", text: label || "Ready" }));
    if (item.url) left.appendChild(createEl("div", { className: "queue-meta wrap-anywhere", text: item.url }));
    if (totalImages || currentImage || progress) {
      left.appendChild(createEl("div", {
        className: "queue-meta wrap-anywhere",
        text: `${Math.round(clampPercent(progress))}%${totalImages ? ` • ${currentImage}/${totalImages} images` : ""}`,
      }));
    }

    top.appendChild(checkbox);
    top.appendChild(left);
    wrapper.appendChild(top);

    const track = createEl("div", { className: `progress-track mt-2${phase === "packing" ? " is-indeterminate" : ""}` });
    track.appendChild(createEl("div", { className: "progress-fill", attrs: { style: `width:${clampPercent(progress)}%` } }));
    wrapper.appendChild(track);

    const actions = createEl("div", { className: "queue-actions" });
    const downloadBtn = createEl("button", { text: status === "failed" ? "Retry" : "Download" });
    downloadBtn.addEventListener("click", async () => {
      try {
        await openQueuedDownload(item);
      } catch (error) {
        await updateQueueItem(item.id, { status: "failed", lastError: error?.message || String(error) });
      }
    });

    const retryBtn = createEl("button", { text: "Retry" });
    retryBtn.addEventListener("click", async () => {
      await updateQueueItem(item.id, { status: "pending", phase: "pending", progress: 0, currentImage: 0, lastError: null, selected: true, updatedAt: Date.now() });
      scheduleQueueAutoStart("retry-item");
    });
    const sourceBtn = createEl("button", { text: "Open" });
    sourceBtn.addEventListener("click", async () => {
      try {
        await browser.tabs.create({ url: item.url, active: false });
      } catch {
        window.open(item.url, "_blank", "noopener");
      }
    });
    const upBtn = createEl("button", { text: "↑" });
    upBtn.title = "Move up";
    upBtn.addEventListener("click", () => moveQueueItem(item.id, -1));
    const downBtn = createEl("button", { text: "↓" });
    downBtn.title = "Move down";
    downBtn.addEventListener("click", () => moveQueueItem(item.id, 1));
    const removeBtn = createEl("button", { text: "Remove" });
    removeBtn.addEventListener("click", () => removeQueueItem(item.id));
    actions.append(downloadBtn, retryBtn, sourceBtn, upBtn, downBtn, removeBtn);
    wrapper.appendChild(actions);

    const diagnostics = createEl("details", { className: "queue-diagnostics" });
    diagnostics.appendChild(createEl("summary", { text: "Diagnostics" }));
    const reason = getQueueDiagnosticReason(item, activeJob, status);
    diagnostics.appendChild(createEl("div", { className: "queue-meta wrap-anywhere", text: `State: ${status || "pending"} • ${reason}` }));
    diagnostics.appendChild(createEl("div", { className: "queue-meta wrap-anywhere", text: `Selected: ${item.selected !== false ? "yes" : "no"} • Auto-start: ${mrmSettings.queueAutoStartEnabled ? "on" : "off"} • Wi‑Fi only: ${mrmSettings.queueWifiOnly ? "on" : "off"}` }));
    if (item.lastError) diagnostics.appendChild(createEl("div", { className: "queue-meta wrap-anywhere", text: `Last error: ${item.lastError}` }));
    wrapper.appendChild(diagnostics);

    groups[filterKey].push(wrapper);
  }

  const visibleCount = Object.values(groups).reduce((acc, items) => acc + items.length, 0);
  if (!visibleCount) {
    emptyQueue.style.display = "block";
    emptyQueue.textContent = "No queue items match this filter";
    updateQueueSheetState();
    return;
  }

  emptyQueue.style.display = "none";
  emptyQueue.textContent = "No queued downloads";

  if (queueQuickFilter === "all") {
    appendQueueGroup(queueList, "Active", groups.active);
    appendQueueGroup(queueList, "Pending", groups.pending);
    appendQueueGroup(queueList, "Packing", groups.packing);
    appendQueueGroup(queueList, "Completed", groups.done);
    appendQueueGroup(queueList, "Failed", groups.failed);
  } else {
    appendQueueGroup(queueList, getQueueFilterGroupLabel(queueQuickFilter), groups[queueQuickFilter] || []);
  }

  updateQueueSheetState();
}

function syncPopupProgressFromJobs() {
  const jobs = [...activeJobs]
    .filter(isActiveDownloadJob)
    .sort((a, b) => new Date(b.updatedAt || b.startedAt || 0) - new Date(a.updatedAt || a.startedAt || 0));
  const job = jobs[0];

  if (!job) {
    setProgressPanelVisible(Boolean(currentDownload));
    if (!currentDownload) {
      setElementDisplay("cancelBtn", "none");
    }
    return;
  }

  setProgressPanelVisible(true);
  setElementDisplay("downloadCard", "block");
  setElementDisplay("cancelBtn", "inline-flex");
  updateStatusText("downloadTitle", job.title || "Downloading…");
  updateStatusText("downloadStatus", job.progressLabel || job.status || "Queued");
  updateStatusText("progressText", `${Math.round(job.progress || 0)}%`);
  updateStatusText("progressStatus", job.status || "queued");
  setElementWidth("progressBar", `${clampPercent(job.progress || 0)}%`);
}

function renderHistory() {
  const historyList = document.getElementById("historyList");
  const emptyHistory = document.getElementById("emptyHistory");

  if (!historyList || !emptyHistory) return;
  setQuickChipState("historyQuickFilters", "data-history-filter", historyQuickFilter);
  clearChildren(historyList);

  const allEntries = [...downloadHistory];
  let visibleEntries = allEntries;
  if (historyQuickFilter === "completed") {
    visibleEntries = allEntries.filter((item) => String(item.status || "completed").toLowerCase() === "completed");
  } else if (historyQuickFilter === "failed") {
    visibleEntries = allEntries.filter((item) => String(item.status || "").toLowerCase() === "failed");
  } else if (historyQuickFilter === "recent") {
    visibleEntries = allEntries.slice(0, 20);
  }

  if (visibleEntries.length === 0) {
    emptyHistory.style.display = "block";
    return;
  }

  emptyHistory.style.display = "none";

  for (const item of visibleEntries) {
    const dateObj = new Date(item.timestamp);
    const date = dateObj.toLocaleDateString();
    const time = dateObj.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    const status = String(item.status || "completed").toLowerCase();
    const wrapper = createEl("div", { className: "history-row" });
    const top = createEl("div", { className: "history-row-top" });
    const left = createEl("div", { className: "min-w-0 flex-1" });
    left.appendChild(createEl("div", { className: "history-title wrap-anywhere", text: item.title || "Untitled" }));
    const metaParts = [`${date} · ${time}`];
    if (item.count) metaParts.push(`${item.count} files`);
    if (item.format) metaParts.push(String(item.format).toUpperCase());
    left.appendChild(createEl("div", { className: "history-meta wrap-anywhere", text: metaParts.join(" • ") }));
    if (item.filename) left.appendChild(createEl("div", { className: "history-meta wrap-anywhere", text: item.filename }));
    if (item.error) left.appendChild(createEl("div", { className: "history-meta wrap-anywhere", text: item.error }));
    top.appendChild(left);
    top.appendChild(createEl("span", { className: `pill ${status === "completed" ? "success" : status === "failed" ? "danger" : "info"}`, text: status === "completed" ? "Done" : status === "failed" ? "Failed" : status }));
    wrapper.appendChild(top);
    historyList.appendChild(wrapper);
  }
}

// open the external url
async function openUrl(url) {
  try {
    const validUrl = new URL(url);

    await browser.tabs.create({
      url: validUrl.href,
      active: true,
    });

    window.close();
  } catch (error) {
    console.error("[MRM] Error opening URL:", error);
    alert("Invalid URL or unable to open the link");
  }
}

// clear the history
async function clearHistory() {
  if (confirm("Are you sure you want to clear all download history?")) {
    downloadHistory = [];
    await saveDownloadHistory();
    renderHistory();
  }
}

function setDownloadButtonState(isDisabled, text) {
  const buttons = ["downloadImagesBtn", "downloadBtn", "downloadAllBtn"];
  buttons.forEach(id => {
    const btn = document.getElementById(id);
    if (!btn) return;
    btn.disabled = isDisabled;

    // Handle special text scenarios
    if (text) {
      if (id === "downloadAllBtn") {
        updateStatusText("allButtonText", text);
      } else {
        btn.textContent = text;
      }
    }
  });
}

async function handlePdfDownloadClick() {
  try {
    const data = await getMRMData();
    if (!data) {
      alert("No content found on this page.");
      setDownloadButtonState(false);
      return;
    }

    if (data.images && data.images.length > 0) {
      await downloadPdf(data.images, data.title, data.page);
    } else {
      alert("No images found to generate PDF.");
      setDownloadButtonState(false, "Generate PDF");
    }
  } catch (error) {
    console.error("[MRM] PDF download error:", error);
    setDownloadButtonState(false, "Generate PDF");
    alert("Failed to generate PDF. Check console for details.");
  }
}

async function handleDownloadClick() {
  try {
    const data = await getMRMData();
    if (!data) {
      alert("No content found on this page.");
      setDownloadButtonState(false);
      return;
    }

    if (data.contentType) {
      switch (data.contentType) {
        case "video":
          if (data.video) {
            await downloadVideo(data.video, data.title);
          } else {
            alert("Video content detected but no video source found.");
            setDownloadButtonState(false, "Download video");
          }
          break;

        case "images":
          if (data.images && data.images.length > 0) {
            await downloadImages(data.images, data.title, data.page);
          } else {
            alert("Image content detected but no images found.");
            setDownloadButtonState(false, "Download images (CBZ)");
          }
          break;

        default:
          alert("No downloadable content found.");
          setDownloadButtonState(false);
          break;
      }
    } else {
      const hasImages = data.images && data.images.length > 0;
      const hasVideo = data.video;

      if (hasImages && !hasVideo) {
        await downloadImages(data.images, data.title, data.page);
      } else if (hasVideo && !hasImages) {
        await downloadVideo(data.video, data.title);
      } else if (hasImages && hasVideo) {
        const choice = confirm(
          "This page has both images and video. Click OK for images, Cancel for video."
        );
        if (choice) {
          await downloadImages(data.images, data.title, data.page);
        } else {
          await downloadVideo(data.video, data.title);
        }
      } else {
        alert("No downloadable content found.");
        setDownloadButtonState(false);
      }
    }
  } catch (error) {
    console.error("[MRM] Download error:", error);
    alert("Download failed. Check console for details.");
    setDownloadButtonState(false);
  }
}

async function handleDownloadAllClick() {
  try {
    const data = await getMRMData();
    if (!data) {
      alert("No content found on this page.");
      setDownloadButtonState(false);
      return;
    }

    const hasImages = data.images && data.images.length > 0;
    const hasVideo = !!data.video;

    if (!hasImages && !hasVideo) {
      alert("No downloadable content found.");
      setDownloadButtonState(false);
      return;
    }

    await downloadAllMedia({
      images: hasImages ? data.images : [],
      videoUrl: hasVideo ? data.video : null,
      title: data.title,
      page: data.page || "1",
    });
  } catch (error) {
    console.error("[MRM] Download all error:", error);
    alert("Download failed. Check console for details.");
    setDownloadButtonState(false);
  }
}

function handleDeleteClick() {
  if (currentDownload) {
    if (confirm("Are you sure you want to cancel this download?")) {
      currentDownload = null;
      setProgress(0, "Cancelled");
      updateStatus("Cancelled");
      setDownloadButtonState(false);
    }
  } else {
    alert("No active download to cancel.");
  }
}

function handleBulkDownloadClick() {
  window.location.href = "bulk-download.html";
}

function handleSettingsClick() {
  window.location.href = "settings.html";
}

function setProgress(percent, text) {
  const normalized = clampPercent(Number(percent || 0));
  const active = Boolean(currentDownload) && normalized > 0 && normalized < 100;

  setProgressPanelVisible(active);
  if (active) {
    setElementDisplay("downloadCard", "block");
    setElementDisplay("cancelBtn", "inline-flex");
  } else if (normalized === 100) {
    setTimeout(() => {
      setProgressPanelVisible(false);
      setElementDisplay("cancelBtn", "none");
    }, 1200);
  } else {
    setElementDisplay("cancelBtn", "none");
  }

  setElementWidth("progressBar", `${normalized}%`);
  updateStatusText("progressText", active ? `${Math.round(normalized)}%` : "No active download");

  if (text) {
    updateStatusText("downloadStatus", text);
    updateStatusText("progressStatus", active ? text : "Idle");
    if (currentDownload) {
      updateStatusText("downloadTitle", `Downloading ${currentDownload.type}...`);
    }
  }

  if (mrmSettings.debugMode) {
    console.log(`[MRM] Progress: ${normalized}% - ${text}`);
  }
}

function updateStatus(status) {
  updateStatusText("statusText", status);
}

function isActiveDownloadJob(job) {
  const status = String(job?.status || "").toLowerCase();
  if (!job) return false;
  if (["completed", "complete", "done", "failed", "error", "cancelled", "canceled", "paused", "stopped", "idle"].includes(status)) {
    return false;
  }
  return ["queued", "opening", "started", "downloading", "fetching", "packing", "building", "running", "active"].includes(status) ||
    Number(job.progress || 0) > 0 && Number(job.progress || 0) < 100;
}

function setProgressPanelVisible(visible) {
  const panel = document.querySelector(".progress-card");
  if (!panel) return;
  panel.classList.toggle("is-active", Boolean(visible));
  if (!visible) {
    updateStatusText("progressStatus", "Idle");
    updateStatusText("progressText", "No active download");
    setElementWidth("progressBar", "0%");
    setElementDisplay("cancelBtn", "none");
  }
}


function syncLatestDownloadStatusCard() {
  if (downloadHistory.length > 0 && currentView === "main") {
    const latest = downloadHistory[0];
    if (latest.status === "completed") {
      return;
    }
    const heading = document.querySelector("h2");
    if (heading) heading.textContent = latest.title;
    updateStatus(latest.status);
    setProgress(latest.progress);
  }
}

async function downloadImages(images, title, page = "1") {
  if (!images.length) {
    alert("No images found on this page.");
    setDownloadButtonState(false, "Download images (CBZ)");
    return;
  }

  const tab = await getActiveTab();
  currentDownload = { type: "images", title, url: tab.url };
  updateStatus("Downloading images...");
  setDownloadButtonState(true, "Downloading...");
  setProgress(0, "Starting download...");

  const zip = new JSZip();

  try {
    for (let i = 0; i < images.length; i++) {
      const percent = ((i + 1) / images.length) * 90;
      setProgress(percent, `Downloading image ${i + 1} of ${images.length}...`);

      try {
        // Add referrer header for image requests
        const response = await fetchWithSettings(images[i], {
          headers: {
            Referer: tab.url,
          },
        });
        if (!response.ok) throw new Error(`HTTP error: ${response.status}`);

        const blob = await response.blob();
        const ext = getFileExtension(blob);
        zip.file(`image_${i + 1}.${ext}`, blob, { binary: true });

        if (mrmSettings.debugMode) {
          console.log(`[MRM] Downloaded image ${i + 1}/${images.length}`);
        }
      } catch (e) {
        console.error("[MRM] Error downloading image", images[i], e);
        if (mrmSettings.debugMode) {
          console.error("[MRM Debug] Image download error details:", e);
        }
      }
    }

    setProgress(95, "Creating CBZ file...");
    console.log("[MRM] Creating CBZ archive...");

    const content = await zip.generateAsync({ type: "blob", mimeType: "application/octet-stream" });
    console.log("[MRM] CBZ file created");

    setProgress(100, "Saving file...");

    const filename = normalizeCbzFilename(`${sanitizeFilename(title)} - Page ${page}.cbz`);
    const archiveBlob = createAndroidSafeCbzBlob(content);

    saveAs(archiveBlob, filename);

    addToHistory({
      title: `${title} - Page ${page}`,
      url: tab.url,
      type: "images",
      status: "completed",
      progress: 100,
      count: images.length,
      filename,
      format: "cbz",
    });

    updateStatus("Download completed");
    currentDownload = null;
    setDownloadButtonState(false, "Download images (CBZ)");

    console.log("[MRM] Images download completed");
  } catch (error) {
    console.error("[MRM] Images download error:", error);
    updateStatus("Download failed");
    setProgress(0, "Download failed");
    addToHistory({
      title,
      url: tab.url,
      type: "images",
      status: "failed",
      progress: 0,
    });
    currentDownload = null;
    setDownloadButtonState(false, "Download Images (CBZ)");
    alert("Images download failed. Check console for details.");
  }
}

async function downloadVideo(videoUrl, title) {
  if (!videoUrl) {
    alert("No video found on this page.");
    setDownloadButtonState(false, "Download video");
    return;
  }

  const tab = await getActiveTab();
  currentDownload = { type: "video", title, url: tab.url };
  updateStatus("Downloading video...");

  // Start with immediate visual feedback
  setProgress(5, "Initializing download...");
  setDownloadButtonState(true, "Downloading...");

  try {
    // Simulate progress during fetch to show activity
    let progressInterval = setInterval(() => {
      const progressBar = document.getElementById("progressBar");
      const currentProgress = progressBar ? parseInt(progressBar.style.width) || 5 : 5;
      if (currentProgress < 45) {
        setProgress(currentProgress + 2, "Fetching video...");
      }
    }, 300);

    // Add referrer header for video requests
    const response = await fetchWithSettings(videoUrl, {
      headers: {
        Referer: tab.url,
      },
    });

    clearInterval(progressInterval);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    setProgress(50, "Processing video...");

    // Try to get content length for better progress tracking
    const contentLength = response.headers?.get?.('content-length');
    let blob;

    if (contentLength && response.body && typeof response.body.getReader === 'function') {
      // Stream the response with progress tracking
      const total = parseInt(contentLength, 10);
      let loaded = 0;
      const reader = response.body.getReader();
      const chunks = [];

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        chunks.push(value);
        loaded += value.length;

        // Progress from 50% to 85% based on download progress
        const downloadProgress = 50 + Math.floor((loaded / total) * 35);
        setProgress(downloadProgress, `Downloading video... ${Math.floor((loaded / total) * 100)}%`);
      }

      // Combine chunks into blob
      const contentType = response.headers?.get?.('content-type') || 'video/mp4';
      blob = new Blob(chunks, { type: contentType });
    } else {
      // Fallback: show incremental progress during blob conversion
      setProgress(60, "Processing video data...");
      await new Promise(resolve => setTimeout(resolve, 100));
      setProgress(75, "Almost done...");
      blob = await response.blob();
    }

    setProgress(90, "Saving video...");

    // const safeTitle = title.replace(/[^a-z0-9]/gi, "_").toLowerCase();
    const ext = getFileExtension(blob, "mp4");
    const filename = `${title}.${ext}`;

    saveAs(blob, filename);

    setProgress(100, "Download completed");

    addToHistory({
      title,
      url: tab.url,
      type: "video",
      status: "completed",
      progress: 100,
      filename,
      format: ext,
    });

    updateStatus("Download completed");
    currentDownload = null;
    setDownloadButtonState(false, "Download video");

    console.log("[MRM] Video download completed");
  } catch (error) {
    console.error("[MRM] Video download error:", error);
    updateStatus("Download failed");
    setProgress(0, "Download failed");
    addToHistory({
      title,
      url: tab.url,
      type: "video",
      status: "failed",
      progress: 0,
    });
    currentDownload = null;
    setDownloadButtonState(false, "Download video");
    alert("Video download failed. Check console for details.");
  }
}

async function downloadAllMedia({ images, videoUrl, title, page = "1" }) {
  const hasImages = images && images.length > 0;
  const hasVideo = !!videoUrl;

  if (!hasImages && !hasVideo) {
    alert("No images or video to download.");
    return;
  }

  const tab = await getActiveTab();
  currentDownload = { type: "all", title, url: tab.url };
  updateStatus("Downloading media...");
  setDownloadButtonState(true, "Downloading...");
  setProgress(0, "Preparing files...");

  const zip = new JSZip();

  try {
    let progressBase = 0;
    let progressSpan = hasImages && hasVideo ? 45 : 90;

    // Images first
    if (hasImages) {
      for (let i = 0; i < images.length; i++) {
        const percent = progressBase + ((i + 1) / images.length) * progressSpan;
        setProgress(
          percent,
          `Downloading image ${i + 1} of ${images.length}...`
        );
        try {
          const response = await fetchWithSettings(images[i], {
            headers: { Referer: tab.url },
          });
          if (!response.ok) throw new Error(`HTTP error: ${response.status}`);
          const blob = await response.blob();
          const ext = getFileExtension(blob);
          zip.file(`images/image_${i + 1}.${ext}`, blob, { binary: true });
        } catch (e) {
          console.error("[MRM] Error downloading image", images[i], e);
        }
      }
      progressBase += progressSpan;
    }

    // Then video
    if (hasVideo) {
      setProgress(progressBase + 5, "Fetching video...");
      const response = await fetchWithSettings(videoUrl, {
        headers: { Referer: tab.url },
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const blob = await response.blob();
      const guessedExt = (() => {
        const byMime =
          blob.type && blob.type.includes("/") ? blob.type.split("/")[1] : null;
        const byUrl = videoUrl.split(".").pop();
        const candidate = (byMime || byUrl || "mp4").split(/[?#]/)[0];
        return candidate.length > 5 ? "mp4" : candidate;
      })();
      zip.file(`video/video.${guessedExt}`, blob, { binary: true });
      setProgress(progressBase + 45, "Added video to archive...");
    }

    setProgress(95, "Creating CBZ file...");
    const content = await zip.generateAsync({ type: "blob", mimeType: "application/octet-stream" });

    const filename = normalizeCbzFilename(`${sanitizeFilename(title).toLowerCase()}_p${page}_all.cbz`);
    const archiveBlob = createAndroidSafeCbzBlob(content);
    saveAs(archiveBlob, filename);

    setProgress(100, "Saved archive");

    addToHistory({
      title: `${title} - Page ${page}`,
      url: tab.url,
      type: "all",
      status: "completed",
      progress: 100,
      count: (images?.length || 0) + (videoUrl ? 1 : 0),
      filename,
      format: "cbz",
    });

    updateStatus("Download completed");
    currentDownload = null;
    setDownloadButtonState(false, "Download All (CBZ)");
  } catch (error) {
    console.error("[MRM] All media download error:", error);
    updateStatus("Download failed");
    setProgress(0, "Download failed");
    addToHistory({
      title,
      url: tab.url,
      type: "all",
      status: "failed",
      progress: 0,
    });
    currentDownload = null;
    setDownloadButtonState(false, "Download All (CBZ)");
    alert("All media download failed. Check console for details.");
  }
}

async function downloadPdf(images, title, page = "1") {
  if (!images.length) {
    alert("No images found on this page.");
    setPdfButtonState(false, "Generate PDF");
    return;
  }

  const tab = await getActiveTab();
  currentDownload = { type: "pdf", title, url: tab.url };
  updateStatus("Generating PDF...");
  setPdfButtonState(true, "Generating...");
  setProgress(0, "Initializing PDF generation...");

  try {
    let jsPDF;
    if (window.jspdf && window.jspdf.jsPDF) {
      jsPDF = window.jspdf.jsPDF;
    } else if (window.jsPDF) {
      jsPDF = window.jsPDF;
    } else {
      throw new Error(
        "PDF export is not available in this build."
      );
    }

    let pdf = null;

    for (let i = 0; i < images.length; i++) {
      const percent = ((i + 1) / images.length) * 90;
      setProgress(percent, `Processing image ${i + 1} of ${images.length}...`);

      try {
        // Add referrer header for PDF image requests
        const response = await fetchWithSettings(images[i], {
          headers: {
            Referer: tab.url,
          },
        });
        if (!response.ok) throw new Error(`HTTP error: ${response.status}`);

        const blob = await response.blob();
        const base64 = await blobToBase64(blob);
        const img = await loadImage(base64);

        // Initialize PDF on first image with page size matching image resolution (no borders)
        const orientation = img.width > img.height ? "l" : "p";
        if (!pdf) {
          pdf = new jsPDF(orientation, "px", [img.width, img.height]);
        } else {
          pdf.addPage([img.width, img.height], orientation);
        }

        // Choose image format based on mime (default to JPEG)
        const imgFormat = base64.toLowerCase().includes("png") ? "PNG" : "JPEG";

        pdf.addImage(base64, imgFormat, 0, 0, img.width, img.height);

        if (mrmSettings.debugMode) {
          console.log(`[MRM] Added image ${i + 1}/${images.length} to PDF`);
        }
      } catch (e) {
        console.error("[MRM] Error processing image for PDF", images[i], e);
        if (mrmSettings.debugMode) {
          console.error("[MRM Debug] PDF image processing error details:", e);
        }
      }
    }

    setProgress(95, "Finalizing PDF...");
    console.log("[MRM] PDF generation complete, saving...");

    const safeTitle = title.replace(/[^a-z0-9]/gi, "_").toLowerCase();
    const filename = `${safeTitle}_p${page}_manga.pdf`;

    pdf.save(filename);

    setProgress(100, "PDF saved!");

    addToHistory({
      title: `${title} - Page ${page} (PDF)`,
      url: tab.url,
      type: "pdf",
      status: "completed",
      progress: 100,
    });

    updateStatus("PDF generation completed");
    currentDownload = null;
    setPdfButtonState(false, "Generate PDF");

    console.log("[MRM] PDF generation completed");
  } catch (error) {
    console.error("[MRM] PDF generation error:", error);
    updateStatus("PDF generation failed");
    setProgress(0, "PDF generation failed");
    addToHistory({
      title,
      url: tab.url,
      type: "pdf",
      status: "failed",
      progress: 0,
    });
    currentDownload = null;
    setPdfButtonState(false, "Generate PDF");
    alert("PDF generation failed. Check console for details.");
  }
}
