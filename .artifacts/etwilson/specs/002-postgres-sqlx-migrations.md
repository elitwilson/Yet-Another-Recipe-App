---
number: 002
story: STR-002
status: ready
base_branch: main
depends_on: [STR-001]
scope_files:
  - docker-compose.yml
  - .env.example
  - backend/Cargo.toml
  - backend/.env.example
  - backend/src/main.rs
  - backend/src/config.rs
  - backend/src/db.rs
  - backend/migrations/**
  - backend/.sqlx/**
  - backend/README.md
---

# Feature: Postgres + sqlx + Migrations

## Summary
Stand up the persistence half of the YARA stack. Introduces a root `docker-compose.yml` with a single Postgres service (named volume, env-configured credentials), wires the `sqlx` Postgres data-access layer into the existing Axum backend (a connection pool built on startup from `DATABASE_URL`, failing fast with a clear error if the DB is unreachable), and establishes a `backend/migrations/` directory containing a migration that creates a throwaway `recipes` table plus an idempotent seed of a few rows. sqlx offline mode is configured (`cargo sqlx prepare`, with `.sqlx/` committed) so the backend builds without a live database. This story stands up table, pool, and migrations only — it does not add any HTTP endpoint (STR-003) and its compose file contains Postgres only (extended in STR-006).

---

## Requirements
- `docker compose up` starts a Postgres container backed by a persistent named volume; data survives container restarts.
- Postgres credentials and database name are supplied via environment variables (with documented defaults for local dev), and the service exposes a port for local connections.
- The backend depends on `sqlx` with the Postgres feature and a connection pool (`PgPool`).
- On startup the backend reads `DATABASE_URL` from the environment and constructs a `PgPool`; if the DB is unreachable (or `DATABASE_URL` is missing/invalid) the process exits with a clear, actionable error message rather than panicking opaquely or hanging.
- A `backend/migrations/` directory exists containing a migration that creates a `recipes` table with the minimum columns needed to render a list (`id`, `name`).
- Seed data inserts a small handful of `recipes` rows; running migrations against a fresh volume is reproducible and the seed is idempotent (re-applying does not duplicate rows or error).
- Migrations are runnable locally via `sqlx-cli` (`sqlx migrate run`) and the mechanism is compatible with a future container-startup path (STR-006) without rework.
- A committed `backend/.sqlx/` directory exists; the backend compiles in sqlx offline mode (`SQLX_OFFLINE=true`) with no live database available at build time.
- The `sqlx-cli` workflow (install, create migration, run migrations, prepare offline cache) is documented in `backend/README.md`.

---

## Scope

### In Scope
- Root `docker-compose.yml` containing **only** a Postgres service (named volume, env-configured credentials, exposed port).
- `sqlx` + connection-pool wiring in the backend, constructed from `DATABASE_URL` on startup with fail-fast behavior.
- `backend/migrations/` with a `recipes` table migration and an idempotent seed.
- sqlx offline mode: `.sqlx/` query cache committed; backend builds with `SQLX_OFFLINE=true`.
- `.env.example` files documenting `DATABASE_URL` / Postgres credentials.
- `sqlx-cli` workflow documentation in `backend/README.md`.

### Out of Scope
- The `GET /api/recipes` endpoint and any query of the `recipes` table from a handler (STR-003).
- Backend and frontend Docker services and full orchestration (STR-006); this compose file is Postgres-only.
- The production recipe data model — `recipes` here is a throwaway slice fixture (`id`, `name`).
- CI, deployment, hosting, auth, migrations-at-container-startup wiring (STR-006 owns the startup path).

---

## Technical Approach
- **Entry points / interfaces:**
  - `docker-compose.yml` (repo root) — `postgres` service only.
  - `backend/src/main.rs` — startup sequence extended to build the pool before the server starts and pass it into application state.
  - `backend/src/config.rs` — config struct extended (or created, if STR-001 left it inline) to read `DATABASE_URL`.
  - `backend/src/db.rs` — new module owning pool construction and the fail-fast connect logic.
- **Key modules / components:**
  - `db::create_pool(database_url: &str) -> Result<PgPool, sqlx::Error>` — a plain async function (functional-first, no service struct) that builds a `PgPoolOptions` pool and eagerly verifies connectivity (e.g. `.connect()` establishes at least one connection, or an explicit `SELECT 1` probe) so unreachability surfaces immediately at startup rather than on first query.
  - `main.rs` calls `create_pool`, and on `Err` logs a clear message naming `DATABASE_URL` and the underlying error, then exits non-zero.
  - The pool is stored in Axum application state (e.g. `with_state` / an `AppState` holding `PgPool`) so STR-003 can pull it into a handler — but **no handler reads it in this story**. `PgPool` is `Clone` and internally `Arc`-shared.
- **Data model:**
  - `recipes` table — minimal fixture:
    - `id` — integer primary key (`SERIAL`/`GENERATED ... AS IDENTITY`), or `UUID` if preferred; pick one and keep it minimal.
    - `name` — `TEXT NOT NULL`.
  - Seed: ~3–5 fixed rows (e.g. recipe names). Make idempotent via `INSERT ... ON CONFLICT DO NOTHING` against a stable unique key (add a `UNIQUE` constraint on `name`, or seed explicit `id`s with `ON CONFLICT (id) DO NOTHING`).
- **Key design decisions:**
  - **Seed as a migration vs. separate script:** ship the seed as a dedicated numbered migration so a single `sqlx migrate run` produces a ready-to-read table both locally and at container startup (STR-006), satisfying the "runnable in both paths" note with one mechanism. Idempotency is handled with `ON CONFLICT DO NOTHING` so re-runs against an existing volume are safe.
  - **Offline mode:** because no query in this story is checked with the `query!`/`query_as!` compile-time macros (no handler reads the table yet), `.sqlx/` may be an empty/near-empty cache. Still run `cargo sqlx prepare` and commit the `.sqlx/` directory so the workflow is established and `SQLX_OFFLINE=true` builds succeed; STR-003 will populate it with real query metadata. Document this explicitly so the implementer doesn't treat an empty cache as a failure.
  - **Fail-fast:** prefer an explicit connectivity check at startup over lazy pool creation, so the acceptance criterion ("fails fast with a clear error if the DB is unreachable") is directly testable.
  - **Env loading:** follow STR-001's config pattern (env vars with defaults, e.g. via `dotenvy` if STR-001 adopted it) for `DATABASE_URL`; keep parity between `.env.example` and the compose credentials so the local-dev `DATABASE_URL` points at the compose Postgres.

---

## Success Criteria
- [ ] `docker compose up` brings up a Postgres container with a named volume; stopping and restarting preserves data.
- [ ] `sqlx migrate run` (against the compose Postgres) applies cleanly and creates the `recipes` table.
- [ ] After migration, `recipes` contains the seeded rows; running `sqlx migrate run` again does not duplicate rows or error.
- [ ] Starting the backend with a valid `DATABASE_URL` constructs the pool successfully; starting it with the DB down (or a bad URL) exits promptly with a clear error message naming `DATABASE_URL`.
- [ ] `backend/.sqlx/` is committed and `SQLX_OFFLINE=true cargo build` (no DB available) succeeds.
- [ ] `backend/README.md` documents the `sqlx-cli` workflow (install, migrate, prepare).
- [ ] `cargo fmt --check` and `cargo clippy` pass clean (consistent with STR-001's gate).

---

## Tasks
Ordered by dependency.

- [ ] **Postgres compose service + env files:** Add root `docker-compose.yml` with a single `postgres` service (named volume for `/var/lib/postgresql/data`, `POSTGRES_USER`/`POSTGRES_PASSWORD`/`POSTGRES_DB` from env with local defaults, exposed port). Add root `.env.example` and `backend/.env.example` documenting `DATABASE_URL` and the Postgres credentials, kept consistent with the compose service. Verify `docker compose up` starts Postgres and the volume persists across restarts.

- [ ] **Migrations + seed:** Add `sqlx` and `sqlx-cli` workflow; create `backend/migrations/` with (a) a migration creating the minimal `recipes` table (`id`, `name`, with a unique key to support idempotent seeding) and (b) a seed migration inserting a few rows via `ON CONFLICT DO NOTHING`. Confirm `sqlx migrate run` against the compose Postgres applies cleanly and is idempotent on re-run. Must be complete before pool wiring is exercised end-to-end.

- [ ] **sqlx pool wiring + fail-fast:** Add `sqlx` (Postgres + pool features, async runtime matching STR-001's Tokio setup) to `backend/Cargo.toml`. Create `backend/src/db.rs` with `create_pool` performing an eager connectivity check. Extend `backend/src/config.rs` to read `DATABASE_URL`, and `backend/src/main.rs` to build the pool before serving, store it in Axum state, and exit with a clear error on connect failure. No handler consumes the pool yet.

- [ ] **Offline cache + docs:** Run `cargo sqlx prepare` and commit `backend/.sqlx/`. Verify `SQLX_OFFLINE=true cargo build` succeeds with no DB. Document the full `sqlx-cli` workflow (install, `migrate add`, `migrate run`, `prepare`) and offline-mode note in `backend/README.md`. Run `cargo fmt` and `cargo clippy` clean.

---

## Considerations
- **Empty `.sqlx/` cache is expected here.** No compile-time-checked query exists yet (the table is read in STR-003), so `cargo sqlx prepare` may produce little or nothing. Commit the directory regardless and treat an empty cache as success — the goal is establishing the offline-build workflow, not query coverage.
- **Pool in state but unused.** Axum will not complain about state that no handler reads, but `cargo clippy`/compiler may warn about unused fields depending on structure. Keep the pool reachable via `AppState` so STR-003 can wire a handler with zero refactor; suppress or shape it so the clippy gate stays clean (e.g. the state is already passed to the router even if no route uses it yet).
- **`DATABASE_URL` parity.** The local-dev `DATABASE_URL` in `.env.example` must match the compose service's host/port/credentials (host `localhost` + exposed port for running the backend outside Docker; STR-006 will introduce the in-network `postgres` host form). Document both if helpful, but the local path is what this story must make work.
- **Migration-runner compatibility (STR-006 forward-compat).** Shipping the seed as a migration means STR-006 can run `sqlx migrate run` (or `sqlx::migrate!` embedded at startup) as the single mechanism for both local and container paths. Avoid a seed mechanism that only works via a one-off manual script.
- **`id` type choice is open but must be minimal.** `SERIAL`/identity integer is the simplest for a throwaway fixture; UUID is acceptable. Either is fine — do not introduce additional production-model columns.
- **Idempotency requires a conflict target.** `ON CONFLICT DO NOTHING` needs a unique constraint or explicit conflict column; add a `UNIQUE` on `name` or seed fixed `id`s. Don't rely on "table is empty" assumptions — the volume persists across runs.
