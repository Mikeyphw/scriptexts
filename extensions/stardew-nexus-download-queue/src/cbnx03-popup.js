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
  refresh.textContent = 'Refresh status'
  const revoke = document.createElement('button')
  revoke.type = 'button'
  revoke.textContent = 'Disconnect'
  const status = document.createElement('div')
  status.setAttribute('role', 'status')
  status.textContent = 'Not paired'
  const jobs = document.createElement('div')
  jobs.setAttribute('aria-label', 'Cinderbox read-only job statuses')
  panel.append(header, description, code, pair, refresh, revoke, status, jobs)
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
  function render(result) {
    status.textContent = ({ paired: 'Paired (status only)', connected: 'Connected (journal status)',
      offline: 'Cinderbox unavailable. Use regular NXM handoff.',
      unpaired: 'Not paired', invalid_code: 'Enter the nine-digit code from Cinderbox.',
      incompatible: 'Bridge protocol not supported.', busy: 'Try again shortly.',
      refused: 'Pairing refused.' })[result?.state] || 'Pairing unavailable'
    jobs.replaceChildren()
    if (result?.state === 'connected') {
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
