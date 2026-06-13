# YARA Backend

Rust/Axum HTTP server for the Yet Another Recipe App.

## Prerequisites

- Rust (stable) — install via [rustup](https://rustup.rs)

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
