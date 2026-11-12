import { test } from 'node:test'
import { strict as assert } from 'node:assert'
import fs from 'node:fs'
import vm from 'node:vm'
import path from 'node:path'
const script = fs.readFileSync(path.resolve('extensions/stardew-nexus-download-queue/src/cbnx03-background.js'), 'utf8')
const popup = 'moz-extension://5a953e21-cb87-4b12-874f-64e2b6070c1f/popup.html'

function launch(fetchFn) {
  let listener
  const sandbox = {
    browser: { runtime: {
      getURL: name => popup.replace('popup.html', name),
      onMessage: { addListener: cb => { listener = cb } }
    } },
    crypto: { getRandomValues: a => { a.fill(13); return a } },
    fetch: fetchFn,
    AbortController, setTimeout, clearTimeout, Uint8Array, Promise
  }
  vm.runInNewContext(script, sandbox)
  return (type, payload, sender = { url: popup }) => listener(
    { type, ...(typeof payload === 'object' && payload !== null ? payload : { code: payload }) }, sender)
}
const result = (obj, status = 200) => ({ ok: status >= 200 && status < 300, status, json: async () => obj })

test('unpaired status is explicit, and Nexus content scripts cannot pair', async () => {
  let requests = 0
  const send = launch(async () => { requests++; return result({}) })
  const state = await send('CBNX03_STATUS')
  assert.equal(state.state, 'unpaired')
  const rejected = await send('CBNX03_PAIR', '123456789', { url: 'https://www.nexusmods.com', tab: { id: 12 } })
  assert.equal(rejected.state, 'refused')
  assert.equal(requests, 0)
})

test('paired state uses ephemeral bearer, one-time request nonces, and sanitized output', async () => {
  const requests = []
  const send = launch(async (url, options) => {
    requests.push({ url, options })
    if (url.endsWith('/hello')) return result({ protocol: 1, challenge: 'challenge' })
    if (url.endsWith('/pair')) return result({ protocol: 1, token: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa', read_only: true })
    if (url.endsWith('/state')) return result({ protocol: 1, proof_kind: 'journal_only', installed_inventory_qualified: false,
      jobs: [{ job_id: '1', source: 'nexus', mod_id: '50535', file_id: '178239', status: 'PAUSED', received: 1, total: 2 }] })
    return result({ revoked: true })
  })
  assert.equal((await send('CBNX03_PAIR', '123456789')).state, 'paired')
  const state = await send('CBNX03_STATUS')
  assert.equal(state.state, 'connected')
  assert.equal(state.jobs[0].fileId, '178239')
  assert.equal(JSON.stringify(state).includes('aaaaa'), false)
  assert.equal(requests[2].options.credentials, 'omit')
  assert.match(requests[2].options.headers.Authorization, /^Bearer a+/)
  assert.match(requests[2].options.headers['X-CBNX-Nonce'], /^[a-f0-9]{36}$/)
  assert.equal((await send('CBNX03_REVOKE')).state, 'unpaired')
  assert.equal((await send('CBNX03_STATUS')).state, 'unpaired')
  assert.equal(requests.length, 4)
})

test('invalid pair code, offline and unknown message do not reach remote service', async () => {
  let calls = 0
  const send = launch(async () => { calls++; throw new Error('connection') })
  assert.equal((await send('CBNX03_PAIR', 'bad')).state, 'invalid_code')
  assert.equal(calls, 0)
  assert.equal(await send('OTHER_MESSAGE'), undefined)
  assert.equal((await send('CBNX03_PAIR', '123456789')).state, 'offline')
  assert.equal(calls, 1)
})


test('exact-file handoff requires popup provenance, positive IDs and active pairing', async () => {
  const requests = []
  const send = launch(async (url, options) => {
    requests.push({ url, options })
    if (url.endsWith('/hello')) return result({ protocol: 1, challenge: 'challenge' })
    if (url.endsWith('/pair')) return result({ protocol: 1, token: 'x'.repeat(43), read_only: true })
    if (url.endsWith('/handoff')) return result({ status: 'pending_user_action', request_id: 'i'.repeat(36),
      download_started: false, archive_staged: false, installed: false }, 202)
    throw new Error('bad path')
  })
  assert.equal((await send('CBNX03_HANDOFF', { modId: '50535', fileId: '178239' })).state, 'unpaired')
  assert.equal((await send('CBNX03_HANDOFF', { modId: '0', fileId: '178239' })).state, 'invalid_identity')
  assert.equal(requests.length, 0)
  assert.equal((await send('CBNX03_PAIR', '123456789')).state, 'paired')
  assert.equal((await send('CBNX03_HANDOFF', { modId: '50535', fileId: '178239' },
    { url: 'https://www.nexusmods.com/stardewvalley' })).state, 'refused')
  const accepted = await send('CBNX03_HANDOFF', { modId: '50535', fileId: '178239' })
  assert.equal(accepted.state, 'handoff_pending')
  assert.equal(accepted.downloadStarted, false)
  assert.equal(requests.length, 3)
  const request = requests[2]
  assert.equal(request.url, 'http://127.0.0.1:38471/v1/handoff')
  assert.equal(request.options.credentials, 'omit')
  assert.match(request.options.headers.Authorization, /^Bearer x+$/)
  const body = JSON.parse(request.options.body)
  assert.deepEqual(Object.keys(body).sort(), ['file_id', 'mod_id', 'request_id'])
  assert.equal(body.mod_id, '50535')
  assert.equal(body.file_id, '178239')
  assert.match(body.request_id, /^[a-f0-9]{36}$/)
  assert.equal(JSON.stringify(accepted).includes('xxx'), false)
})

test('successful HTTP alone is insufficient to claim download or install', async () => {
  const send = launch(async url => {
    if (url.endsWith('/hello')) return result({ protocol: 1, challenge: 'challenge' })
    if (url.endsWith('/pair')) return result({ protocol: 1, token: 'x'.repeat(43), read_only: true })
    if (url.endsWith('/handoff')) return result({ status: 'pending_user_action', request_id: 'i'.repeat(36),
      download_started: true, archive_staged: false, installed: false }, 202)
    throw new Error('unexpected path')
  })
  assert.equal((await send('CBNX03_PAIR', '123456789')).state, 'paired')
  assert.equal((await send('CBNX03_HANDOFF', { modId: '50535', fileId: '178239' })).state, 'incompatible')
})

test('read-only state carries only redacted pending identities and capability', async () => {
  const send = launch(async url => {
    if (url.endsWith('/hello')) return result({ protocol: 1, challenge: 'challenge' })
    if (url.endsWith('/pair')) return result({ protocol: 1, token: 'x'.repeat(43), read_only: true })
    if (url.endsWith('/state')) return result({ protocol: 1, proof_kind: 'journal_only',
      installed_inventory_qualified: false, handoff_enabled: true, jobs: [],
      handoffs: [{ request_id: 'q'.repeat(36), mod_id: '50535', file_id: '178239', status: 'PENDING' }] })
    throw new Error('unexpected path')
  })
  assert.equal((await send('CBNX03_PAIR', '123456789')).state, 'paired')
  const state = await send('CBNX03_STATUS')
  assert.equal(state.state, 'connected')
  assert.equal(state.handoffEnabled, true)
  assert.equal(state.handoffs.length, 1)
  assert.equal(state.handoffs[0].fileId, '178239')
  assert.equal(JSON.stringify(state).includes('xxxxx'), false)
})
