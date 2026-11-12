# Stardew Nexus Download Queue

Firefox extension version **0.4.8** for queuing and launching Stardew Valley Nexus Mods downloads.

## Source model

`src/` is the canonical editable source. Uploaded signed packages are not retained as upstream snapshots or backup artifacts.

## Firefox extension ID

`stardew-nexus-download-queue@mikeyphw.scriptexts`

## Build

```bash
python3 build.py
```

The command creates an unsigned XPI under `dist/` plus `dist/SHA256SUMS`. Load `src/manifest.json` temporarily during development through `about:debugging#/runtime/this-firefox`, or sign the generated XPI through Mozilla Add-ons for normal release-channel installation.

## Target

`https://www.nexusmods.com/stardewvalley/*`

## CB-NX01 Android file handoff

When a requested file is available through a rendered Nexus Mod Manager link, the extension preserves the exact file identity before attempting an NXM handoff. If a dynamic Nexus page does not expose that link, the notice offers **Continue exact file on Nexus**, an explicit HTTPS link scoped to the requested file with `nmm=1`. Nexus may still require sign-in or confirmation, or may not provide a manager download for the file. This fallback is **not evidence of a successful download**. The Retry button restarts 15 bounded checks; it does not silently select a different file.
