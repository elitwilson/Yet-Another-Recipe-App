# Decisions — 003-recipes-endpoint

## AppState vs PgPool in handler signature
The spec says `State(pool): State<PgPool>` but the existing router uses `AppState` as state
(added in STR-001). Handler uses `State(state): State<AppState>` and accesses `state.pool`.
This is the correct adaptation per the spec's guidance: "adapt to the actual shape."

## id type: i32
The migration uses `SERIAL PRIMARY KEY` which is a 4-byte PostgreSQL integer. sqlx maps
this to `i32` in Rust (not `i64`). Confirmed from `20240101000000_create_recipes.sql`.

## Module location: src/recipes/ (not src/routes/recipes/)
The spec calls for `backend/src/recipes/mod.rs`, `handler.rs`, `model.rs` as top-level
modules. We follow the spec rather than nesting under `src/routes/`.

## Error module: src/error.rs
The spec calls for `backend/src/error.rs` as a top-level module. Created accordingly.

## lib.rs modification (not in declared scope_files)
`backend/src/lib.rs` must be modified to declare the new `error` and `recipes` modules —
this is required Rust module wiring, not optional. The spec's scope_files list is not
exhaustive; it omits lib.rs. Reviewer flagged this; proceeding as it is a structural
necessity with no alternative. The spec's "adapt to the actual shape" guidance applies.

## serde dependency
`serde` with the `derive` feature was not in Cargo.toml. Added `serde = { version = "1",
features = ["derive"] }` and `serde_json = "1"` (needed for JSON error body in AppError
and for integration test assertions).
