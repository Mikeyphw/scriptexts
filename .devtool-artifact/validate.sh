#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BUILDER="$ROOT/userscripts/builders/content-site-modernizer"

cd "$BUILDER"
node build.mjs --check
node --test test/*.test.mjs

cd "$ROOT"
node tools/check-repo.mjs
