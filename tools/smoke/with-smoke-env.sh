#!/usr/bin/env bash
set -euo pipefail

find_repo_root() {
  local dir="${1:-$PWD}"
  while [ "$dir" != "/" ]; do
    if [ -f "$dir/repo-manifest.json" ] && [ -d "$dir/userscripts" ]; then
      printf '%s\n' "$dir"
      return 0
    fi
    dir="$(dirname "$dir")"
  done
  return 1
}

ROOT="${SMOKE_REPO_ROOT:-$(find_repo_root "$PWD")}" || {
  echo "smoke-env: could not find repo root" >&2
  exit 2
}
cd "$ROOT"

SMOKE_VENV="${SMOKE_VENV:-$ROOT/.venv-smoke}"
SMOKE_PYTHON="${SMOKE_PYTHON:-python3}"
SMOKE_REQUIREMENTS="${SMOKE_REQUIREMENTS:-$ROOT/requirements-smoke.txt}"
SMOKE_BROWSER_CACHE="${PLAYWRIGHT_BROWSERS_PATH:-$HOME/.cache/ms-playwright}"
export PLAYWRIGHT_BROWSERS_PATH="$SMOKE_BROWSER_CACHE"

have_uv() { command -v uv >/dev/null 2>&1; }
venv_python() { printf '%s/bin/python' "$SMOKE_VENV"; }
venv_bin() { printf '%s/bin' "$SMOKE_VENV"; }

manager_name() {
  if have_uv; then printf 'uv\n'; else printf 'venv\n'; fi
}

sync_env() {
  mkdir -p "$(dirname "$SMOKE_VENV")"
  if have_uv; then
    uv venv --python "$SMOKE_PYTHON" "$SMOKE_VENV" >/dev/null
    uv pip install --python "$(venv_python)" -r "$SMOKE_REQUIREMENTS"
  else
    "$SMOKE_PYTHON" -m venv "$SMOKE_VENV"
    "$(venv_python)" -m pip install --upgrade pip
    "$(venv_python)" -m pip install -r "$SMOKE_REQUIREMENTS"
  fi
}

ensure_env() {
  if [ ! -x "$(venv_python)" ]; then
    sync_env
    return
  fi
  if ! "$(venv_python)" - <<'PY' >/dev/null 2>&1
import importlib.util
raise SystemExit(0 if importlib.util.find_spec('playwright') else 1)
PY
  then
    sync_env
  fi
}

resolve_browser() {
  if [ -n "${PLAYWRIGHT_EXECUTABLE_PATH:-}" ]; then
    return 0
  fi
  for candidate in chromium chromium-browser google-chrome-stable google-chrome; do
    if command -v "$candidate" >/dev/null 2>&1; then
      export PLAYWRIGHT_EXECUTABLE_PATH="$(command -v "$candidate")"
      return 0
    fi
  done
}

doctor() {
  ensure_env
  resolve_browser || true
  cat <<DOC
smoke-env root: $ROOT
smoke-env manager: $(manager_name)
smoke-env venv: $SMOKE_VENV
smoke-env python: $(venv_python)
smoke-env playwright browsers: $PLAYWRIGHT_BROWSERS_PATH
smoke-env executable: ${PLAYWRIGHT_EXECUTABLE_PATH:-<playwright-managed chromium>}
DOC
  "$(venv_python)" --version
  "$(venv_python)" - <<'PY'
from importlib import metadata
for name in ('playwright', 'Pillow'):
    try:
        print(f'{name}: {metadata.version(name)}')
    except metadata.PackageNotFoundError:
        print(f'{name}: <missing>')
PY
}

usage() {
  cat <<'HELP'
Usage:
  tools/smoke/with-smoke-env.sh --doctor
  tools/smoke/with-smoke-env.sh --sync
  tools/smoke/with-smoke-env.sh --install-browsers
  tools/smoke/with-smoke-env.sh --shell
  tools/smoke/with-smoke-env.sh -- <command> [args...]

The command form auto-activates .venv-smoke for the subprocess and auto-deactivates
when the subprocess exits. It prefers uv when available and falls back to venv+pip.
HELP
}

case "${1:-}" in
  --doctor)
    doctor
    ;;
  --sync)
    sync_env
    doctor
    ;;
  --install-browsers)
    ensure_env
    "$(venv_python)" -m playwright install chromium
    ;;
  --shell)
    ensure_env
    resolve_browser || true
    export VIRTUAL_ENV="$SMOKE_VENV"
    export PATH="$(venv_bin):$PATH"
    echo "smoke-env: activated $VIRTUAL_ENV"
    echo "smoke-env: exit this shell to deactivate"
    exec "${SHELL:-/bin/bash}"
    ;;
  --help|-h|help)
    usage
    ;;
  --)
    shift
    if [ "$#" -eq 0 ]; then
      echo "smoke-env: missing command after --" >&2
      usage >&2
      exit 2
    fi
    ensure_env
    resolve_browser || true
    export VIRTUAL_ENV="$SMOKE_VENV"
    export PATH="$(venv_bin):$PATH"
    exec "$@"
    ;;
  "")
    usage
    ;;
  *)
    echo "smoke-env: unknown option '$1'" >&2
    usage >&2
    exit 2
    ;;
esac
