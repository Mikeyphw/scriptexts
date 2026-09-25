# Repository Devtool wrapper

This repository ships Devtool-managed `devtoolw` launchers. The launchers are deliberately thin: they resolve the repository root and delegate to `devtool --repo <root> wrapper exec`, so wrapper commands re-enter canonical Devtool rather than creating a second runner, scheduler, or run store.

Do not edit `devtoolw` or `devtoolw.cmd` by hand. Refresh them with `devtool wrapper update` when the installed Devtool wrapper template changes.

## LPSG command surface

The wrapper currently exposes the stable LPSG development surface:

| Command | Alias | Devtool resolution | Purpose |
| --- | --- | --- | --- |
| `./devtoolw build` | `b` | `invoke build --target lpsg-media-gallery-unlocker` | Regenerate the installable LPSG userscript. |
| `./devtoolw check` | `c` | `invoke check --target lpsg-media-gallery-unlocker` | Verify byte-for-byte reproducibility and userscript syntax. |
| `./devtoolw test` | `t` | `invoke test --target lpsg-media-gallery-unlocker` | Run the dedicated LPSG regression suite. |
| `./devtoolw seal` | `s` | `invoke seal --target lpsg-media-gallery-unlocker` | Run the deterministic release seal. |
| `./devtoolw validate` | `v` | `invoke validate --target lpsg-media-gallery-unlocker` | Run the normal EXO/TLJ validation workflow. |

`validate` is the default wrapper command, so `./devtoolw` and `./devtoolw validate` resolve to the same workflow.

## EXO and target-local jobs

LPSG execution units live under `[targets.lpsg-media-gallery-unlocker.jobs.*]` in `.devtool.toml`. They are target-local jobs (TLJs), not repository-global jobs. The owning target references them by short name from `[targets.lpsg-media-gallery-unlocker.workflows]`.

The normal validation graph contains three read-only TLJs:

- `reproducibility`: `node build.mjs --check`
- `syntax`: `node --check` on the generated standalone userscript
- `regression`: the two LPSG Node test files

All three declare explicit input scopes and `read_only = true`. With the repository scheduler policy (`parallel = true`, `max_parallel_nodes = 3`), Devtool can safely schedule the normal validation graph in one parallel wave. The separate `build` TLJ declares its generated userscript output, so write ownership remains explicit.

Wrapper execution preserves invocation provenance through Devtool's wrapper bridge and EXO execution store. The flow is:

```text
./devtoolw validate
  -> devtool --repo <repo> wrapper exec validate
  -> canonical wrapper resolution
  -> devtool invoke validate --target lpsg-media-gallery-unlocker
  -> target workflow graph
  -> target-local jobs
  -> normal EXO events / execution store / logs / summaries
```

There is no shell-snippet wrapper layer and no duplicate scheduler.

## Inspect before executing

Use Devtool's machine-readable discovery and planning surfaces when changing this contract:

```bash
devtool wrapper describe --json
devtool wrapper verify
devtool wrapper seal --json

devtool target-local-jobs --target lpsg-media-gallery-unlocker --json
devtool workflows --json
devtool plan validate --target lpsg-media-gallery-unlocker --json
```

The plan should report three target-local validation jobs, known reservation paths, `parallel_effective = true`, and one schedule wave containing `reproducibility`, `syntax`, and `regression`.

## Launcher lifecycle

Create launchers in a clone that does not have them yet:

```bash
devtool wrapper init
```

Verify checked-in launchers:

```bash
devtool wrapper verify
```

Refresh checked-in launchers after upgrading Devtool:

```bash
devtool wrapper update
```

Run the wrapper cross-surface final seal after changing `.devtool.toml`, the launchers, or this guide:

```bash
devtool wrapper seal
```
