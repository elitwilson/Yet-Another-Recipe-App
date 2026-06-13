# YARA Backend

Rust/Axum HTTP server for the Yet Another Recipe App.

## Prerequisites

- Rust (stable) — install via [rustup](https://rustup.rs)
- Docker (for Postgres) — `docker compose up` starts the database

## Database Setup

The backend connects to Postgres. Copy `backend/.env.example` to `backend/.env` and adjust if needed.

### Install sqlx-cli

```bash
cargo install sqlx-cli --no-default-features --features native-tls,postgres
```

### Run migrations

With the Postgres container running (`docker compose up -d`):

```bash
sqlx migrate run
```

This creates the `recipes` table and seeds a few rows. Re-running is safe — the seed uses `ON CONFLICT DO NOTHING`.

### Add a new migration

```bash
sqlx migrate add <migration-name>
```

### Regenerate the offline query cache

After adding `query!`/`query_as!` macros, regenerate the cache so the project builds without a live database:

```bash
cargo sqlx prepare
```

Commit the resulting `backend/.sqlx/` directory.

### Offline builds (no database required)

```bash
SQLX_OFFLINE=true cargo build
```

The committed `backend/.sqlx/` cache allows the project to compile without a live Postgres connection. The cache is intentionally empty until STR-003 adds compile-time-checked queries.

## Run

```bash
cargo run
```

The server binds to `127.0.0.1:3000` by default. Set `YARA_HOST` and `YARA_PORT` to override:

```bash
YARA_HOST=0.0.0.0 YARA_PORT=8080 cargo run
```

`YARA_PORT` must be a valid port number (0–65535). An invalid value causes the server to exit with an error at startup.

## Hot Reload (Development)

Requires [cargo-watch](https://github.com/watchexec/cargo-watch):

```bash
cargo install cargo-watch
```

Then:

```bash
cargo watch -x run
```

The server restarts automatically on any source file change.

## Test

```bash
cargo test
```

## Lint / Format

```bash
cargo fmt --check
cargo clippy -- -D warnings
```
