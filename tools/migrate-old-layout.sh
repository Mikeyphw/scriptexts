#!/usr/bin/env bash
set -euo pipefail

if [[ "${1:-}" != "--apply" ]]; then
  echo "Dry run. Re-run with --apply to remove obsolete pre-normalization paths."
  APPLY=0
else
  APPLY=1
fi

paths=(
  "userscripts/builders/manga-modern-ui"
  "userscripts/standalone/100-search-engines-clean-dark-ui"
  "userscripts/standalone/lpsg-video-unlocker-improved-gallery"
  "userscripts/standalone/poast-nitter-reset-timeline-metadata"
  "userscripts/standalone/telegram-media-downloader-userscript"
  "extensions/mrm-suite-downloader"
  "extensions/stardew-nexus-queue"
)

for path in "${paths[@]}"; do
  if [[ -e "$path" ]]; then
    echo "remove $path"
    if [[ "$APPLY" == 1 ]]; then rm -rf "$path"; fi
  fi
done
