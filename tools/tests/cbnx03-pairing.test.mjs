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
  return (type, code, sender = { url: popup }) => listener({ type, code }, sender)
}
const result = (obj, status = 200) => ({ ok: status === 200, status, json: async () => obj })

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
