# shellcheck shell=bash
# Source this file for an interactive smoke environment:
#   source tools/smoke/activate-smoke-env.sh
#   smoke-env-deactivate

if [ -n "${BASH_SOURCE[0]:-}" ]; then
  _SMOKE_ENV_SCRIPT="${BASH_SOURCE[0]}"
else
  _SMOKE_ENV_SCRIPT="$0"
fi
_SMOKE_ENV_DIR="$(cd "$(dirname "$_SMOKE_ENV_SCRIPT")" && pwd)"
_SMOKE_ENV_ROOT="$(cd "$_SMOKE_ENV_DIR/../.." && pwd)"

"$_SMOKE_ENV_ROOT/tools/smoke/with-smoke-env.sh" --sync >/dev/null

export SMOKE_REPO_ROOT="$_SMOKE_ENV_ROOT"
export VIRTUAL_ENV="${SMOKE_VENV:-$_SMOKE_ENV_ROOT/.venv-smoke}"
export PLAYWRIGHT_BROWSERS_PATH="${PLAYWRIGHT_BROWSERS_PATH:-$HOME/.cache/ms-playwright}"
if [ -z "${_SMOKE_ENV_OLD_PATH+x}" ]; then
  export _SMOKE_ENV_OLD_PATH="$PATH"
fi
export PATH="$VIRTUAL_ENV/bin:$_SMOKE_ENV_OLD_PATH"

smoke-env-deactivate() {
  if [ -n "${_SMOKE_ENV_OLD_PATH+x}" ]; then
    export PATH="$_SMOKE_ENV_OLD_PATH"
    unset _SMOKE_ENV_OLD_PATH
  fi
  unset VIRTUAL_ENV SMOKE_REPO_ROOT
  unset -f smoke-env-deactivate 2>/dev/null || true
  echo "smoke-env: deactivated"
}

echo "smoke-env: activated $VIRTUAL_ENV"
echo "smoke-env: run smoke-env-deactivate when finished"
