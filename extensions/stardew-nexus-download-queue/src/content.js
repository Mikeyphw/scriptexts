const NXQ = {
  settings: null,
  injectedPass: 0,
  observers: [],
  listingCache: new Map(),
  scheduledInject: false
}

const MANUAL_ICON = `
<svg viewBox="0 0 24 24" aria-hidden="true" class="nxq-icon">
  <path d="M12 3v10.2l3.4-3.4 1.4 1.4-5.8 5.8-5.8-5.8 1.4-1.4 3.4 3.4V3h2zM5 19h14v2H5z"></path>
</svg>`

const MANAGER_ICON = `
<svg viewBox="0 0 24 24" aria-hidden="true" class="nxq-icon">
  <path d="M12 2 4 6v6c0 5.2 3.3 9.9 8 11 4.7-1.1 8-5.8 8-11V6l-8-4zm1 6h3l-5 8h-3l5-8z"></path>
</svg>`

const STYLE_TEXT = `
#nxq-live-region {
  position: fixed;
  left: -9999px;
  top: auto;
}

.nxq-listing-actions {
  display: flex;
  gap: 8px;
  margin-top: 10px;
  flex-wrap: wrap;
  width: 100%;
}

.nxq-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  border: 1px solid rgba(255,255,255,0.12);
  border-radius: 10px;
  min-height: 36px;
  background: rgba(0,0,0,0.24);
  color: #f5f8fa;
  cursor: pointer;
  padding: 8px 12px;
  line-height: 1;
  transition: transform .12s ease, border-color .12s ease, background .12s ease;
}

.nxq-btn:hover {
  transform: translateY(-1px);
  border-color: rgba(255,255,255,0.24);
  background: rgba(0,0,0,0.34);
}

.nxq-btn:disabled {
  cursor: default;
  opacity: .72;
  transform: none;
}

.nxq-btn--manual {
  background: rgba(102, 187, 106, 0.18);
}

.nxq-btn--manager {
  background: rgba(84, 167, 255, 0.16);
}

.nxq-btn--icon {
  width: 36px;
  min-width: 36px;
  height: 36px;
  padding: 0;
  border-radius: 10px;
}

.nxq-btn--fill {
  flex: 1 1 auto;
}

.nxq-icon {
  width: 16px;
  height: 16px;
  fill: currentColor;
  pointer-events: none;
}

.nxq-btn-label {
  font-size: 13px;
  font-weight: 600;
  pointer-events: none;
}

.nxq-debug-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 999px;
  padding: 2px 8px;
  font-size: 11px;
  background: rgba(255, 82, 82, 0.25);
  color: #ffd4d4;
}
`


const SVG_NS = "http://www.w3.org/2000/svg"

function createSvgNode(name, attrs = {}) {
  const node = document.createElementNS(SVG_NS, name)
  for (const [key, value] of Object.entries(attrs)) {
    node.setAttribute(key, String(value))
  }
  return node
}

function createActionIcon(kind) {
  const svg = createSvgNode("svg", { viewBox: "0 0 24 24", "aria-hidden": "true", class: "nxq-icon" })
  const path = createSvgNode("path", {
    d: kind === "manager"
      ? "M12 2 4 6v6c0 5.2 3.3 9.9 8 11 4.7-1.1 8-5.8 8-11V6l-8-4zm1 6h3l-5 8h-3l5-8z"
      : "M12 3v10.2l3.4-3.4 1.4 1.4-5.8 5.8-5.8-5.8 1.4-1.4 3.4 3.4V3h2zM5 19h14v2H5z"
  })
  svg.appendChild(path)
  return svg
}

const CHIP_STYLE_TEXT = `
.nxq-chip-wrap {
  display: inline-flex;
  position: relative;
  margin-left: 8px;
  vertical-align: middle;
}

.nxq-chip {
  min-height: 28px;
  padding: 4px 10px;
  border-radius: 999px;
  gap: 0;
  font-size: 11px;
  font-weight: 700;
}

.nxq-chip--no-data {
  background: rgba(95, 84, 72, 0.38);
  color: #eadfce;
}

.nxq-chip--downloaded {
  background: rgba(112, 143, 79, 0.32);
  color: #edf6df;
}

.nxq-chip--update {
  background: rgba(140, 102, 52, 0.34);
  color: #fff0d5;
}

.nxq-tile--update {
  box-shadow: 0 0 0 1px rgba(177, 131, 68, 0.32), 0 0 20px rgba(177, 131, 68, 0.18);
}

.nxq-chip-popover {
  position: absolute;
  left: 0;
  top: calc(100% + 6px);
  z-index: 9999;
  min-width: 240px;
  max-width: 320px;
  padding: 10px;
  border-radius: 12px;
  background: rgba(23, 17, 13, 0.98);
  color: #ecd9bb;
  box-shadow: 0 12px 30px rgba(0,0,0,.34);
}

.nxq-chip-popover[hidden] {
  display: none !important;
}

.nxq-chip-popover--side {
  left: calc(100% + 8px);
  top: 0;
}

.nxq-chip-popover__title {
  font-size: 12px;
  font-weight: 700;
  color: #f2e4cc;
  margin-bottom: 6px;
}

.nxq-chip-popover__row {
  margin-top: 4px;
  font-size: 11px;
  color: #c8aa79;
}

.nxq-chip-popover__row strong {
  color: #efdfc6;
}

.nxq-chip-popover__actions {
  display: flex;
  gap: 6px;
  margin-top: 8px;
}

.nxq-chip-action {
  min-height: 26px;
  padding: 4px 8px;
  border-radius: 8px;
  font-size: 11px;
}

.nxq-chip-action--check {
  background: rgba(112, 143, 79, 0.26);
}

.nxq-chip-action--close {
  background: rgba(95, 84, 72, 0.38);
}
`


function log(...args) {
  if (NXQ.settings && NXQ.settings.debug) console.log("[StardewNexusQueue]", ...args)
  try {
    browser.runtime.sendMessage({
      type: "CONTENT_LOG",
      payload: {
        scope: "content",
        line: args.map(arg => {
          if (typeof arg === "string") return arg
          try { return JSON.stringify(arg) } catch (_) { return String(arg) }
        }).join(" "),
        url: location.href
      }
    }).catch(() => {})
  } catch (_) {}
}

function escapeHtml(value) {
  return String(value || "").replace(/[&<>"']/g, char => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  }[char]))
}

const MOD_STATE_PREFIX = "mod-state:"
const MOD_CHECK_PREFIX = "mod-check:"
const MOD_CHECK_TTL_MS = 30 * 60 * 1000

function getModStateKey(modId) {
  return `${MOD_STATE_PREFIX}${modId}`
}

function getModCheckKey(modId) {
  return `${MOD_CHECK_PREFIX}${modId}`
}

async function getStoredModState(modId) {
  const key = getModStateKey(modId)
  const data = await browser.storage.local.get(key).catch(() => ({}))
  return data[key] || null
}

async function setStoredModState(modId, state) {
  const key = getModStateKey(modId)
  await browser.storage.local.set({ [key]: state })
}

async function getStoredModCheck(modId) {
  const key = getModCheckKey(modId)
  const data = await browser.storage.local.get(key).catch(() => ({}))
  return data[key] || null
}

async function setStoredModCheck(modId, state) {
  const key = getModCheckKey(modId)
  await browser.storage.local.set({ [key]: state })
}

function shouldGlowUpdateCard() {
  return NXQ.settings?.highlightUpdateCards !== false
}

function formatChipDate(value) {
  if (!value) return "—"
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? String(value) : date.toLocaleString()
}

function getStatusLabel(status) {
  if (status === "update_available") return "Update available"
  if (status === "downloaded") return "Downloaded"
  return "No data"
}

function getStatusClass(status) {
  if (status === "update_available") return "nxq-chip--update"
  if (status === "downloaded") return "nxq-chip--downloaded"
  return "nxq-chip--no-data"
}

function applyUpdateGlow(tile, enabled) {
  tile.classList.toggle("nxq-tile--update", Boolean(enabled))
}

function getChipMount(tile) {
  return tile.querySelector('[data-e2eid="mod-tile-title"]') || getTileMount(tile) || tile
}

function ensureChipUi(tile) {
  let wrap = tile.querySelector(".nxq-chip-wrap")
  let chip = wrap?.querySelector(".nxq-mod-chip")
  let popover = wrap?.querySelector(".nxq-chip-popover")
  if (wrap && chip && popover) return { wrap, chip, popover }

  wrap = document.createElement("span")
  wrap.className = "nxq-chip-wrap"

  chip = document.createElement("button")
  chip.type = "button"
  chip.className = "nxq-btn nxq-mod-chip nxq-chip nxq-chip--no-data"
  chip.textContent = "No data"
  wrap.appendChild(chip)

  popover = document.createElement("div")
  popover.className = "nxq-chip-popover"
  popover.hidden = true
  wrap.appendChild(popover)

  const mount = getChipMount(tile)
  if (mount.matches?.('[data-e2eid="mod-tile-title"]')) {
    mount.insertAdjacentElement("afterend", wrap)
  } else {
    mount.prepend(wrap)
  }

  let pinned = false

  chip.addEventListener("mouseenter", () => {
    popover.hidden = false
    placeChipPopover(wrap, popover)
  })

  wrap.addEventListener("mouseleave", event => {
    if (!pinned && !wrap.contains(event.relatedTarget)) {
      popover.hidden = true
    }
  })

  chip.addEventListener("click", event => {
    event.preventDefault()
    event.stopPropagation()
    pinned = !pinned
    popover.hidden = !pinned
    if (!popover.hidden) placeChipPopover(wrap, popover)
  })

  document.addEventListener("click", event => {
    if (!wrap.contains(event.target)) {
      pinned = false
      popover.hidden = true
    }
  })

  return { wrap, chip, popover }
}

function placeChipPopover(wrap, popover) {
  popover.classList.remove("nxq-chip-popover--side")
  popover.hidden = false
  popover.style.left = ""
  popover.style.right = ""

  const wrapRect = wrap.getBoundingClientRect()
  const popRect = popover.getBoundingClientRect()
  const viewportHeight = window.innerHeight || document.documentElement.clientHeight
  const viewportWidth = window.innerWidth || document.documentElement.clientWidth

  if (wrapRect.bottom + popRect.height + 12 > viewportHeight) {
    popover.classList.add("nxq-chip-popover--side")
  }

  const nextRect = popover.getBoundingClientRect()
  if (nextRect.right > viewportWidth - 12) {
    popover.style.left = "auto"
    popover.style.right = "0"
  }
}

function updateChipPopover(tile, chip, popover, state, status) {
  const modId = state?.modId || Number(extractModIdFromUrl(getTileModUrl(tile)) || 0) || ""
  const modUrl = state?.modUrl || getTileModUrl(tile) || ""
  chip.dataset.modId = String(modId || "")
  chip.dataset.modUrl = modUrl

  const rows = [
    ["Status", getStatusLabel(status)],
    ["Downloaded file ID", state?.downloadedFileId || "—"],
    ["Downloaded at", formatChipDate(state?.downloadedAt)],
    ["Last checked", formatChipDate(state?.lastCheckedAt)],
    ["Last updated", formatChipDate(state?.lastKnownUpdatedAt)],
    ["Remote file ID", state?.lastKnownRemoteFileId || "—"]
  ]

  popover.replaceChildren()

  const title = document.createElement("div")
  title.className = "nxq-chip-popover__title"
  title.textContent = state?.modName || getModNameFromTile(tile) || "Mod status"
  popover.appendChild(title)

  for (const [labelText, valueText] of rows) {
    const row = document.createElement("div")
    row.className = "nxq-chip-popover__row"

    const strong = document.createElement("strong")
    strong.textContent = `${labelText}:`

    row.appendChild(strong)
    row.appendChild(document.createTextNode(` ${valueText}`))
    popover.appendChild(row)
  }

  const actions = document.createElement("div")
  actions.className = "nxq-chip-popover__actions"

  const checkButton = document.createElement("button")
  checkButton.type = "button"
  checkButton.className = "nxq-btn nxq-chip-action nxq-chip-action--check"
  checkButton.textContent = "Check now"

  const closeButton = document.createElement("button")
  closeButton.type = "button"
  closeButton.className = "nxq-btn nxq-chip-action nxq-chip-action--close"
  closeButton.textContent = "Close"

  actions.append(checkButton, closeButton)
  popover.appendChild(actions)

  closeButton.addEventListener("click", event => {
    event.preventDefault()
    event.stopPropagation()
    popover.hidden = true
  })

  checkButton.addEventListener("click", async event => {
    event.preventDefault()
    event.stopPropagation()
    const button = event.currentTarget
    const previousText = button.textContent
    button.textContent = "Checking…"
    button.disabled = true
    try {
      await forceRefreshModChip(tile, modId, modUrl)
      button.textContent = "Checked"
    } catch (error) {
      button.textContent = "Failed"
    }
    setTimeout(() => {
      button.disabled = false
      button.textContent = previousText
    }, 1200)
  })
}

function renderModChip(tile, status, state = null) {
  const { chip, popover } = ensureChipUi(tile)
  chip.className = `nxq-btn nxq-mod-chip nxq-chip ${getStatusClass(status)}`
  chip.textContent = getStatusLabel(status)
  chip.title = state?.fileName || state?.modName || getStatusLabel(status)
  applyUpdateGlow(tile, status === "update_available" && shouldGlowUpdateCard())
  updateChipPopover(tile, chip, popover, state, status)
}

function parseLatestFileIdFromDoc(doc) {
  const selectors = [
    '#action-manual a[href*="file_id="]',
    '#action-manual[href*="file_id="]',
    'a[href*="ModRequirementsPopUp"][href*="file_id="]',
    'a[href*="file_id="]:not([href*="nmm=1"])'
  ]
  for (const selector of selectors) {
    const anchor = doc.querySelector(selector)
    const href = anchor?.href || anchor?.getAttribute("href") || ""
    const match = href.match(/[?&]file_id=(\d+)/)
    if (match) return Number(match[1])
  }
  return null
}

function parseUpdatedAtFromDoc(doc) {
  const selectors = [
    'meta[property="article:modified_time"]',
    'meta[name="last-modified"]',
    '[data-e2eid="mod-updated"] time[datetime]',
    'time[datetime]'
  ]
  for (const selector of selectors) {
    const node = doc.querySelector(selector)
    const value = node?.getAttribute("content") || node?.getAttribute("datetime") || ""
    if (value) return value
  }
  return null
}

async function getFreshRemoteModMetadata(modId, modUrl, force = false) {
  const cached = await getStoredModCheck(modId)
  const now = Date.now()

  if (!force && cached && cached.checkedAt && now - cached.checkedAt < MOD_CHECK_TTL_MS) {
    return cached
  }

  const pageUrl = modUrl || `https://www.nexusmods.com/stardewvalley/mods/${modId}`
  const { response, text } = await fetchText(pageUrl)
  if (!text) return cached || null

  const doc = parseHtml(text)
  const fresh = {
    modId,
    latestFileId: parseLatestFileIdFromDoc(doc),
    updatedAt: parseUpdatedAtFromDoc(doc),
    checkedAt: now,
    finalUrl: response?.url || pageUrl
  }
  await setStoredModCheck(modId, fresh)
  return fresh
}

async function refreshModChipForTile(tile, modId, modUrl, force = false) {
  const local = await getStoredModState(modId)

  if (!local) {
    renderModChip(tile, "no_data", {
      modId,
      modUrl,
      modName: getModNameFromTile(tile),
      status: "no_data"
    })
    return
  }

  renderModChip(tile, local.status || "downloaded", local)

  try {
    const remote = await getFreshRemoteModMetadata(modId, modUrl, force)
    if (!remote) return

    let status = "downloaded"
    if (
      (remote.latestFileId && local.downloadedFileId && Number(remote.latestFileId) !== Number(local.downloadedFileId)) ||
      (remote.updatedAt && local.downloadedAt && new Date(remote.updatedAt).getTime() > Number(local.downloadedAt))
    ) {
      status = "update_available"
    }

    const nextLocal = {
      ...local,
      status,
      lastCheckedAt: remote.checkedAt || local.lastCheckedAt || null,
      lastKnownRemoteFileId: remote.latestFileId || local.lastKnownRemoteFileId || null,
      lastKnownUpdatedAt: remote.updatedAt || local.lastKnownUpdatedAt || null,
      modUrl: modUrl || local.modUrl || "",
      modName: local.modName || getModNameFromTile(tile)
    }

    await setStoredModState(modId, nextLocal)
    renderModChip(tile, nextLocal.status, nextLocal)
  } catch (error) {
    log("chip:refresh-failed", {
      modId,
      message: error && error.message ? error.message : String(error)
    })
  }
}

async function forceRefreshModChip(tile, modId, modUrl) {
  if (!modId) return
  await browser.storage.local.remove(getModCheckKey(modId)).catch(() => {})
  await refreshModChipForTile(tile, modId, modUrl, true)
}

async function injectModChips() {
  const tiles = [...document.querySelectorAll('div[data-e2eid="mod-tile"]')]
  for (const tile of tiles) {
    const modUrl = getTileModUrl(tile)
    const modId = Number(extractModIdFromUrl(modUrl) || 0)
    if (!modId) continue
    await refreshModChipForTile(tile, modId, modUrl, false)
  }
}

async function loadSettings() {
  const state = await browser.runtime.sendMessage({ type: "GET_STATE" })
  NXQ.settings = state.settings
  return NXQ.settings
}

function ensureBaseUi() {
  if (document.getElementById("nxq-style")) return

  const style = document.createElement("style")
  style.id = "nxq-style"
  style.textContent = STYLE_TEXT
  document.documentElement.appendChild(style)

  const chipStyle = document.createElement("style")
  chipStyle.id = "nxq-chip-style"
  chipStyle.textContent = CHIP_STYLE_TEXT
  document.documentElement.appendChild(chipStyle)

  const live = document.createElement("div")
  live.id = "nxq-live-region"
  live.setAttribute("aria-live", "polite")
  document.body.appendChild(live)
}

function announce(message) {
  const region = document.getElementById("nxq-live-region")
  if (!region) return
  region.textContent = message
}

function isStardewDomain() {
  return /nexusmods\.com$/.test(location.hostname) &&
    (/^\/stardewvalley\//.test(location.pathname) || /^\/games\/stardewvalley\//.test(location.pathname))
}

function isModPage() {
  return /\/(?:games\/)?stardewvalley\/mods\/\d+(?:\/)?$/.test(location.pathname)
}

function parseHtml(htmlText) {
  return new DOMParser().parseFromString(htmlText, "text/html")
}

async function fetchText(url, options = {}) {
  const response = await fetch(url, {
    method: options.method || "GET",
    credentials: "include",
    headers: options.headers || {},
    body: options.body || undefined
  })
  const text = await response.text().catch(() => "")
  return { response, text }
}

function extractModIdFromUrl(url) {
  const match = String(url).match(/\/mods\/(\d+)/)
  return match ? match[1] : null
}

function getGameId() {
  return document.getElementById("section")?.dataset?.gameId ||
    document.querySelector("[data-game-id]")?.getAttribute("data-game-id") ||
    ""
}

function getModNameFromTile(tile) {
  const selectors = [
    '[data-e2eid="mod-tile-title"]',
    'h2 a[href*="/mods/"]',
    'h3 a[href*="/mods/"]',
    '.space-y-1\\.5 a[href*="/mods/"]',
    'a[href*="/mods/"]'
  ]
  for (const selector of selectors) {
    const el = tile.querySelector(selector)
    const value = el?.textContent?.trim()
    if (value) return value
  }
  return "Stardew Mod"
}

function getFileLabelFromAnchor(anchor, fallback) {
  const text = anchor?.textContent?.trim()
  return text || fallback || "Download"
}

function parseJsonDownloadUrl(text) {
  try {
    const json = JSON.parse(String(text))
    if (json && typeof json.url === "string") return json.url.replace(/&amp;/g, "&")
  } catch (_) {}
  return null
}

function parseNxmUrl(value) {
  const text = String(value || "").replace(/\\\//g, "/").replace(/&amp;/g, "&")
  const match = text.match(/nxm:\/\/[^\s"'<>]+/i)
  return match ? match[0] : null
}

async function resolveApiDownload(href, isManager) {
  const url = new URL(href, location.origin)
  if (isManager && !url.searchParams.has("nmm")) url.searchParams.set("nmm", "1")

  const { response, text } = await fetchText(url.toString(), {
    headers: { "X-Requested-With": "XMLHttpRequest" }
  })

  const jsonUrl = parseJsonDownloadUrl(text)
  if (jsonUrl) return jsonUrl

  const nxmFromResponse = parseNxmUrl(text) || parseNxmUrl(response.url)
  if (nxmFromResponse) return nxmFromResponse

  if (response.url && response.url !== url.toString()) return response.url
  return null
}

async function resolveGeneratedManual(fileId, gameIdOverride = null) {
  const body = new URLSearchParams({
    fid: String(fileId),
    game_id: String(gameIdOverride || getGameId() || "")
  })
  const { text } = await fetchText("https://www.nexusmods.com/Core/Libs/Common/Managers/Downloads?GenerateDownloadUrl", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
      "X-Requested-With": "XMLHttpRequest"
    },
    body
  })
  return parseJsonDownloadUrl(text)
}

async function resolveRequirementsPopup(href, isManager) {
  const popupUrl = new URL(href, location.origin)
  const popupGameId = popupUrl.searchParams.get("game_id") || getGameId() || ""
  const first = await fetchText(href, {
    headers: { "X-Requested-With": "XMLHttpRequest" }
  })

  const nxmUrl = parseNxmUrl(first.text) || parseNxmUrl(first.response.url)
  if (nxmUrl) return nxmUrl

  const doc = parseHtml(first.text)
  const link = doc.querySelector('a[href*="file_id="], a[href*="/api/files/"]')?.href
  if (!link) return null

  if (link.includes("/api/files/")) return resolveApiDownload(link, isManager)

  const fileId = new URL(link, location.origin).searchParams.get("file_id")
  if (!fileId) return link
  if (isManager) {
    const withNmm = new URL(link, location.origin)
    withNmm.searchParams.set("nmm", "1")
    return resolveRequirementsPopup(withNmm.toString(), true)
  }
  return resolveGeneratedManual(fileId, popupGameId)
}

async function resolveFromClickedAnchor(anchor) {
  const href = anchor.href || anchor.getAttribute("href") || ""
  const isManager = href.includes("nmm=1") || anchor.closest("#action-nmm") !== null || anchor.dataset.nxqKind === "manager"
  const fileId = new URL(href, location.origin).searchParams.get("file_id")
  const modId = extractModIdFromUrl(location.href)
  const modName = document.querySelector("h1")?.textContent?.trim() || "Stardew Mod"
  const fileName = getFileLabelFromAnchor(anchor, isManager ? "Vortex" : "Download")

  let downloadUrl = null

  if (href.includes("/api/files/")) {
    downloadUrl = await resolveApiDownload(href, isManager)
  } else if (href.includes("ModRequirementsPopUp")) {
    downloadUrl = await resolveRequirementsPopup(href, isManager)
  } else if (fileId && !isManager) {
    downloadUrl = await resolveGeneratedManual(fileId)
  } else if (fileId && isManager) {
    const managerUrl = new URL(href, location.origin)
    managerUrl.searchParams.set("nmm", "1")
    downloadUrl = await resolveRequirementsPopup(managerUrl.toString(), true)
  } else if (/^nxm:\/\//i.test(href)) {
    downloadUrl = href
  }

  return {
    modId,
    fileId,
    modName,
    fileName,
    kind: isManager || /^nxm:\/\//i.test(downloadUrl || "") ? "manager" : "manual",
    downloadUrl
  }
}

async function resolveListingTarget(modUrl, preferManager) {
  const cacheKey = `${modUrl}::${preferManager ? "manager" : "manual"}`
  if (NXQ.listingCache.has(cacheKey)) return NXQ.listingCache.get(cacheKey)

  log("listing:resolve-fetch", modUrl)
  const { response, text } = await fetchText(modUrl, {
    headers: { "X-Requested-With": "XMLHttpRequest" }
  })
  log("listing:resolve-fetch-done", { modUrl, status: response.status, finalUrl: response.url, length: text ? text.length : 0 })

  const doc = parseHtml(text)
  const modName = doc.querySelector("h1")?.textContent?.trim() || "Stardew Mod"
  const manualAnchor = doc.querySelector('#action-manual a[href], #action-manual[href], a[href*="ModRequirementsPopUp"]:not([href*="nmm=1"]), a[href*="file_id="]:not([href*="nmm=1"]), a[href*="/api/files/"]:not([href*="nmm=1"])')
  const managerAnchor = doc.querySelector('#action-nmm a[href], #action-nmm[href], a[href*="nmm=1"]')
  const anchor = preferManager ? managerAnchor || manualAnchor : manualAnchor || managerAnchor

  if (!anchor) {
    const failed = { error: "No listing download action found.", modName }
    NXQ.listingCache.set(cacheKey, failed)
    return failed
  }

  const anchorHref = anchor.href || anchor.getAttribute("href") || ""
  const anchorKind = preferManager ? "manager" : "manual"

  let payload = {
    modId: extractModIdFromUrl(modUrl),
    fileId: new URL(anchorHref, location.origin).searchParams.get("file_id"),
    modName,
    fileName: preferManager ? "Vortex" : "Download",
    kind: anchorKind,
    downloadUrl: null
  }

  if (anchorHref.includes("/api/files/")) {
    payload.downloadUrl = await resolveApiDownload(anchorHref, preferManager)
  } else if (anchorHref.includes("ModRequirementsPopUp")) {
    payload.downloadUrl = await resolveRequirementsPopup(anchorHref, preferManager)
  } else if (payload.fileId && !preferManager) {
    const anchorGameId = new URL(anchorHref, location.origin).searchParams.get("game_id") || getGameId() || ""
    payload.downloadUrl = await resolveGeneratedManual(payload.fileId, anchorGameId)
  } else if (payload.fileId && preferManager) {
    const withNmm = new URL(anchorHref, location.origin)
    withNmm.searchParams.set("nmm", "1")
    payload.downloadUrl = await resolveRequirementsPopup(withNmm.toString(), true)
  } else if (/^nxm:\/\//i.test(anchorHref)) {
    payload.downloadUrl = anchorHref
  }

  if (!payload.downloadUrl) {
    payload = { error: "Failed to resolve listing download URL.", modName }
  }

  NXQ.listingCache.set(cacheKey, payload)
  return payload
}

function createButton(kind, style) {
  const button = document.createElement("button")
  button.type = "button"
  button.className = `nxq-btn nxq-btn--${kind} ${style === "icon" ? "nxq-btn--icon" : "nxq-btn--fill"}`
  const label = kind === "manager" ? "Vortex" : "Download"
  button.title = label
  button.dataset.nxqKind = kind
  button.appendChild(createActionIcon(kind))
  if (style !== "icon") {
    const span = document.createElement("span")
    span.className = "nxq-btn-label"
    span.textContent = label
    button.appendChild(span)
  }
  return button
}

function updateButton(button, state, message) {
  const label = button.querySelector(".nxq-btn-label")
  button.disabled = state === "busy"
  if (label) {
    if (state === "busy") label.textContent = "Queued…"
    if (state === "done") label.textContent = "Queued"
    if (state === "error") label.textContent = "Failed"
    if (state === "idle") label.textContent = button.dataset.nxqKind === "manager" ? "Vortex" : "Download"
  }
  if (state === "error") button.title = message || "Failed"
}

function candidateTiles() {
  const links = [...document.querySelectorAll('.mods-grid a[href*="/mods/"], a[data-e2eid="mod-tile-title"][href*="/mods/"]')]
  const seen = new Set()
  const tiles = []

  for (const link of links) {
    const tile =
      link.closest('[data-e2eid="mod-tile"]') ||
      link.closest('[class*="group/mod-tile"]') ||
      link.closest('[class*="@container/mod-tile"]') ||
      link.closest('.mods-grid > div') ||
      link.closest('.mods-grid .relative')

    if (!tile || seen.has(tile)) continue
    seen.add(tile)
    tiles.push(tile)
  }

  return tiles
}

function getTileModUrl(tile) {
  const link = tile.querySelector('a[data-e2eid="mod-tile-title"], h2 a[href*="/mods/"], h3 a[href*="/mods/"], a[href*="/mods/"]')
  const href = link?.href || link?.getAttribute("href") || ""
  return href ? new URL(href, location.origin).href : null
}

function getTileMount(tile) {
  return (
    tile.querySelector(".px-3.pt-3.pb-5") ||
    tile.querySelector(".tile-data") ||
    tile.querySelector(".divide-y.divide-solid.divide-stroke-weak") ||
    tile.querySelector(".space-y-1\.5.pb-2") ||
    tile
  )
}

async function queuePayload(payload, sourceUrl) {
  const item = await browser.runtime.sendMessage({
    type: "ENQUEUE_DOWNLOAD",
    payload: {
      ...payload,
      sourceUrl
    }
  })
  if (!item || typeof item !== "object") {
    throw new Error("Queue enqueue failed.")
  }
  announce(`${item.modName || "Mod"} queued.`)
  return item
}

async function handleListingButtonClick(button, modUrl, tileName, preferManager) {
  try {
    updateButton(button, "busy")
    const resolved = await resolveListingTarget(modUrl, preferManager)
    if (!resolved || resolved.error || !resolved.downloadUrl) {
      updateButton(button, "error", resolved?.error || "Unable to resolve download")
      return
    }
    resolved.modName = resolved.modName || tileName || "Stardew Mod"
    await queuePayload(resolved, modUrl)
    updateButton(button, "done")
    setTimeout(() => updateButton(button, "idle"), 1400)
  } catch (error) {
    log("listing button failed", {
      modUrl,
      message: error && error.message ? error.message : String(error),
      stack: error && error.stack ? error.stack : "",
      name: error && error.name ? error.name : ""
    })
    updateButton(button, "error", error && error.message ? error.message : String(error))
  }
}

function injectListingButtons() {
  if (!NXQ.settings?.showListingButtons) { log("listing:disabled"); return }
  if (isModPage()) { log("listing:skip-mod-page"); return }

  const mode = NXQ.settings.listingButtonMode || "both"
  const style = NXQ.settings.listingButtonStyle || "icon"
  const tiles = candidateTiles()
  const seenModUrls = new Set()
  log("listing:tiles-found", tiles.length)

  for (const tile of tiles) {
    const modUrl = getTileModUrl(tile)
    if (!modUrl) { log("listing:no-mod-url"); continue }
    if (seenModUrls.has(modUrl)) continue
    seenModUrls.add(modUrl)

    const mount = getTileMount(tile)
    if ((mount && mount.querySelector(":scope > .nxq-listing-actions")) || tile.querySelector(".nxq-listing-actions")) {
      tile.dataset.nxqInjected = "1"
      continue
    }

    const modName = getModNameFromTile(tile)
    const row = document.createElement("div")
    row.className = "nxq-listing-actions"

    if (mode === "manual" || mode === "both") {
      const manualButton = createButton("manual", style)
      manualButton.addEventListener("click", event => {
        event.preventDefault()
        event.stopPropagation()
        handleListingButtonClick(manualButton, modUrl, modName, false)
      })
      row.appendChild(manualButton)
    }

    if (mode === "manager" || mode === "both") {
      const managerButton = createButton("manager", style)
      managerButton.addEventListener("click", event => {
        event.preventDefault()
        event.stopPropagation()
        handleListingButtonClick(managerButton, modUrl, modName, true)
      })
      row.appendChild(managerButton)
    }

    mount.appendChild(row)
    tile.dataset.nxqInjected = "1"
    log("listing:button-injected", modName, modUrl)
  }

  NXQ.injectedPass += 1
  log("listing:inject-pass-complete", NXQ.injectedPass)
}

function scheduleListingInjection() {
  if (NXQ.scheduledInject) return
  NXQ.scheduledInject = true
  requestAnimationFrame(() => {
    NXQ.scheduledInject = false
    log("listing:inject-start", location.href)
    injectListingButtons()
    injectModChips().catch(error => log("chip:inject-failed", error && error.message ? error.message : String(error)))
    injectModPageFileButtons()
  })
}

function installObservers() {
  if (NXQ.observers.length) return
  const observer = new MutationObserver(scheduleListingInjection)
  observer.observe(document.body, { childList: true, subtree: true })
  NXQ.observers.push(observer)
}

function matchesDownloadLink(anchor) {
  const href = anchor?.href || anchor?.getAttribute("href") || ""
  if (!href) return false
  return href.includes("file_id=") ||
    href.includes("/api/files/") ||
    href.includes("ModRequirementsPopUp") ||
    anchor.closest("#action-manual") !== null ||
    anchor.closest("#action-nmm") !== null
}

async function onCaptureClick(event) {
  if (!NXQ.settings?.interceptPageDownloads) return
  if (event.target.closest("#cbnx01-download-handoff")) return
  const anchor = event.target.closest("a[href]")
  if (!anchor || !matchesDownloadLink(anchor)) return

  const href = anchor.href || anchor.getAttribute("href") || ""
  if (!/stardewvalley/.test(href) && !href.startsWith("/") && !href.includes("file_id=") && !href.includes("/api/files/")) return

  event.preventDefault()
  event.stopImmediatePropagation()

  const originalText = anchor.textContent
  anchor.style.pointerEvents = "none"
  if (anchor.querySelector("span")) anchor.querySelector("span").textContent = "Queued…"

  try {
    const payload = await resolveFromClickedAnchor(anchor)
    if (!payload.downloadUrl) throw new Error("Unable to resolve download URL.")
    await queuePayload(payload, location.href)
    if (anchor.querySelector("span")) {
      anchor.querySelector("span").textContent = "Queued"
      setTimeout(() => {
        anchor.querySelector("span").textContent = originalText || "Download"
      }, 1400)
    }
  } catch (error) {
    log("page click failed", error)
    if (anchor.querySelector("span")) anchor.querySelector("span").textContent = "Failed"
    setTimeout(() => {
      if (anchor.querySelector("span")) anchor.querySelector("span").textContent = originalText || "Download"
    }, 1800)
  } finally {
    anchor.style.pointerEvents = ""
  }
}

function hookHistoryNavigation() {
  if (window.__nxqHistoryHooked) return
  window.__nxqHistoryHooked = true
  const push = history.pushState
  const replace = history.replaceState

  function rerun() {
    setTimeout(scheduleListingInjection, 50)
    setTimeout(scheduleListingInjection, 400)
    setTimeout(scheduleListingInjection, 1200)
  }

  history.pushState = function (...args) {
    const result = push.apply(this, args)
    rerun()
    return result
  }

  history.replaceState = function (...args) {
    const result = replace.apply(this, args)
    rerun()
    return result
  }

  window.addEventListener("popstate", rerun)
}

async function boot() {
  log("boot:start", location.href)
  if (!isStardewDomain()) {
    log("boot:skipped-non-stardew", location.pathname)
    return
  }
  await loadSettings()
  // Only a canonical, user-initiated Cinderbox URL activates this bridge.
  startCinderboxBrowserBridge().catch(() => {
    log("cbnx01:bridge-failed")
  })
  log("boot:settings-loaded", NXQ.settings)
  ensureBaseUi()
  installObservers()
  hookHistoryNavigation()
  document.addEventListener("click", onCaptureClick, true)
  scheduleListingInjection()
  setTimeout(scheduleListingInjection, 400)
  setTimeout(scheduleListingInjection, 1200)
  setTimeout(scheduleListingInjection, 2400)
}

browser.runtime.onMessage.addListener(message => {
  if (message && message.type === "STATE_UPDATED") {
    if (message.payload?.settings) {
      NXQ.settings = message.payload.settings
      log("settings:updated", NXQ.settings)
    }
    scheduleListingInjection()
  }
})

async function injectModPageFileButtons() {
  if (!NXQ.settings?.showListingButtons) return;
  if (!isModPage()) return;
  const fileRows = document.querySelectorAll('#files table tbody tr, table tbody tr[data-id], [data-e2eid="files-tab"] table tbody tr');
  log("files:rows-found", fileRows.length);
  if (!fileRows.length) return;
  const style = NXQ.settings.listingButtonStyle || "icon";
  for (const row of fileRows) {
    if (row.dataset.nxqInjected === '1') continue;
    const anchor = row.querySelector('a[href*="/api/files/"], a[href*="file_id="]');
    if (!anchor) continue;
    const label = anchor.textContent.trim() || "Download";
    const button = createButton('manual', style);
    button.title = label;
    button.addEventListener('click', e => {
      e.preventDefault();
      e.stopPropagation();
      resolveFromClickedAnchor(anchor).then(payload => queuePayload(payload, location.href));
    });
    const cell = row.querySelector('td:last-child') || row;
    cell.appendChild(button);
    row.dataset.nxqInjected = '1';
    log('files:button-injected', label);
  }
}



boot().catch(error => log("boot:error", error && (error.stack || error.message || String(error))))
