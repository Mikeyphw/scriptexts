const controls = {
  queueList: document.getElementById("queueList"),
  refreshBtn: document.getElementById("refreshBtn"),
  pauseBtn: document.getElementById("pauseBtn"),
  clearBtn: document.getElementById("clearBtn"),
  showListingButtons: document.getElementById("showListingButtons"),
  interceptPageDownloads: document.getElementById("interceptPageDownloads"),
  autoProcessQueue: document.getElementById("autoProcessQueue"),
  notifyOnComplete: document.getElementById("notifyOnComplete"),
  highlightUpdateCards: document.getElementById("highlightUpdateCards"),
  debug: document.getElementById("debug"),
  listingButtonMode: document.getElementById("listingButtonMode"),
  listingButtonStyle: document.getElementById("listingButtonStyle"),
  debugPanel: document.getElementById("debugPanel"),
  debugStatus: document.getElementById("debugStatus"),
  clearLogsBtn: document.getElementById("clearLogsBtn"),
  copyLogsBtn: document.getElementById("copyLogsBtn")
}

function formatRelative(timestamp) {
  const deltaMs = Date.now() - Number(timestamp || 0)
  const minutes = Math.floor(deltaMs / 60000)
  if (minutes <= 0) return "just now"
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

function makeButton(text, className, action, id) {
  const button = document.createElement("button")
  button.type = "button"
  button.textContent = text
  button.className = className
  button.dataset.action = action
  button.dataset.id = String(id)
  return button
}

function renderQueueItemNode(item) {
  const progress = Math.max(0, Math.min(100, Number(item.progress || 0)))
  const article = document.createElement("article")
  article.className = "queue-item"
  article.draggable = true
  article.dataset.id = String(item.id)

  const row = document.createElement("div")
  row.className = "queue-row"

  const left = document.createElement("div")
  const title = document.createElement("div")
  title.className = "queue-title"
  title.textContent = item.modName || "Stardew Mod"
  const subtitle = document.createElement("div")
  subtitle.className = "queue-subtitle"
  subtitle.textContent = item.fileName || item.label || item.kind || ""
  left.append(title, subtitle)

  const actions = document.createElement("div")
  actions.className = "queue-actions"
  if (["failed", "paused"].includes(item.status)) {
    actions.appendChild(makeButton("Retry", "secondary", "retry", item.id))
  }
  actions.appendChild(makeButton("Remove", "danger", "remove", item.id))

  row.append(left, actions)

  const meta = document.createElement("div")
  meta.className = "queue-meta"
  const badge = document.createElement("span")
  badge.className = "badge"
  badge.textContent = String(item.status || "")
  const kind = document.createElement("span")
  kind.textContent = item.kind || "manual"
  const age = document.createElement("span")
  age.textContent = formatRelative(item.createdAt)
  meta.append(badge, kind, age)

  const message = document.createElement("div")
  message.className = "queue-message"
  message.textContent = item.message || ""

  const progressWrap = document.createElement("div")
  progressWrap.className = "progress"
  const progressFill = document.createElement("span")
  progressFill.style.width = `${progress}%`
  progressWrap.appendChild(progressFill)

  article.append(row, meta, message, progressWrap)
  return article
}

function renderLogs(logs) {
  if (!controls.debugPanel) return
  const items = Array.isArray(logs) ? logs : []
  controls.debugPanel.textContent = items.length
    ? items.map(entry => {
        const time = new Date(entry.ts || Date.now()).toLocaleTimeString()
        const scope = entry.scope || "log"
        const url = entry.url ? ` @ ${entry.url}` : ""
        return `[${time}] ${scope}: ${entry.line || ""}${url}`
      }).join("\n")
    : "No logs yet."
  if (controls.debugStatus) {
    controls.debugStatus.textContent = `${items.length} log entries`
  }
}

function render(state) {
  const { queue = [], settings = {} } = state || {}
  controls.queueList.replaceChildren()

  if (queue.length) {
    for (const item of queue) {
      controls.queueList.appendChild(renderQueueItemNode(item))
    }
  } else {
    const empty = document.createElement("div")
    empty.className = "queue-empty"
    empty.textContent = "No downloads queued yet."
    controls.queueList.appendChild(empty)
  }

  controls.showListingButtons.checked = Boolean(settings.showListingButtons)
  controls.interceptPageDownloads.checked = Boolean(settings.interceptPageDownloads)
  controls.autoProcessQueue.checked = Boolean(settings.autoProcessQueue)
  controls.notifyOnComplete.checked = Boolean(settings.notifyOnComplete)
  if (controls.highlightUpdateCards) controls.highlightUpdateCards.checked = settings.highlightUpdateCards !== false
  controls.debug.checked = Boolean(settings.debug)
  controls.listingButtonMode.value = settings.listingButtonMode || "both"
  controls.listingButtonStyle.value = settings.listingButtonStyle || "icon"
  renderLogs(state.debugLogs || [])
}

async function refresh() {
  const state = await browser.runtime.sendMessage({ type: "GET_STATE" })
  render(state)
  const logs = await browser.runtime.sendMessage({ type: "GET_LOGS" }).catch(() => ({ logs: [] }))
  renderLogs(logs.logs || [])
}

async function saveSettings() {
  const payload = {
    showListingButtons: controls.showListingButtons.checked,
    interceptPageDownloads: controls.interceptPageDownloads.checked,
    autoProcessQueue: controls.autoProcessQueue.checked,
    notifyOnComplete: controls.notifyOnComplete.checked,
    highlightUpdateCards: controls.highlightUpdateCards ? controls.highlightUpdateCards.checked : true,
    debug: controls.debug.checked,
    listingButtonMode: controls.listingButtonMode.value,
    listingButtonStyle: controls.listingButtonStyle.value
  }
  const nextState = await browser.runtime.sendMessage({ type: "SAVE_SETTINGS", payload })
  render(nextState)
}

controls.refreshBtn.addEventListener("click", refresh)
controls.pauseBtn.addEventListener("click", () => browser.runtime.sendMessage({ type: "PAUSE_ACTIVE" }).then(render))
controls.clearBtn.addEventListener("click", () => browser.runtime.sendMessage({ type: "CLEAR_FINISHED" }).then(render))

for (const key of ["showListingButtons", "interceptPageDownloads", "autoProcessQueue", "notifyOnComplete", "highlightUpdateCards", "debug", "listingButtonMode", "listingButtonStyle"]) {
  controls[key].addEventListener("change", saveSettings)
}

controls.queueList.addEventListener("click", async event => {
  const button = event.target.closest("button[data-action][data-id]")
  if (!button) return
  const id = Number(button.dataset.id)
  if (!id) return
  if (button.dataset.action === "remove") {
    render(await browser.runtime.sendMessage({ type: "REMOVE_QUEUE_ITEM", id }))
    return
  }
  if (button.dataset.action === "retry") {
    render(await browser.runtime.sendMessage({ type: "RETRY_QUEUE_ITEM", id }))
  }
})

browser.runtime.onMessage.addListener(message => {
  if (message && message.type === "STATE_UPDATED") render(message.payload)
})

refresh()
controls.clearLogsBtn?.addEventListener("click", async () => {
  const state = await browser.runtime.sendMessage({ type: "CLEAR_LOGS" })
  render(state)
})

const queueList = document.getElementById("queueList")
queueList.addEventListener("dragstart", event => {
  const target = event.target.closest(".queue-item")
  if (!target) return
  target.classList.add("dragging")
  event.dataTransfer?.setData("text/plain", target.dataset.id || "")
})
queueList.addEventListener("dragend", event => {
  const target = event.target.closest(".queue-item")
  if (target) target.classList.remove("dragging")
})
queueList.addEventListener("dragover", event => {
  event.preventDefault()
})
queueList.addEventListener("drop", async event => {
  event.preventDefault()
  const draggedId = event.dataTransfer?.getData("text/plain")
  const target = event.target.closest(".queue-item")
  if (!target || !draggedId) return
  const targetId = target.dataset.id
  if (draggedId === targetId) return
  await browser.runtime.sendMessage({ type: "MOVE_QUEUE_ITEM", draggedId, targetId })
  await refresh()
})

controls.copyLogsBtn?.addEventListener("click", async () => {
  const logs = await browser.runtime.sendMessage({ type: "GET_LOGS" }).catch(() => ({ logs: [] }))
  const text = Array.isArray(logs.logs)
    ? logs.logs.map(entry => {
        const time = new Date(entry.ts || Date.now()).toLocaleTimeString()
        const scope = entry.scope || "log"
        const url = entry.url ? ` @ ${entry.url}` : ""
        return `[${time}] ${scope}: ${entry.line || ""}${url}`
      }).join("\n")
    : ""

  try {
    await navigator.clipboard.writeText(text || "")
    if (controls.debugStatus) controls.debugStatus.textContent = `Copied ${(logs.logs || []).length} log entries`
  } catch (error) {
    if (controls.debugStatus) controls.debugStatus.textContent = "Copy failed"
  }
})

try {
  if (document.documentElement.classList.contains("nxq-android-ui")) {
    document.body.classList.add("nxq-popup-mobile");
  }
} catch (error) {
  console.error(error);
}
