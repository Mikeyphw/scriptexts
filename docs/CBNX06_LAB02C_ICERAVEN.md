# CB-NX06 LAB02C — Isolated Firefox/Iceraven extension variant

This builds the **actual** Stardew Nexus Download Queue Firefox extension for the **full Cinderbox LAB Android app** (not a standalone mini-app). It is a distinct side-by-side browser extension with the Gecko ID `stardew-nexus-download-queue-cbnx06lab@mikeyphw.scriptexts`, not a replacement for `stardew-nexus-download-queue@mikeyphw.scriptexts`. Separate Gecko extension IDs yield separate `browser.storage.local` partitions; the existing browser extension remains untouched.

## Security boundary

- Production Cinderbox loopback bridge: `127.0.0.1:38471` — unchanged.
- Full Cinderbox lab loopback bridge: `127.0.0.1:38472` — this variant connects only here, under deliberate local opt-in and per-window Android approval.
- Native Android LAB package: `com.sdvsync.cbnx06lab`, synthetic private `CBNX06_GAME_LAB` data.
- A distinct LAB popup title/banner is always visible. New browser downloads from this extension use the `Cinderbox LAB/Stardew Valley` directory (browser Downloads; **not** Android Mods). Its browser queue/storage is separate by Gecko ID.
- This variant blocks its own direct `nxm://` manager launches, including the former exact-file browser bridge and listing-manager button. This is deliberate: native Android NXM intents could still select the **production** app because the lab intentionally does not register an NXM handler.
- The lab popup still supports ordinary/manual browser downloads and **authenticated, read-only, explicitly approved** exact-file requests to the Cinderbox LAB pairing inbox. It cannot remotely trigger a native install.
- Clicking **third-party Nexus page manager links** directly is outside the extension's control; the operator must not select production Cinderbox for these tests. A fresh Nexus login/user approval is still required for live files; no accounts, cookies, ephemeral download URLs or bearer tokens are ever recorded in the attestation.
- Canonical production `src/`, existing production `build.py`, and normal unsigned XPI are **unchanged**. The LAB XPI is generated in-memory from the current canonical source.

## Hosted proof and limits

The CI job `CB-NX06 LAB02C Isolated Firefox/Iceraven XPI` checks the exact PR head, source security gates, bridge tests, synthetic negative cases, deterministic source inventory, contents of the generated XPI, and its SHA256. `LAB02C_ARTIFACT_ATTESTATION.json` intentionally reports `signed=false`, `browser_installed=false`, `physical_qualified=false`, `paired_with_android=false` and `live_nexus_qualified=false`.

The `.xpi` is **unsigned**. A successful hosted job does not mean it can be installed in a particular Iceraven/Firefox build; extension signing and device/browser acceptance are separate. Do not bypass browser security controls or claim installed/pairing/live-download success without a physical evidence receipt. The next milestone LAB03 is limited to exact-file staging and safe synthetic Android lab-root operations, with the production APK and game data unchanged.

## Reproduction

```sh
python3 -B tools/tests/cbnx06_lab02c_tests.py
python3 -B extensions/stardew-nexus-download-queue/build_cbnx06_lab.py
cd extensions/stardew-nexus-download-queue/dist-lab
sha256sum -c SHA256SUMS
```

No merge, production launch, extension install, Android package install, or release publication is performed by the builder or tests.
