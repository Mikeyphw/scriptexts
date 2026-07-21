# Manga Site Media Downloader

Firefox extension version **1.10.3** for downloading galleries from MyReadingManga, MangaLotus, BaraMangaOnline, YaoiMangaOnline, and nhentai.

## Source model

`src/` is the canonical editable source. Uploaded signed packages are not retained as upstream snapshots or backup artifacts.

## Firefox extension ID

`manga-site-media-downloader@mikeyphw.scriptexts`

## Build

```bash
python3 build.py
```

The command creates an unsigned XPI under `dist/` plus `dist/SHA256SUMS`. Load `src/manifest.json` temporarily during development through `about:debugging#/runtime/this-firefox`, or sign the generated XPI through Mozilla Add-ons for normal release-channel installation.

## Note

The source contains a public Google OAuth desktop client ID. No client secret or access token is bundled. User-provided secrets and tokens remain local to the extension.
