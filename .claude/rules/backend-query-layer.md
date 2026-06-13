---
paths: ["backend/**"]
---

# Backend Query Layer Pattern

Each feature module owns a `queries.rs` file that is the sole location for all database access within that feature.

## Rules

1. **Add `queries.rs` to every feature module.** Each feature under `backend/src/<feature>/` gets a `queries.rs` declared with `pub mod queries;` in `mod.rs`.

2. **Functions take `&PgPool`, not `&AppState`.** The query layer must not know about HTTP wiring. Pass only what the query needs.

3. **Return `sqlx::Error` from queries; map at the handler.** Query functions return `Result<T, sqlx::Error>`. The handler converts via `From<sqlx::Error> for AppError` using `?`.

4. **No repository struct or trait.** Plain `pub async fn` is the standard. `sqlx::query_as!` requires a real schema at compile time, so mock-based trait indirection buys nothing.

5. **Inline SQL is the default.** Keep SQL inline in `query_as!`. Use `query_file_as!` only as a per-query escape hatch when the SQL grows large enough to warrant it.
