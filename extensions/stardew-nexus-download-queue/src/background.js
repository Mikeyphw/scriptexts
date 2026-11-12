const DEFAULT_SETTINGS = {
  showListingButtons: true,
  listingButtonMode: "both",
  listingButtonStyle: "icon",
  interceptPageDownloads: false,
  autoProcessQueue: true,
  notifyOnComplete: true,
  preferManagerForDefaultButton: false,
  highlightUpdateCards: true,
  debug: false
}

const MOD_STATE_PREFIX = "mod-state:"

function getModStateKey(modId) {
  return `${MOD_STATE_PREFIX}${modId}`
}

async function persistDownloadedModState(item) {
  if (!item || !item.modId) return
  const key = getModStateKey(item.modId)
  const stored = await browser.storage.local.get(key).catch(() => ({}))
  const existing = stored[key] || {}
  const nextState = {
    ...existing,
    modId: Number(item.modId) || item.modId,
    modUrl: item.sourceUrl || existing.modUrl || "",
    modName: item.modName || existing.modName || "Stardew Mod",
    downloadedFileId: item.fileId || existing.downloadedFileId || null,
    fileName: item.fileName || existing.fileName || "",
    downloadedAt: Date.now(),
    lastKnownUpdatedAt: existing.lastKnownUpdatedAt || null,
    lastKnownRemoteFileId: existing.lastKnownRemoteFileId || item.fileId || null,
    lastCheckedAt: existing.lastCheckedAt || null,
    status: "downloaded"
  }
  await browser.storage.local.set({ [key]: nextState })
}

const state = {
  settings: { ...DEFAULT_SETTINGS },
  queue: [],
  activeQueueId: null,
  downloadToQueue: {},
  nextQueueId: 1,
  debugLogs: []
}

function log(...args) {
  const line = args.map(arg => {
    if (typeof arg === "string") return arg
    try { return JSON.stringify(arg) } catch (_) { return String(arg) }
  }).join(" ")
  state.debugLogs.unshift({
    ts: Date.now(),
    scope: "background",
    line
  })
  state.debugLogs = state.debugLogs.slice(0, 200)
  if (state.settings.debug) console.log("[StardewNexusQueue]", ...args)
}

async function loadState() {
  const stored = await browser.storage.local.get(["settings", "queue", "nextQueueId", "downloadToQueue", "cbnx05c_interception_migrated"])
  state.settings = { ...DEFAULT_SETTINGS, ...(stored.settings || {}) }
  // Earlier versions silently defaulted to interception ON. A one-time
  // security migration requires fresh explicit consent rather than preserving
  // an indistinguishable inherited default. Do not re-enable automatically.
  const needsInterceptionReset = stored.cbnx05c_interception_migrated !== true
  if (needsInterceptionReset) state.settings.interceptPageDownloads = false
  state.queue = Array.isArray(stored.queue) ? stored.queue : []
  state.nextQueueId = Number.isInteger(stored.nextQueueId) ? stored.nextQueueId : 1
  state.downloadToQueue = stored.downloadToQueue && typeof stored.downloadToQueue === "object" ? stored.downloadToQueue : {}
  state.activeQueueId = state.queue.find(item => item.status === "resolving" || item.status === "downloading")?.id || null
  for (const item of state.queue) {
    if (item.status === "downloading" && !Object.values(state.downloadToQueue).includes(item.id)) {
      item.status = "queued"
      item.message = "Browser restarted. Re-queueing."
      item.downloadId = null
    }
  }
  await persist()
  if (needsInterceptionReset) await browser.storage.local.set({ cbnx05c_interception_migrated: true })
  await processQueue()
}

async function persist() {
  await browser.storage.local.set({
    settings: state.settings,
    queue: state.queue,
    nextQueueId: state.nextQueueId,
    downloadToQueue: state.downloadToQueue
  })
  broadcastState()
}

function getPublicState() {
  return {
    settings: state.settings,
    queue: state.queue,
    activeQueueId: state.activeQueueId,
    debugLogs: state.debugLogs
  }
}

function broadcastState() {
  browser.runtime.sendMessage({ type: "STATE_UPDATED", payload: getPublicState() }).catch(() => {})
}

function sanitizeFilenamePart(value) {
  return String(value || "")
    .replace(/[\\/:*?"<>|]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 120)
}

function buildFilename(item) {
  const mod = sanitizeFilenamePart(item.modName || `mod-${item.modId || "unknown"}`)
  const file = sanitizeFilenamePart(item.fileName || item.label || item.kind || "download")
  const ext = item.kind === "manager" ? ".nxm.txt" : ""
  return `Stardew Valley/${mod}/${file}${ext}`
}

function addQueueItem(data) {
  const dedupeKey = JSON.stringify({
    modId: data.modId || null,
    fileId: data.fileId || null,
    kind: data.kind || "manual",
    downloadUrl: data.downloadUrl || null
  })

  const existing = state.queue.find(item => JSON.stringify({
    modId: item.modId || null,
    fileId: item.fileId || null,
    kind: item.kind || "manual",
    downloadUrl: item.downloadUrl || null
  }) === dedupeKey && !["failed", "cancelled"].includes(item.status))

  if (existing) {
    updateItem(existing.id, {
      message: "Already queued."
    })
    return existing
  }

  const id = state.nextQueueId++
  const item = {
    id,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    status: "queued",
    progress: 0,
    message: "",
    downloadId: null,
    ...data
  }
  state.queue.unshift(item)
  return item
}

function updateItem(id, patch) {
  const item = state.queue.find(entry => entry.id === id)
  if (!item) return null
  Object.assign(item, patch, { updatedAt: Date.now() })
  return item
}

function removeQueueItem(id) {
  const index = state.queue.findIndex(item => item.id === id)
  if (index === -1) return null
  const [removed] = state.queue.splice(index, 1)
  if (state.activeQueueId === id) state.activeQueueId = null
  return removed
}

async function notify(title, message) {
  if (!state.settings.notifyOnComplete) return
  try {
    await browser.notifications.create({
      type: "basic",
      title,
      message,
      iconUrl: browser.runtime.getURL("icons/icon48.png")
    })
  } catch (error) {
    log("notification failed", error)
  }
}

async function launchManagerUrl(item) {
  const targetUrl = item.downloadUrl
  updateItem(item.id, {
    status: "launching",
    progress: 100,
    message: "Launching mod manager…"
  })
  await persist()

  try {
    if (item.tabId) {
      await browser.tabs.create({ url: targetUrl, active: false, openerTabId: item.tabId }).catch(async () => {
        await browser.tabs.update(item.tabId, { url: targetUrl })
      })
    } else {
      await browser.tabs.create({ url: targetUrl, active: false })
    }
    updateItem(item.id, {
      status: "handoff_attempted",
      progress: 0,
      message: "NXM launch attempted. Confirm receipt in the target app."
    })
    await notify("Stardew Nexus Queue", `${item.modName || "Mod"}: NXM launch attempted; check the mod manager.`)
  } catch (error) {
    updateItem(item.id, {
      status: "failed",
      message: `Manager launch failed: ${error && error.message ? error.message : String(error)}`
    })
  }
}

async function startBrowserDownload(item) {
  updateItem(item.id, {
    status: "downloading",
    progress: 0,
    message: "Starting browser download…"
  })
  await persist()

  try {
    const downloadId = await browser.downloads.download({
      url: item.downloadUrl,
      filename: buildFilename(item),
      saveAs: false,
      conflictAction: "uniquify"
    })
    state.downloadToQueue[String(downloadId)] = item.id
    updateItem(item.id, {
      downloadId,
      message: "Browser download started."
    })
  } catch (error) {
    updateItem(item.id, {
      status: "failed",
      message: `Download failed to start: ${error && error.message ? error.message : String(error)}`
    })
    state.activeQueueId = null
    await persist()
    await processQueue()
  }
}

async function processQueue() {
  if (!state.settings.autoProcessQueue) return
  if (state.activeQueueId !== null) return

  const nextItem = state.queue.find(item => item.status === "queued")
  if (!nextItem) {
    await persist()
    return
  }

  state.activeQueueId = nextItem.id
  updateItem(nextItem.id, {
    status: "resolving",
    message: "Preparing download…"
  })
  await persist()

  if (!nextItem.downloadUrl) {
    updateItem(nextItem.id, {
      status: "failed",
      message: "Missing download URL."
    })
    state.activeQueueId = null
    await persist()
    return processQueue()
  }

  if (nextItem.kind === "manager" || String(nextItem.downloadUrl).startsWith("nxm://")) {
    await launchManagerUrl(nextItem)
    state.activeQueueId = null
    await persist()
    return processQueue()
  }

  await startBrowserDownload(nextItem)
  await persist()
}

browser.downloads.onChanged.addListener(async delta => {
  const queueId = state.downloadToQueue[String(delta.id)]
  if (!queueId) return

  if (delta.bytesReceived || delta.totalBytes) {
    const item = state.queue.find(entry => entry.id === queueId)
    const received = delta.bytesReceived ? delta.bytesReceived.current : item?.receivedBytes || 0
    const total = delta.totalBytes ? delta.totalBytes.current : item?.totalBytes || 0
    let progress = item?.progress || 0
    if (received && total) progress = Math.max(0, Math.min(100, Math.round((received / total) * 100)))
    updateItem(queueId, {
      receivedBytes: received,
      totalBytes: total,
      progress
    })
    broadcastState()
  }

  if (delta.state && delta.state.current === "complete") {
    const item = updateItem(queueId, {
      status: "completed",
      progress: 100,
      message: "Download complete."
    })
    delete state.downloadToQueue[String(delta.id)]
    state.activeQueueId = null
    if (item) await persistDownloadedModState(item)
    await persist()
    if (item) await notify("Stardew Nexus Queue", `${item.modName || "Mod"} finished downloading.`)
    await processQueue()
  }

  if (delta.error && delta.error.current) {
    updateItem(queueId, {
      status: "failed",
      message: `Browser error: ${delta.error.current}`
    })
    delete state.downloadToQueue[String(delta.id)]
    state.activeQueueId = null
    await persist()
    await processQueue()
  }

  if (delta.paused && delta.paused.current === true) {
    updateItem(queueId, {
      status: "paused",
      message: "Browser download paused."
    })
    state.activeQueueId = null
    await persist()
    await processQueue()
  }
})

browser.runtime.onMessage.addListener(EXT_PROTOCOL_V2.adaptPromiseListener((message, sender) => {
  if (!message || !message.type) return undefined

  if (message.type === "GET_STATE") {
    return Promise.resolve(getPublicState())
  }

  if (message.type === "SAVE_SETTINGS") {
    state.settings = { ...state.settings, ...(message.payload || {}) }
    return persist().then(processQueue).then(() => getPublicState())
  }

  if (message.type === "ENQUEUE_DOWNLOAD") {
    const payload = message.payload || {}
    const item = addQueueItem({
      tabId: sender.tab ? sender.tab.id : null,
      sourceUrl: payload.sourceUrl || (sender.tab ? sender.tab.url : ""),
      modId: payload.modId || null,
      fileId: payload.fileId || null,
      modName: payload.modName || payload.label || "Stardew Mod",
      fileName: payload.fileName || payload.label || "Download",
      label: payload.label || payload.fileName || payload.modName || "Download",
      kind: payload.kind || "manual",
      downloadUrl: payload.downloadUrl || null,
      metadata: payload.metadata || {}
    })
    return persist().then(processQueue).then(() => item)
  }

  if (message.type === "REMOVE_QUEUE_ITEM") {
    const item = state.queue.find(entry => entry.id === message.id)
    if (item && item.downloadId) {
      browser.downloads.cancel(item.downloadId).catch(() => {})
      delete state.downloadToQueue[String(item.downloadId)]
    }
    removeQueueItem(message.id)
    return persist().then(processQueue).then(() => getPublicState())
  }

  if (message.type === "RETRY_QUEUE_ITEM") {
    const item = state.queue.find(entry => entry.id === message.id)
    if (!item) return Promise.resolve(getPublicState())
    item.status = "queued"
    item.progress = 0
    item.message = ""
    item.downloadId = null
    return persist().then(processQueue).then(() => getPublicState())
  }

  if (message.type === "CLEAR_FINISHED") {
    state.queue = state.queue.filter(item => !["completed", "handoff_attempted", "failed", "cancelled"].includes(item.status))
    return persist().then(processQueue).then(() => getPublicState())
  }

  if (message.type === "PAUSE_ACTIVE") {
    const active = state.queue.find(item => item.id === state.activeQueueId)
    if (!active || !active.downloadId || typeof browser.downloads.pause !== "function") {
      return Promise.resolve(getPublicState())
    }
    return browser.downloads.pause(active.downloadId).catch(() => {}).then(() => getPublicState())
  }

  if (message.type === "RESUME_ITEM") {
    const item = state.queue.find(entry => entry.id === message.id)
    if (!item || !item.downloadId || typeof browser.downloads.resume !== "function") {
      item.status = "queued"
      item.message = ""
      item.downloadId = null
      return persist().then(processQueue).then(() => getPublicState())
    }
    return browser.downloads.resume(item.downloadId).catch(() => {
      item.status = "queued"
      item.message = ""
      item.downloadId = null
      return persist().then(processQueue)
    }).then(() => getPublicState())
  }


if (message.type === "MOVE_QUEUE_ITEM") {
  const draggedId = Number(message.draggedId)
  const targetId = Number(message.targetId)
  const fromIndex = state.queue.findIndex(item => item.id === draggedId)
  const toIndex = state.queue.findIndex(item => item.id === targetId)
  if (fromIndex === -1 || toIndex === -1 || fromIndex === toIndex) {
    return Promise.resolve(getPublicState())
  }
  const [moved] = state.queue.splice(fromIndex, 1)
  state.queue.splice(toIndex, 0, moved)
  return persist().then(() => getPublicState())
}

  if (message.type === "GET_LOGS") {
    return Promise.resolve({ logs: state.debugLogs, settings: state.settings })
  }

  if (message.type === "CLEAR_LOGS") {
    state.debugLogs = []
    return persist().then(() => getPublicState())
  }

  if (message.type === "CONTENT_LOG") {
    const payload = message.payload || {}
    const line = typeof payload.line === "string" ? payload.line : JSON.stringify(payload)
    state.debugLogs.unshift({
      ts: Date.now(),
      scope: payload.scope || "content",
      line,
      url: payload.url || (sender.tab ? sender.tab.url : "")
    })
    state.debugLogs = state.debugLogs.slice(0, 200)
    if (state.settings.debug) console.log("[StardewNexusQueue][content]", line)
    return Promise.resolve({ ok: true })
  }


  return undefined
}))

loadState()