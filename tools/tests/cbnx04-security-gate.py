#!/usr/bin/env python3
"""NX04A: strict source provenance, legacy Vortex parity, and no claimed update proof."""
from pathlib import Path
p = Path(__file__).resolve().parents[2]/'extensions/stardew-nexus-download-queue/src'
bg=(p/'cbnx03-background.js').read_text(encoding='utf8')
popup=(p/'cbnx03-popup.js').read_text(encoding='utf8')
legacy=(p/'background.js').read_text(encoding='utf8')
for key in ('function normalizeAuthority(value)', "scope !== 'LOCAL_SMAPI_AND_JOURNAL'",
            "SMAPI_CACHE_FRESH", "item.exact_file_installed !== 'UNKNOWN'",
            "!updateStates.has(item.update_state)", "typeof item.archive_checksum_qualified !== 'boolean'",
            "value.inventory_state === 'QUALIFIED'", "installedState = value.inventory_state === 'QUALIFIED'",
            'authority: normalizeAuthority(state.authority)', 'credentials: \'omit\'',
            "if (sender?.url !== POPUP || sender?.tab)"):
    assert key in bg, 'CBNX04_FIREFOX_AUTHORITY_MISSING:'+key
for forbidden in ('browser.storage', 'localStorage', 'downloads.download(', 'startDownload(', 'installFromZip('):
    assert forbidden not in bg, 'CBNX04_BROWSER_PRIVILEGE_REGRESSION:'+forbidden
for key in ('Refresh local evidence', "installedModState === 'PRESENT'",
            'exact file unverified', 'cached observation expired', 'No installation or update claims'):
    assert key in popup, 'CBNX04_POPUP_PROOF_MISSING:'+key
for key in ('ENQUEUE_DOWNLOAD','RETRY_QUEUE_ITEM','REMOVE_QUEUE_ITEM','MOVE_QUEUE_ITEM'):
    assert key in legacy, 'CBNX04_STANDALONE_BEHAVIOR_LOST:'+key
assert (p/'manifest.json').is_file()
print('CBNX04_FIREFOX_AUTHORITY_SOURCE_PASS_NO_FALSE_INSTALL_UPDATE_BADGES')

# CB-NX04B canonical migration: checksum evidence MUST stay local-app scoped,
# and legacy blanket rejection of true is no longer an acceptable contract.
assert 'item.archive_checksum_qualified !== false' not in bg
for phrase in ("proofStates = new Set(['VERIFIED_AT_SCAN'", "LOCAL_ZIP_VS_APP_RECEIPT",
               "item.archive_checksum_qualified !== (item.archive_proof_state === 'VERIFIED_AT_SCAN')",
               "fileId === '' || !possibleRetained.has(item.journal_state)",
               'archiveProofState: item.archive_proof_state',
               "exactFileInstalled: 'UNKNOWN', updateState: item.update_state"):
    assert phrase in bg, 'CBNX04B_FIREFOX_PROVENANCE_CONTRACT_MISSING:'+phrase
assert 'archiveProofState' in popup and 'not provider-verified' in popup
print('CBNX04B_FIREFOX_CANONICAL_SOURCE_CONTRACT_PASS')

# CB-NX04C canonical cache contract (old blanket UPDATE_UNKNOWN no longer valid).
assert "          item.update_state !== 'UNKNOWN' ||" not in bg
assert "value.remote_update_check !== 'NOT_PERFORMED'" not in bg
for marker in ('SMAPI_CACHE_FRESH', "item.update_proof_scope !== updateScope",
               'candidateVersion: newer ? candidate : null', "exactFileInstalled: 'UNKNOWN'",
               "!newer && candidate !== undefined"):
    assert marker in bg, 'CBNX04C_SMAPI_CACHE_POLICY_MISSING:'+marker
assert 'cached SMAPI mod version' in popup and 'exact Nexus file update unverified' in popup
print('CBNX04C_FIREFOX_SMAPI_UPDATE_SOURCE_AND_STALE_CONTRACT_PASS')
