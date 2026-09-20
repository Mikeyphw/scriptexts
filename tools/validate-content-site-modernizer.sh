#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BUILDER="$ROOT/userscripts/builders/content-site-modernizer"

cd "$BUILDER"
node build.mjs --check
node --test test/*.test.mjs

cd "$ROOT"
node tools/check-repo.mjs

# Browser smoke is deliberately opt-in so normal Devtool validation remains
# deterministic/offline-friendly. When enabled, use the managed smoke env and
# retain trace/snapshot evidence on failure.
if [[ "${PLAYWRIGHT_SMOKE:-0}" == "1" ]]; then
  : "${PAGETUAL_SCRIPT:?PAGETUAL_SCRIPT must point to the PageTual userscript when PLAYWRIGHT_SMOKE=1}"
  npm run smoke:content-sites:interactions:managed -- --trace retain-on-failure --snapshot retain-on-failure
  npm run smoke:content-sites:pagetual:managed -- --pagetual "$PAGETUAL_SCRIPT" --trace retain-on-failure --snapshot retain-on-failure
fi
