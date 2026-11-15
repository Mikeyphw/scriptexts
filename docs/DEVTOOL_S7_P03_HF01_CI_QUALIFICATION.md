# Devtool S7 P03 HF01 — exact registered CI policy

This follow-up to the first `scriptexts` consumer pilot adds the **committed**
Devtool delivery-required CI policy. It does not replace the `Validate` workflow,
`devtoolw`, consumer static contract, or the P03 adoption workflow.

The two non-release `pull_request` workflows are bound to provider-assigned
workflow IDs, not inferred from names observed in a newer or older run:

| Workflow | Workflow ID |
| --- | ---: |
| `Validate` | `317669398` |
| `Devtool S7 P03 scriptexts Consumer Adoption` | `418864667` |

The P03 workflow runs `test_devtool_delivery_*.py` to include the CI policy
regressions alongside the original consumer pilot. The exact source in PR #3
changes after this commit, so previous successful runs (for `4ce1b425...`) may
not be reused as CI proof for HF01. Devtool S4/S5 independently checks exact
head/base/PR identity, workflow IDs, registration window, run attempt, jobs,
and branch/ruleset state, then persists the observation in the new S1 session.

From the new HF01 session:

```sh
python3 -m devtool --repo "$HOME/Code/scriptexts" delivery session ci \
  --id NEW_HF01_SESSION_ID --checks 25 --interval 8
python3 -m devtool --repo "$HOME/Code/scriptexts" delivery session report \
  --id NEW_HF01_SESSION_ID
```

`REQUIRED_CHECKS_PASSED` certifies these **CI checks only**, never release,
merge, signing, approval or installation. No dispatch/rerun or historical run
reuse is authorized. If CI remains pending, use `--ci-only --resume-id` on the
consolidated S7 launcher. Keep the original P03 session as historical evidence.
