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
for forbidden in ('browser.storage', 'localStorage', 'sessionStorage', 'cookies.get',
                  'getDownloadUrl(', 'downloads.download(', 'installFromZip', 'startDownload('):
    assert forbidden not in background, 'CBNX03B_EXTENSION_PRIVILEGED:' + forbidden
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
assert popup.index("if (!remember.checked)") < popup.index("browser.storage.local.set(")
print('CBNX03B_FIREFOX_SECURITY_AND_STANDALONE_SOURCE_PASS')
print('CBNX05B_FIREFOX_EXPLICIT_DESTINATION_PRIVACY_PASS')
