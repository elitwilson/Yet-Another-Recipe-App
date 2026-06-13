---
number: 009
story: STR-008
status: complete
base_branch: main
depends_on: [STR-007]
scope_files:
  - backend/src/recipes/queries.rs
  - backend/src/recipes/handler.rs
  - backend/src/recipes/model.rs
  - backend/src/recipes/mod.rs
  - backend/src/app.rs
  - backend/src/error.rs
  - backend/tests/recipes.rs
  - backend/.sqlx/**
---

# Feature: Recipe CRUD REST Endpoints

## Summary

Extend the recipes feature from a single `GET /api/recipes` list endpoint to the full set of five CRUD endpoints (list, read-by-id, create, update, delete) over the production recipe schema. The frontend (STR-009 onward) needs a complete REST API to build the library, detail, and edit flows against. This story owns the HTTP + query layer only — the production schema, `Recipe`/`Ingredient` model structs, and the migration are delivered by STR-007 and consumed here. All DB access lives in `recipes/queries.rs` per the `backend-query-layer` rule; handlers are thin adapters that map `sqlx::Error` to `AppError` via `?`; routes are wired in `app.rs`.

---

## Requirements

- `GET /api/recipes` returns a JSON array of full `Recipe` objects (all production fields, not just `id`/`name`), ordered by `id`.
- `GET /api/recipes/:id` returns a single full `Recipe` as JSON for a known id, and a 404 `AppError` JSON response for an unknown id.
- `POST /api/recipes` accepts a JSON request body describing a recipe (without `id`/`created_at`), inserts it, and returns the created `Recipe` including the server-generated `id` and `created_at`. Response status is 201 Created.
- `PUT /api/recipes/:id` accepts the same request-body shape, fully replaces all mutable fields of the recipe at `:id`, and returns the updated `Recipe`. Returns 404 for an unknown id. There is no partial update (no PATCH).
- `DELETE /api/recipes/:id` deletes the recipe at `:id` and returns 204 No Content with an empty body. Returns 404 for an unknown id.
- Every non-2xx response uses the existing `AppError` JSON shape (`{ "error": ... }`).
- `sqlx::Error::RowNotFound` maps to a 404 `AppError` variant; all other `sqlx` errors continue to map to 500.
- A `RecipeInput` (deserialize-only) struct represents the POST/PUT request body; `id` and `created_at` are never accepted from the client.

---

## Scope

### In Scope

- Five query functions in `recipes/queries.rs`: list, get-by-id, create, update, delete — each taking `&PgPool` (plus id and/or input as needed), returning `Result<_, sqlx::Error>`.
- Five handlers in `recipes/handler.rs`, thin adapters returning `Result<_, AppError>`.
- Adding a 404/`NotFound` variant to `AppError` in `error.rs` and mapping `sqlx::Error::RowNotFound` to it.
- A `RecipeInput` request-body struct (in `recipes/model.rs`) deriving `Deserialize`.
- Wiring all five routes in `app.rs` `create_router_with_state` (`GET`/`POST` on `/recipes`, `GET`/`PUT`/`DELETE` on `/recipes/:id`).
- Updating the existing `list_recipes` query/handler to return the full production `Recipe` shape.
- Integration tests in `backend/tests/recipes.rs` covering happy path and 404 path for every endpoint.
- Regenerating and committing the `backend/.sqlx/` offline cache for all new/changed queries (`cargo sqlx prepare`).

### Out of Scope

- The production schema, migration, and `Recipe`/`Ingredient` model struct definitions — owned by **STR-007**. This story consumes whatever `Recipe` shape STR-007 lands.
- TypeScript types and API client — STR-009.
- Partial update (PATCH).
- Any UI, validation beyond what the DB schema enforces, auth, or pagination.

---

## Technical Approach

- **Entry points / interfaces:** All routes registered in `backend/src/app.rs::create_router_with_state`, nested under `/api`. Use Axum extractors: `State(AppState)`, `Path(i32)` for `:id`, `Json(RecipeInput)` for bodies.
- **Key modules / components:**
  - `recipes/queries.rs` — owns all five DB operations. Signatures (illustrative; field set follows STR-007's `Recipe`):
    - `list_recipes(pool) -> Result<Vec<Recipe>, sqlx::Error>` (update existing)
    - `get_recipe(pool, id: i32) -> Result<Recipe, sqlx::Error>` (use `fetch_one`, which yields `RowNotFound` for a missing row)
    - `create_recipe(pool, input: &RecipeInput) -> Result<Recipe, sqlx::Error>` (`INSERT ... RETURNING` the full row including `id`, `created_at`)
    - `update_recipe(pool, id: i32, input: &RecipeInput) -> Result<Recipe, sqlx::Error>` (`UPDATE ... WHERE id = $ RETURNING ...`; `fetch_one` yields `RowNotFound` when no row matched)
    - `delete_recipe(pool, id: i32) -> Result<(), sqlx::Error>` (`DELETE ... WHERE id = $`; inspect `rows_affected()` and return `sqlx::Error::RowNotFound` when zero)
  - `recipes/handler.rs` — five handlers, each extracts inputs, calls the query with `?`, and returns `Json`/`StatusCode`. Create returns `(StatusCode::CREATED, Json(recipe))`; delete returns `StatusCode::NO_CONTENT`.
  - `recipes/model.rs` — `RecipeInput` deserialize struct (the writable subset of `Recipe`). `Recipe` itself comes from STR-007.
  - `error.rs` — add a `NotFound` variant; in `From<sqlx::Error>` (or in `into_response`) route `sqlx::Error::RowNotFound` to a 404 with the existing JSON error shape.
- **Data model:** `Recipe` (full production shape from STR-007 — `title`, `servings`, `total_time`, `tags`, `favorite`, `ingredients`, `steps`, `notes`, `source`, `created_at`, plus `id`). `RecipeInput` mirrors the client-writable fields, excluding `id` and `created_at`. Ingredient storage (JSONB column vs. join table) is decided by STR-007; this story uses whatever access pattern STR-007's `query_as!` established for `list_recipes`.
- **Key design decisions:**
  - 404 via `RowNotFound`: `fetch_one` on get/update naturally surfaces `RowNotFound`; delete must convert a zero `rows_affected()` into `RowNotFound` explicitly so a delete of a missing id is a 404, not a 204.
  - `RETURNING` clauses on insert/update avoid a second round-trip and give the handler the canonical persisted row (including server-set `created_at`).
  - No repository struct/trait — plain `pub async fn` per the `backend-query-layer` rule.
  - Offline `.sqlx` cache must be regenerated; the Docker build relies on `SQLX_OFFLINE`.

---

## Success Criteria

- [ ] `cargo check` and `cargo test` pass with no warnings.
- [ ] `GET /api/recipes` returns an array of full recipe objects (all production fields).
- [ ] `GET /api/recipes/:id` returns one recipe (200) for a known id; 404 JSON error for an unknown id.
- [ ] `POST /api/recipes` returns 201 with the created recipe carrying a server-generated `id` and `created_at`.
- [ ] `PUT /api/recipes/:id` returns 200 with the fully-updated recipe; 404 for an unknown id.
- [ ] `DELETE /api/recipes/:id` returns 204 with empty body; 404 for an unknown id.
- [ ] All non-2xx responses use the `AppError` JSON shape.
- [ ] Integration tests cover happy path and 404 path for every endpoint and pass against a live migrated DB.
- [ ] `backend/.sqlx/` is regenerated and committed.

---

## Tasks

Ordered by dependency.

- [ ] **Add 404 to `AppError`:** Add a `NotFound` variant to `AppError` in `backend/src/error.rs` and map `sqlx::Error::RowNotFound` to a 404 response using the existing `{ "error": ... }` JSON shape (keep all other errors as 500). Update/extend `error/tests.rs` for the new mapping. Must be complete before handlers can rely on 404 mapping.
- [ ] **`RecipeInput` struct:** Add a `Deserialize`-only `RecipeInput` to `backend/src/recipes/model.rs` mirroring the client-writable fields of STR-007's `Recipe` (exclude `id`, `created_at`).
- [ ] **Query layer:** Implement `get_recipe`, `create_recipe`, `update_recipe`, `delete_recipe` in `backend/src/recipes/queries.rs` and update `list_recipes` to select the full production column set. Use `INSERT/UPDATE ... RETURNING`; convert zero-rows delete to `RowNotFound`. Run `cargo sqlx prepare` and commit `backend/.sqlx/`.
- [ ] **Handlers + routes:** Implement the four new handlers in `backend/src/recipes/handler.rs` (update `list_recipes` handler for the new shape) and wire all five routes in `backend/src/app.rs::create_router_with_state` (`GET`/`POST` on `/recipes`; `GET`/`PUT`/`DELETE` on `/recipes/:id`). Create returns 201; delete returns 204.
- [ ] **Integration tests:** Extend `backend/tests/recipes.rs` following the existing `oneshot` pattern — happy path and 404 path for each endpoint. Tests requiring a row id should create via `POST` (or read a seeded row) rather than hard-coding ids. Confirm against a live migrated DB.

---

## Considerations

- **STR-007 coupling:** This story is unimplementable until STR-007 lands the production `Recipe` struct and migration — the `query_as!` macros compile-check against the real schema. The executor sequences STR-007 first via `depends_on`. The exact field/column names and ingredient storage mechanism are STR-007's to define; this spec deliberately does not re-specify them. If STR-007's `Recipe` field set differs from the brief, follow STR-007 — it is authoritative.
- **`.sqlx` offline cache:** Every new or changed compile-time-checked query requires `cargo sqlx prepare` against a live DB; the regenerated `backend/.sqlx/` must be committed or the `SQLX_OFFLINE` Docker build breaks.
- **Delete semantics:** `DELETE` of a missing id must be 404, not an idempotent 204 — the acceptance criteria require it. `rows_affected() == 0` must be translated to `RowNotFound`.
- **Integration tests need a live Postgres** with migrations applied (`DATABASE_URL=postgres://yara:yara@localhost:5432/yara`), per the header comment already in `backend/tests/recipes.rs`. The existing list-body test asserts an `id`/`name` shape — update it to the production shape rather than leaving a stale assertion.
- **No client-supplied `id`/`created_at`:** `RecipeInput` must not include these fields, so a malicious or buggy client cannot set them.
