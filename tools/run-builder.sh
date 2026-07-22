#!/usr/bin/env bash
set -Eeuo pipefail

usage() {
  cat <<'USAGE'
Run npm scripts for auto-discovered userscript builders.

Usage:
  tools/run-builder.sh
  tools/run-builder.sh <builder>
  tools/run-builder.sh <builder> <npm-script>
  tools/run-builder.sh all [npm-script]
  tools/run-builder.sh --script <npm-script>
  tools/run-builder.sh --list

When no builder is passed, fzf is used when available. Without fzf, an indexed menu is shown.
USAGE
}

die() { echo "error: $*" >&2; exit 1; }

repo_root() {
  if command -v git >/dev/null 2>&1; then
    git rev-parse --show-toplevel 2>/dev/null && return 0
  fi
  cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd
}

script_list() {
  local package_json="$1"
  node -e '
    const fs = require("fs");
    const pkg = JSON.parse(fs.readFileSync(process.argv[1], "utf8"));
    console.log(Object.keys(pkg.scripts || {}).join(", "));
  ' "$package_json"
}

has_npm_script() {
  local package_json="$1" script_name="$2"
  node -e '
    const fs = require("fs");
    const pkg = JSON.parse(fs.readFileSync(process.argv[1], "utf8"));
    process.exit(pkg.scripts && Object.prototype.hasOwnProperty.call(pkg.scripts, process.argv[2]) ? 0 : 1);
  ' "$package_json" "$script_name" >/dev/null 2>&1
}

discover_builders() {
  local root="$1"
  [[ -d "$root" ]] || die "builders directory not found: $root"
  find "$root" -mindepth 2 -maxdepth 2 -name package.json -type f | sort | while IFS= read -r pkg; do
    local dir slug scripts
    dir="$(dirname "$pkg")"
    slug="$(basename "$dir")"
    scripts="$(script_list "$pkg" 2>/dev/null || true)"
    [[ -n "$scripts" ]] || continue
    printf '%s\t%s\t%s\n' "$slug" "$dir" "$scripts"
  done
}

choose_builder() {
  local rows="$1"
  [[ -n "$rows" ]] || die "no builders found"
  if command -v fzf >/dev/null 2>&1; then
    printf '%s\n' "$rows" | fzf --prompt='Builder > ' --delimiter=$'\t' --with-nth=1,3 --height=60% --reverse | cut -f1
    return
  fi
  echo "Available builders:"
  local i=1 line
  while IFS=$'\t' read -r slug _dir scripts; do
    printf '  %2d) %-32s %s\n' "$i" "$slug" "$scripts"
    i=$((i + 1))
  done <<< "$rows"
  echo
  printf 'Choose builder number: '
  local choice
  read -r choice
  [[ "$choice" =~ ^[0-9]+$ ]] || die "invalid selection: $choice"
  printf '%s\n' "$rows" | sed -n "${choice}p" | cut -f1
}

run_builder() {
  local slug="$1" npm_script="$2" rows="$3"
  local dir package_json
  dir="$(printf '%s\n' "$rows" | awk -F '\t' -v s="$slug" '$1 == s { print $2; exit }')"
  [[ -n "$dir" ]] || die "builder not found: $slug"
  package_json="$dir/package.json"
  [[ -f "$package_json" ]] || die "package.json not found for $slug"
  if ! has_npm_script "$package_json" "$npm_script"; then
    echo "available scripts for $slug: $(script_list "$package_json")" >&2
    die "npm script '$npm_script' not found in $package_json"
  fi
  echo "==> $slug: npm run $npm_script"
  ( cd "$dir" && npm run "$npm_script" )
}

main() {
  local root builders_root rows builder='' npm_script='build'
  root="$(repo_root)"
  builders_root="${BUILDERS_ROOT:-$root/userscripts/builders}"

  while [[ $# -gt 0 ]]; do
    case "$1" in
      -h|--help) usage; exit 0 ;;
      --list)
        rows="$(discover_builders "$builders_root")"
        printf '%s\n' "$rows" | awk -F '\t' '{ printf "%-32s %s\n", $1, $3 }'
        exit 0
        ;;
      --script) shift; [[ $# -gt 0 ]] || die "--script needs a value"; npm_script="$1" ;;
      --script=*) npm_script="${1#--script=}" ;;
      *)
        if [[ -z "$builder" ]]; then builder="$1"; else npm_script="$1"; fi
        ;;
    esac
    shift
  done

  rows="$(discover_builders "$builders_root")"
  if [[ -z "$builder" ]]; then
    builder="$(choose_builder "$rows")"
    [[ -n "$builder" ]] || die "no builder selected"
  fi
  if [[ "$builder" == "all" ]]; then
    while IFS=$'\t' read -r slug _dir _scripts; do run_builder "$slug" "$npm_script" "$rows"; done <<< "$rows"
  else
    run_builder "$builder" "$npm_script" "$rows"
  fi
}

main "$@"
