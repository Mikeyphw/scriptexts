# Devtool repository optimization report

## Goal

Make Devtool the repository execution contract rather than an LPSG-specific convenience wrapper. The checked-in wrapper now represents the complete scriptexts workspace; LPSG is one explicit component shortcut.

## Devtool source audited

The integration was designed and executed against the supplied Devtool 1.1.0 source snapshot (`devtool-20260925-201501-788530.tar.gz`). The audit covered wrapper resolution/provenance, EXO execution objects, target-local jobs (TLJs), cross-target DAGs, workspace groups, scheduler reservations, affected selection, plan/preflight machine exports, Python environment policy, artifact declarations, validation profiles, doctor/completion surfaces, and wrapper final sealing.

## Repository model

- `workspace` is the default target and owns orchestration only.
- 13 release/root component targets own their actual jobs; `smoke-python` is isolated as an optional managed Python target.
- Nested groups model `builders`, `standalone`, `extensions`, `userscripts`, `release`, `ci`, `smoke`, and `all`.
- Cross-target workflows use `target:<target>#<workflow>` references, so one EXO graph owns execution, logging, provenance, evidence, and scheduling.
- Shared files are modeled as explicit inputs instead of widening every target root. This gives native `--affected` selection useful ownership boundaries.
- Scheduler parallelism is enabled with a three-node cap and read-only TLJs explicitly marked.

## Wrapper

`./devtoolw` defaults to repository-wide `validate`; it is not tied to LPSG. Commands cover restore, build, test, check, validate, seal, package, smoke, userscripts, extensions, content-sites, explicit LPSG, and Git-affected validation. The `changed` command delegates to Devtool `--affected` / `--affected-base` / `--affected-head`; there is no duplicate Git-diff implementation in the repository.

Dependency restoration is explicit (`./devtoolw restore`) instead of running `npm install` before every validation. This keeps normal validation deterministic, fast, and offline-friendly once dependencies exist.

## TLJ decomposition and npm progress issue

The supplied Devtool source was exercised, not only parsed. During that audit, aggregate npm lifecycle commands exposed a Devtool 1.1.0 progress-finalization defect: predicted `npm-script:*` child progress nodes could remain nonterminal after every top-level EXO job had already succeeded. The repository does not suppress that error. Instead, npm-backed component lifecycles were decomposed into direct structured TLJs such as build, reproducibility, syntax, tests, profile checks, and final seals.

That is also the better Devtool model: individual work is visible in the plan, independently schedulable, gets precise input/output reservations, and has specific failure evidence. `.devtool.toml` contains no hidden `npm run ...` lifecycle jobs and no `action = "build"` / `action = "test"` aliases that would collapse these stages back into npm child scripts. npm remains the package manager for the explicit restore boundary.

## Artifacts and release evidence

Generated userscript builders declare their installable `.user.js`/`.meta.js` output locations as target artifacts. Extension targets declare deterministic `dist/` artifacts (`*.xpi` plus `SHA256SUMS`) and use a reproducibility helper that builds twice and compares hashes. Root metadata, repository checks, inventory, and tool tests run only after component outputs are complete.

## Validation profiles and managed environments

Devtool's built-in validation profiles remain available for direct validation runs. Repository-local overrides live under `.devtool/validation.toml`, which Devtool treats as runtime metadata, so this overlay intentionally does not try to persist that runtime file as repository payload. The optional browser-smoke target uses the canonical Python runner with `uv`, `.venv-smoke`, a locked smoke dependency group, and no project install. Browser launching remains opt-in; ordinary validation only verifies smoke configuration.

## Runtime qualification

After direct-TLJ decomposition, Devtool's machine plan for `workspace#validate` contains **39 nodes, all 39 target-local jobs**, scheduled in **14 waves** with `parallel_requested=true`, `parallel_effective=true`, and `max_parallel_nodes=3`.

The actual checked-in wrapper was executed through the supplied Devtool source:

- `devtool wrapper verify`: current launchers.
- `devtool wrapper seal`: PASS, including schema, docs, discovery/completion parity, canonical execution bridge, EXO invocation origin, and target/group resolution.
- `./devtoolw validate`: PASS end-to-end through the repository DAG, including component builders/extensions, metadata join, root tool tests, repository check, and inventory.
- `./devtoolw check`: PASS after generated-source metadata convergence.
- repository Devtool contract + smoke-environment regression suite: PASS (**31/31** tests).
- `devtool plan validate --target workspace --json`: PASS, **39 nodes / 39 commands / 39 TLJs / 14 waves**, effective parallelism enabled with cap 3.
- `devtool preflight --workflow validate --target workspace --json`: PASS and reports all 39 graph nodes as target-local jobs across 13 participating targets.
- `devtool doctor --json`: PASS/healthy for the repository wrapper and workflow model.


## Affected-selection qualification

A disposable Git qualification commit changed only `userscripts/builders/lpsg-media-gallery-unlocker/src/20-gallery-controls.part.js`. Native `devtool affected --group ci --base HEAD~1 --head HEAD --explain --json` selected exactly `lpsg-media-gallery-unlocker` and `root`: LPSG by target ownership and root because its repository-level tool/repo/inventory checks consume `userscripts/**`. `./devtoolw changed --base HEAD~1 --head HEAD` then passed with **5 TLJ stages, 43 tests, 0 failures, 0 warnings, and 0 errors**. This proves the wrapper's affected mode is using Devtool ownership propagation rather than a repository-local approximation.

## Baseline hygiene repaired while qualifying the graph

The repo-wide final join surfaced baseline inconsistencies that narrower LPSG-only validation did not see. The integration synchronizes extension install-artifact names/versions in `repo-manifest.json`, registers Coomer as an installable standalone project, canonicalizes Coomer userscript update/download/home/support metadata at the builder source, and keeps generated Coomer output/meta consistent. Root `tools/check-repo.mjs` passes on the resulting tree.

## Capabilities deliberately not enabled

Android/device operations, SSH/OCI execution, and repository federation are implemented by Devtool but are not meaningful for this single local Node/Python repository today. Enabling them without a real Android, remote-execution, or cross-repository ownership boundary would add ceremony rather than execution truth. The integration uses the relevant Devtool capabilities deeply and leaves unrelated providers disabled until the repository actually needs them.
