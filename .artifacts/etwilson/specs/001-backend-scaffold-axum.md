---
number: 001
story: STR-001
status: complete
base_branch: main
depends_on: []
scope_files:
  - backend/Cargo.toml
  - backend/Cargo.lock
  - backend/rustfmt.toml
  - backend/clippy.toml
  - backend/.gitignore
  - backend/src/main.rs
  - backend/src/app.rs
  - backend/src/config.rs
  - backend/src/routes/mod.rs
  - backend/src/routes/health.rs
  - backend/README.md
  - backend/tests/health_test.rs
---

# Feature: Backend Scaffold — Axum

## Summary
Stand up the Rust backend project for YARA at `backend/` (establishing the monorepo root convention), serving a trivial `GET /health` route over Axum on Tokio. The server binds to a host/port configured via environment variables with sensible defaults. Project structure is functional-first — router construction is separated from `main`, so the DB layer (STR-002) and the `/api/recipes` endpoint (STR-003) can extend a known-good foundation. rustfmt and clippy are configured and clean, and a hot-reload dev command is documented. No database, no REST domain endpoints, no Docker — pure backend scaffold.

---

## Requirements
- Running `cargo run` from `backend/` starts an HTTP server.
- The server binds to a host and port read from environment variables, falling back to documented defaults when unset.
- `GET /health` returns a 2xx response.
- The Axum `Router` is constructed by a dedicated function, separate from `main`, so it can be built and tested in isolation and extended by later stories.
- `cargo fmt --check` passes with no diffs.
- `cargo clippy` passes with no warnings.
- A hot-reload dev command (rebuild/restart on source change) is documented as the dev run command in `backend/README.md`.
- An integration test exercises the assembled router and asserts `GET /health` returns 2xx.

---

## Scope

### In Scope
- New `backend/` Cargo binary project at repo root.
- Axum on Tokio with a `GET /health` route.
- Config struct reading bind host + port from env vars with defaults.
- Functional-first structure: `main` is thin; router assembly lives in its own function/module; the health handler is a plain async function.
- `rustfmt.toml` and `clippy.toml` (or documented lint config) so formatting and linting are reproducible.
- `backend/.gitignore` for the Rust `target/` directory.
- `backend/README.md` documenting the standard run command and the hot-reload dev command.
- One integration test for `GET /health`.

### Out of Scope
- Any DB/sqlx wiring, connection pool, or migrations (STR-002).
- `GET /api/recipes` or any domain endpoint (STR-003).
- Dockerfile / docker-compose (STR-006).
- Frontend, CORS handling, structured logging frameworks, auth, metrics.
- Graceful shutdown handling beyond Axum/Tokio defaults.

---

## Technical Approach
- **Entry point:** `backend/src/main.rs` — `#[tokio::main] async fn main()`. Loads config, builds the router via `app::create_router()`, binds a `TcpListener`, and serves with `axum::serve`. Keep it thin; no route logic inline.
- **Router assembly:** `backend/src/app.rs` exposes `pub fn create_router() -> Router`. This is the single composition point later stories extend (DB pool as state in STR-002, `/api/recipes` route in STR-003). Returning the `Router` (rather than serving inside the function) is what makes it unit/integration-testable.
- **Config:** `backend/src/config.rs` exposes a `Config` struct (e.g. `host: String`, `port: u16`) and a constructor that reads `std::env` with defaults. Suggested env vars: `YARA_HOST` (default `127.0.0.1`) and `YARA_PORT` (default `3000`). Parse failures on `YARA_PORT` should fail fast with a clear error at startup rather than silently falling back. Prefer plain `std::env::var` over adding a config crate — keep dependencies lean.
- **Routes:** `backend/src/routes/mod.rs` + `backend/src/routes/health.rs`. `health` is a plain `async fn health() -> impl IntoResponse` returning `StatusCode::OK` (a bare 200 is sufficient; the route exists only to prove the server runs). The router wires `.route("/health", get(health))`.
- **Dependencies (lean):** `axum`, `tokio` (with the features Axum needs — `rt-multi-thread`, `macros`, `net`). No `serde`, no DB crates, no config crate, no tracing stack yet — those arrive when a story actually needs them.
- **Lint/format config:** `rustfmt.toml` (can be minimal/default) and a clippy invocation that treats warnings as errors in the documented command (e.g. `cargo clippy -- -D warnings`) so "no warnings" is enforceable. `clippy.toml` only if a specific lint config is needed; otherwise rely on defaults.
- **Hot reload:** Document `cargo watch -x run` (cargo-watch) as the dev command in `backend/README.md`, noting it requires `cargo install cargo-watch`. bacon is an acceptable alternative — pick one and document it; do not add it as a project dependency.
- **Key design decisions:**
  - `create_router()` returns the `Router` so tests can drive it without binding a socket. This is the seam every later backend story builds on.
  - Config via env vars (not a config file) for parity with the eventual Docker Compose environment.
  - Functional-first: handlers and router assembly are plain functions; no service structs or trait objects introduced at this stage.

---

## Success Criteria
- [ ] `cargo run` from `backend/` starts the server and logs (or otherwise indicates) the bound address.
- [ ] `curl localhost:3000/health` (or the configured port) returns a 2xx status.
- [ ] Setting `YARA_PORT` to a different value binds the server to that port; an invalid `YARA_PORT` fails startup with a clear error.
- [ ] `cargo fmt --check` produces no diff.
- [ ] `cargo clippy -- -D warnings` exits 0 with no warnings.
- [ ] The integration test for `GET /health` passes via `cargo test`.
- [ ] `backend/README.md` documents both the standard run command and the hot-reload dev command.

---

## Tasks
Ordered by dependency.

- [ ] **Initialize the Cargo project and tooling:** Create `backend/` as a Cargo binary crate (`Cargo.toml`, `src/main.rs` placeholder). Add `axum` and `tokio` with the minimal required features. Add `backend/.gitignore` (ignore `target/`) and `rustfmt.toml`. Confirm `cargo build` succeeds. This establishes the monorepo `backend/` root convention.
- [ ] **Config from environment:** Implement `backend/src/config.rs` with a `Config` struct and a constructor reading `YARA_HOST` / `YARA_PORT` from env with defaults (`127.0.0.1` / `3000`), failing fast on an unparseable port. Keep it dependency-free (`std::env`).
- [ ] **Health route + router assembly:** Implement `backend/src/routes/health.rs` (plain `async fn` returning 200) and `backend/src/routes/mod.rs`, then `backend/src/app.rs` with `pub fn create_router() -> Router` wiring `GET /health`. Must be complete before the next task, which tests it.
- [ ] **Wire `main` + integration test:** Make `main.rs` thin — load `Config`, build the router via `create_router()`, bind a `TcpListener`, serve. Add `backend/tests/health_test.rs` asserting `GET /health` returns 2xx against the assembled router. Verify `cargo test`, `cargo fmt --check`, and `cargo clippy -- -D warnings` all pass clean.
- [ ] **Document dev ergonomics:** Write `backend/README.md` covering: prerequisites, the standard `cargo run` command, the configurable env vars and their defaults, and the documented hot-reload command (`cargo watch -x run`, noting the `cargo install cargo-watch` prerequisite).

---

## Considerations
- This is the first code in the repo. The `backend/` directory and the monorepo root layout are established here; STR-004 adds `frontend/` and STR-006 adds the root `docker-compose.yml`. Do not create those here.
- Keep dependencies minimal and deliberate. Resist pulling in `serde`, a config crate, or a tracing/logging framework — later stories add what they need. A single startup `println!`/`eprintln!` for the bound address is fine without a logging crate.
- The health handler must stay trivial. It is a liveness proof, not a product feature — do not return JSON, version info, or DB status (there is no DB yet).
- `create_router()`'s signature will change in STR-002 (to accept DB state) and STR-003 (to add routes). Design it as the extension seam, but do not pre-build for those stories — no DB state parameter, no placeholder routes now.
- Axum version matters for the `axum::serve` / `tokio::net::TcpListener` pattern (axum 0.7+). Use a current stable Axum and let `Cargo.lock` pin it; commit `Cargo.lock` since this is a binary crate.
- Enforce "no clippy warnings" via `-D warnings` in the documented command so the acceptance criterion is mechanically checkable.
