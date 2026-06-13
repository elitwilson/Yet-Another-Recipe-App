# Yet Another Recipe App

A full-stack vertical slice: SvelteKit frontend, Axum/Rust backend, Postgres database.

## Prerequisites

Local dev runs Postgres in Docker and the backend + frontend natively on the host (compiled Rust is far faster to iterate on natively than inside the macOS Docker VM). You need:

- [Docker](https://docs.docker.com/get-docker/) with Compose (v2) — for Postgres
- Rust toolchain (`rustup`), plus `cargo install cargo-watch sqlx-cli`
- Node.js 20+

## Running the full stack

```sh
cp .env.example .env   # first time only
./dev.sh
```

This starts Postgres (Docker), waits for it to be healthy, applies migrations, then runs the backend (`cargo watch`) and frontend (Vite) natively with hot reload.

- Frontend → http://localhost:5173
- Backend → http://localhost:3000

`Ctrl-C` stops the backend + frontend watchers. Postgres keeps running between sessions; `./dev.sh down` stops it (the `postgres_data` volume is preserved). Migrations are idempotent and re-apply safely on each start.

### Environment variables

Copy `.env.example` to `.env` to override defaults (ports, Postgres credentials):

```sh
cp .env.example .env
```

## Per-service dev workflow

### Frontend (hot reload via Vite)

```sh
cd frontend
npm install
npm run dev
```

Open http://localhost:5173. The Vite dev server proxies `/api` to the backend at `http://localhost:3000` (configurable via `VITE_API_PROXY_TARGET`).

### Backend (Rust / Axum)

```sh
cd backend
cp .env.example .env   # set DATABASE_URL pointing at localhost Postgres
cargo run
```

Requires a running Postgres — use `docker compose up postgres` to start only the database.

For watch mode: `cargo watch -x run` (install with `cargo install cargo-watch`).

### Database migrations (sqlx)

Migrations live in `backend/migrations/`. To apply manually against the local database:

```sh
cd backend
sqlx migrate run
```

The `.sqlx/` directory contains the offline query cache (`SQLX_OFFLINE=true`) so `cargo build` and `docker build` never require a live database connection.

To add a new migration:

```sh
sqlx migrate add <description>
cargo sqlx prepare   # regenerate .sqlx/ cache after schema changes
```

## Architecture

- **Frontend:** SvelteKit with `adapter-static` (pure SPA, no SSR). Built output in `frontend/build/`.
- **Backend:** Axum REST API at `/api/recipes`. Listens on `YARA_HOST:YARA_PORT` (default `127.0.0.1:3000`).
- **Database:** Postgres 16. Schema + seed applied via sqlx migrations.
- **Prod images:** the production Dockerfiles build an nginx image that serves the frontend SPA and reverse-proxies `/api` to the backend — single-origin, no CORS required. This mirrors the Vite dev proxy so behavior is identical in both modes. (`docker-compose.yml` runs only Postgres, for local dev.)

Deployment and hosting are out of scope for this project.
