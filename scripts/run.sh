#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

API_HOST="${API_HOST:-127.0.0.1}"
API_PORT="${API_PORT:-5000}"
FRONTEND_PORT="${FRONTEND_PORT:-5173}"

if [[ -x "$ROOT/.venv/bin/python" ]]; then
  PYTHON="$ROOT/.venv/bin/python"
elif [[ -x "$ROOT/venv/bin/python" ]]; then
  PYTHON="$ROOT/venv/bin/python"
else
  echo "Creating Python virtual environment in .venv ..."
  python3 -m venv "$ROOT/.venv"
  PYTHON="$ROOT/.venv/bin/python"
fi

echo "Installing backend dependencies ..."
"$PYTHON" -m pip install -q -r "$ROOT/backend/requirements.txt"

if [[ ! -d "$ROOT/frontend/node_modules" ]]; then
  echo "Installing frontend dependencies ..."
  npm install --prefix "$ROOT/frontend"
fi

export DATABASE_URL="${DATABASE_URL:-sqlite:///./test.db}"
export VITE_API_URL="${VITE_API_URL:-http://${API_HOST}:${API_PORT}}"
export FRONTEND_URL="${FRONTEND_URL:-http://127.0.0.1:${FRONTEND_PORT}}"

if [[ -f "$ROOT/backend/.env" ]]; then
  set -a
  # shellcheck disable=SC1091
  source "$ROOT/backend/.env"
  set +a
fi

cleanup() {
  local exit_code=$?
  [[ -n "${API_PID:-}" ]] && kill "$API_PID" 2>/dev/null || true
  [[ -n "${FRONTEND_PID:-}" ]] && kill "$FRONTEND_PID" 2>/dev/null || true
  wait 2>/dev/null || true
  exit "$exit_code"
}
trap cleanup EXIT INT TERM

echo "Starting API on http://${API_HOST}:${API_PORT} ..."
(
  cd "$ROOT/backend"
  exec "$PYTHON" -m uvicorn app.main:app --host "$API_HOST" --port "$API_PORT" --reload
) &
API_PID=$!

echo "Starting frontend on http://127.0.0.1:${FRONTEND_PORT} ..."
(
  cd "$ROOT/frontend"
  exec npm run dev:frontend -- --host 127.0.0.1 --port "$FRONTEND_PORT"
) &
FRONTEND_PID=$!

echo
echo "LegalCase is running:"
echo "  Frontend: http://127.0.0.1:${FRONTEND_PORT}"
echo "  API:      http://${API_HOST}:${API_PORT}"
echo "  Database: backend/test.db"
echo
echo "Press Ctrl+C to stop."

wait
