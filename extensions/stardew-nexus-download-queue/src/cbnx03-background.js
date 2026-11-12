/* CB-NX03A: optional read-only local Cinderbox status. Browser queue/Vortex stay independent. */
(() => {
  'use strict'
  const BASE = 'http://127.0.0.1:38471'
  const POPUP = browser.runtime.getURL('popup.html')
  const PAGE_TTL_MS = 60_000
  let pageCache = null // In-process, never persisted; never includes bearer credentials.
  let pageCheckedAt = 0
  let pageFetch = null
  let token = null // Memory only; not written to storage, log, message or content script.
  let inFlight = false

  function nonce() {
    const data = new Uint8Array(18)
    crypto.getRandomValues(data)
    return Array.from(data, value => value.toString(16).padStart(2, '0')).join('')
  }
  async function call(path, options = {}, authorized = false) {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 2500)
    try {
      const headers = { ...(options.body ? { 'Content-Type': 'application/json' } : {}) }
      if (authorized) {
        if (!token) throw new Error('unpaired')
        headers.Authorization = 'Bearer ' + token
        headers['X-CBNX-Nonce'] = nonce()
      }
      const res = await fetch(BASE + path, {
        method: options.body ? 'POST' : 'GET',
        body: options.body ? JSON.stringify(options.body) : undefined,
        headers,
        cache: 'no-store',
        credentials: 'omit',
        redirect: 'error',
        signal: controller.signal
      })
      if (!res.ok) throw new Error(res.status === 401 ? 'unpaired' : 'offline')
      return await res.json()
    } finally { clearTimeout(timeout) }
  }
  async function pair(code) {
    if (!/^\d{9}$/.test(code || '')) return { state: 'invalid_code' }
    const hello = await call('/v1/hello')
    if (hello.protocol !== 1 || typeof hello.challenge !== 'string') return { state: 'incompatible' }
    const joined = await call('/v1/pair', { body: { code, challenge: hello.challenge } })
    if (joined.protocol !== 1 || joined.read_only !== true ||
        !/^[A-Za-z0-9_-]{36,64}$/.test(joined.token || '')) return { state: 'incompatible' }
    token = joined.token
    pageCache = null
    pageCheckedAt = 0
    return { state: 'paired', readOnly: true }
  }
  function normalizeAuthority(value) {
    // Only the installed SMAPI manifest can prove local mod presence. No journal
    // state alone can prove an exact installed Nexus file, or a remote update.
    const empty = { inventoryState: 'UNAVAILABLE', remoteUpdateCheck: 'NOT_PERFORMED', items: [] }
    if (!value || value.schema !== 1 || value.scope !== 'LOCAL_SMAPI_AND_JOURNAL' ||
        !['QUALIFIED', 'UNAVAILABLE'].includes(value.inventory_state) ||
        !['NOT_PERFORMED', 'UNAVAILABLE', 'CLOCK_INVALID', 'SMAPI_CACHE_STALE', 'SMAPI_CACHE_FRESH'].includes(value.remote_update_check) || !Array.isArray(value.items) ||
        value.items.length > 128) return empty
    const validId = id => /^[1-9][0-9]{0,11}$/.test(id)
    const allowedInstalled = new Set(['UNKNOWN', 'NOT_LINKED', 'AMBIGUOUS', 'PRESENT', 'DISABLED_PRESENT'])
    const allowedJournal = new Set(['QUEUED', 'DOWNLOADING', 'PAUSED', 'CANCELLED',
      'INTERRUPTED', 'FAILED', 'VALIDATING', 'REVIEW_REQUIRED', 'BLOCKED',
      'VERIFY_REQUIRED', 'INSTALLING', 'INSTALLED', 'COMPLETED', 'DISCARDED',
      'NO_EXACT_FILE_RECEIPT'])
    // A verified private archive receipt is NOT a Nexus-signed checksum and
    // does not prove an installed file or an available remote update.
    const proofStates = new Set(['VERIFIED_AT_SCAN', 'NO_RETAINED_ARCHIVE', 'UNAVAILABLE'])
    const possibleRetained = new Set(['VALIDATING', 'REVIEW_REQUIRED', 'BLOCKED',
      'VERIFY_REQUIRED', 'INSTALLING', 'INSTALLED'])
    const updateStates = new Set(['UNKNOWN', 'NEWER', 'CURRENT', 'INSTALLED_AHEAD', 'UNCOMPARABLE'])
    const updateScope = 'CACHED_SMAPI_MOD_VERSION'
    const items = []
    const seen = new Set()
    for (const item of value.items) {
      if (!item || typeof item !== 'object') return empty
      const modId = item.mod_id, fileId = item.file_id
      if (typeof modId !== 'string' || !validId(modId) ||
          typeof fileId !== 'string' || (fileId !== '' && !validId(fileId)) ||
          !allowedJournal.has(item.journal_state) ||
          !allowedInstalled.has(item.installed_mod_state) ||
          !updateStates.has(item.update_state) ||
          item.update_proof_scope !== updateScope ||
          item.exact_file_installed !== 'UNKNOWN' ||
          typeof item.archive_checksum_qualified !== 'boolean' ||
          !proofStates.has(item.archive_proof_state) ||
          item.archive_proof_scope !== 'LOCAL_ZIP_VS_APP_RECEIPT' ||
          (item.archive_checksum_qualified !== (item.archive_proof_state === 'VERIFIED_AT_SCAN')) ||
          (item.archive_checksum_qualified &&
            (fileId === '' || !possibleRetained.has(item.journal_state))) ||
          typeof item.journal_transfer_reported !== 'boolean') return empty
      const identity = modId + '/' + fileId
      if (seen.has(identity)) return empty
      seen.add(identity)
      const installedState = value.inventory_state === 'QUALIFIED' ? item.installed_mod_state : 'UNKNOWN'
      const version = item.installed_version
      if (version !== undefined &&
          (typeof version !== 'string' || !/^[A-Za-z0-9.+_-]{1,80}$/.test(version) ||
          !['PRESENT','DISABLED_PRESENT'].includes(installedState))) return empty
      const isFresh = value.remote_update_check === 'SMAPI_CACHE_FRESH'
      const hasUpdate = item.update_state !== 'UNKNOWN'
      const newer = item.update_state === 'NEWER'
      const candidate = item.candidate_version
      if ((hasUpdate && (!isFresh || installedState !== 'PRESENT' || !version)) ||
          (newer && (typeof candidate !== 'string' ||
             !/^[A-Za-z0-9.+_-]{1,80}$/.test(candidate))) ||
          (!newer && candidate !== undefined)) return empty
      items.push({ modId, fileId, journalState: item.journal_state,
        journalTransferReported: item.journal_transfer_reported,
        installedModState: installedState, installedVersion: version || null,
        archiveProofState: item.archive_proof_state,
        archiveProofScope: 'LOCAL_ZIP_VS_APP_RECEIPT',
        archiveChecksumQualified: item.archive_checksum_qualified,
        exactFileInstalled: 'UNKNOWN', updateState: item.update_state,
        updateProofScope: updateScope, candidateVersion: newer ? candidate : null })
    }
    return { inventoryState: value.inventory_state,
      remoteUpdateCheck: value.remote_update_check, items }
  }
  async function status() {
    if (!token) return { state: 'unpaired', jobs: [] }
    try {
      const state = await call('/v1/state', {}, true)
      if (state.protocol !== 1 || state.proof_kind !== 'journal_only' ||
          state.installed_inventory_qualified !== false || !Array.isArray(state.jobs)) {
        return { state: 'incompatible', jobs: [] }
      }
      return {
        state: 'connected', readOnly: true, proof: 'journal_only',
        authority: normalizeAuthority(state.authority),
        handoffEnabled: state.handoff_enabled === true && state.inbox_available !== false,
        inboxAvailable: state.inbox_available !== false,
        handoffs: (Array.isArray(state.handoffs) ? state.handoffs : []).slice(0, 40).map(item => ({
          requestId: String(item.request_id || '').slice(0, 64),
          modId: String(item.mod_id || '').slice(0, 12),
          fileId: String(item.file_id || '').slice(0, 12),
          status: String(item.status || 'UNKNOWN').slice(0, 24)
        })),
        jobs: state.jobs.slice(0, 60).map(job => ({
          jobId: String(job.job_id || '').slice(0, 64),
          source: String(job.source || '').slice(0, 32),
          modId: String(job.mod_id || '').slice(0, 30),
          fileId: String(job.file_id || '').slice(0, 30),
          status: String(job.status || 'UNKNOWN').slice(0, 32),
          received: Number(job.received || 0),
          total: Number(job.total || 0)
        }))
      }
    } catch (error) {
      if (error.message === 'unpaired') {
        token = null
        return { state: 'unpaired', jobs: [] }
      }
      return { state: 'offline', jobs: [] }
    }
  }
  async function handoff(modId, fileId) {
    // Credentials and actual Nexus URLs NEVER cross this interface.
    if (!/^[1-9][0-9]{0,11}$/.test(modId || '') ||
        !/^[1-9][0-9]{0,11}$/.test(fileId || '')) return { state: 'invalid_identity' }
    if (!token) return { state: 'unpaired' }
    const requestId = nonce()
    const ack = await call('/v1/handoff', {
      body: { mod_id: modId, file_id: fileId, request_id: requestId }
    }, true)
    if (!['pending_user_action', 'already_pending', 'already_seen'].includes(ack.status) ||
        !/^[A-Za-z0-9_-]{22,64}$/.test(ack.request_id || '') ||
        ack.download_started !== false || ack.archive_staged !== false || ack.installed !== false) {
      return { state: 'incompatible' }
    }
    return { state: 'handoff_pending', status: ack.status,
      modId, fileId, requestId: ack.request_id, downloadStarted: false }
  }
  async function revoke() {
    try { if (token) await call('/v1/revoke', { body: {} }, true) }
    catch (_) { /* Local Cinderbox might have already stopped. */ }
    finally { token = null; pageCache = null; pageCheckedAt = 0 }
    return { state: 'unpaired', jobs: [] }
  }

  // Content scripts are permitted ONLY a mod-scoped, status-only projection.
  // No host page can pair, revoke, request an exact file, or obtain a bearer token.
  function allowedPageSender(sender, ids) {
    if (!sender?.tab || !Number.isInteger(sender.tab.id) || sender.tab.id < 0 ||
        (sender.frameId !== undefined && sender.frameId !== 0)) return false
    try {
      const url = new URL(sender.url)
      if (url.protocol !== 'https:' ||
          !['www.nexusmods.com', 'next.nexusmods.com'].includes(url.hostname) ||
          !/^\/(?:games\/)?stardewvalley(?:\/|$)/.test(url.pathname)) return false
      const detail = /^\/(?:games\/)?stardewvalley\/mods\/([1-9][0-9]{0,11})(?:\/|$)/.exec(url.pathname)
      return !detail || (ids.length === 1 && ids[0] === detail[1])
    } catch (_) { return false }
  }
  async function pageStatus(message, sender) {
    const ids = CBNX05CPolicy.normalizeIds(message?.modIds)
    if (!ids) return { state: 'invalid_identity', rows: [] }
    if (!allowedPageSender(sender, ids)) return { state: 'refused', rows: [] }
    // Opt-in checks at the PRIVILEGED background boundary, not just at the UI.
    const pref = await browser.storage.local.get('cbnx05c_page_badges').catch(() => null)
    if (pref?.cbnx05c_page_badges !== true) return { state: 'disabled', rows: [] }
    if (!token) { pageCache = null; pageCheckedAt = 0; return { state: 'unpaired', rows: [] } }
    // Capture the bearer identity before any await: revoke/re-pair must invalidate this read.
    const issuedToken = token
    if (!pageCache || Date.now() - pageCheckedAt >= PAGE_TTL_MS ||
        (message.force === true && Date.now() - pageCheckedAt >= 30_000)) {
      if (!pageFetch) {
        pageFetch = status().then(value => {
          pageCache = value
          pageCheckedAt = Date.now()
        }).catch(() => {
          pageCache = { state: 'offline' }
          pageCheckedAt = Date.now()
        }).finally(() => { pageFetch = null })
      }
      await pageFetch
    }
    // Revocation or an opt-out racing the read must win before any page reply.
    if (token !== issuedToken) return { state: 'unpaired', rows: [] }
    const currentConsent = await browser.storage.local.get('cbnx05c_page_badges').catch(() => null)
    if (currentConsent?.cbnx05c_page_badges !== true) return { state: 'disabled', rows: [] }
    if (pageCache?.state !== 'connected') return { state: pageCache?.state || 'offline', rows: [] }
    const rows = CBNX05CPolicy.summarize(pageCache, ids)
    if (!rows) return { state: 'incompatible', rows: [] }
    return { state: 'connected', checkedAtMs: pageCheckedAt, rows }
  }

  browser.runtime.onMessage.addListener((message, sender) => {
    if (message?.type === 'CBNX05C_PAGE_STATUS') {
      return pageStatus(message, sender).catch(() => ({ state: 'offline', rows: [] }))
    }
    if (!message || !['CBNX03_PAIR', 'CBNX03_STATUS', 'CBNX03_REVOKE', 'CBNX03_HANDOFF'].includes(message.type)) return undefined
    // Never accept pairing/control messages from untrusted Nexus page content scripts.
    if (sender?.url !== POPUP || sender?.tab) return Promise.resolve({ state: 'refused' })
    if (inFlight) return Promise.resolve({ state: 'busy' })
    inFlight = true
    const task = message.type === 'CBNX03_PAIR' ? pair(message.code) :
      message.type === 'CBNX03_REVOKE' ? revoke() :
        message.type === 'CBNX03_HANDOFF' ? handoff(message.modId, message.fileId) : status()
    return Promise.resolve(task).catch(() => ({ state: 'offline', jobs: [] }))
      .finally(() => { inFlight = false })
  })
})()
