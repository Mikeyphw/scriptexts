#!/usr/bin/env python3
"""Deterministic synthetic negatives for the separate Cinderbox LAB Firefox XPI.

Never opens the network, installs a browser extension, or touches Android files.
"""
from __future__ import annotations
import importlib.util
import json
import os
from pathlib import Path
import tempfile
import unittest
import zipfile

BUILDER_FILE = Path(__file__).resolve().parents[2] / 'extensions/stardew-nexus-download-queue/build_cbnx06_lab.py'
spec = importlib.util.spec_from_file_location('cbnx06_lab02c_builder', BUILDER_FILE)
builder = importlib.util.module_from_spec(spec)
spec.loader.exec_module(builder)
SRC = Path(__file__).resolve().parents[2] / 'extensions/stardew-nexus-download-queue/src'


def fixture():
    manifest = {
        'manifest_version': 2, 'version': '0.4.9', 'name': 'Prod',
        'permissions': ['storage', 'http://127.0.0.1/*'],
        'browser_action': {'default_title': 'Stardew Nexus Queue'},
        'background': {'persistent': True, 'scripts': ['cbnx03-background.js', 'background.js']},
        'content_scripts': [{'js': ['cbnx01-browser-bridge.js', 'content.js']}],
        'browser_specific_settings': {'gecko': {'id': builder.PROD_ID}},
    }
    bridge = '''/* Cinderbox file handoff UX. Runs only when Cinderbox query parameters are valid. */
async function startCinderboxBrowserBridge() {
  const openLink = document.createElement('a')
  openLink.href = result.downloadUrl
  await queuePayload({ kind: 'manager' })
}
'''
    background = '''const DEFAULT_SETTINGS = {
  listingButtonMode: "both",
  interceptPageDownloads: false
}
function buildFilename(item) {
  const mod = 'example', file = 'data', ext = ''
  return `Stardew Valley/${mod}/${file}${ext}`
}
async function launchManagerUrl(item) {
  const targetUrl = item.downloadUrl
  await browser.tabs.create({url: targetUrl}) // NXM
}
async function startBrowserDownload(item) {
  await browser.downloads.download({filename: buildFilename(item)})
}
'''
    return {
        'manifest.json': json.dumps(manifest).encode(),
        'cbnx03-background.js': b"const BASE = 'http://127.0.0.1:38471'\n",
        'cbnx03-popup.js': b"header.textContent = 'Cinderbox companion'\n",
        'background.js': background.encode(),
        'cbnx01-browser-bridge.js': bridge.encode(),
        'content.js': b'if (mode === "manager" || mode === "both") { showManager() }',
        'popup.html': (b'<title>Stardew Nexus Queue</title><h1>Stardew Nexus Queue</h1>'
                       b'<option value="manager">Vortex only</option>'
                       b'<option value="both">Manual + Vortex</option>'),
        'icons/icon16.png': b'not-a-real-icon-but-safe-fixture',
    }


class Lab02CSecurityTests(unittest.TestCase):
    def test_isolated_extension_and_endpoint(self):
        generated = builder.render_variant(fixture())
        manifest = json.loads(generated['manifest.json'])
        self.assertEqual(manifest['browser_specific_settings']['gecko']['id'], builder.LAB_ID)
        self.assertEqual(manifest['manifest_version'], 2)
        self.assertEqual(manifest['version'], '0.4.9')
        self.assertIn('Cinderbox LAB', manifest['name'])
        self.assertIn(b'127.0.0.1:38472', generated['cbnx03-background.js'])
        self.assertNotIn(b'38471', generated['cbnx03-background.js'])

    def test_manager_cannot_open_production_app(self):
        out = builder.render_variant(fixture())
        self.assertNotIn(b'browser.tabs.create', out['background.js'])
        self.assertIn(b'LAB blocked direct NXM launch', out['background.js'])
        self.assertIn(b'Cinderbox LAB/Stardew Valley/', out['background.js'])
        self.assertNotIn(b'openLink.href = result.downloadUrl', out['cbnx01-browser-bridge.js'])
        self.assertIn(b'if (false /* CBNX06 LAB:', out['content.js'])
        self.assertIn(b'disabled', out['popup.html'])

    def test_manifest_preserves_nexus_permissions(self):
        files = fixture()
        manifest = json.loads(files['manifest.json'])
        manifest['permissions'].append('https://www.nexusmods.com/stardewvalley/*')
        files['manifest.json'] = json.dumps(manifest).encode()
        out = json.loads(builder.render_variant(files)['manifest.json'])
        self.assertIn('https://www.nexusmods.com/stardewvalley/*', out['permissions'])

    def refuse(self, file, old, new, reason):
        data = fixture()
        self.assertIn(old.encode(), data[file])
        data[file] = data[file].replace(old.encode(), new.encode(), 1)
        with self.assertRaisesRegex(builder.Refused, reason):
            builder.render_variant(data)

    def test_refuse_wrong_production_id(self):
        self.refuse('manifest.json', builder.PROD_ID, 'other@invalid', 'PRODUCTION_EXTENSION_ID_DRIFT')

    def test_refuse_missing_bridge(self):
        files = fixture()
        del files['cbnx03-background.js']
        with self.assertRaisesRegex(builder.Refused, 'REQUIRED_SOURCE_MISSING'):
            builder.render_variant(files)

    def test_refuse_version_drift(self):
        self.refuse('manifest.json', '0.4.9', '0.4.8', 'UPSTREAM_EXTENSION_VERSION_DRIFT')

    def test_refuse_duplicate_production_endpoint(self):
        files = fixture()
        files['cbnx03-background.js'] += files['cbnx03-background.js']
        with self.assertRaisesRegex(builder.Refused, 'ANCHOR_DRIFT:LAB_LOOPBACK_ENDPOINT'):
            builder.render_variant(files)

    def test_refuse_production_port_in_another_script(self):
        files = fixture()
        files['background.js'] += b'\nconst PROD = "http://127.0.0.1:38471"'
        with self.assertRaisesRegex(builder.Refused, 'PRODUCTION_PORT_LEAK:background.js'):
            builder.render_variant(files)

    def test_refuse_other_loopback_port(self):
        files = fixture()
        files['background.js'] += b'\nconst OTHER = "http://127.0.0.1:38473"'
        with self.assertRaisesRegex(builder.Refused, 'NON_LAB_LOOPBACK_PORT:background.js'):
            builder.render_variant(files)

    def test_refuse_privileged_browser_permissions(self):
        files = fixture()
        obj = json.loads(files['manifest.json'])
        obj['permissions'].append('nativeMessaging')
        files['manifest.json'] = json.dumps(obj).encode()
        with self.assertRaisesRegex(builder.Refused, 'UNEXPECTED_PRIVILEGED_EXTENSION_PERMISSION'):
            builder.render_variant(files)

    def test_refuse_missing_nxm_legacy_anchor(self):
        self.refuse('background.js', 'browser.tabs.create', 'newFunction', 'MANAGER_LAUNCH_CONTRACT_DRIFT')

    def test_refuse_missing_direct_browser_bridge_contract(self):
        self.refuse('cbnx01-browser-bridge.js', 'await queuePayload({', 'queuePayload({',
                    'BROWSER_BRIDGE_SOURCE_DRIFT')

    def test_refuse_missing_manager_listing_guard(self):
        self.refuse('content.js', 'mode === "both"', 'mode === "manual"',
                    'ANCHOR_DRIFT:CONTENT_MANAGER_BUTTONS_DISABLED')

    def test_refuse_missing_banner(self):
        self.refuse('popup.html', '<h1>Stardew Nexus Queue</h1>', '<h1>Changed</h1>',
                    'ANCHOR_DRIFT:POPUP_LAB_BANNER')

    @staticmethod
    def lab_ux_fixture():
        files = fixture()
        files['popup.css'] = b'body {\n  overflow: hidden;\n}\n.app {\n  overflow: hidden;\n}\n'
        files['cbnx03-popup.js'] = (
            "header.textContent = 'Cinderbox companion'\n"
            "code.placeholder = '9-digit Cinderbox code'\n"
            "  code.autocomplete = 'off'\n"
            "  status.textContent = 'Not paired'\n"
            "  panel.append(header, description, destinationTitle, rememberLabel, destinationInfo,\n"
            "    code, pair, refresh, revoke, status, authority, jobs,\n"
            "  main.append(panel)\n"
            "    canHandoff = result?.state === 'connected' && result.handoffEnabled === true\n"
            "  pair.addEventListener('click', async () => {\n"
            "    const value = code.value.trim()\n"
            "    code.value = '' // Keep the manually entered code out of page history and DOM.\n"
            "    render(await send({ type: 'CBNX03_PAIR', code: value }))\n"
            "  })\n"
            "offline: 'Cinderbox unavailable. Use regular NXM handoff.',\n"
        ).encode()
        return files

    def test_lab_only_scroll_and_pairing_first_controls(self):
        src = self.lab_ux_fixture()
        out = builder.render_variant(src)
        css = out['popup.css'].decode()
        popup = out['cbnx03-popup.js'].decode()
        self.assertIn('overflow-y: auto;', css)
        self.assertIn('touch-action: pan-y;', css)
        self.assertIn('.app > .header, .app > .panel { flex: 0 0 auto; }', css)
        self.assertIn("if (top) top.after(panel)", popup)
        self.assertIn("pairingActions.append(pair, refresh, revoke)", popup)
        self.assertIn("status.setAttribute('aria-live', 'polite')", popup)
        self.assertIn('9-digit Cinderbox LAB pairing code', popup)
        self.assertIn("if (outcome?.state === 'paired') render(await send({ type: 'CBNX03_STATUS' }))",popup)
        self.assertNotIn('main.append(panel)', popup)
        self.assertNotIn('regular NXM handoff', popup)
        # The canonical source dictionaries passed to the builder are immutable.
        self.assertEqual(src['popup.css'], self.lab_ux_fixture()['popup.css'])
        self.assertEqual(src['cbnx03-popup.js'], self.lab_ux_fixture()['cbnx03-popup.js'])
        self.assertNotIn('overflow-y: auto;', src['popup.css'].decode())

    def test_lab_scroll_rejects_hidden_viewport_layout_drift(self):
        src = self.lab_ux_fixture()
        src['popup.css'] = src['popup.css'].replace(b'overflow: hidden;',b'overflow: visible;')
        src['popup.css'] = src['popup.css'].replace(b'overflow: hidden;',b'overflow: visible;')
        with self.assertRaisesRegex(builder.Refused,'LAB_POPUP_SCROLL_SOURCE_DRIFT'):
            builder.render_variant(src)

    def test_lab_pairing_rejects_missing_input_anchor(self):
        src = self.lab_ux_fixture()
        src['cbnx03-popup.js'] = src['cbnx03-popup.js'].replace(b'9-digit Cinderbox code', b'other text')
        with self.assertRaisesRegex(builder.Refused,'LAB_PAIRING_POPUP_SOURCE_DRIFT'):
            builder.render_variant(src)

    def test_reproducible_unsigned_xpi_and_receipt(self):
        with tempfile.TemporaryDirectory() as td:
            root = Path(td)
            source = root / 'src'
            for name, body in fixture().items():
                file = source / name
                file.parent.mkdir(parents=True, exist_ok=True)
                file.write_bytes(body)
            xpi1, m1 = builder.build(source, root/'a', 'a'*40)
            xpi2, m2 = builder.build(source, root/'b', 'a'*40)
            self.assertEqual(xpi1.read_bytes(), xpi2.read_bytes())
            self.assertEqual(m1, m2)
            self.assertFalse(m1['signed'])
            self.assertFalse(m1['physical_qualified'])
            self.assertEqual(m1['android_lab_application_id'], builder.APK_ID)
            with zipfile.ZipFile(xpi1) as z:
                self.assertEqual(z.read('manifest.json'), builder.render_variant(fixture())['manifest.json'])
                self.assertEqual(len(z.namelist()), len(fixture()))

    def test_refuse_symlinked_source(self):
        with tempfile.TemporaryDirectory() as td:
            root = Path(td)/'src'
            root.mkdir()
            (root/'manifest.json').write_text('{}')
            (root/'bad.js').symlink_to('manifest.json')
            with self.assertRaisesRegex(builder.Refused, 'SOURCE_SYMLINK'):
                builder.safe_files(root)

    def test_refuse_reserved_signature_content(self):
        with tempfile.TemporaryDirectory() as td:
            root = Path(td)/'src'
            root.mkdir()
            for name, data in fixture().items():
                file = root / name
                file.parent.mkdir(parents=True, exist_ok=True)
                file.write_bytes(data)
            (root/'META-INF').mkdir()
            (root/'META-INF/signer.sf').write_text('unsafe')
            with self.assertRaisesRegex(builder.Refused, 'SOURCE_META_INF_RESERVED'):
                builder.safe_files(root)

    def test_parent_source_is_unmodified(self):
        # Only render in memory. Production source must remain byte-identical.
        files = fixture()
        before = dict(files)
        builder.render_variant(files)
        self.assertEqual(files, before)


if __name__ == '__main__':
    unittest.main(verbosity=2)
