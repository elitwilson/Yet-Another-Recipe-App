# Decisions — 006-docker-compose-orchestration

## SPA fallback: 200.html not index.html

The spec says "try_files SPA fallback to index.html" but SvelteKit's `adapter-static` with `fallback: '200.html'` (confirmed in `frontend/vite.config.ts`) produces `200.html` as the fallback file, not `index.html`. `frontend/nginx.conf` uses `try_files $uri $uri/ /200.html;` to match.

The test was updated to accept either `index.html` or `200.html` to remain correct against the actual build output.

## sqlx-cli install in runtime image via curl

The spec says "install the sqlx CLI in the runtime image OR prefer embedded sqlx::migrate!" and notes the implementer picks based on what STR-001/002 built. `main.rs` does not call `sqlx::migrate!` — it only creates the pool and serves. Rather than editing `main.rs` (out of scope), the entrypoint uses `sqlx migrate run` via the CLI, installed in the runtime image via a curl download of the pre-built binary.

This is a packaging decision that avoids any `backend/src` changes.

## Backend Dockerfile: sqlx-cli architecture

The sqlx-cli release binary is downloaded as `x86_64-unknown-linux-gnu` targeting the Debian bookworm-slim runtime. This is correct for standard amd64 hosts. For arm64 (e.g. Apple Silicon with `--platform linux/arm64`), the architecture would need updating. No action taken — out of scope for this story.
