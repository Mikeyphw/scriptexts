/* Exact-file Nexus handoff contract. No cookies, credentials or implicit file substitution. */
(() => {
  'use strict'
  const idPattern = /^[1-9][0-9]{0,11}$/
  const requestPattern = /^[A-Za-z0-9-]{8,64}$/
  const nexusHosts = new Set(['www.nexusmods.com', 'next.nexusmods.com'])

  function parseRequest(href) {
    try {
      const url = new URL(href)
      if (url.protocol !== 'https:' || !nexusHosts.has(url.hostname) ||
          url.username || url.password || url.port || url.hash) return null
      const path = url.pathname.match(/^\/(?:games\/)?stardewvalley\/mods\/([1-9][0-9]{0,11})\/?$/)
      if (!path || url.searchParams.get('tab') !== 'files' ||
          url.searchParams.get('cinderbox_mode') !== 'nxm') return null
      for (const key of ['cinderbox_file', 'cinderbox_mode', 'cinderbox_request']) {
        if (url.searchParams.getAll(key).length !== 1) return null
      }
      const fileId = url.searchParams.get('cinderbox_file')
      const requestId = url.searchParams.get('cinderbox_request')
      if (!idPattern.test(fileId || '') || !requestPattern.test(requestId || '')) return null
      return { modId: path[1], fileId, requestId }
    } catch (_) {
      return null
    }
  }

  function extractFileId(href, baseUrl) {
    try {
      const url = new URL(href, baseUrl)
      if (url.protocol === 'nxm:' && url.hostname.toLowerCase() === 'stardewvalley') {
        const match = url.pathname.match(/^\/mods\/[1-9][0-9]{0,11}\/files\/([1-9][0-9]{0,11})$/)
        return match ? match[1] : null
      }
      if (!nexusHosts.has(url.hostname) || url.protocol !== 'https:') return null
      const explicit = url.searchParams.get('file_id') || url.searchParams.get('fileId')
      if (explicit && idPattern.test(explicit)) return explicit
      const path = url.pathname.match(/\/api\/files\/([1-9][0-9]{0,11})(?:\/|$)/)
      return path ? path[1] : null
    } catch (_) {
      return null
    }
  }

  function isManagerAnchor(anchor, baseUrl) {
    try {
      const href = anchor?.href || anchor?.getAttribute?.('href') || ''
      const url = new URL(href, baseUrl)
      return url.protocol === 'nxm:' || url.searchParams.get('nmm') === '1' ||
        Boolean(anchor.closest?.('#action-nmm')) ||
        anchor.getAttribute?.('data-nxq-kind') === 'manager'
    } catch (_) {
      return false
    }
  }

  /** Refuse missing and ambiguous manager actions. Never pick the first download. */
  function selectExactManagerAnchor(anchors, expectedFileId, baseUrl) {
    if (!idPattern.test(String(expectedFileId || ''))) return null
    const byHref = new Map()
    for (const anchor of anchors) {
      const href = anchor?.href || anchor?.getAttribute?.('href') || ''
      const identified = extractFileId(href, baseUrl) ||
        anchor?.closest?.('[data-file-id]')?.getAttribute?.('data-file-id') || null
      if (!href || identified !== expectedFileId ||
          !isManagerAnchor(anchor, baseUrl)) continue
      const canonical = new URL(href, baseUrl).href
      if (!byHref.has(canonical)) byHref.set(canonical, anchor)
    }
    return byHref.size === 1 ? [...byHref.values()][0] : null
  }

  function matchesNxmUrl(href, modId, fileId) {
    try {
      const url = new URL(href)
      if (url.protocol !== 'nxm:' || url.hostname.toLowerCase() !== 'stardewvalley' ||
          url.username || url.password || url.port || url.hash) return false
      const match = url.pathname.match(/^\/mods\/([1-9][0-9]{0,11})\/files\/([1-9][0-9]{0,11})$/)
      return Boolean(match && match[1] === modId && match[2] === fileId &&
        url.searchParams.get('key') && url.searchParams.get('expires'))
    } catch (_) {
      return false
    }
  }

  globalThis.CBNX01 = Object.freeze({parseRequest, extractFileId, selectExactManagerAnchor, matchesNxmUrl})
})()
