# Decisions — 002-postgres-sqlx-migrations

## Assumptions

- Using `SERIAL` (integer) for `id` in `recipes` table per spec guidance ("simplest for a throwaway fixture").
- `DATABASE_URL` defaults to `postgres://yara:yara@localhost:5432/yara` matching the compose credentials.
- Using `anyhow` for application-level error handling in `main.rs` per the Rust code style rules.
- `dotenvy` is not used by STR-001 (no env-file loading), so we keep the same pattern — env vars only, no `.env` auto-loading at runtime.
- The `.sqlx/` directory will contain only `query-metadata.json` with an empty queries map since no compile-time query macros exist in this story.
- `sqlx` version `0.8` used (latest stable as of spec time).
- `anyhow` added as a dependency for error handling context in main.rs.
