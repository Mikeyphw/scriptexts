/* CB-NX05C: optional, read-only Nexus listing/detail badges; no automatic install,
 * browser queue takeover, credentials, provider updates or Nexus network requests. */
(() => {
  'use strict'
  if (!['www.nexusmods.com', 'next.nexusmods.com'].includes(location.hostname) ||
      !/^\/(?:games\/)?stardewvalley(?:\/|$)/.test(location.pathname)) return

  const MAX = 24
  const MAX_AGE_MS = 90_000
  const statusByMod = new Map()
  let enabled = false
  let scheduled = false
  let lastPage = location.href
  let activeRequest = 0
  let checkedAt = 0
  let lastResult = 'unpaired'
  let busy = false
  let retryAfterBusy = false
  let lastRequestedIds = ''

  const style = document.createElement('style')
  style.id = 'cbnx05c-style'
  style.textContent = `
  .cbnx05c-widget { display:inline-flex; flex-wrap:wrap; align-items:center; gap:6px;
    margin:6px 0; padding:5px 8px; border-radius:8px;
    background:#1e2530; color:#e5ecf4; border:1px solid #526073;
    font:normal 12px/1.4 system-ui,sans-serif; max-width:100%; }
  .cbnx05c-widget button { color:inherit; font:inherit; cursor:pointer; border:1px solid #6b8195;
    border-radius:6px; padding:3px 7px; background:transparent; }
  .cbnx05c-widget button:focus-visible { outline:2px solid #e9d189; outline-offset:2px; }
  .cbnx05c-widget [data-cbnx05c-detail] { flex-basis:100%; white-space:normal; }
  .cbnx05c-widget [data-cbnx05c-detail][hidden] { display:none; }
  `

  ;(document.head || document.documentElement).appendChild(style)

  function modFromUrl(value) {
    try {
      const u = new URL(value, location.origin)
      if (!['www.nexusmods.com', 'next.nexusmods.com'].includes(u.hostname) || u.protocol !== 'https:') return null
      const m = /^\/(?:games\/)?stardewvalley\/mods\/([1-9][0-9]{0,11})(?:\/|$)/.exec(u.pathname)
      return m ? m[1] : null
    } catch (_) { return null }
  }
  function candidates() {
    const out = []
    const detailId = modFromUrl(location.href)
    if (detailId) {
      const anchor = document.querySelector('h1, [data-e2eid="mod-name"]')
      if (anchor) out.push({ id: detailId, mount: anchor.parentElement || anchor })
    }
    for (const tile of document.querySelectorAll('div[data-e2eid="mod-tile"]')) {
      const link = tile.querySelector('a[href*="/mods/"]')
      const modId = link && modFromUrl(link.href)
      if (modId) out.push({ id: modId, mount: tile })
      if (out.length >= MAX) break
    }
    return out.slice(0, MAX)
  }
  function clearBadges() {
    document.querySelectorAll('[data-cbnx05c-widget]').forEach(node => node.remove())
    statusByMod.clear()
    checkedAt = 0
  }
  function display(row, view) {
    let el = view.mount.querySelector(':scope > [data-cbnx05c-widget]')
    if (!el) {
      el = document.createElement('div')
      el.className = 'cbnx05c-widget'
      el.dataset.cbnx05cWidget = '1'
      el.dataset.cbnx05cId = view.id
      const label = document.createElement('span')
      label.dataset.cbnx05cLabel = '1'
      const disclosure = document.createElement('button')
      disclosure.type = 'button'
      disclosure.textContent = 'Details'
      disclosure.setAttribute('aria-expanded', 'false')
      const reload = document.createElement('button')
      reload.type = 'button'
      reload.textContent = 'Refresh local'
      reload.addEventListener('click', event => {
        event.preventDefault()
        event.stopPropagation()
        refresh(true).catch(() => {})
      })
      const detail = document.createElement('span')
      detail.dataset.cbnx05cDetail = '1'
      detail.hidden = true
      disclosure.addEventListener('click', event => {
        event.preventDefault()
        event.stopPropagation()
        detail.hidden = !detail.hidden
        disclosure.setAttribute('aria-expanded', String(!detail.hidden))
        disclosure.textContent = detail.hidden ? 'Details' : 'Hide details'
      })
      el.append(label, disclosure, reload, detail)
      view.mount.append(el)
    }
    const label = el.querySelector('[data-cbnx05c-label]')
    const detail = el.querySelector('[data-cbnx05c-detail]')
    const age = checkedAt && Date.now() >= checkedAt ? Date.now() - checkedAt : Number.POSITIVE_INFINITY
    const fresh = age <= MAX_AGE_MS && lastResult === 'connected'
    label.textContent = fresh && row ? row.label :
      lastResult === 'unpaired' ? 'Cinderbox not paired' :
      lastResult === 'offline' ? 'Cinderbox unavailable' :
      lastResult === 'disabled' ? 'Companion badges disabled' :
      'Local evidence expired or unavailable'
    detail.textContent = fresh && row
      ? `${row.detail} Local status checked ${Math.floor(age / 1000)}s ago; not a Nexus provider check.`
      : 'Open the companion popup and refresh local evidence. No installation or remote update is implied.'
  }
  function changedPage() {
    if (location.href === lastPage) return false
    lastPage = location.href
    lastRequestedIds = ''
    ++activeRequest
    lastResult = 'unpaired'
    clearBadges()
    return true
  }
  function render() {
    if (!enabled) { clearBadges(); return }
    changedPage()
    for (const view of candidates()) {
      const stale = view.mount.querySelector(':scope > [data-cbnx05c-widget]')
      if (stale && stale.dataset.cbnx05cId !== view.id) stale.remove()
      display(statusByMod.get(view.id), view)
    }
  }
  function schedule() {
    if (scheduled) return
    scheduled = true
    setTimeout(() => { scheduled = false; render() }, 200)
  }
  async function refresh(force = false) {
    if (!enabled) return
    if (busy) { retryAfterBusy = true; return }
    changedPage()
    busy = true
    const requestId = ++activeRequest
    const page = location.href
    try {
      const ids = [...new Set(candidates().map(view => view.id))].slice(0, MAX)
      if (!ids.length) return
      lastRequestedIds = ids.join(',')
      const result = await browser.runtime.sendMessage({ type: 'CBNX05C_PAGE_STATUS', modIds: ids, force })
      if (requestId !== activeRequest || page !== location.href || !enabled) return
      statusByMod.clear()
      lastResult = result?.state || 'offline'
      checkedAt = result?.state === 'connected' && Number.isSafeInteger(result.checkedAtMs)
        ? result.checkedAtMs : 0
      if (lastResult === 'connected' && Array.isArray(result.rows) && result.rows.length === ids.length) {
        for (const row of result.rows) {
          if (ids.includes(row.modId) && typeof row.label === 'string' && typeof row.detail === 'string') {
            statusByMod.set(row.modId, row)
          }
        }
      }
    } catch (_) { lastResult = 'offline'; checkedAt = 0; statusByMod.clear() }
    finally {
      busy = false
      schedule()
      if (retryAfterBusy) { retryAfterBusy = false; refresh().catch(() => {}) }
    }
  }
  async function readOptIn() {
    try {
      const pref = await browser.storage.local.get('cbnx05c_page_badges')
      enabled = pref?.cbnx05c_page_badges === true
    } catch (_) { enabled = false }
    if (!enabled) { ++activeRequest; retryAfterBusy = false; lastRequestedIds = ''; clearBadges() }
    else { render(); await refresh() }
  }
  browser.storage.onChanged.addListener((changes, area) => {
    if (area === 'local' && Object.hasOwn(changes, 'cbnx05c_page_badges')) {
      readOptIn().catch(() => { enabled = false; clearBadges() })
    }
  })
  const observer = new MutationObserver(records => {
    if (!enabled) return
    // Avoid scheduling self-generated mutations forever.
    if (records.every(record => record.target.closest?.('[data-cbnx05c-widget]'))) return
    schedule()
    const ids = [...new Set(candidates().map(view => view.id))].slice(0, MAX).join(',')
    if (location.href !== lastPage || (ids && ids !== lastRequestedIds)) refresh().catch(() => {})
  })
  if (document.body) observer.observe(document.body, { childList: true, subtree: true })
  window.addEventListener('popstate', () => { schedule(); refresh().catch(() => {}) })
  // Expiry is visual only. Never continually poll Cinderbox in the background.
  setInterval(() => { if (enabled) schedule() }, 30_000)
  readOptIn().catch(() => { enabled = false; clearBadges() })
})()
