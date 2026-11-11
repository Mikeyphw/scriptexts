/* Read-only pairing is optional; existing queue and browser fallback are untouched. */
(() => {
  'use strict'
  const main = document.querySelector('main')
  if (!main) return
  const panel = document.createElement('section')
  panel.className = 'panel'
  const header = document.createElement('h2')
  header.textContent = 'Cinderbox companion'
  const description = document.createElement('p')
  description.textContent = 'Optional local pairing. Status only; browser downloads and Vortex still work when unpaired.'
  const destinationTitle = document.createElement('label')
  destinationTitle.textContent = 'Exact-file destination'
  const destination = document.createElement('select')
  destination.setAttribute('aria-label', 'Exact-file destination')
  for (const [value, label] of [
    ['browser', 'Open file on Nexus in Firefox'],
    ['cinderbox', 'Request in Cinderbox'],
    ['manager', 'Open Nexus for another supported manager']
  ]) {
    const option = document.createElement('option')
    option.value = value
    option.textContent = label
    destination.append(option)
  }
  const rememberLabel = document.createElement('label')
  const remember = document.createElement('input')
  remember.type = 'checkbox'
  rememberLabel.append(remember, document.createTextNode(' Remember destination on this device'))
  const destinationInfo = document.createElement('p')
  destinationInfo.textContent = 'Browser by default. Nothing is auto-routed or installed. ' +
    'For other managers, choose the supported action on Nexus yourself.'
  destinationTitle.append(destination)
  destination.value = 'browser'
  const evidenceLabel = document.createElement('label')
  const evidenceOptIn = document.createElement('input')
  evidenceOptIn.type = 'checkbox'
  evidenceOptIn.setAttribute('aria-label', 'Show local companion status on Nexus pages')
  evidenceLabel.append(evidenceOptIn, document.createTextNode(' Show companion badges on Nexus pages'))
  const evidencePrivacy = document.createElement('p')
  evidencePrivacy.textContent = 'Off by default. Enabling may expose displayed local mod status to Nexus page scripts. ' +
    'No file IDs, app paths, cookies, bearer tokens or exact installed-file claims are shared.'
  const code = document.createElement('input')
  code.type = 'text'
  code.inputMode = 'numeric'
  code.placeholder = '9-digit Cinderbox code'
  code.maxLength = 9
  code.autocomplete = 'off'
  const pair = document.createElement('button')
  pair.type = 'button'
  pair.textContent = 'Pair'
  const refresh = document.createElement('button')
  refresh.type = 'button'
  refresh.textContent = 'Refresh local evidence'
  const revoke = document.createElement('button')
  revoke.type = 'button'
  revoke.textContent = 'Disconnect'
  const status = document.createElement('div')
  status.setAttribute('role', 'status')
  status.textContent = 'Not paired'
  const handoffTitle = document.createElement('h3')
  handoffTitle.textContent = 'Send an exact file request'
  const handoffInfo = document.createElement('p')
  handoffInfo.textContent = 'Use a selected file from your browser queue. Cinderbox must approve requests locally; no download starts here.'
  const handoffList = document.createElement('div')
  handoffList.setAttribute('aria-label', 'Browser exact-file requests')
  const authority = document.createElement('div')
  authority.setAttribute('aria-label', 'Cinderbox authoritative local mod evidence')
  const jobs = document.createElement('div')
  jobs.setAttribute('aria-label', 'Cinderbox read-only job statuses')
  panel.append(header, description, destinationTitle, rememberLabel, destinationInfo,
    evidenceLabel, evidencePrivacy,
    code, pair, refresh, revoke, status, authority, jobs,
    handoffTitle, handoffInfo, handoffList)
  main.append(panel)

  async function send(message) {
    pair.disabled = true
    refresh.disabled = true
    revoke.disabled = true
    try {
      return await browser.runtime.sendMessage(message)
    } catch (_) { return { state: 'offline', jobs: [] } }
    finally { pair.disabled = false; refresh.disabled = false; revoke.disabled = false }
  }
  let canHandoff = false
  browser.storage.local.get('cbnx05c_page_badges').then(data => {
    evidenceOptIn.checked = data?.cbnx05c_page_badges === true
  }).catch(() => { evidenceOptIn.checked = false })
  evidenceOptIn.addEventListener('change', async () => {
    const wanted = evidenceOptIn.checked
    evidenceOptIn.disabled = true
    try {
      await browser.storage.local.set({ cbnx05c_page_badges: wanted })
      status.textContent = wanted
        ? 'Companion badges enabled. Local status may appear on Nexus pages.'
        : 'Companion page badges disabled.'
    } catch (_) {
      evidenceOptIn.checked = !wanted // Never pretend an opt-out was stored.
      status.textContent = 'Could not save badge preference. Check privacy settings.'
    } finally { evidenceOptIn.disabled = false }
  })
  const validDestinations = new Set(['browser', 'cinderbox', 'manager'])
  async function saveDestination() {
    if (!remember.checked) {
      await browser.storage.local.remove(['cbnx05b_destination', 'cbnx05b_remember'])
    } else if (validDestinations.has(destination.value)) {
      await browser.storage.local.set({ cbnx05b_destination: destination.value,
        cbnx05b_remember: true })
    }
  }
  destination.addEventListener('change', () => {
    saveDestination().catch(() => { status.textContent = 'Destination preference could not be saved.' })
    renderHandoffChoices().catch(() => { handoffList.textContent = 'Browser queue unavailable' })
  })
  remember.addEventListener('change', () => {
    saveDestination().catch(() => { status.textContent = 'Destination preference could not be saved.' })
  })
  // Local opt-in only. Never persist bearer tokens, selected NXM links, or file IDs.
  browser.storage.local.get(['cbnx05b_destination', 'cbnx05b_remember']).then(saved => {
    if (saved?.cbnx05b_remember === true && validDestinations.has(saved.cbnx05b_destination)) {
      destination.value = saved.cbnx05b_destination
      remember.checked = true
    }
    return renderHandoffChoices()
  }).catch(() => { destination.value = 'browser' })
  async function renderHandoffChoices() {
    handoffList.replaceChildren()
    if (destination.value === 'cinderbox' && !canHandoff) {
      handoffList.textContent = 'Pair and enable exact-file requests in Cinderbox Settings first.'
      return
    }
    // GET_STATE is the existing standalone browser queue; do not change its ownership.
    const state = await browser.runtime.sendMessage({ type: 'GET_STATE' }).catch(() => null)
    const items = Array.isArray(state?.queue) ? state.queue : []
    const seen = new Set()
    for (const item of items) {
      const modId = String(item.modId || '')
      const fileId = String(item.fileId || '')
      if (!/^[1-9][0-9]{0,11}$/.test(modId) || !/^[1-9][0-9]{0,11}$/.test(fileId)) continue
      const key = modId + '/' + fileId
      if (seen.has(key)) continue
      seen.add(key)
      const button = document.createElement('button')
      button.type = 'button'
      button.textContent = destination.value === 'cinderbox'
        ? `Request mod ${modId} · file ${fileId} in Cinderbox`
        : `Open mod ${modId} · file ${fileId} on Nexus`
      button.addEventListener('click', async () => {
        button.disabled = true
        try {
          if (destination.value !== 'cinderbox') {
            // An exact-file PAGE is not a completed Nexus download. Keep official
            // authorization/manual and supported manager choices in the browser.
            const url = new URL(`https://www.nexusmods.com/stardewvalley/mods/${modId}`)
            url.searchParams.set('tab', 'files')
            url.searchParams.set('file_id', fileId)
            await browser.tabs.create({ url: url.toString() })
            status.textContent = destination.value === 'manager'
              ? 'Opened the selected file on Nexus. Choose a supported manager there.'
              : 'Opened the selected file on Nexus. Finish the browser download there.'
            return
          }
          const ack = await send({ type: 'CBNX03_HANDOFF', modId, fileId })
          status.textContent = ack?.state === 'handoff_pending'
            ? ack.status === 'already_seen'
              ? 'This request was already handled in Cinderbox. No new download was started.'
              : ack.status === 'already_pending'
                ? 'That exact file is already waiting in Cinderbox Settings.'
                : 'Cinderbox recorded the exact-file request. Open Settings to review it.'
            : 'Request unavailable. Use the regular Nexus/NXM download flow.'
        } catch (_) {
          status.textContent = 'Selected-file action unavailable. Use the normal Nexus queue.'
        } finally { button.disabled = false }
      })
      handoffList.append(button)
    }
    if (!seen.size) handoffList.textContent = 'No exact mod/file IDs in the browser queue.'
    if (destination.value !== 'cinderbox') {
      handoffInfo.textContent = 'Open the exact selected file on Nexus. No download or manager handoff is claimed.'
    } else {
      handoffInfo.textContent = 'Cinderbox must approve requests locally; no download starts here.'
    }
  }
  function render(result) {
    status.textContent = ({ paired: 'Paired (status only)', connected: 'Connected (journal status)',
      offline: 'Cinderbox unavailable. Use regular NXM handoff.',
      unpaired: 'Not paired', invalid_code: 'Enter the nine-digit code from Cinderbox.',
      incompatible: 'Bridge protocol not supported.', busy: 'Try again shortly.',
      refused: 'Pairing refused.' })[result?.state] || 'Pairing unavailable'
    canHandoff = result?.state === 'connected' && result.handoffEnabled === true
    renderHandoffChoices().catch(() => { handoffList.textContent = 'Browser queue unavailable' })
    authority.replaceChildren()
    if (result?.state === 'connected') {
      const evidence = result.authority
      const summary = document.createElement('p')
      summary.textContent = evidence?.inventoryState === 'QUALIFIED'
        ? 'SMAPI manifests scanned. Exact installed files are unverified; updates reflect a cached SMAPI observation only.'
        : 'Installed-mod inventory unavailable. No installation or update claims can be made.'
      authority.append(summary)
      for (const item of evidence?.items || []) {
        const row = document.createElement('p')
        const mod = 'Mod ' + item.modId
        const file = item.fileId ? ' · file ' + item.fileId : ''
        const installed = item.installedModState === 'PRESENT'
          ? 'SMAPI mod present (exact file unverified)'
          : item.installedModState === 'DISABLED_PRESENT'
            ? 'Disabled SMAPI mod present (exact file unverified)'
            : item.installedModState === 'AMBIGUOUS'
              ? 'Conflicting SMAPI manifest links'
              : 'Installation unverified'
        const archiveProof = item.archiveProofState === 'VERIFIED_AT_SCAN'
          ? ' · private archive SHA-256 matched its app receipt at scan time (not provider-verified)'
          : item.archiveProofState === 'NO_RETAINED_ARCHIVE'
            ? ' · no retained archive available for checksum proof'
            : ' · private archive evidence unavailable'
        const transfer = item.journalTransferReported
          ? ' · transfer completion reported by journal'
          : ''
        const update = item.updateState === 'NEWER'
          ? ' · newer SMAPI mod version ' + item.candidateVersion + ' (cached observation; exact Nexus file update unverified)'
          : item.updateState === 'CURRENT'
            ? ' · current compared with cached SMAPI mod version (not an exact file claim)'
            : item.updateState === 'INSTALLED_AHEAD'
              ? ' · installed mod version ahead of cached SMAPI version'
              : item.updateState === 'UNCOMPARABLE'
                ? ' · cached SMAPI mod versions are not comparable'
                : ' · update status unknown or cached observation expired'
        row.textContent = mod + file + ': ' + installed + transfer + archiveProof + update
        authority.append(row)
      }
    }
    jobs.replaceChildren()
    if (result?.state === 'connected') {
      for (const handoff of result.handoffs || []) {
        if (handoff.status !== 'PENDING') continue
        const row = document.createElement('p')
        row.textContent = `Request ${handoff.modId}/${handoff.fileId}: waiting for local Cinderbox action`
        jobs.append(row)
      }
      for (const job of result.jobs || []) {
        const row = document.createElement('p')
        row.textContent = `Mod ${job.modId} · file ${job.fileId}: ${job.status}`
        jobs.append(row)
      }
      if (!result.jobs?.length) jobs.textContent = 'No journal entries'
    }
  }
  pair.addEventListener('click', async () => {
    const value = code.value.trim()
    code.value = '' // Keep the manually entered code out of page history and DOM.
    render(await send({ type: 'CBNX03_PAIR', code: value }))
  })
  refresh.addEventListener('click', async () => render(await send({ type: 'CBNX03_STATUS' })))
  revoke.addEventListener('click', async () => render(await send({ type: 'CBNX03_REVOKE' })))
  send({ type: 'CBNX03_STATUS' }).then(render)
})()
