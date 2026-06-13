---
number: 003
story: STR-003
status: complete
base_branch: main
depends_on: [STR-001, STR-002]
scope_files:
  - backend/src/recipes/mod.rs
  - backend/src/recipes/handler.rs
  - backend/src/recipes/model.rs
  - backend/src/error.rs
  - backend/src/router.rs
  - backend/src/main.rs
  - backend/.sqlx/**
  - backend/tests/recipes.rs
---

# Feature: GET /api/recipes Endpoint

## Summary
Implements the backend half of the EPIC-001 vertical slice: a `GET /api/recipes` REST endpoint that reads the seeded `recipes` table through the sqlx connection pool and returns the rows as a JSON array. It proves the Axum → sqlx → Postgres path works server-side and establishes the canonical shape every later API endpoint follows — a thin functional handler, a typed serde-serialized struct, a compile-time-checked sqlx query, and DB errors mapped to a clean HTTP response instead of a panic.

---

## Requirements
- `GET /api/recipes` returns HTTP 200 with a JSON array of the seeded recipes.
- Each array element contains the recipe's seeded fields (`id`, `name`) serialized via serde.
- The response carries the `application/json` content type.
- When the recipes table is empty, the endpoint returns `200` with an empty JSON array (`[]`), not an error.
- The underlying query uses a sqlx compile-time-checked query macro (`query_as!`), verified against the committed `.sqlx/` offline metadata.
- If the query fails at runtime (e.g. DB unreachable), the handler returns a `500 Internal Server Error` JSON response rather than panicking or leaking the raw error.
- The route is mounted under the `/api` prefix so the frontend dev proxy (STR-005) can forward to it.

---

## Scope

### In Scope
- A typed `Recipe` Rust struct (`id`, `name`) deriving `serde::Serialize` and usable as the `query_as!` target.
- A thin async Axum handler that runs the query against the pool and returns `Json<Vec<Recipe>>`.
- An application error type that maps `sqlx::Error` to an HTTP response (`IntoResponse`), returning `500` with a JSON body.
- Registering the `GET /api/recipes` route on the existing router, with the pool available to the handler (Axum state).
- Refreshing the committed `.sqlx/` offline metadata to include this story's query.
- An integration test asserting status, content type, and array body shape against a seeded DB.

### Out of Scope
- Filtering, pagination, sorting, or query parameters.
- Any write / CRUD / mutation endpoints.
- Frontend consumption (STR-005).
- Auth, ownership, or authorization (out of epic scope).
- Changing the `recipes` schema or seed data (owned by STR-002).

---

## Technical Approach
- **Entry points / interfaces:** The route is added to the router assembled in STR-001 (expected `backend/src/router.rs`, exposing a function like `build_router(pool: PgPool) -> Router`). The handler is reached via `GET /api/recipes`.
- **Key modules / components:**
  - `backend/src/recipes/model.rs` — the `Recipe` struct (`#[derive(Serialize)]`, fields `id`, `name`).
  - `backend/src/recipes/handler.rs` — `async fn list_recipes(State(pool): State<PgPool>) -> Result<Json<Vec<Recipe>>, AppError>`, running `sqlx::query_as!(Recipe, "SELECT id, name FROM recipes ORDER BY id")` against the pool.
  - `backend/src/recipes/mod.rs` — re-exports the handler/model and may expose a `routes()` helper merged into the main router.
  - `backend/src/error.rs` — an `AppError` enum (at minimum a `Database(sqlx::Error)` variant via `#[from]`) implementing `IntoResponse`, returning `StatusCode::INTERNAL_SERVER_ERROR` with a JSON error body and logging the underlying error.
  - `backend/src/router.rs` / `backend/src/main.rs` — wire the new route and ensure the `PgPool` is attached as router state. If STR-001/STR-002 land the router or pool under different names/paths, adapt to the actual shape — these are the expected locations, not contractual ones.
- **Data model:** `Recipe { id: i32, name: String }`. Confirm the exact column types against the STR-002 migration when implementing — if `id` is `BIGINT`/`SERIAL` the Rust type must match what `query_as!` infers (`i64` vs `i32`); the macro will fail to compile on a mismatch, which is the intended safety property.
- **Key design decisions:**
  - `query_as!` (not the runtime `query_as` builder) so the slice demonstrates compile-time verification against the schema; this requires the `.sqlx/` metadata to be regenerated and committed.
  - DB errors flow through a single `AppError` → `IntoResponse` path, keeping the handler thin and functional (no per-call `match` boilerplate, no `.unwrap()`/`.expect()` on the query result).
  - Deterministic `ORDER BY id` so the response order is stable and the integration test can assert exact contents.

---

## Success Criteria
- [ ] `GET /api/recipes` returns `200`, `content-type: application/json`, and a JSON array of the seeded rows with `id` and `name` fields.
- [ ] The implementation uses `sqlx::query_as!` and the project builds in sqlx offline mode (`SQLX_OFFLINE=true`) with the committed `.sqlx/` metadata.
- [ ] A simulated query failure produces a `500` JSON response, and there is no `.unwrap()`/`.expect()`/`panic!` on the query path.
- [ ] An empty table yields `200` with `[]`.
- [ ] `cargo fmt --check` and `cargo clippy` pass clean (consistent with STR-001's gate).

---

## Tasks
Ordered by dependency.

- [ ] **Recipe model + AppError:** Add `backend/src/recipes/model.rs` with the `Recipe` struct (serde `Serialize`, fields matching the seeded columns) and `backend/src/error.rs` with an `AppError` that converts `sqlx::Error` (via `#[from]`) and implements `IntoResponse` returning a `500` JSON body. Unit-test the `IntoResponse` mapping (status + body shape) before wiring the handler.
- [ ] **Handler with compile-time-checked query:** Add `backend/src/recipes/handler.rs` with the thin `list_recipes` handler using `sqlx::query_as!` against the pool, returning `Result<Json<Vec<Recipe>>, AppError>`. Regenerate and commit `.sqlx/` offline metadata (`cargo sqlx prepare`) so the macro resolves without a live DB.
- [ ] **Route wiring:** Mount `GET /api/recipes` on the router from STR-001, ensuring the `PgPool` is attached as Axum state. Adapt to the actual router/pool signatures STR-001/STR-002 produced.
- [ ] **Integration test:** Add `backend/tests/recipes.rs` exercising the endpoint against a seeded test DB — assert `200`, `application/json`, and that the body deserializes to the expected seeded recipes (including the empty-table `[]` case if the harness allows). Must be fully passing before the story is done.

---

## Considerations
- **Type matching is the whole point of `query_as!`:** read the STR-002 migration for the actual `id` column type and make the `Recipe` field type agree, or the macro won't compile. Treat a compile failure here as the feature working, not a blocker.
- **Offline metadata must be committed.** STR-006 builds the backend image with `SQLX_OFFLINE=true`; a missing or stale `.sqlx/` entry for this query breaks that build even though it compiles locally against a live DB. Always re-run `cargo sqlx prepare` after touching the query.
- **Integration test needs a real Postgres** (the seeded table from STR-002). It cannot run purely offline. Follow whatever DB-test setup STR-002 established (e.g. `DATABASE_URL` against the compose Postgres); if STR-002 left no test harness, scope the integration test to require a running DB and document the run command, keeping the unit tests (error mapping) DB-free.
- **Do not leak raw `sqlx::Error` text** to clients in the `500` body — log it server-side, return a generic JSON error. This sets the error-response convention for later endpoints.
- **Keep the handler functional and thin** per the developer's Rust conventions — no service struct; the query and `Json` wrap are the entire body, errors via `?` through `AppError`.
