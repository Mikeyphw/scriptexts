(() => {
  const { ACTIONS, CONFIG, ext } = globalThis.TMD_COMMON;

  const DEFAULT_SETTINGS = {
    debugEnabled: true,
    showFloatingButtons: true,
    autoCollectLight: true,
  };

  const getKey = (chatKey) => `${CONFIG.storage.chatPrefix}${chatKey}`;

  async function getSettings() {
    const data = await ext.storage.local.get(CONFIG.storage.settings);
    return { ...DEFAULT_SETTINGS, ...(data[CONFIG.storage.settings] || {}) };
  }
  async function setSettings(settings) {
    const merged = { ...DEFAULT_SETTINGS, ...(settings || {}) };
    await ext.storage.local.set({ [CONFIG.storage.settings]: merged });
    return merged;
  }
  async function appendLog(entry) {
    const data = await ext.storage.local.get(CONFIG.storage.logs);
    const logs = data[CONFIG.storage.logs] || [];
    logs.unshift(entry);
    if (logs.length > CONFIG.maxLogs) logs.length = CONFIG.maxLogs;
    await ext.storage.local.set({ [CONFIG.storage.logs]: logs });
    return logs;
  }
  async function getLogs() {
    return (await ext.storage.local.get(CONFIG.storage.logs))[CONFIG.storage.logs] || [];
  }
  async function clearLogs() {
    await ext.storage.local.set({ [CONFIG.storage.logs]: [] });
  }
  async function upsertMediaBatch(chatKey, chatLabel, entries) {
    const key = getKey(chatKey);
    const data = await ext.storage.local.get(key);
    const existing = data[key] || { chatKey, chatLabel, entries: [] };
    const list = Array.isArray(existing.entries) ? existing.entries.slice() : [];
    for (const entry of (entries || [])) {
      if (!entry || !entry.fingerprint) continue;
      const idx = list.findIndex((x) => x.fingerprint === entry.fingerprint);
      if (idx >= 0) list[idx] = { ...list[idx], ...entry, updatedAt: Date.now() };
      else list.unshift({ createdAt: Date.now(), updatedAt: Date.now(), ...entry });
    }
    if (list.length > CONFIG.maxIndexEntriesPerChat) list.length = CONFIG.maxIndexEntriesPerChat;
    const value = { chatKey, chatLabel, entries: list };
    await ext.storage.local.set({ [key]: value });
    return value;
  }
  async function getChatMedia(chatKey) {
    const key = getKey(chatKey);
    return (await ext.storage.local.get(key))[key] || { chatKey, chatLabel: "", entries: [] };
  }
  async function getAllIndexSummary() {
    const all = await ext.storage.local.get(null);
    return Object.entries(all)
      .filter(([k]) => k.startsWith(CONFIG.storage.chatPrefix))
      .map(([k, v]) => ({ key: k, chatKey: v.chatKey, chatLabel: v.chatLabel || v.chatKey, count: Array.isArray(v.entries) ? v.entries.length : 0 }))
      .sort((a, b) => b.count - a.count);
  }
  async function clearChatIndex(chatKey) {
    await ext.storage.local.remove(getKey(chatKey));
  }
  async function clearAllIndex() {
    const all = await ext.storage.local.get(null);
    const keys = Object.keys(all).filter((k) => k.startsWith(CONFIG.storage.chatPrefix));
    if (keys.length) await ext.storage.local.remove(keys);
  }
  async function exportChatIndex(chatKey) {
    return getChatMedia(chatKey);
  }
  const DOWNLOAD_JOB_LIMIT = 200;
  const DOWNLOAD_RETRY_DELAYS = [0, 300, 900];

  async function getDownloadJobs() {
    const data = await ext.storage.local.get(CONFIG.storage.downloadJobs);
    return Array.isArray(data[CONFIG.storage.downloadJobs]) ? data[CONFIG.storage.downloadJobs] : [];
  }

  async function saveDownloadJobs(jobs) {
    const bounded = jobs.slice(-DOWNLOAD_JOB_LIMIT);
    await ext.storage.local.set({ [CONFIG.storage.downloadJobs]: bounded });
    return bounded;
  }

  async function patchDownloadJob(requestId, patch) {
    const jobs = await getDownloadJobs();
    const index = jobs.findIndex((job) => job.requestId === requestId);
    const current = index >= 0 ? jobs[index] : { requestId, createdAt: Date.now() };
    const next = { ...current, ...patch, updatedAt: Date.now() };
    if (index >= 0) jobs[index] = next;
    else jobs.push(next);
    await saveDownloadJobs(jobs);
    return next;
  }

  async function startDownload(url, filename, requestId) {
    if (!/^https?:|^blob:/.test(String(url || ""))) throw new Error("Unsupported media URL");
    const safeName = String(filename || "download.bin").replace(/[\\/:*?"<>|]+/g, "_").slice(0, 180) || "download.bin";
    const id = requestId || `legacy_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    await patchDownloadJob(id, { url, filename: safeName, state: "starting", attempts: 0 });
    let lastError;
    for (let attempt = 0; attempt < DOWNLOAD_RETRY_DELAYS.length; attempt += 1) {
      if (DOWNLOAD_RETRY_DELAYS[attempt]) await new Promise((resolve) => setTimeout(resolve, DOWNLOAD_RETRY_DELAYS[attempt]));
      try {
        const downloadId = await ext.downloads.download({ url, filename: safeName, saveAs: false });
        await patchDownloadJob(id, { downloadId, state: "active", attempts: attempt + 1, error: "" });
        return { requestId: id, downloadId };
      } catch (error) {
        lastError = error;
        await patchDownloadJob(id, { state: "retrying", attempts: attempt + 1, error: String(error?.message || error) });
      }
    }
    await patchDownloadJob(id, { state: "failed", error: String(lastError?.message || lastError) });
    throw lastError || new Error("Download failed");
  }

  async function cancelDownload(requestId) {
    const jobs = await getDownloadJobs();
    const job = jobs.find((item) => item.requestId === requestId);
    if (!job) return { cancelled: false, reason: "not-found" };
    if (Number.isInteger(job.downloadId)) {
      try { await ext.downloads.cancel(job.downloadId); } catch {}
    }
    await patchDownloadJob(requestId, { state: "cancelled" });
    return { cancelled: true, requestId };
  }

  if (chrome.downloads?.onChanged) {
    chrome.downloads.onChanged.addListener((delta) => {
      if (!Number.isInteger(delta?.id)) return;
      getDownloadJobs().then(async (jobs) => {
        const job = jobs.find((item) => item.downloadId === delta.id);
        if (!job) return;
        if (delta.state?.current === "complete") await patchDownloadJob(job.requestId, { state: "complete" });
        else if (delta.state?.current === "interrupted") await patchDownloadJob(job.requestId, { state: "interrupted", error: delta.error?.current || job.error || "interrupted" });
      }).catch(() => {});
    });
  }

  chrome.runtime.onInstalled.addListener(() => {
    ext.storage.local.set({ [CONFIG.storage.settings]: DEFAULT_SETTINGS }).catch(() => {});
  });

  chrome.runtime.onMessage.addListener(EXT_PROTOCOL_V2.adaptCallbackListener((message, sender, sendResponse) => {
    (async () => {
      switch (message?.type) {
        case ACTIONS.GET_SETTINGS:
          sendResponse({ ok: true, settings: await getSettings() });
          break;
        case ACTIONS.SET_SETTINGS:
          sendResponse({ ok: true, settings: await setSettings(message.settings) });
          break;
        case ACTIONS.APPEND_LOG:
          sendResponse({ ok: true, logs: await appendLog(message.entry) });
          break;
        case ACTIONS.GET_LOGS:
          sendResponse({ ok: true, logs: await getLogs() });
          break;
        case ACTIONS.CLEAR_LOGS:
          await clearLogs();
          sendResponse({ ok: true });
          break;
        case ACTIONS.UPSERT_MEDIA_BATCH:
          sendResponse({ ok: true, value: await upsertMediaBatch(message.chatKey, message.chatLabel, message.entries) });
          break;
        case ACTIONS.GET_CHAT_MEDIA:
          sendResponse({ ok: true, value: await getChatMedia(message.chatKey) });
          break;
        case ACTIONS.GET_ALL_INDEX_SUMMARY:
          sendResponse({ ok: true, value: await getAllIndexSummary() });
          break;
        case ACTIONS.DOWNLOAD_URL: {
          const result = await startDownload(message.url, message.filename, message.requestId || message.__protocolV2RequestId);
          sendResponse({ ok: true, ...result });
          break;
        }
        case ACTIONS.CANCEL_DOWNLOAD:
          sendResponse({ ok: true, ...(await cancelDownload(message.requestId)) });
          break;
        case ACTIONS.GET_DOWNLOAD_JOBS:
          sendResponse({ ok: true, jobs: await getDownloadJobs() });
          break;
        case ACTIONS.CLEAR_CHAT_INDEX:
          await clearChatIndex(message.chatKey);
          sendResponse({ ok: true });
          break;
        case ACTIONS.CLEAR_ALL_INDEX:
          await clearAllIndex();
          sendResponse({ ok: true });
          break;
        case ACTIONS.EXPORT_CHAT_INDEX:
          sendResponse({ ok: true, value: await exportChatIndex(message.chatKey) });
          break;
        case ACTIONS.OPEN_LIBRARY:
          await ext.tabs.create({ url: chrome.runtime.getURL("library.html") });
          sendResponse({ ok: true });
          break;
        default:
          sendResponse({ ok: false, error: "Unknown action" });
      }
    })().catch((error) => sendResponse({ ok: false, error: String(error?.message || error) }));
    return true;
  }));
})();
