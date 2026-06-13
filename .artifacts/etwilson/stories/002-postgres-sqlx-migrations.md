---
id: STR-002
title: Postgres + sqlx + migrations
epic: EPIC-001
status: specced
priority: high
---

## Goal

Add Postgres as a Docker Compose service and wire the sqlx data-access layer into the backend, including a migrations setup and a seeded `recipes` table that later stories read from. Establishes the persistence half of the stack.

---

## Scope

### In
- A root `docker-compose.yml` defining a **Postgres** service (named volume for data, env-configured credentials, exposed port for local dev).
- `sqlx` (with the Postgres feature and a connection pool) added to the backend; pool constructed on startup from a `DATABASE_URL` env var.
- `sqlx-cli` workflow documented; migrations directory at `backend/migrations/`.
- A migration creating a `recipes` table and a migration (or seed step) inserting a handful of seed rows.
- **sqlx offline mode**: `cargo sqlx prepare` run and the resulting `.sqlx/` directory committed, so builds don't require a live DB.

### Out
- The `GET /api/recipes` endpoint (STR-003) — this story only stands up the table, pool, and migrations.
- Backend and frontend Docker services / full orchestration (STR-006). This story's compose file contains only Postgres; later stories extend it.
- The production data model — the `recipes` table is a throwaway slice fixture.

---

## Acceptance Criteria

- [ ] `docker compose up` (postgres service) starts a Postgres container with a persistent named volume.
- [ ] Migrations apply cleanly against the running Postgres and create a `recipes` table.
- [ ] The `recipes` table is seeded with a small set of rows.
- [ ] The backend constructs a sqlx connection pool on startup from `DATABASE_URL` and fails fast with a clear error if the DB is unreachable.
- [ ] A committed `.sqlx/` directory exists and the backend builds in sqlx offline mode (no live DB needed at build time).

---

## Context & Decisions

- **Postgres + sqlx** per EPIC-001. sqlx chosen for raw, visible SQL with compile-time query verification and parameterized queries for injection safety — no ORM abstraction.
- **sqlx offline mode** is mandated so the backend Docker image (STR-006) builds without a running database. `cargo sqlx prepare` caches query metadata in `.sqlx/`, which is committed to the repo.
- The `recipes` table schema should be the **minimum** needed to render a list in the slice (e.g. `id`, `name`) — it is explicitly *not* the production recipe model and will be replaced when real domain work begins.
- The compose file is introduced here (Postgres only) rather than in a separate skeleton story, and is extended in STR-006.

---

## Dependencies

- **Depends on:** STR-001 (sqlx pool and config attach to the Axum backend project)
- **Blocks:** STR-003 (endpoint queries this table via the pool)

---

## Notes

- Decide whether seed data ships as a dedicated migration or a separate seed script; either is fine — keep it reproducible and idempotent on a fresh volume.
- Migrations should be runnable both locally (sqlx-cli) and at container startup (STR-006 will wire the startup path); keep the mechanism compatible with both.
