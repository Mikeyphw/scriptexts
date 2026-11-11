#!/usr/bin/env python3
"""Build a side-by-side, UNSIGNED Cinderbox LAB Firefox/Iceraven XPI.

Canonical production source tree is NEVER edited. The build is deterministic,
strictly bounded, refuses upstream contract drift, and cannot open an NXM link.
The independent Gecko ID partitions browser.storage.local from production.
"""
from __future__ import annotations

import argparse
import hashlib
import json
import os
from pathlib import Path
import re
import stat
import subprocess
import sys
import zipfile

ROOT = Path(__file__).resolve().parent
SRC = ROOT / 'src'
DIST = ROOT / 'dist-lab'
LAB_ID = 'stardew-nexus-download-queue-cbnx06lab@mikeyphw.scriptexts'
PROD_ID = 'stardew-nexus-download-queue@mikeyphw.scriptexts'
LAB_PORT = 38472
PROD_PORT = 38471
APK_ID = 'com.sdvsync.cbnx06lab'
ZIP_DATE = (1980, 1, 1, 0, 0, 0)
HEX40 = re.compile(r'[0-9a-f]{40}\Z')
XPI_NAME = 'stardew-nexus-queue-cbnx06lab-0.4.9-unsigned.xpi'
ANCHORS = (
    'manifest.json', 'cbnx03-background.js', 'cbnx03-popup.js',
    'background.js', 'cbnx01-browser-bridge.js', 'content.js', 'popup.html'
)

class Refused(Exception):
    pass


def require(ok: bool, reason: str) -> None:
    if not ok:
        raise Refused(reason)


def sha(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def replace_once(source: str, before: str, after: str, label: str) -> str:
    require(source.count(before) == 1 and before != after, 'ANCHOR_DRIFT:' + label)
    return source.replace(before, after, 1)


def safe_files(root: Path) -> dict[str, bytes]:
    require(root.is_dir() and not root.is_symlink(), 'SOURCE_DIRECTORY_UNSAFE')
    entries = {}
    for path in sorted(root.rglob('*')):
        require(not path.is_symlink(), 'SOURCE_SYMLINK:' + str(path.relative_to(root)))
        if path.is_dir():
            continue
        require(path.is_file() and stat.S_ISREG(path.stat(follow_symlinks=False).st_mode),
                'SOURCE_NOT_REGULAR')
        rel = path.relative_to(root)
        require(all(x not in ('.', '..', '') for x in rel.parts), 'SOURCE_TRAVERSAL')
        if rel.parts[0] == 'META-INF':
            raise Refused('SOURCE_META_INF_RESERVED')
        require(len(path.read_bytes()) <= 8_000_000, 'SOURCE_FILE_TOO_LARGE:' + rel.as_posix())
        entries[rel.as_posix()] = path.read_bytes()
    require(set(ANCHORS).issubset(entries), 'REQUIRED_SOURCE_MISSING')
    require(len(entries) < 150, 'SOURCE_FILE_COUNT_UNEXPECTED')
    return entries


def render_variant(files: dict[str, bytes]) -> dict[str, bytes]:
    require(set(ANCHORS).issubset(files), 'REQUIRED_SOURCE_MISSING')
    files = dict(files)
    for name in ANCHORS:
        require(name in files and isinstance(files[name], bytes), 'SOURCE_NOT_BYTES:' + name)
    try:
        manifest = json.loads(files['manifest.json'])
    except (UnicodeDecodeError, json.JSONDecodeError) as e:
        raise Refused('MANIFEST_INVALID') from e
    gecko = manifest.get('browser_specific_settings', {}).get('gecko', {})
    require(manifest.get('manifest_version') == 2 and manifest.get('version') == '0.4.9',
            'UPSTREAM_EXTENSION_VERSION_DRIFT')
    require(gecko.get('id') == PROD_ID, 'PRODUCTION_EXTENSION_ID_DRIFT')
    require(manifest['background'].get('persistent') is True, 'BACKGROUND_NOT_PERSISTENT')
    require('cbnx03-background.js' in manifest['background']['scripts'], 'BRIDGE_NOT_PACKAGED')
    require('cbnx01-browser-bridge.js' in manifest['content_scripts'][0]['js'],
            'EXACT_FILE_CONTENT_BRIDGE_NOT_PACKAGED')
    require('http://127.0.0.1/*' in manifest['permissions'], 'LOOPBACK_PERMISSION_MISSING')
    require('webRequest' not in manifest['permissions'] and 'nativeMessaging' not in manifest['permissions'],
            'UNEXPECTED_PRIVILEGED_EXTENSION_PERMISSION')
    manifest['name'] = 'Stardew Nexus Download Queue (Cinderbox LAB)'
    manifest['description'] = ('Cinderbox isolated Android lab pairing; independent browser queue and local storage. '
                                'No direct NXM manager launch.')
    manifest['browser_action']['default_title'] = 'Stardew Nexus Queue LAB'
    gecko['id'] = LAB_ID
    files['manifest.json'] = (json.dumps(manifest, sort_keys=True, indent=2, ensure_ascii=False) + '\n').encode()

    bg = files['cbnx03-background.js'].decode('utf-8')
    bg = replace_once(bg, "const BASE = 'http://127.0.0.1:38471'",
                      "const BASE = 'http://127.0.0.1:38472'", 'LAB_LOOPBACK_ENDPOINT')
    files['cbnx03-background.js'] = bg.encode()

    popup = files['cbnx03-popup.js'].decode('utf-8')
    popup = replace_once(popup, "header.textContent = 'Cinderbox companion'",
                         "header.textContent = 'Cinderbox LAB companion (38472)'", 'POPUP_COMPANION_IDENTITY')
    files['cbnx03-popup.js'] = popup.encode()

    html = files['popup.html'].decode('utf-8')
    html = replace_once(html, '<title>Stardew Nexus Queue</title>',
                        '<title>Stardew Nexus Queue LAB</title>', 'POPUP_TITLE')
    html = replace_once(html, '<h1>Stardew Nexus Queue</h1>',
                        '<h1>Stardew Nexus Queue LAB</h1>\n'
                        '        <p role="status" aria-live="polite">LAB extension — isolated local pairing on '
                        '127.0.0.1:38472. No direct NXM manager launches.</p>', 'POPUP_LAB_BANNER')
    # No UI affordance may advertise a manager launch that the LAB intentionally refuses.
    html = replace_once(html, '<option value="manager">Vortex only</option>',
                        '<option value="manager" disabled>Vortex launch disabled in LAB</option>',
                        'POPUP_MANAGER_DISABLED')
    html = replace_once(html, '<option value="both">Manual + Vortex</option>',
                        '<option value="both" disabled>Manual + Vortex disabled in LAB</option>',
                        'POPUP_MANAGER_COMBINED_DISABLED')
    files['popup.html'] = html.encode()

    background = files['background.js'].decode('utf-8')
    background = replace_once(background, 'listingButtonMode: "both",',
                              'listingButtonMode: "manual",', 'MANUAL_DEFAULT')
    background = replace_once(background, 'return `Stardew Valley/${mod}/${file}${ext}`',
                              'return `Cinderbox LAB/Stardew Valley/${mod}/${file}${ext}`',
                              'INDEPENDENT_DOWNLOAD_DIRECTORY')
    start = 'async function launchManagerUrl(item) {'
    stop = '\nasync function startBrowserDownload(item) {'
    require(background.count(start) == 1 and background.count(stop) == 1 and
            background.index(start) < background.index(stop), 'MANAGER_FUNCTION_DRIFT')
    original = background[background.index(start):background.index(stop)]
    require('browser.tabs.create' in original and 'nxm' in original.lower(),
            'MANAGER_LAUNCH_CONTRACT_DRIFT')
    disabled = '''async function launchManagerUrl(item) {
  // CB-NX06 LAB: never send an NXM URI to the installed production manager.
  updateItem(item.id, {
    status: "failed",
    progress: 0,
    message: "LAB blocked direct NXM launch. Use a browser manual download or LAB pairing."
  })
  await persist()
}
'''
    background = background.replace(original, disabled, 1)
    require('browser.tabs.create' not in background[background.index(start):background.index(stop)],
            'LAB_NXM_LAUNCH_NOT_REMOVED')
    files['background.js'] = background.encode()

    # The original direct browser bridge resolves NXM and exposes an external-app link.
    # LAB tests exact file handoff through the separately paired private inbox instead.
    browser_bridge = files['cbnx01-browser-bridge.js'].decode('utf-8')
    require(browser_bridge.startswith('/* Cinderbox file handoff UX.') and
            browser_bridge.count('async function startCinderboxBrowserBridge()') == 1 and
            'openLink.href = result.downloadUrl' in browser_bridge and
            'await queuePayload({' in browser_bridge, 'BROWSER_BRIDGE_SOURCE_DRIFT')
    files['cbnx01-browser-bridge.js'] = ('''/* CB-NX06 LAB: external NXM handoff is deliberately disabled.
 * Exact-file requests use the opt-in private inbox on 127.0.0.1:38472.
 * Keep the function used by content.js to avoid runtime errors.
 */
async function startCinderboxBrowserBridge() {
  return // Native NXM intents would resolve to production Cinderbox.
}
''').encode('utf-8')

    content = files['content.js'].decode('utf-8')
    content = replace_once(content, 'if (mode === "manager" || mode === "both") {',
                           'if (false /* CBNX06 LAB: do not show manager-launch shortcuts */) {',
                           'CONTENT_MANAGER_BUTTONS_DISABLED')
    files['content.js'] = content.encode()

    # No generated source/script can target the production bridge. Explicitly require
    # the one canonical LAB endpoint and deny any new localhost TCP authority.
    for name, data in files.items():
        if not name.endswith(('.js', '.html', '.json')):
            continue
        text = data.decode('utf-8')
        require('127.0.0.1:38471' not in text, 'PRODUCTION_PORT_LEAK:' + name)
        for match in re.findall(r'127\.0\.0\.1:([0-9]{2,5})', text):
            require(int(match) == LAB_PORT, 'NON_LAB_LOOPBACK_PORT:' + name)
    require(files['cbnx03-background.js'].count(b"const BASE = 'http://127.0.0.1:38472'") == 1,
            'LAB_ENDPOINT_NOT_UNIQUE')
    require(LAB_ID.encode() in files['manifest.json'] and PROD_ID.encode() not in files['manifest.json'],
            'LAB_EXTENSION_ID_NOT_ISOLATED')
    return files


def build(src: Path, dist: Path, browser_sha: str) -> tuple[Path, dict]:
    require(HEX40.fullmatch(browser_sha) is not None, 'SOURCE_SHA_INVALID')
    files = safe_files(src)
    source_hashes = {name: sha(data) for name, data in sorted(files.items())}
    rendered = render_variant(files)
    require(not dist.is_symlink(), 'OUTPUT_IS_SYMLINK')
    dist.mkdir(parents=True, exist_ok=True)
    out = dist / XPI_NAME
    require(not out.exists() and not out.is_symlink(), 'OUTPUT_ALREADY_EXISTS')
    with zipfile.ZipFile(out, 'w', compression=zipfile.ZIP_DEFLATED, compresslevel=9) as z:
        for name, data in sorted(rendered.items()):
            info = zipfile.ZipInfo(name, ZIP_DATE)
            info.create_system = 3
            info.external_attr = 0o100644 << 16
            info.compress_type = zipfile.ZIP_DEFLATED
            z.writestr(info, data, compress_type=zipfile.ZIP_DEFLATED, compresslevel=9)
    with zipfile.ZipFile(out) as z:
        require(sorted(z.namelist()) == sorted(rendered), 'XPI_SOURCE_INVENTORY_MISMATCH')
        for name, data in rendered.items():
            require(z.read(name) == data, 'XPI_BYTE_MISMATCH:' + name)
    summary = {
        'schema': 'cbnx06-lab02c-isolated-unsigned-xpi-v1',
        'browser_source_sha': browser_sha,
        'extension_id': LAB_ID,
        'production_extension_id': PROD_ID,
        'android_lab_application_id': APK_ID,
        'android_lab_port': LAB_PORT,
        'production_port': PROD_PORT,
        'signed': False,
        'browser_installed': False,
        'paired_with_android': False,
        'physical_qualified': False,
        'live_nexus_qualified': False,
        'production_app_unmodified_by_builder': True,
        'xpi_sha256': sha(out.read_bytes()),
        'source_file_sha256': source_hashes,
        'xpi_file_sha256': {name: sha(data) for name, data in sorted(rendered.items())},
    }
    (dist / 'SHA256SUMS').write_text(summary['xpi_sha256'] + '  ' + out.name + '\n')
    (dist / 'LAB02C_ARTIFACT_ATTESTATION.json').write_text(json.dumps(summary, indent=2, sort_keys=True) + '\n')
    print('CBNX06_LAB02C_UNSIGNED_ISOLATED_XPI_PASS=' + summary['xpi_sha256'])
    return out, summary


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument('--source', type=Path, default=SRC)
    ap.add_argument('--out', type=Path, default=DIST)
    ap.add_argument('--source-sha', default=None)
    args = ap.parse_args()
    source_sha = args.source_sha
    if source_sha is None:
        result = subprocess.run(['git', 'rev-parse', 'HEAD'], cwd=ROOT, text=True,
                                capture_output=True, check=True)
        source_sha = result.stdout.strip()
    build(args.source, args.out, source_sha)


if __name__ == '__main__':
    try:
        main()
    except (Refused, OSError, ValueError, KeyError, UnicodeError, zipfile.BadZipFile) as exc:
        print('CBNX06_LAB02C_REFUSED:' + str(exc), file=sys.stderr)
        raise SystemExit(2)
