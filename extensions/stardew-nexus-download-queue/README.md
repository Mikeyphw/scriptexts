# Stardew Nexus Download Queue

Firefox extension version **0.4.4** for queuing and launching Stardew Valley Nexus Mods downloads.

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
