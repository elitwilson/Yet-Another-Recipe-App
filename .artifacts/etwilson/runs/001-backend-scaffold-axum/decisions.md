# Decisions — 001-backend-scaffold-axum

## Assumptions

- Using axum 0.7+ with tokio rt-multi-thread + macros + net features
- Config reads via std::env::var only — no config crate
- health handler returns bare StatusCode::OK (no body)
- Integration test uses axum::Server::into_make_service (tower::Service) via axum test utilities (no socket binding needed)
- Commit Cargo.lock since this is a binary crate
- clippy.toml not needed; -D warnings enforced in documented command only
