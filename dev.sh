#!/usr/bin/env bash
set -euo pipefail

# Single-command local dev.
#
#   Postgres  → Docker (compose), the one thing we don't rebuild on save
#   Backend   → native cargo-watch (fast incremental builds on host APFS)
#   Frontend  → native Vite dev server
#
# Usage:
#   ./dev.sh          start everything; Ctrl-C stops the backend + frontend watchers
#   ./dev.sh down     stop Postgres (data is preserved in the postgres_data volume)

cd "$(dirname "$0")"

# Load root .env (Postgres creds + ports) into the environment if present.
if [ -f .env ]; then
  set -a
  . ./.env
  set +a
fi

PG_USER="${POSTGRES_USER:-yara}"
PG_PASS="${POSTGRES_PASSWORD:-yara}"
PG_DB="${POSTGRES_DB:-yara}"
PG_PORT="${POSTGRES_PORT:-5433}"
BACKEND_PORT="${YARA_PORT:-3000}"
WEB_PORT="${FRONTEND_PORT:-5173}"

# Native backend talks to the compose Postgres on its published host port.
export DATABASE_URL="postgres://${PG_USER}:${PG_PASS}@localhost:${PG_PORT}/${PG_DB}"

if [ "${1:-up}" = "down" ]; then
  docker compose down
  exit 0
fi

echo "▸ Starting Postgres…"
docker compose up -d --wait postgres

echo "▸ Running migrations…"
( cd backend && sqlx migrate run )

if [ ! -d frontend/node_modules ]; then
  echo "▸ Installing frontend deps (first run)…"
  ( cd frontend && npm install )
fi

echo "▸ Backend  → http://localhost:${BACKEND_PORT}"
echo "▸ Frontend → http://localhost:${WEB_PORT}"
echo "▸ Ctrl-C stops backend + frontend. Postgres keeps running — './dev.sh down' to stop it."

# Kill the whole process group on exit so both watchers die together.
trap 'kill 0' EXIT

# Backend: native cargo-watch. No --poll needed — host fsevents work fine.
(
  cd backend
  export YARA_HOST=127.0.0.1
  export YARA_PORT="${BACKEND_PORT}"
  export SQLX_OFFLINE=true
  exec cargo watch -x "run --bin yara-backend"
) &

# Frontend: native Vite, proxying /api to the native backend.
(
  cd frontend
  export VITE_API_PROXY_TARGET="http://localhost:${BACKEND_PORT}"
  exec npm run dev -- --port "${WEB_PORT}"
) &

wait
