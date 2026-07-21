# Telegram Media Downloader extension

Editable Firefox Manifest V2 extension for Telegram Web media harvesting and downloads.

## Canonical source

`src/` is the sole source of truth. The originally uploaded archive is **not** retained as an upstream snapshot, backup, or release artifact.

## Firefox extension ID

`telegram-media-downloader@mikeyphw.scriptexts`

This repository-owned ID replaces `telegram-media-downloader-complete@local`, allowing this build to be installed independently from builds that use the old ID.

## Build

```bash
python3 build.py
```

The command creates a deterministic, unsigned XPI under `dist/`. For normal Firefox release-channel installation, sign the generated package through Mozilla Add-ons; it can be loaded temporarily for development without signing.

## Imported version

`3.4.9`
