#!/usr/bin/env python3
"""NX04A: strict source provenance, legacy Vortex parity, and no claimed update proof."""
from pathlib import Path
p = Path(__file__).resolve().parents[2]/'extensions/stardew-nexus-download-queue/src'
bg=(p/'cbnx03-background.js').read_text(encoding='utf8')
popup=(p/'cbnx03-popup.js').read_text(encoding='utf8')
legacy=(p/'background.js').read_text(encoding='utf8')
for key in ('function normalizeAuthority(value)', "scope !== 'LOCAL_SMAPI_AND_JOURNAL'",
            "value.remote_update_check !== 'NOT_PERFORMED'", "item.exact_file_installed !== 'UNKNOWN'",
            "item.update_state !== 'UNKNOWN'", 'item.archive_checksum_qualified !== false',
            "value.inventory_state === 'QUALIFIED'", "installedState = value.inventory_state === 'QUALIFIED'",
            'authority: normalizeAuthority(state.authority)', 'credentials: \'omit\'',
            "if (sender?.url !== POPUP || sender?.tab)"):
    assert key in bg, 'CBNX04_FIREFOX_AUTHORITY_MISSING:'+key
for forbidden in ('browser.storage', 'localStorage', 'downloads.download(', 'startDownload(', 'installFromZip('):
    assert forbidden not in bg, 'CBNX04_BROWSER_PRIVILEGE_REGRESSION:'+forbidden
for key in ('Refresh local evidence', "installedModState === 'PRESENT'",
            'exact file unverified', 'update status unknown', 'No installation or update claims'):
    assert key in popup, 'CBNX04_POPUP_PROOF_MISSING:'+key
for key in ('ENQUEUE_DOWNLOAD','RETRY_QUEUE_ITEM','REMOVE_QUEUE_ITEM','MOVE_QUEUE_ITEM'):
    assert key in legacy, 'CBNX04_STANDALONE_BEHAVIOR_LOST:'+key
assert (p/'manifest.json').is_file()
print('CBNX04_FIREFOX_AUTHORITY_SOURCE_PASS_NO_FALSE_INSTALL_UPDATE_BADGES')
