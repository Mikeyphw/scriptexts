# Repository Devtool wrapper

This repository ships Devtool-managed `devtoolw` launchers. They are deliberately thin: each launcher resolves the repository root and delegates to `devtool --repo <root> wrapper exec`, so wrapper commands re-enter canonical Devtool instead of creating a second scheduler, run store, or logging path.

The wrapper is **repository-oriented**. LPSG is one target among the userscript and extension targets; it is no longer the wrapper default.

Do not edit `devtoolw` or `devtoolw.cmd` by hand. Refresh them with `devtool wrapper update` when the installed Devtool launcher template changes.

## Daily command surface

`validate` is the default, therefore `./devtoolw` and `./devtoolw validate` are equivalent.

| Command | Alias | Scope | Purpose |
| --- | --- | --- | --- |
| `./devtoolw restore` | `r` | `workspace` | Restore Node dependencies through the workspace TLJ. |
| `./devtoolw build` | `b` | `workspace` | Build all generated userscripts and extension artifacts, then refresh userscript metadata. |
| `./devtoolw test` | `t` | `workspace` | Run the repository test DAG. |
| `./devtoolw check` | `c` | `ci` group | Run each target's lint/reproducibility workflow through Devtool. |
| `./devtoolw validate` | `v` | `workspace` | Run the complete deterministic EXO/TLJ validation DAG. This is the default. |
| `./devtoolw seal` | `s` | `workspace` | Run component seals plus final repository checks. |
| `./devtoolw package` | `pkg` | `workspace` | Produce release packages that have a packaging workflow. |
| `./devtoolw changed` | `chg` | `ci` group | Validate only Git-affected targets using Devtool ownership/dependency propagation. |
| `./devtoolw userscripts` | `us` | `userscripts` group | Validate all userscript targets. |
| `./devtoolw extensions` | `ext` | `extensions` group | Validate all extension targets. |
| `./devtoolw lpsg` | — | LPSG target | Validate only LPSG. |
| `./devtoolw content-sites` | `csm` | content-site target | Validate only the shared content-site builder. |
| `./devtoolw smoke` | — | smoke target | Check managed smoke configuration without launching browsers. |

`changed` supports `--base REV`, `--head REV`, and `--fail-fast`. It uses Devtool's `--affected` selection rather than a custom Git parser, so target roots, declared inputs, and reverse target dependencies remain the source of truth.

## Repository execution model

The workspace target at `tools/devtool-workspace/` owns orchestration only. Component work remains target-owned:

- userscript builders have target-local build/test/lint/validate/seal jobs;
- direct standalone userscripts use target-local syntax/runtime jobs;
- browser extensions use deterministic build/reproducibility jobs and artifact collection;
- repository-wide checks are target-local jobs on the `root` target;
- optional browser-smoke configuration is isolated in the `smoke-python` target.

Cross-target work is composed with `target:<target>#<workflow>` references. Workflows do not invoke nested `devtool` processes. That preserves a single EXO graph, one execution store, one scheduler, and one provenance chain.

Lifecycle jobs are intentionally decomposed into direct structured commands rather than aggregate `npm run check` / `npm run seal` pipelines. Build, reproducibility, syntax, tests, profiles, and release seals therefore remain visible as independent TLJs. This improves scheduling and failure attribution and avoids nested npm progress children obscuring EXO completion state. npm is still the repository dependency manager; `./devtoolw restore` is the explicit dependency-restore boundary.

The normal repository validation flow is conceptually:

```text
./devtoolw [validate]
  -> wrapper exec validate
  -> invoke validate --target workspace
  -> target:<component>#validate branches
  -> scheduler parallelizes non-conflicting jobs
  -> root#seal joins after every component succeeds
  -> canonical EXO/TLJ summary, evidence, diagnostics and logs
```

## Groups and affected ownership

The repository defines nested workspace groups:

- `builders`: generated userscript projects;
- `standalone`: direct userscripts;
- `extensions`: browser-extension projects;
- `userscripts`: `builders + standalone`;
- `release`: `userscripts + extensions`;
- `ci`: `root + release`;
- `smoke`: optional smoke configuration;
- `all`: `ci + smoke`.

Target roots are intentionally narrow wherever possible. Shared files are represented with target/job `inputs`. This lets `devtool affected` attribute a changed path to its owner and propagate through reverse dependencies instead of conservatively selecting the entire repository for every edit.

Inspect selection before running it:

```bash
devtool affected --group ci --explain
./devtoolw changed
./devtoolw changed --base HEAD~1 --head HEAD
```

## EXO / target-local jobs

Execution units live under `[targets.<target>.jobs.*]`. Component workflows reference their own TLJs with `job:<local-name>`; cross-target orchestration calls workflows, never another target's private job directly.

Use the current Devtool inspection surfaces:

```bash
devtool jobs --json
devtool jobs --target lpsg-media-gallery-unlocker --json
devtool workflows --json
devtool completion-state --kind target-jobs
devtool completion-state --kind target-job-keys
devtool completion-state --kind target-job-refs
```

The workspace scheduler is opted into parallel execution with a three-node cap. Jobs declare explicit `inputs`/`outputs`; truly read-only jobs also declare `metadata.read_only = true`. Devtool therefore computes safe reservation waves rather than relying on ad-hoc background shells.

## Plan and preflight before execution

For a full dry-run of the repository graph:

```bash
devtool plan validate --target workspace --explain --show-commands
devtool plan validate --target workspace --json
devtool preflight --workflow validate --target workspace --json
```

The machine plan exposes target-local job identity, command specs, dependency edges, reservation scopes, scheduler waves, and whether parallelism is effective. Preflight verifies required runners/tools before work starts.

For one component:

```bash
devtool plan validate --target lpsg-media-gallery-unlocker --explain
devtool preflight --workflow validate --target lpsg-media-gallery-unlocker
```

## Validation profiles

Devtool's built-in validation workflow profiles remain available on direct validation surfaces (`minimal`, `default`, `release`, `termux`, `architecture-final`, and `final-seal` in the audited source). Repository-local overrides belong to `.devtool/validation.toml`, which is Devtool runtime metadata and is intentionally **not** committed or shipped by this overlay. Add local overrides there only when a machine or CI environment needs a different policy; the repository DAG itself stays canonical in `.devtool.toml`.

## Artifact evidence

Generated userscript targets and extension targets declare their installable outputs as Devtool artifacts. Builders register their `dist/` or standalone `.user.js` outputs, while extension targets register `.xpi`/`SHA256SUMS` outputs. This gives build/package surfaces a machine-readable artifact contract instead of leaving produced files as terminal-only knowledge.

Useful inspection commands include:

```bash
devtool artifacts
devtool doctor --json
devtool history
devtool logs
```

(The exact artifact/history subcommand names available to an installed Devtool can be confirmed with `devtool --help`; the repository does not wrap read-only inspection commands.)

## Wrapper lifecycle and contract seal

Discover the checked-in wrapper contract:

```bash
./devtoolw --help
devtool wrapper describe --json
devtool wrapper discover --json
devtool wrapper verify
devtool wrapper seal --json
```

Create launchers in a clone that does not have them yet:

```bash
devtool wrapper init
```

Refresh checked-in launchers after upgrading Devtool:

```bash
devtool wrapper update
```

The wrapper final seal validates schema, descriptions, launcher drift, documentation, discovery/completion parity, invocation provenance, EXO execution-origin evidence, group/target workflow resolution, and generic bridge behavior.

## Features deliberately not enabled

Devtool also supports Android/device workflows, SSH execution providers, OCI/chroot environments, and repository federation. They are not enabled here because this repository is a single local Node/Python workspace without an Android target or required remote/federated dependency. Enabling unrelated surfaces would add configuration without improving execution truth. If the repository later gains a real cross-repository dependency or required remote execution environment, add those capabilities at that boundary rather than simulating them now.
