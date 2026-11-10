/* CB-NX03A: optional read-only local Cinderbox status. Browser queue/Vortex stay independent. */
(() => {
  'use strict'
  const BASE = 'http://127.0.0.1:38471'
  const POPUP = browser.runtime.getURL('popup.html')
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
    return { state: 'paired', readOnly: true }
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
    finally { token = null }
    return { state: 'unpaired', jobs: [] }
  }

  browser.runtime.onMessage.addListener((message, sender) => {
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
