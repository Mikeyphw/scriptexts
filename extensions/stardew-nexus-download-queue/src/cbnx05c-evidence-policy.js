/* CB-NX05C: pure, bounded, credential-free summaries for user-opted-in page badges.
 * Never equate a browser queue or Cinderbox journal with a verified installation. */
var CBNX05CPolicy = (() => {
  'use strict'
  const idPattern = /^[1-9][0-9]{0,11}$/
  const permittedStates = new Set(['QUEUED', 'DOWNLOADING', 'PAUSED', 'INTERRUPTED',
    'FAILED', 'VALIDATING', 'REVIEW_REQUIRED', 'BLOCKED', 'VERIFY_REQUIRED',
    'INSTALLING', 'INSTALLED', 'COMPLETED', 'DISCARDED', 'CANCELLED',
    'NO_EXACT_FILE_RECEIPT'])
  const journalLabels = Object.freeze({
    QUEUED: ['Queued in Cinderbox', 'App journal reports a queued transfer, not a downloaded archive.'],
    DOWNLOADING: ['Transfer in progress', 'App journal reports transfer progress; no installation is established.'],
    PAUSED: ['Transfer paused', 'App journal records a pause; no archive or install proof.'],
    INTERRUPTED: ['Transfer interrupted', 'Fresh Nexus authorization may be needed. No automatic retry.'],
    FAILED: ['Transfer failed', 'App journal reports failure; no installation is established.'],
    VALIDATING: ['Archive validation pending', 'App validation is not a completed installation.'],
    REVIEW_REQUIRED: ['Local archive needs review', 'A local review is required before installation.'],
    BLOCKED: ['Local install blocked', 'Check Cinderbox before taking further action.'],
    VERIFY_REQUIRED: ['Install outcome uncertain', 'Check actual on-device state. Never assume installation.'],
    INSTALLING: ['Installation in progress', 'An install attempt is not proof of success.'],
    INSTALLED: ['Install recorded in app journal', 'A journal entry cannot verify the exact Nexus file installed.'],
    COMPLETED: ['App operation completed', 'Completion alone does not prove installed file identity.'],
    DISCARDED: ['Archive discarded', 'No installation follows from this discarded archive.'],
    CANCELLED: ['Transfer cancelled', 'A cancelled transfer is not a downloaded archive.']
  })
  const precedence = ['VERIFY_REQUIRED', 'BLOCKED', 'REVIEW_REQUIRED', 'INSTALLING',
    'DOWNLOADING', 'VALIDATING', 'QUEUED', 'PAUSED', 'INTERRUPTED', 'FAILED',
    'INSTALLED', 'COMPLETED', 'DISCARDED', 'CANCELLED']

  function normalizeIds(ids) {
    if (!Array.isArray(ids) || ids.length < 1 || ids.length > 24) return null
    if (ids.some(v => typeof v !== 'string' || !idPattern.test(v))) return null
    if (new Set(ids).size !== ids.length) return null
    return ids.slice()
  }

  function summary(authority, handoffs, modId) {
    const rows = authority.items.filter(row => row && row.modId === modId)
    const hasPending = Array.isArray(handoffs) && handoffs.some(row =>
      row && row.modId === modId && row.status === 'PENDING')
    if (!rows.length) return hasPending
      ? { label: 'Request awaiting Cinderbox action', detail: 'Requested only; no download or installation started.', state: 'REQUEST_PENDING' }
      : { label: 'No verified companion evidence', detail: 'Unknown does not mean the mod is absent.', state: 'UNKNOWN' }

    const valid = rows.every(row => permittedStates.has(row.journalState) &&
      ['UNKNOWN', 'NOT_LINKED', 'PRESENT', 'DISABLED_PRESENT', 'AMBIGUOUS'].includes(row.installedModState) &&
      ['UNKNOWN', 'NEWER', 'CURRENT', 'INSTALLED_AHEAD', 'UNCOMPARABLE'].includes(row.updateState) &&
      ['VERIFIED_AT_SCAN', 'NO_RETAINED_ARCHIVE', 'UNAVAILABLE'].includes(row.archiveProofState) &&
      row.exactFileInstalled === 'UNKNOWN')
    if (!valid) return { label: 'Evidence unavailable', detail: 'Companion evidence failed validation.', state: 'UNKNOWN' }

    const installedStates = new Set(rows.map(row => row.installedModState))
    if (authority.inventoryState === 'QUALIFIED' &&
        (installedStates.has('AMBIGUOUS') ||
        (installedStates.has('PRESENT') && installedStates.has('DISABLED_PRESENT')))) {
      return { label: 'Conflicting local mod links', detail: 'Multiple SMAPI relationships; verify in Cinderbox.', state: 'AMBIGUOUS' }
    }
    if (authority.inventoryState === 'QUALIFIED' && installedStates.has('PRESENT') &&
        authority.remoteUpdateCheck === 'SMAPI_CACHE_FRESH' &&
        rows.some(row => row.updateState === 'NEWER')) {
      return { label: 'Cached SMAPI version may be newer',
        detail: 'Local app cached a newer SMAPI mod version. Not an exact Nexus file update claim.',
        state: 'CACHED_SMAPI_NEWER' }
    }
    if (authority.inventoryState === 'QUALIFIED' && installedStates.has('PRESENT')) {
      return { label: 'SMAPI mod present locally',
        detail: 'Matched installed mod identity. Exact Nexus file and variant are unverified.', state: 'SMAPI_PRESENT' }
    }
    if (authority.inventoryState === 'QUALIFIED' && installedStates.has('DISABLED_PRESENT')) {
      return { label: 'Disabled SMAPI mod detected',
        detail: 'Disabled mod identity was found. Exact Nexus file is unverified.', state: 'SMAPI_DISABLED' }
    }
    const journal = precedence.find(s => rows.some(row => row.journalState === s))
    if (journal && journalLabels[journal]) {
      const [label, detail] = journalLabels[journal]
      return { label, detail, state: 'JOURNAL_' + journal }
    }
    if (rows.some(row => row.archiveProofState === 'VERIFIED_AT_SCAN')) {
      return { label: 'Local ZIP checksum matched',
        detail: 'Archive matched an app-private receipt at scan time; not a Nexus-signed checksum or install proof.',
        state: 'LOCAL_ARCHIVE' }
    }
    if (hasPending) return { label: 'Request awaiting Cinderbox action',
      detail: 'Requested only; no download or installation started.', state: 'REQUEST_PENDING' }
    return { label: 'No verified companion evidence',
      detail: 'A local mod link, archive and exact installed file are not established.', state: 'UNKNOWN' }
  }

  function summarize(result, requested) {
    const ids = normalizeIds(requested)
    if (!ids) return null
    const authority = result && result.authority
    if (result?.state !== 'connected' || !authority || !Array.isArray(authority.items) ||
        !['QUALIFIED', 'UNAVAILABLE'].includes(authority.inventoryState) ||
        authority.items.length > 128) return null
    return ids.map(modId => ({ modId, ...summary(authority, result.handoffs, modId) }))
  }
  return Object.freeze({ normalizeIds, summarize })
})()
