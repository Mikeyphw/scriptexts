#!/usr/bin/env python3
"""CB-NX05C canonical security mutants: no stale permissive page status or labels.

Runs against the patched repository in GitHub Actions, with no Nexus credentials.
"""
from pathlib import Path
from tempfile import TemporaryDirectory
import shutil
import subprocess
import sys

ROOT = Path(__file__).resolve().parents[2]
PREFIX = 'extensions/stardew-nexus-download-queue/src/'
BG = PREFIX + 'cbnx03-background.js'
POPUP = PREFIX + 'cbnx03-popup.js'
PAGE = PREFIX + 'cbnx05c-content.js'
POLICY = PREFIX + 'cbnx05c-evidence-policy.js'
LEGACY = PREFIX + 'background.js'
CONTENT = PREFIX + 'content.js'
MANIFEST = PREFIX + 'manifest.json'
POPUP_HTML = PREFIX + 'popup.html'
GATE = 'tools/tests/cbnx03b-security-gate.py'
OTHER = 'tools/tests/cbnx04-security-gate.py'
PATHS = (BG, POPUP, PAGE, POLICY, LEGACY, CONTENT, MANIFEST, POPUP_HTML, GATE, OTHER)

MUTANTS = (
    (BG, "pref?.cbnx05c_page_badges !== true", "false"),
    (BG, "if (!token) { pageCache = null", "if (false) { pageCache = null"),
    (BG, "if (token !== issuedToken)", "if (false)"),
    (BG, "currentConsent?.cbnx05c_page_badges !== true", "false"),
    (BG, "sender.frameId !== 0", "false"),
    (BG, "url.protocol !== 'https:'", "false"),
    (BG, "['www.nexusmods.com', 'next.nexusmods.com']", "['www.nexusmods.com', 'next.nexusmods.com', 'evil.example']"),
    (BG, "CBNX05CPolicy.normalizeIds(message?.modIds)", "message.modIds"),
    (BG, "CBNX05CPolicy.summarize(pageCache, ids)", "pageCache.authority.items"),
    (BG, 'PAGE_TTL_MS = 60_000', 'PAGE_TTL_MS = 999_999_999'),
    (POPUP, 'Off by default.', 'On by default.'),
    (POPUP, 'cbnx05c_page_badges: wanted', 'cbnx05c_page_badges: true'),
    # HF01: keep destination-consent contracts independent of page-badge consent.
    (POPUP, 'if (!remember.checked)', 'if (false)'),
    (POPUP, 'cbnx05b_destination: destination.value', "cbnx05b_destination: 'cinderbox'"),
    (POPUP, "browser.storage.local.remove(['cbnx05b_destination', 'cbnx05b_remember'])", 'await Promise.resolve()'),
    (PAGE, 'MAX_AGE_MS = 90_000', 'MAX_AGE_MS = 999_999_999'),
    (PAGE, "enabled = pref?.cbnx05c_page_badges === true", "enabled = true"),
    (PAGE, "const fresh = age <= MAX_AGE_MS && lastResult === 'connected'", "const fresh = age <= MAX_AGE_MS && true"),
    (PAGE, 'browser.storage.onChanged', 'window.onmessage'),
    (POLICY, 'Matched installed mod identity. Exact Nexus file and variant are unverified.',
     'Matched installed mod identity. Verified Nexus file and variant are unverified.'),
    (POLICY, 'Not an exact Nexus file update claim.', 'Confirmed provider update.'),
    (LEGACY, '  interceptPageDownloads: false,', '  interceptPageDownloads: true,'),
    (LEGACY, 'state.settings.interceptPageDownloads = false', 'state.settings.interceptPageDownloads = true'),
    (LEGACY, 'if (needsInterceptionReset) await browser.storage.local.set(', 'if (false) await browser.storage.local.set('),
    (CONTENT, 'Nexus page/file changed · review', 'Update available'),
    (CONTENT, 'Browser file downloaded', 'Downloaded'),
    (CONTENT, 'applyUpdateGlow(tile, status === "update_available" && shouldGlowUpdateCard())', 'applyUpdateGlow(tile, true)'),
    (POPUP_HTML, 'Highlight changed Nexus pages (unverified; not installed-mod updates)', 'Highlight cards with updates'),
    (MANIFEST, '"cbnx05c-content.js"', '"content.js"'),
    (BG, 'const issuedToken = token', 'const issuedToken = null'),
)

with TemporaryDirectory(prefix='cbnx05c-neg-') as temporary:
    fake = Path(temporary)
    for name in PATHS:
        target = fake / name
        target.parent.mkdir(parents=True, exist_ok=True)
        shutil.copyfile(ROOT/name, target)

    def gate():
        for name in (GATE, OTHER):
            result = subprocess.run((sys.executable, '-B', str(fake/name)),
                                    capture_output=True, text=True, timeout=15)
            if result.returncode:
                return result
        return result

    # HF02: inventory ALL mutation anchors before any gate/test execution.
    # Duplicate occurrences are just as unsafe as missing anchors, because a
    # count-based gate may continue to pass after one occurrence is changed.
    anchor_problems = []
    for idx, (name, before, after) in enumerate(MUTANTS):
        count = (fake/name).read_text(encoding='utf8').count(before)
        if count != 1:
            anchor_problems.append(f'{idx}:{name}:count={count}')
    assert not anchor_problems, 'CBNX05C_MUTATION_ANCHOR_INVENTORY_STALE:' + ';'.join(anchor_problems)
    print(f'CBNX05C_MUTATION_ANCHOR_INVENTORY_PASS count={len(MUTANTS)}')
    baseline = gate()
    assert baseline.returncode == 0, 'CBNX05C_NEGATIVE_BASELINE_INVALID:' + baseline.stderr[-400:]
    for idx, (name, before, after) in enumerate(MUTANTS):
        target = fake/name
        original = target.read_text(encoding='utf8')
        target.write_text(original.replace(before, after, 1), encoding='utf8')
        mutated = gate()
        assert mutated.returncode != 0, 'CBNX05C_MUTATION_ESCAPED:' + str(idx)
        target.write_text(original, encoding='utf8')

print(f'CBNX05C_SECURITY_MUTATION_PASS mutations={len(MUTANTS)}')
