#!/usr/bin/env python3
"""CB-NX03B Firefox source/privacy gate. Includes a bounded mutation smoke test."""
from pathlib import Path
ROOT = Path(__file__).resolve().parents[2]
EXT = ROOT / 'extensions/stardew-nexus-download-queue/src'
background = (EXT / 'cbnx03-background.js').read_text(encoding='utf8')
popup = (EXT / 'cbnx03-popup.js').read_text(encoding='utf8')
old = (EXT / 'background.js').read_text(encoding='utf8')
for required in (
    "const BASE = 'http://127.0.0.1:38471'", "credentials: 'omit'", "redirect: 'error'",
    "['CBNX03_PAIR', 'CBNX03_STATUS', 'CBNX03_REVOKE', 'CBNX03_HANDOFF']",
    "if (sender?.url !== POPUP || sender?.tab)",
    "'CBNX03_HANDOFF' ? handoff(message.modId, message.fileId)",
    "!token) return { state: 'unpaired' }", "/^[1-9][0-9]{0,11}$/",
    "body: { mod_id: modId, file_id: fileId, request_id: requestId }",
    "ack.download_started !== false", "ack.archive_staged !== false",
    "ack.installed !== false", "readOnly: true", "inboxAvailable:",
    "let token = null", "token = null", "'unpaired'"
):
    assert required in background, 'CBNX03B_EXTENSION_CONTRACT_MISSING:' + required
for forbidden in ('localStorage', 'sessionStorage', 'cookies.get',
                  'getDownloadUrl(', 'downloads.download(', 'installFromZip', 'startDownload('):
    assert forbidden not in background, 'CBNX03B_EXTENSION_PRIVILEGED:' + forbidden
assert background.count("browser.storage.local.get('cbnx05c_page_badges')") == 2
for persistence in ('browser.storage.local.set(', 'browser.storage.local.remove(',
                    'browser.storage.sync', 'browser.storage.local.clear('):
    assert persistence not in background, 'CBNX05C_PAIRING_BACKGROUND_PERSISTENCE:' + persistence
for required in ("type: 'GET_STATE'", "type: 'CBNX03_HANDOFF'", 'const seen = new Set()',
                 'button.addEventListener(\'click\'', 'Cinderbox must approve requests locally'):
    assert required in popup, 'CBNX03B_POPUP_CONTRACT:' + required
for feature in ('ENQUEUE_DOWNLOAD', 'RETRY_QUEUE_ITEM', 'REMOVE_QUEUE_ITEM', 'MOVE_QUEUE_ITEM'):
    assert feature in old, 'CBNX03B_STANDALONE_PARITY_LOST:' + feature
assert (EXT / 'manifest.json').is_file(), 'CBNX03B_MANIFEST_MISSING'
# CB-NX05B canonical migration: explicit destination per click and opt-in local
# persistence. This is not browser-wide interception or a new background privilege.
for required in ("destination.value = 'browser'", "['browser', 'cinderbox', 'manager']",
                 "cbnx05b_remember: true", "if (!remember.checked)",
                 "browser.storage.local.remove", "destination.value !== 'cinderbox'",
                 "url.searchParams.set('file_id', fileId)",
                 "await browser.tabs.create({ url: url.toString() })",
                 "type: 'CBNX03_HANDOFF'", "No download or manager handoff is claimed.",
                 "Selected-file action unavailable. Use the normal Nexus queue."):
    assert required in popup, 'CBNX05B_DESTINATION_CONTRACT_STALE:' + required
for forbidden in ('downloads.download(', 'cookies.get(', "credentials: 'include'",
                  'localStorage.setItem(', 'interceptPageDownloads = true'):
    assert forbidden not in popup, 'CBNX05B_POPUP_PRIVACY_REGRESSION:' + forbidden
assert popup.index("if (destination.value !== 'cinderbox')") < popup.index("const ack = await send({ type: 'CBNX03_HANDOFF'")
# CB-NX05C HF01: the badge-consent write precedes destination settings in
# source order; test the DESTINATION function itself, not the first write in
# the entire popup. A global index comparison produces a false failure.
start = '  async function saveDestination() {'
end = "\n  destination.addEventListener('change',"
assert popup.count(start) == 1 and popup.count(end) == 1, 'CBNX05C_DESTINATION_FUNCTION_DRIFT'
scope = popup[popup.index(start) + len(start):popup.index(end, popup.index(start))]
assert scope.count('browser.storage.local.set(') == 1, 'CBNX05C_DESTINATION_WRITE_COUNT_DRIFT'
assert scope.count('browser.storage.local.remove(') == 1, 'CBNX05C_DESTINATION_ERASE_COUNT_DRIFT'
assert scope.index('if (!remember.checked)') < scope.index('browser.storage.local.set('), \
    'CBNX05C_DESTINATION_CONSENT_ORDER_DRIFT'
assert "browser.storage.local.remove(['cbnx05b_destination', 'cbnx05b_remember'])" in scope, \
    'CBNX05C_DESTINATION_ERASE_REQUIRED'
assert 'browser.storage.local.set({ cbnx05b_destination: destination.value,' in scope, \
    'CBNX05C_DESTINATION_ONLY_EXPLICIT_CHOICE'
assert 'cbnx05b_remember: true' in scope, 'CBNX05C_DESTINATION_REMEMBER_OPT_IN_DRIFT'
print('CBNX03B_FIREFOX_SECURITY_AND_STANDALONE_SOURCE_PASS')
# CB-NX05C migrates the canonical page-message boundary in place. The popup
# alone must never be enough to authorize page status or disclose a bearer.
manifest = (EXT / 'manifest.json').read_text(encoding='utf8')
legacy_bg = (EXT / 'background.js').read_text(encoding='utf8')
content = (EXT / 'content.js').read_text(encoding='utf8')
policy = (EXT / 'cbnx05c-evidence-policy.js').read_text(encoding='utf8')
page = (EXT / 'cbnx05c-content.js').read_text(encoding='utf8')
for marker in ('cbnx05c-evidence-policy.js', 'cbnx05c-content.js'):
    assert marker in manifest, 'CBNX05C_MISSING_CONTENT_SCRIPT:' + marker
for marker in ("message?.type === 'CBNX05C_PAGE_STATUS'", 'allowedPageSender(sender, ids)',
               'CBNX05CPolicy.normalizeIds(message?.modIds)',
               "pref?.cbnx05c_page_badges !== true", "if (!token) { pageCache = null",
               'const rows = CBNX05CPolicy.summarize(pageCache, ids)',
               'if (token !== issuedToken)', 'const issuedToken = token',
               'currentConsent?.cbnx05c_page_badges !== true',
               "url.protocol !== 'https:'", 'sender.frameId !== 0',
               "['www.nexusmods.com', 'next.nexusmods.com']",
               "sender?.tab", 'PAGE_TTL_MS = 60_000',
               "return { state: 'connected', checkedAtMs: pageCheckedAt, rows }"):
    assert marker in background, 'CBNX05C_PAGE_AUTH_BOUNDARY_MISSING:' + marker
# Only a captured token from inside pageStatus may guard against in-flight revoke.
page_scope = background[background.index('  async function pageStatus('):
    background.index('  browser.runtime.onMessage.addListener(')]
assert page_scope.count('const issuedToken = token') == 1, 'CBNX05C_MISSING_SESSION_CAPTURE'
assert page_scope.index('if (!token) { pageCache = null') < page_scope.index('const issuedToken = token') < page_scope.index('if (!pageCache'), 'CBNX05C_SESSION_CAPTURE_ORDER'
assert page_scope.index('const issuedToken = token') < page_scope.index('await pageFetch') < page_scope.index('if (token !== issuedToken)'), 'CBNX05C_REVOKE_RACE_GUARD_ORDER'
assert background.index("message?.type === 'CBNX05C_PAGE_STATUS'") < background.index(
    "if (sender?.url !== POPUP || sender?.tab)"), 'CBNX05C_POPUP_GUARD_DRIFT'
for marker in ('cbnx05c_page_badges', 'evidenceOptIn.addEventListener',
               'Off by default.', 'Nexus page scripts', 'cbnx05c_page_badges: wanted'):
    assert marker in popup, 'CBNX05C_DISCLOSURE_CONSENT_DRIFT:' + marker
for marker in ('MAX_AGE_MS = 90_000', 'CBNX05C_PAGE_STATUS',
               "enabled = pref?.cbnx05c_page_badges === true", 'browser.storage.onChanged',
               "const fresh = age <= MAX_AGE_MS && lastResult === 'connected'", 'location.href !== lastPage'):
    assert marker in page, 'CBNX05C_PAGE_STALE_GUARD:' + marker
for forbidden in ('Authorization', 'Bearer ', 'getDownloadUrl(', 'downloads.download(',
                  'nxm://', 'browser.cookies', 'window.postMessage('):
    assert forbidden not in page + policy, 'CBNX05C_PAGE_SECRET_OR_ACTION_LEAK:' + forbidden
assert '  interceptPageDownloads: false,' in legacy_bg
assert 'cbnx05c_interception_migrated' in legacy_bg
assert 'state.settings.interceptPageDownloads = false' in legacy_bg
assert '  await persist()\n  if (needsInterceptionReset) await browser.storage.local.set(' in legacy_bg
assert 'Nexus page/file changed · review' in content
assert 'Browser file downloaded' in content
assert 'applyUpdateGlow(tile, status === "update_available" && shouldGlowUpdateCard())' in content
assert 'Highlight changed Nexus pages (unverified; not installed-mod updates)' in (EXT/'popup.html').read_text(encoding='utf8')
for bad in ('return "Update available"', 'return "Downloaded"',
            'return "nxq-chip--update"'):
    assert bad not in content, 'CBNX05C_LEGACY_FALSE_EVIDENCE:' + bad
for label in ('Cached SMAPI version may be newer',
              'Matched installed mod identity. Exact Nexus file and variant are unverified.',
              'Not an exact Nexus file update claim.', 'Requested only;'):
    assert label in policy, 'CBNX05C_PROOF_SCOPE_DRIFT:' + label
print('CBNX05B_FIREFOX_EXPLICIT_DESTINATION_PRIVACY_PASS')
print('CBNX05C_PAGE_STATUS_CONSENT_AND_LEGACY_MIGRATION_SOURCE_PASS')
