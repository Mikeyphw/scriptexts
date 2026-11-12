import { test } from 'node:test'
import { strict as assert } from 'node:assert'
import fs from 'node:fs'
import vm from 'node:vm'
import path from 'node:path'

const ROOT = 'extensions/stardew-nexus-download-queue/src'
const policySource = fs.readFileSync(path.resolve(ROOT, 'cbnx05c-evidence-policy.js'), 'utf8')
const bridgeSource = fs.readFileSync(path.resolve(ROOT, 'cbnx03-background.js'), 'utf8')
const POPUP = 'moz-extension://local-123/popup.html'
const VALID_SENDER = { url: 'https://www.nexusmods.com/stardewvalley/mods/50535', tab: { id: 3 }, frameId: 0 }
const token = 'a'.repeat(43)
const goodAuthority = {
  schema: 1, scope: 'LOCAL_SMAPI_AND_JOURNAL', inventory_state: 'QUALIFIED',
  remote_update_check: 'SMAPI_CACHE_FRESH', items: [
    { mod_id: '50535', file_id: '178239', journal_state: 'INSTALLED',
      installed_mod_state: 'PRESENT', installed_version: '1.0.0',
      update_state: 'NEWER', update_proof_scope: 'CACHED_SMAPI_MOD_VERSION',
      candidate_version: '1.1.0', exact_file_installed: 'UNKNOWN',
      archive_checksum_qualified: true, archive_proof_state: 'VERIFIED_AT_SCAN',
      archive_proof_scope: 'LOCAL_ZIP_VS_APP_RECEIPT', journal_transfer_reported: true }
  ]
}
function launch({ optedIn = true, authority = goodAuthority, stateBarrier = null } = {}) {
  let listener
  let requests = []
  let consent = optedIn
  const runtime = { getURL: name => POPUP.replace('popup.html', name),
    onMessage: { addListener: fn => { listener = fn } } }
  const storage = { local: { get: async () => ({ cbnx05c_page_badges: consent }) } }
  const fetchFn = async (url, options) => {
    requests.push({ url, options })
    if (url.endsWith('/hello')) return { ok: true, json: async () => ({ protocol: 1, challenge: 'nonce' }) }
    if (url.endsWith('/pair')) return { ok: true, json: async () => ({ protocol: 1, token, read_only: true }) }
    if (url.endsWith('/state')) {
      // Hold an in-flight local read to prove that revoke/consent removal wins.
      if (stateBarrier) await stateBarrier
      return { ok: true, json: async () => ({
        protocol: 1, proof_kind: 'journal_only', installed_inventory_qualified: false,
        authority, jobs: [], handoffs: [] }) }
    }
    if (url.endsWith('/revoke')) return { ok: true, json: async () => ({ revoked: true }) }
    throw Error('unexpected route')
  }
  const context = { browser: { runtime, storage }, fetch: fetchFn,
    crypto: { getRandomValues: a => { a.fill(42); return a } },
    AbortController, setTimeout, clearTimeout, Uint8Array, Promise, Date, URL }
  vm.runInNewContext(policySource + '\n;globalThis.__cbnx_policy = CBNX05CPolicy', context)
  vm.runInNewContext(bridgeSource, context)
  const send = (type, body = {}, sender = VALID_SENDER) =>
    listener({ type, ...body }, sender)
  return { send, requests, setConsent: v => { consent = v }, policy: context.__cbnx_policy }
}
const ask = runtime => runtime.send('CBNX05C_PAGE_STATUS', { modIds: ['50535'] })

test('read-only page status is opt-in and cannot pair on behalf of a tab', async () => {
  const r = launch({ optedIn: false })
  assert.equal((await ask(r)).state, 'disabled')
  assert.equal(r.requests.length, 0)
  assert.equal((await r.send('CBNX03_PAIR', { code: '123456789' }, VALID_SENDER)).state, 'refused')
  assert.equal(r.requests.length, 0)
})

test('rejects unsafe sender, frames, invalid IDs and unpaired evidence', async () => {
  const r = launch()
  assert.equal((await ask(r)).state, 'unpaired')
  for (const sender of [
    { url: 'https://evilnexusmods.com/stardewvalley/mods/50535', tab: { id: 2 } },
    { url: 'http://www.nexusmods.com/stardewvalley/mods/50535', tab: { id: 2 } },
    { url: 'https://www.nexusmods.com/skyrim/mods/50535', tab: { id: 2 } },
    { url: 'https://www.nexusmods.com/stardewvalley/mods/50535' },
    { ...VALID_SENDER, frameId: 8 },
    { ...VALID_SENDER, url: POPUP }
  ]) assert.equal((await r.send('CBNX05C_PAGE_STATUS', { modIds: ['50535'] }, sender)).state, 'refused')
  for (const modIds of [['0'], ['50535', '50535'], ['1/2'], [], Array(25).fill('1'), [50535]]) {
    assert.equal((await r.send('CBNX05C_PAGE_STATUS', { modIds })).state, 'invalid_identity')
  }
  assert.equal(r.requests.length, 0)
})

test('paired permission returns only local read-only, redacted one-mod badge', async () => {
  const r = launch()
  assert.equal((await r.send('CBNX03_PAIR', { code: '123456789' }, { url: POPUP })).state, 'paired')
  const view = await ask(r)
  assert.equal(view.state, 'connected')
  assert.equal(view.rows.length, 1)
  assert.equal(view.rows[0].modId, '50535')
  assert.match(view.rows[0].label, /Cached SMAPI version/)
  assert.match(view.rows[0].detail, /Not an exact Nexus file update/)
  assert.equal(Number.isSafeInteger(view.checkedAtMs), true)
  const json = JSON.stringify(view)
  for (const forbidden of [token, '178239', '1.1.0', 'Authorization', 'VERIFIED_AT_SCAN', 'archive_checksum_qualified', 'path', 'nxm://']) {
    assert.equal(json.includes(forbidden), false, forbidden)
  }
  const headers = r.requests.find(req => req.url.endsWith('/state')).options.headers
  assert.equal(headers.Authorization, 'Bearer ' + token)
})

test('stale SMAPI observations never produce cached-newer or confirmed update badges', async () => {
  const stale = structuredClone(goodAuthority)
  stale.remote_update_check = 'SMAPI_CACHE_STALE'
  stale.items[0].update_state = 'UNKNOWN'
  delete stale.items[0].candidate_version
  const r = launch({ authority: stale })
  await r.send('CBNX03_PAIR', { code: '123456789' }, { url: POPUP })
  const view = await ask(r)
  assert.equal(view.rows[0].state, 'SMAPI_PRESENT')
  assert.doesNotMatch(view.rows[0].label, /newer|update available|installed file/i)
})

test('invalid proof or missing inventory fails closed, no exact install badge', async () => {
  const forged = structuredClone(goodAuthority)
  forged.items[0].exact_file_installed = 'CONFIRMED'
  const r = launch({ authority: forged })
  await r.send('CBNX03_PAIR', { code: '123456789' }, { url: POPUP })
  const view = await ask(r)
  assert.equal(view.rows[0].state, 'UNKNOWN')
  assert.doesNotMatch(JSON.stringify(view), /CONFIRMED|178239/)
})

test('requests are bounded and status cache is in-memory, revocation wins', async () => {
  const r = launch()
  await r.send('CBNX03_PAIR', { code: '123456789' }, { url: POPUP })
  const first = await ask(r)
  const second = await ask(r)
  assert.equal(first.checkedAtMs, second.checkedAtMs)
  assert.equal(r.requests.filter(x => x.url.endsWith('/state')).length, 1)
  assert.equal((await r.send('CBNX03_REVOKE', {}, { url: POPUP })).state, 'unpaired')
  assert.equal((await ask(r)).state, 'unpaired')
  assert.equal(r.requests.filter(x => x.url.endsWith('/state')).length, 1)
})

test('revocation during an in-flight page request prevents stale status disclosure', async () => {
  let finishState
  const barrier = new Promise(resolve => { finishState = resolve })
  const r = launch({ stateBarrier: barrier })
  assert.equal((await r.send('CBNX03_PAIR', { code: '123456789' }, { url: POPUP })).state, 'paired')
  const pending = ask(r)
  for (let n = 0; n < 20 && !r.requests.some(x => x.url.endsWith('/state')); n++) await Promise.resolve()
  assert.equal(r.requests.filter(x => x.url.endsWith('/state')).length, 1)
  assert.equal((await r.send('CBNX03_REVOKE', {}, { url: POPUP })).state, 'unpaired')
  finishState()
  const view = await pending
  assert.equal(view.state, 'unpaired')
  assert.equal(view.rows.length, 0)
  assert.equal(JSON.stringify(view).includes(token), false)
})

test('withdrawn badge consent during an in-flight page request wins', async () => {
  let finishState
  const barrier = new Promise(resolve => { finishState = resolve })
  const r = launch({ stateBarrier: barrier })
  await r.send('CBNX03_PAIR', { code: '123456789' }, { url: POPUP })
  const pending = ask(r)
  for (let n = 0; n < 20 && !r.requests.some(x => x.url.endsWith('/state')); n++) await Promise.resolve()
  assert.equal(r.requests.filter(x => x.url.endsWith('/state')).length, 1)
  r.setConsent(false)
  finishState()
  const view = await pending
  assert.equal(view.state, 'disabled')
  assert.equal(view.rows.length, 0)
})

test('policy refuses empty, duplicate, malformed IDs and returns no unrelated rows', () => {
  const p = launch().policy
  for (const ids of [[], ['0'], ['7', '7'], [7], Array(25).fill('7')]) assert.equal(p.normalizeIds(ids), null)
  const result = { state: 'connected', authority: {
    inventoryState: 'QUALIFIED', remoteUpdateCheck: 'SMAPI_CACHE_FRESH', items: [
      { modId: '50535', fileId: '178239', journalState: 'INSTALLED',
        installedModState: 'PRESENT', updateState: 'UNKNOWN',
        archiveProofState: 'VERIFIED_AT_SCAN', exactFileInstalled: 'UNKNOWN' }
    ] }, handoffs: [] }
  const rows = p.summarize(result, ['50535', '9999'])
  assert.equal(rows.length, 2)
  assert.equal(rows[1].state, 'UNKNOWN')
  assert.equal(rows[0].state, 'SMAPI_PRESENT')
  assert.equal(JSON.stringify(rows).includes('178239'), false)
})
