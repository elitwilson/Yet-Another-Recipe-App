---
id: STR-001
title: Backend scaffold (Axum)
epic: EPIC-001
status: specced
priority: high
---

## Goal

Stand up the Rust backend project on Axum with a trivial health route and developer ergonomics, runnable standalone. This is the foundation the DB layer and REST endpoints build on.

---

## Scope

### In
- `backend/` Cargo project at the repo root (monorepo layout).
- Axum web server on the Tokio runtime, serving a basic `GET /health` route returning a success response.
- Server configuration (bind address / port) via environment variables with sensible defaults.
- `rustfmt` and `clippy` configured; code passes both clean.
- Hot-reload dev ergonomics (e.g. `cargo-watch` or `bacon`), documented as the dev run command.
- Minimal, functional-first project structure (router setup separated from `main`).

### Out
- Any database / sqlx wiring (STR-002).
- The `/api/recipes` endpoint (STR-003).
- Docker / Docker Compose (postgres service arrives in STR-002, full orchestration in STR-006).
- Frontend.

---

## Acceptance Criteria

- [ ] `cargo run` from `backend/` starts the server and binds a configurable port.
- [ ] `GET /health` returns a 2xx success response.
- [ ] `cargo fmt --check` and `cargo clippy` pass with no warnings.
- [ ] A documented hot-reload command rebuilds and restarts the server on source change.

---

## Context & Decisions

- **Axum** is the chosen framework (EPIC-001) — modern Tokio-ecosystem default, picked to build Rust web-server experience.
- **Functional-first style** per the developer's global conventions: prefer plain functions and handlers over class-like service structs.
- Health route exists purely to prove the server runs; it is not a product feature.
- Config via env vars keeps parity with the eventual Docker Compose setup (STR-006).

---

## Dependencies

- **Depends on:** none
- **Blocks:** STR-002 (sqlx/DB layer attaches to this project), STR-003 (endpoint lives in this server)

---

## Notes

- This is the first code in the repo — establish the `backend/` directory and the monorepo root convention here.
- Keep dependencies lean; the DB stack is added deliberately in STR-002, not pre-emptively.
