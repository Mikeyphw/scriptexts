/* Cinderbox file handoff UX. Runs only when Cinderbox query parameters are valid. */
async function startCinderboxBrowserBridge() {
  const request = CBNX01.parseRequest(location.href)
  if (!request || !isModPage()) return

  const notice = document.createElement('aside')
  notice.id = 'cbnx01-download-handoff'
  notice.setAttribute('role', 'status')
  notice.style.cssText = 'position:relative;z-index:10000;margin:14px;padding:14px;border-radius:12px;border:1px solid #7fb495;background:#173326;color:#f3f8f4;font:14px/1.5 sans-serif'
  const title = document.createElement('strong')
  title.textContent = `Cinderbox download · mod ${request.modId} · file ${request.fileId}`
  const message = document.createElement('div')
  message.textContent = 'Finding the exact Nexus Mod Manager download for the selected file…'
  const button = document.createElement('button')
  button.type = 'button'
  button.textContent = 'Retry selected file'
  button.style.cssText = 'margin-top:10px;padding:8px 12px;background:#407c5a;color:white;border:0;border-radius:8px;cursor:pointer'
  button.hidden = true
  const openLink = document.createElement('a')
  openLink.textContent = 'Open in Cinderbox'
  openLink.style.cssText = 'display:inline-block;margin:10px;color:#b9f6cf;text-decoration:underline'
  openLink.hidden = true
  // The fallback is an exact Nexus HTTPS manager-action URL, not a guessed NXM URI.
  // A fresh user gesture is needed. Nexus retains control of auth, requirements,
  // file availability and confirmation, and Android retains its external-app prompt.
  const nexusFallback = document.createElement('a')
  nexusFallback.textContent = 'Continue exact file on Nexus'
  nexusFallback.href = CBNX01.exactNexusFileActionUrl(request.modId, request.fileId)
  nexusFallback.style.cssText = 'display:inline-block;margin:10px;color:#b9f6cf;text-decoration:underline'
  notice.append(title, message, button, openLink, nexusFallback)
  ;(document.querySelector('main') || document.body).prepend(notice)

  let resolving = false
  let attempts = 0
  let finished = false
  const sessionKey = `cbnx01:${request.requestId}`

  async function resolveExactFile() {
    if (resolving || finished) return
    const anchor = CBNX01.selectExactManagerAnchor(document.querySelectorAll('a[href]'), request.fileId, location.href)
    if (!anchor) {
      message.textContent = 'Waiting for this exact file and its Mod Manager action. If needed, sign in and open Files.'
      if (attempts >= 15) {
        button.hidden = false
        message.textContent = 'Exact manager link not exposed by this page. Continue the exact file on Nexus using the link below, complete the normal Nexus prompts, or retry. No other file is selected.'
      }
      return
    }
    // A requirements/terms popup must be completed through Nexus UI, not crawled automatically.
    if (/ModRequirementsPopUp/i.test(anchor.href || '')) {
      openLink.href = anchor.href
      openLink.textContent = 'Continue on Nexus'
      openLink.hidden = false
      button.hidden = false
      message.textContent = 'Nexus requires a confirmation step. Complete it on Nexus before retrying the exact file.'
      return
    }
    resolving = true
    button.disabled = true
    message.textContent = 'Resolving selected file through the normal Nexus download flow…'
    try {
      const result = await resolveFromClickedAnchor(anchor)
      if (!CBNX01.matchesNxmUrl(result?.downloadUrl, request.modId, request.fileId)) {
        throw new Error('Resolved link does not match the selected mod and file')
      }
      openLink.href = result.downloadUrl
      openLink.hidden = false
      // This real anchor remains available for Android browsers requiring a fresh gesture.
      if (sessionStorage.getItem(sessionKey) === 'queued') {
        finished = true
        message.textContent = 'Handoff was already attempted. Check Cinderbox or use the link below.'
        return
      }
      await queuePayload({
        ...result, modId: request.modId, fileId: request.fileId,
        kind: 'manager', metadata: { cinderboxRequest: request.requestId }
      }, location.href)
      sessionStorage.setItem(sessionKey, 'queued')
      finished = true
      message.textContent = 'NXM launch attempted. Confirm the browser prompt and check Cinderbox; a download is not yet confirmed.'
    } catch (error) {
      message.textContent = 'The exact Nexus file could not be handed off. Complete any required Nexus confirmation, then retry.'
      button.hidden = false
      // Never display the exception: provider errors can contain sensitive URLs.
    } finally {
      resolving = false
      button.disabled = false
    }
  }

  // Retrying re-arms the complete 15-check window, not just one probe.
  // No site login, wait screen or confirmation is bypassed.
  const probe = async () => {
    if (finished) return
    if (resolving) {
      setTimeout(probe, 900)
      return
    }
    attempts++
    try {
      await resolveExactFile()
    } catch (_) {
      button.hidden = false
      // Never reveal provider exceptions: they may contain private URLs.
    }
    if (!finished && attempts < 15) setTimeout(probe, 900)
  }
  button.addEventListener('click', () => {
    if (finished) return
    attempts = 0
    button.hidden = true
    setTimeout(probe, 100)
  })
  setTimeout(probe, 600)
}
