#!/usr/bin/env bash
set -euo pipefail
cd "$(git rev-parse --show-toplevel)"

# Devtool's active ledger and ignored generated/cache files cannot safely be
# payload-deleted during the Devtool transaction that is using them. Remove
# them from Git's index only after the hygiene overlay has completed.
mapfile -t tracked < <(git ls-files -ci --exclude-standard)
if ((${#tracked[@]})); then
  printf 'Untracking %d ignored generated/local path(s) from Git index...\n' "${#tracked[@]}"
  printf '%s\0' "${tracked[@]}" | xargs -0 git rm -r --cached --ignore-unmatch --
else
  echo "No tracked ignored/generated paths remain."
fi

echo "Local files remain on disk and are protected by .gitignore."
