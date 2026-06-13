---
number: 007
story:
status: ready
base_branch: main
depends_on: []
scope_files:
  - backend/src/recipes/handler.rs
  - backend/src/recipes/queries.rs
  - backend/src/recipes/mod.rs
  - .claude/rules/backend-query-layer.md
---

# Feature: Recipes Query Layer

## Summary

Extract the SQL access from `recipes/handler.rs` into a dedicated `recipes/queries.rs` module. The handler becomes a thin HTTP adapter; all database access for the recipes feature lives in `queries.rs`. This establishes the canonical pattern for every feature module going forward and is captured in a backend-scoped rule file so future agents apply it consistently.

---

## Requirements

- `recipes/queries.rs` exists and contains a `list_recipes` function with signature `pub async fn list_recipes(pool: &PgPool) -> Result<Vec<Recipe>, sqlx::Error>`
- `recipes/handler.rs` contains no `sqlx` calls — it delegates to `queries::list_recipes`
- `recipes/mod.rs` declares `pub mod queries`
- The existing `GET /recipes` route continues to return the same JSON response
- The pattern is documented in `.claude/rules/backend-query-layer.md` scoped to `backend/**`

---

## Scope

### In Scope

- Extracting `sqlx::query_as!` from `handler.rs` into `queries.rs`
- Wiring `handler.rs` to call `queries::list_recipes(&state.pool)`
- Creating the backend-scoped rule file documenting this pattern

### Out of Scope

- Integration tests for `queries::list_recipes` — this is a structural refactor; the data shape is unstable and the existing route covers observable behavior
- Any other feature module (no `routes/health.rs` changes, no new endpoints)
- `query_file_as!` / external `.sql` files — inline SQL stays inline for now

---

## Technical Approach

- **Entry points:** `GET /recipes` route, unchanged — still wired in `routes/mod.rs`, still calls `handler::list_recipes`
- **Key modules:**
  - `backend/src/recipes/queries.rs` — owns all DB access for the recipes feature; takes `&PgPool`, returns domain types, surfaces `sqlx::Error`
  - `backend/src/recipes/handler.rs` — HTTP adapter only; extracts `State(state)`, calls `queries::list_recipes(&state.pool)`, returns `Json`
  - `backend/src/recipes/mod.rs` — adds `pub mod queries`
- **Data model:** `Recipe { id: i32, name: String }` — unchanged
- **Key design decisions:**
  - Plain `pub async fn`, not a repository struct or trait — `query_as!` requires a real schema at compile time, so mock-based testing is not viable; a trait buys indirection with no payoff
  - Query layer takes `&PgPool`, not `&AppState` — keeps the query layer ignorant of HTTP wiring
  - `sqlx::Error` returned from queries; `From<sqlx::Error> for AppError` in `error.rs` handles translation at the handler boundary via `?`
  - `.sqlx/` offline cache is already committed — compile-time macro checking is wired up

---

## Success Criteria

- [ ] `cargo check` passes with no errors or warnings
- [ ] `cargo test` passes (existing tests unaffected)
- [ ] `recipes/handler.rs` contains no `sqlx` import or `query_as!` call
- [ ] `recipes/queries.rs` exists with the correct function signature and SQL
- [ ] `.claude/rules/backend-query-layer.md` exists with `paths: ["backend/**"]` frontmatter

---

## Tasks

- [ ] **Create `queries.rs`:** Create `backend/src/recipes/queries.rs` with `list_recipes(pool: &PgPool) -> Result<Vec<Recipe>, sqlx::Error>` containing the `sqlx::query_as!` call moved from `handler.rs`.
- [ ] **Update `mod.rs`:** Add `pub mod queries;` to `backend/src/recipes/mod.rs`.
- [ ] **Update `handler.rs`:** Remove the `sqlx` import and inline query. Call `queries::list_recipes(&state.pool).await?` instead. Update imports to include `queries`.
- [ ] **Write rule file:** Create `.claude/rules/backend-query-layer.md` documenting the query layer pattern (see Considerations for content). Include `paths: ["backend/**"]` frontmatter.
- [ ] **Smoke test:** Run `cargo check` and `cargo test` and confirm both pass with no regressions.

---

## Considerations

- The `.sqlx/` offline cache (`backend/.sqlx/`) must stay committed. If new queries are added in future, `cargo sqlx prepare` must be re-run and the output committed before the Docker build will succeed.
- `recipes/model/tests.rs` exists and tests `Recipe` — those tests are unaffected by this change.
- The rule file content should cover: (1) add `queries.rs` to each feature module, (2) functions take `&PgPool` not `&AppState`, (3) return `sqlx::Error` and map at the handler, (4) no repository struct/trait, (5) inline SQL is fine; `query_file_as!` is a per-query escape hatch when SQL grows large.
