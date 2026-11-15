# Devtool S7 P03 — scriptexts first real consumer

This change is an *additive, non-release, source-pinned consumer migration* of
Devtool's **delivery adoption audit and scaffold** into `Mikeyphw/scriptexts`.
It leaves the existing `Validate` workflow, npm scripts, build DAG, browser
smoke tests, `devtoolw` wrappers and release pipeline unchanged.

## Scope and provenance

- Consumer source: `Mikeyphw/scriptexts` `main` at
  `523013f9a79eff8215b603c165523a38b82a3d86`.
- Devtool CLI source: `Mikeyphw/devtool` S7 P02 at
  `416d24140c7f7a4b9833d7cb19df50ca7e7363b8`.
- Consumer CI checks out the exact PR source SHA and uses a disposable *local*
  named branch because the canonical Devtool adoption identity requires a
  named Git branch. The CI branch never gets pushed.
- The pinned Devtool package is installed in a virtual environment outside
  the consumer checkout. No Devtool source is vendored into `scriptexts`.

## Why the audit's duplicate-launcher hint is advisory

`scripts/devtool_actions_contract.py` is an existing read-only, repository-
specific assertion set for `.devtool.toml` target workflows and GitHub workflow
shape. It does **not** push, create PRs, dispatch, register, watch, or retry
remote workflows, so it is intentionally retained and still run in P03 CI.
Its source contains the string `workflow_dispatch:`, which is sufficient to
trigger the S7 P01 heuristic. That does not establish duplicated orchestration.

## Acceptance

The new GitHub workflow runs the real Devtool S7 P02 canonical command:

```sh
python3 -m devtool --repo "$PWD" delivery adoption audit --json
```

The pilot asserts: exact consumer origin, valid source SHA, clean worktree,
Devtool config presence, non-qualified CI/release advisory scope, no worktree
changes from the audit, successful data-only scaffold on a throwaway Git repo,
actual native Devtool artifact validation, and fail-closed refusal to reuse
that artifact after a later clean Git commit.

All tests are Python stdlib `unittest`. No npm install, Gradle, remote Git
mutation, PR creation, dispatch, release, signing, or physical device access
is performed by the new P03 workflow.

## Deliberately not claimed

This P03 workflow demonstrates consumer-side adoption and safety of the shared
Devtool coordinator, **not** migration of every `scriptexts` builder or any
GitHub PR/CI/release qualification. The existing `Validate` workflow remains
a separate required release process. A passing P03 workflow cannot authorize
merge or release. Devtool remains the authority for delivery operations.
