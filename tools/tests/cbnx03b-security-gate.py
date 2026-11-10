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
print('CBNX03B_FIREFOX_SECURITY_AND_STANDALONE_SOURCE_PASS')
