# LPSG Devtool wrapper / EXO / TLJ integration

## Scope

This change integrates the optimized LPSG userscript work with the current Devtool wrapper and EXO target-local-job model from the supplied Devtool source snapshot.

## Delivered contract

- Added Devtool-managed `devtoolw` and `devtoolw.cmd` launchers.
- Added wrapper schema 1 with `build`, `check`, `test`, `seal`, and default `validate` commands.
- Wrapper commands resolve to the `lpsg-media-gallery-unlocker` target workflows rather than invoking npm ad hoc.
- Added target-local jobs for build, reproducibility, syntax, regression, and release seal.
- Added explicit job inputs/outputs and read-only metadata so Devtool's safe scheduler can reason about overlap.
- Corrected the LPSG target's declared output from a nonexistent builder `dist/**` path to the actual standalone generated userscript.
- Added five target workflows: `build`, `check`, `test`, `seal`, and `validate`.
- The normal `validate` graph has three read-only TLJs and is eligible for one three-node parallel wave.
- Added `docs/WRAPPER.md`, required by the current Devtool wrapper final seal.

## LPSG functional work carried by the same overlay

- Mobile long-press on Images/Videos toggles selection of all media of that type without changing the current filter.
- ZIP progress Details now expands/collapses real live diagnostics and links into Diagnostics.
- ZIP completion state is reachable and no longer sits after an early return.
- Floating Diagnostics uses the toast API correctly.
- Bulk-selection operations synchronize existing cards instead of rebuilding the gallery unnecessarily.
- Regression coverage audits all static gallery buttons and delegated action families.

## Validation expectations

The overlay is based on the original `scriptexts-20260925-125754-616550` snapshot and carries source SHA-256 guards for every modified source path. The repository-level validation after apply should include:

```bash
devtool wrapper verify
devtool wrapper seal --json
devtool target-local-jobs --target lpsg-media-gallery-unlocker --json
devtool plan validate --target lpsg-media-gallery-unlocker --json
./devtoolw validate
./devtoolw seal
```
