# LPSG Media Gallery Unlocker — 6.7.5 optimized

## Changes

- Added mobile long-press behavior to the top **Images** and **Videos** filter buttons.
  - Hold Images: select all images; hold again when all images are selected: deselect all images.
  - Hold Videos: same behavior for videos.
  - Other selected media types are preserved.
  - The click generated after a long press is suppressed, so long-press does not unexpectedly change the active filter.
  - Small visual/haptic feedback is provided where supported.
- Fixed ZIP **Details**.
  - Details now expands/collapses an actual live ZIP summary directly below the progress bar.
  - Added Diagnostics and Hide actions to the expanded summary.
  - Details no longer appears for a scan-only job where no ZIP summary exists.
- Fixed an unreachable ZIP-completion summary update that occurred after a `return`.
  - Successful jobs now actually transition from `Creating ZIP` to `ZIP complete` / `Completed with problems`.
  - Hard failures and partial failures automatically expose useful detail state.
- Fixed the floating **Diagnostics** action's malformed `showToast(...)` call.
- Optimized bulk selection.
  - Select all / none / visible / media type / page / invert / failed selection now update existing cards in place instead of rebuilding the entire gallery when a rebuild is not semantically required.
  - Re-rendering is retained when `Selected only` or `Selected first` makes selection alter the visible/order result.
- Fixed single-card deselection behavior under selection-dependent views by scheduling a grid refresh when needed.
- Bumped userscript version to `6.7.5-optimized` and refreshed the standalone metadata file.

## Validation

- LPSG build reproducibility: PASS
- Generated userscript JavaScript syntax: PASS
- LPSG release seal: PASS
- Regression tests: 18 passed, 0 failed
- Static gallery button wiring audit: 69 button IDs, 0 unwired
- Delegated button families checked: media preview, thumbnail retry, toast close/actions, floating media-tools menu

Release-seal SHA-256 for the generated userscript:

`37a6f124bb1e59329aeaafdb5147b7aa6828d92307eefab2dc3d8a08dc9cbb85`
