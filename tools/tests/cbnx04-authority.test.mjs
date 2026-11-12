import { test } from 'node:test'
import { strict as assert } from 'node:assert'
import fs from 'node:fs'
import vm from 'node:vm'
import path from 'node:path'

const script = fs.readFileSync(path.resolve('extensions/stardew-nexus-download-queue/src/cbnx03-background.js'), 'utf8')
const popup = 'moz-extension://5a953e21-cb87-4b12-874f-64e2b6070c1f/popup.html'
const token = 't'.repeat(43)
const evidence = (changes = {}) => ({ schema: 1, scope: 'LOCAL_SMAPI_AND_JOURNAL',
  inventory_state: 'QUALIFIED', remote_update_check: 'NOT_PERFORMED', items: [{
    mod_id: '50535', file_id: '178239', journal_state: 'INSTALLED',
    journal_transfer_reported: true, archive_checksum_qualified: false,
    archive_proof_state: 'NO_RETAINED_ARCHIVE', archive_proof_scope: 'LOCAL_ZIP_VS_APP_RECEIPT',
    installed_mod_state: 'PRESENT', exact_file_installed: 'UNKNOWN',
    update_state: 'UNKNOWN', update_proof_scope: 'CACHED_SMAPI_MOD_VERSION', installed_version: '1.2.0'
  }], ...changes })
function session(authority, onFetch = () => {}) {
  let listener
  const sandbox = { browser: { runtime: { getURL: () => popup,
    onMessage: { addListener: fn => { listener = fn } } } },
    crypto: { getRandomValues: a => { a.fill(13); return a } },
    AbortController, setTimeout, clearTimeout, Uint8Array, Promise,
    fetch: async (url, opts) => {
      onFetch(url, opts)
      const payload = url.endsWith('/hello') ? { protocol: 1, challenge: 'good' } :
        url.endsWith('/pair') ? { protocol: 1, token, read_only: true } :
          { protocol: 1, proof_kind: 'journal_only', installed_inventory_qualified: false,
            jobs: [], authority }
      return { ok: true, status: 200, json: async () => payload }
    } }
  vm.runInNewContext(script, sandbox)
  return (type, sender = { url: popup }) => listener({ type, code: '123456789' }, sender)
}
test('qualified SMAPI link proves mod presence, but never exact installed file or provider update', async () => {
  const send = session(evidence())
  assert.equal((await send('CBNX03_PAIR')).state, 'paired')
  const state = await send('CBNX03_STATUS')
  assert.equal(state.authority.inventoryState, 'QUALIFIED')
  assert.equal(state.authority.items[0].installedModState, 'PRESENT')
  assert.equal(state.authority.items[0].exactFileInstalled, 'UNKNOWN')
  assert.equal(state.authority.items[0].updateState, 'UNKNOWN')
  assert.equal(state.authority.items[0].archiveProofState, 'NO_RETAINED_ARCHIVE')
  assert.equal(state.authority.items[0].archiveChecksumQualified, false)
  assert.equal(JSON.stringify(state).includes(token), false)
})
test('inaccessible inventory cannot show installed even with forged old evidence', async () => {
  const send = session(evidence({ inventory_state: 'UNAVAILABLE' }))
  await send('CBNX03_PAIR')
  const authority = (await send('CBNX03_STATUS')).authority
  assert.equal(authority.inventoryState, 'UNAVAILABLE')
  assert.equal(authority.items.length, 0)
})
test('forged exact-file installed or remote update proof is rejected, not promoted', async () => {
  for (const change of [{ exact_file_installed: 'CONFIRMED' }, { update_state: 'NEWER' },
      { archive_checksum_qualified: true }]) {
    const payload = evidence({ items: [{ ...evidence().items[0], ...change }] })
    const send = session(payload)
    await send('CBNX03_PAIR')
    assert.equal((await send('CBNX03_STATUS')).authority.inventoryState, 'UNAVAILABLE')
  }
})
test('duplicate IDs and credential-bearing version strings fail the entire authority payload', async () => {
  const item = evidence().items[0]
  for (const items of [[item, item], [{ ...item, installed_version: 'nxm://private' }]]) {
    const send = session(evidence({ items }))
    await send('CBNX03_PAIR')
    assert.equal((await send('CBNX03_STATUS')).authority.items.length, 0)
  }
})
test('unauthorized Nexus content script cannot obtain local evidence', async () => {
  let requests = 0
  const send = session(evidence(), () => { requests++ })
  const denied = await send('CBNX03_STATUS', { tab: { id: 1 }, url: 'https://www.nexusmods.com/stardewvalley' })
  assert.equal(denied.state, 'refused')
  assert.equal(requests, 0)
})
test('old Cinderbox payload remains connected but clearly unqualified', async () => {
  const send = session(undefined)
  await send('CBNX03_PAIR')
  const state = await send('CBNX03_STATUS')
  assert.equal(state.state, 'connected')
  assert.equal(state.authority.inventoryState, 'UNAVAILABLE')
  assert.equal(state.authority.items.length, 0)
})

// CB-NX04B: Update the SAME canonical authority suite, not a new legacy gate.
test('matching app-private receipt is surfaced as local proof, never Nexus proof or installed-file status', async () => {
  const item = { ...evidence().items[0], journal_state: 'REVIEW_REQUIRED',
    archive_checksum_qualified: true, archive_proof_state: 'VERIFIED_AT_SCAN' }
  const send = session(evidence({ items: [item] }))
  await send('CBNX03_PAIR')
  const state = (await send('CBNX03_STATUS')).authority
  assert.equal(state.items.length, 1)
  assert.equal(state.items[0].archiveProofState, 'VERIFIED_AT_SCAN')
  assert.equal(state.items[0].archiveProofScope, 'LOCAL_ZIP_VS_APP_RECEIPT')
  assert.equal(state.items[0].archiveChecksumQualified, true)
  assert.equal(state.items[0].exactFileInstalled, 'UNKNOWN')
  assert.equal(state.items[0].updateState, 'UNKNOWN')
})
test('inconsistent or forged archive proof and provider scope are rejected fail closed', async () => {
  const variants = [
    { archive_checksum_qualified: true, archive_proof_state: 'NO_RETAINED_ARCHIVE' },
    { archive_checksum_qualified: false, archive_proof_state: 'VERIFIED_AT_SCAN' },
    { archive_checksum_qualified: true, archive_proof_state: 'VERIFIED_AT_SCAN',
      archive_proof_scope: 'NEXUS_PROVIDER_SIGNATURE' },
    { archive_proof_state: 'SOME_UNTRUSTED_STATE' },
    { archive_checksum_qualified: true, archive_proof_state: 'VERIFIED_AT_SCAN',
      journal_state: 'QUEUED' },
  ]
  for (const changes of variants) {
    const payload = evidence({ items: [{ ...evidence().items[0], ...changes }] })
    const send = session(payload)
    await send('CBNX03_PAIR')
    assert.equal((await send('CBNX03_STATUS')).authority.items.length, 0)
  }
})

// CB-NX04C migration: existing authority suite accepts ONLY bounded cached SMAPI mod
// comparisons with fresh inventory evidence; no remote requests or exact-file claims.
test('fresh cached SMAPI newer mod version is surfaced without exact Nexus-file proof', async () => {
  const newItem = { ...evidence().items[0], update_state: 'NEWER', candidate_version: '1.3.0' }
  const send = session(evidence({ remote_update_check: 'SMAPI_CACHE_FRESH', items: [newItem] }))
  await send('CBNX03_PAIR')
  const state = (await send('CBNX03_STATUS')).authority
  assert.equal(state.remoteUpdateCheck, 'SMAPI_CACHE_FRESH')
  assert.equal(state.items[0].updateState, 'NEWER')
  assert.equal(state.items[0].candidateVersion, '1.3.0')
  assert.equal(state.items[0].exactFileInstalled, 'UNKNOWN')
})
test('stale, unavailable and clock-invalid cache cannot produce an update badge', async () => {
  for (const remoteUpdateCheck of ['NOT_PERFORMED', 'SMAPI_CACHE_STALE', 'CLOCK_INVALID', 'UNAVAILABLE']) {
    const send = session(evidence({ remote_update_check: remoteUpdateCheck,
      items: [{ ...evidence().items[0], update_state: 'NEWER', candidate_version: '1.3.0' }] }))
    await send('CBNX03_PAIR')
    assert.equal((await send('CBNX03_STATUS')).authority.items.length, 0)
  }
})
test('forged or missing SMAPI update metadata fails closed, never auto-installs', async () => {
  const old = evidence().items[0]
  const mutants = [
    { ...old, update_state: 'NEWER' },
    { ...old, update_state: 'NEWER', candidate_version: 'nxm://private' },
    { ...old, update_state: 'CURRENT', candidate_version: '1.3.0' },
    { ...old, update_state: 'NEWER', candidate_version: '1.3.0', update_proof_scope: 'NEXUS_FILE_SIGNATURE' },
    { ...old, update_state: 'NEWER', candidate_version: '1.3.0', installed_mod_state: 'DISABLED_PRESENT' },
    { ...old, update_state: 'NEWER', candidate_version: '1.3.0', exact_file_installed: 'CONFIRMED' },
  ]
  for (const item of mutants) {
    const send = session(evidence({ remote_update_check: 'SMAPI_CACHE_FRESH', items: [item] }))
    await send('CBNX03_PAIR')
    assert.equal((await send('CBNX03_STATUS')).authority.items.length, 0)
  }
})
