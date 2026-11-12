import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { runInNewContext } from 'node:vm'

const root = new URL('../../extensions/stardew-nexus-download-queue/src/cbnx01-handoff.js', import.meta.url)
const scope = { URL }
runInNewContext(readFileSync(root, 'utf8'), scope)
const bridge = scope.CBNX01
const origin = 'https://www.nexusmods.com/stardewvalley/mods/123'
const request = `${origin}?tab=files&cinderbox_file=456&cinderbox_mode=nxm&cinderbox_request=request-0001`

function anchor(href, manager = true) {
  return {href, getAttribute: key => key === 'href' ? href : null,
    closest: selector => manager && selector === '#action-nmm' ? {} : null}
}

test('accepts the exact file-only Cinderbox handoff contract', () => {
  const parsed = bridge.parseRequest(request)
  assert.equal(parsed?.modId, '123')
  assert.equal(parsed?.fileId, '456')
  assert.equal(parsed?.requestId, 'request-0001')
  for (const bad of [
    request.replace('mods/123', 'mods/124'), // another valid identity is not a fixed 123 requirement
    request.replace('cinderbox_file=456', 'cinderbox_file=0'),
    request.replace('www.nexusmods.com', 'nexusmods.com.evil.test'),
    request.replace('https:', 'http:'),
    request + '&cinderbox_file=789',
    request.replace('cinderbox_mode=nxm', 'cinderbox_mode=manual'),
    request.replace('cinderbox_request=request-0001', 'cinderbox_request=x'),
  ].slice(1)) assert.equal(bridge.parseRequest(bad), null)
})

test('never substitutes an arbitrary first/primary mod file', () => {
  const correct = anchor(`${origin}?file_id=456&nmm=1`)
  const wrong = anchor(`${origin}?file_id=789&nmm=1`)
  const manual = anchor(`${origin}?file_id=456`, false)
  assert.equal(bridge.selectExactManagerAnchor([wrong, manual, correct], '456', origin), correct)
  assert.equal(bridge.selectExactManagerAnchor([wrong, manual], '456', origin), null)
  assert.equal(bridge.selectExactManagerAnchor([correct, anchor(`${origin}?file_id=456&nmm=1&alt=1`)], '456', origin), null)
  assert.equal(bridge.selectExactManagerAnchor([], '456', origin), null)
  const directNxm = anchor('nxm://stardewvalley/mods/123/files/456?key=abc&expires=1794170200', false)
  assert.equal(bridge.selectExactManagerAnchor([directNxm], '456', origin), directNxm)
})

test('requires matching mod/file identity on final NXM handoff', () => {
  const nxm = 'nxm://stardewvalley/mods/123/files/456?key=abc&expires=1794170200'
  assert.equal(bridge.matchesNxmUrl(nxm, '123', '456'), true)
  assert.equal(bridge.matchesNxmUrl(nxm, '123', '789'), false)
  assert.equal(bridge.matchesNxmUrl(nxm.replace('stardewvalley', 'skyrim'), '123', '456'), false)
  assert.equal(bridge.matchesNxmUrl(nxm + '#spoof', '123', '456'), false)
  assert.equal(bridge.matchesNxmUrl(nxm.replace('nxm:', 'https:'), '123', '456'), false)
})

function makeBrowserHarness(finalUrl, candidates) {
  const timers = []
  const sent = []
  const elements = []
  const page = {prepend: child => { page.notice = child }}
  const document = {
    createElement: tag => {
      const el = {
        tag, hidden: false, style: {}, textContent: '', children: [],
        setAttribute(name, value) { this[name] = value },
        append(...children) { this.children.push(...children) },
        addEventListener(type, listener) { this[`on_${type}`] = listener }
      }
      elements.push(el)
      return el
    },
    querySelector: () => page,
    querySelectorAll: () => candidates,
    body: page
  }
  const store = new Map()
  const sandbox = {
    URL,
    document,
    location: { href: request },
    sessionStorage: {getItem: k => store.get(k) || null, setItem: (k,v) => store.set(k,v)},
    isModPage: () => true,
    setTimeout: (fn) => { timers.push(fn) },
    resolveFromClickedAnchor: async () => ({downloadUrl:finalUrl,modId:'123',fileId:'456'}),
    queuePayload: async (item) => { sent.push(item) }
  }
  runInNewContext(readFileSync(root, 'utf8'), sandbox)
  const runtime = new URL('../../extensions/stardew-nexus-download-queue/src/cbnx01-browser-bridge.js', import.meta.url)
  runInNewContext(readFileSync(runtime, 'utf8'), sandbox)
  return { sandbox, timers, sent, elements, page }
}

test('browser bridge queues the exact file and leaves OS-gesture fallback visible', async () => {
  const goodNxm = 'nxm://stardewvalley/mods/123/files/456?key=abc&expires=1794170200'
  const h = makeBrowserHarness(goodNxm, [anchor(`${origin}?file_id=456&nmm=1`)])
  await h.sandbox.startCinderboxBrowserBridge()
  assert.equal(h.timers.length, 1)
  await h.timers.shift()()
  assert.equal(h.sent.length, 1)
  assert.equal(h.sent[0].fileId, '456')
  assert.equal(h.sent[0].kind, 'manager')
  const link = h.elements.find(x => x.tag === 'a')
  assert.equal(link.href, goodNxm)
  assert.equal(link.hidden, false)
  assert.match(h.elements.find(x => x.tag === 'div').textContent, /attempted/i)
})

test('browser bridge refuses mismatched final NXM and never enqueues', async () => {
  const wrongNxm = 'nxm://stardewvalley/mods/123/files/999?key=abc&expires=1794170200'
  const h = makeBrowserHarness(wrongNxm, [anchor(`${origin}?file_id=456&nmm=1`)])
  await h.sandbox.startCinderboxBrowserBridge()
  await h.timers.shift()()
  assert.equal(h.sent.length, 0)
  assert.equal(h.elements.find(x => x.tag === 'button').hidden, false)
})

test('official HTTPS fallback stays bound to exact mod and file IDs, without NXM fabrication', () => {
  const expected = bridge.exactNexusFileActionUrl('50535', '178239')
  const url = new URL(expected)
  assert.equal(url.protocol, 'https:')
  assert.equal(url.hostname, 'www.nexusmods.com')
  assert.equal(url.pathname, '/stardewvalley/mods/50535')
  assert.equal(url.searchParams.get('file_id'), '178239')
  assert.equal(url.searchParams.get('nmm'), '1')
  assert.equal(bridge.exactNexusFileActionUrl('50535', '190561').includes('file_id=178239'), false)
  for (const invalid of ['0', '-1', '1/2', '1?x=2', '1234567890123']) {
    assert.equal(bridge.exactNexusFileActionUrl(invalid, '178239'), null)
    assert.equal(bridge.exactNexusFileActionUrl('50535', invalid), null)
  }
})

test('missing dynamic manager link exposes a safe exact-file fallback and a complete retry window', async () => {
  const h = makeBrowserHarness(null, [])
  await h.sandbox.startCinderboxBrowserBridge()
  const links = h.elements.filter(x => x.tag === 'a')
  assert.equal(links.length, 2)
  const fallback = links[1]
  assert.equal(fallback.hidden, false)
  assert.equal(new URL(fallback.href).searchParams.get('file_id'), '456')
  assert.equal(new URL(fallback.href).searchParams.get('nmm'), '1')
  assert.equal(h.sent.length, 0)
  for (let count = 0; count < 15; count++) {
    const timer = h.timers.shift()
    assert.equal(typeof timer, 'function')
    await timer()
  }
  assert.equal(h.timers.length, 0)
  assert.equal(h.elements.find(x => x.tag === 'button').hidden, false)
  const retry = h.elements.find(x => x.tag === 'button')
  retry.on_click()
  assert.equal(h.timers.length, 1)
  for (let count = 0; count < 15; count++) {
    const timer = h.timers.shift()
    assert.equal(typeof timer, 'function')
    await timer()
  }
  assert.equal(h.timers.length, 0)
  assert.equal(retry.hidden, false)
  assert.equal(h.sent.length, 0)
})
