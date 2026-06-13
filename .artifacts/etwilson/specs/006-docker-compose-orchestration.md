---
number: 006
story: STR-006
status: complete
base_branch: main
depends_on: [STR-001, STR-002, STR-003, STR-004, STR-005]
scope_files:
  - docker-compose.yml
  - .env.example
  - backend/Dockerfile
  - backend/.dockerignore
  - backend/docker-entrypoint.sh
  - frontend/Dockerfile
  - frontend/.dockerignore
  - frontend/nginx.conf
  - README.md
---

# Feature: Docker Compose Full-Stack Orchestration + README

## Summary
This is the integration story and the EPIC-001 definition of done. It extends the root `docker-compose.yml` (which contains only Postgres after STR-002) with **backend** and **frontend** services so a single `docker compose up` from a clean checkout brings the whole vertical slice to life: Postgres comes up, the backend image (built with sqlx offline mode, no live DB at build time) applies migrations on startup and serves `/api/recipes`, and the frontend image (static SvelteKit assets served by nginx) serves the SPA and reverse-proxies `/api` to the backend so the running app is single-origin — mirroring the STR-005 Vite dev proxy so behavior is identical between `npm run dev` and `docker compose up`. A root `README.md` documents prerequisites, the canonical `docker compose up` entrypoint, the per-service dev workflow, and how to view the running slice. No new application code — this is packaging, orchestration, and documentation of the already-built slice.

---

## Requirements
- `docker compose up` from a clean checkout (no pre-existing volumes, no manual steps) brings up Postgres, backend, and frontend, and the vertical slice works end-to-end.
- The backend image builds with `SQLX_OFFLINE=true` against the committed `.sqlx/` cache — no database is contacted during `docker build`.
- Database migrations (table creation + idempotent seed) are applied automatically as part of bringing the stack up, before the backend begins serving, and are idempotent against an existing (already-migrated) volume.
- Inside Compose, services resolve each other by service name: the frontend proxies `/api` to the backend by service name, and the backend connects to Postgres by service name via `DATABASE_URL`.
- The backend only begins serving (and the frontend only proxies successfully) once Postgres is accepting connections — startup ordering / health waits prevent a crash-on-boot race against a not-yet-ready database.
- Visiting the frontend in a browser (the frontend's published port on the host) shows the seeded recipes, fetched through the backend from Postgres, with no CORS configuration required (single-origin).
- The frontend container serves the static SvelteKit build output and reverse-proxies `/api/*` to the backend, mirroring the STR-005 dev proxy so there is no behavioral drift between dev and Compose.
- A root `README.md` lets a fresh developer clone the repo and run the full stack from scratch using only its instructions, and documents the per-service dev workflow (frontend hot reload via Vite, backend hot reload, the sqlx/migrations workflow).

---

## Scope

### In Scope
- Extending root `docker-compose.yml` with `backend` and `frontend` services, joined to the existing `postgres` service on a shared default network, with `depends_on` + healthchecks for startup ordering.
- `backend/Dockerfile` — multi-stage Rust build with `SQLX_OFFLINE=true`, producing an image that applies migrations on startup then runs the server.
- `backend/docker-entrypoint.sh` (or equivalent) — applies migrations (`sqlx migrate run` or embedded `sqlx::migrate!`) then exec's the server; idempotent against an existing volume.
- `backend/.dockerignore` — exclude `target/`, local env files, etc. so the build context stays lean and reproducible.
- `frontend/Dockerfile` — multi-stage: Node stage builds the static `adapter-static` output, nginx stage serves it and proxies `/api`.
- `frontend/nginx.conf` — serve static assets with SPA fallback, `proxy_pass /api/` → backend service.
- `frontend/.dockerignore` — exclude `node_modules/`, build output, local env files.
- Root `.env.example` extension (or confirmation) documenting any Compose-level variables (e.g. published host ports, in-network `DATABASE_URL`).
- Root `README.md` documenting prerequisites, `docker compose up`, per-service dev workflow, and how to view the slice.

### Out of Scope
- Deployment, hosting, CI, cloud provisioning (later epic).
- Production hardening: secrets management, TLS, resource limits beyond basics, non-root hardening beyond what comes for free.
- Any application code change in `backend/src` or `frontend/src` (this story packages the existing slice; if a wiring assumption proves wrong, **flag it** rather than editing slice code here — see Considerations).
- Changing the migration/seed content or the API shape (owned by STR-002 / STR-003).
- A backend hot-reload story inside the container (dev hot reload runs on the host via the STR-001/STR-005 documented commands; the README points at those).

---

## Technical Approach

- **Entry points / interfaces:**
  - Root `docker-compose.yml` — the canonical entrypoint. Three services: `postgres` (from STR-002, unchanged in shape), `backend`, `frontend`. Single user-facing published port: the frontend's (e.g. host `5173`→nginx `80`, or `8080`→`80`). Postgres's host port from STR-002 may remain published for local-tool/host-backend access.
  - `frontend/nginx.conf` — the single-origin seam: `location /api/ { proxy_pass http://backend:<port>/api/; }` plus `try_files $uri $uri/ /index.html;` for SPA routing.

- **Key modules / components:**
  - **`backend/Dockerfile` (multi-stage):**
    - *Builder stage:* `rust:<version>` base, copy `backend/` (respecting `.dockerignore`), set `ENV SQLX_OFFLINE=true`, `cargo build --release`. The committed `backend/.sqlx/` cache is what lets `query_as!` resolve with no DB — reaffirm by setting `SQLX_OFFLINE=true` explicitly.
    - *Runtime stage:* slim Debian base (matching the build's glibc), copy the release binary, the `backend/migrations/` directory, and the entrypoint. Install the `sqlx` CLI in the runtime image **or** prefer embedded `sqlx::migrate!` to avoid shipping the CLI — see "Migrations on startup" decision below.
    - Exposes the server port; `ENTRYPOINT` is the migration-then-serve script.
  - **`backend/docker-entrypoint.sh`:** runs migrations against `DATABASE_URL`, then `exec`s the server binary so it becomes PID 1 and receives signals. Because STR-002's pool construction already fails fast if the DB is unreachable, the entrypoint should wait for / retry the migration step until Postgres accepts connections (or rely on the compose healthcheck gating `depends_on`). Idempotency comes for free from STR-002's `ON CONFLICT DO NOTHING` seed and sqlx's migration ledger.
  - **`frontend/Dockerfile` (multi-stage):**
    - *Build stage:* `node:<version>` base, `npm ci`, `npm run build` → static `adapter-static` output (typically `frontend/build/`). Confirm the actual output directory STR-004 produces.
    - *Serve stage:* `nginx:<alpine>` base, copy the build output into the nginx html root, copy `frontend/nginx.conf` over the default site config. No Node process in the final image (consistent with the pure-SPA posture).
  - **Compose wiring:** `backend.environment.DATABASE_URL` points at `postgres://…@postgres:5432/…` (in-network service name, not `localhost`). `backend.environment.YARA_HOST=0.0.0.0` so the server is reachable across the Compose network (STR-001 defaults to `127.0.0.1`, which would be unreachable from nginx — this override is required; see Considerations). `frontend depends_on backend`; `backend depends_on postgres` with `condition: service_healthy`.

- **Data model:** None introduced. Uses the existing `recipes` table/seed from STR-002 and the `GET /api/recipes` JSON contract from STR-003 unchanged.

- **Key design decisions:**
  - **Frontend served by nginx, single-origin via reverse proxy.** nginx serves the static SvelteKit assets and `proxy_pass`es `/api` to the backend service. This mirrors the STR-005 Vite dev proxy exactly: in both modes the browser only ever talks to one origin and `/api` is transparently forwarded, so no CORS handling is ever needed and there is no dev/Compose behavioral drift. Chosen over serving the frontend from the backend (keeps Axum the pure API per the epic's decoupled-API decision) and over a separate proxy container (unnecessary for this scale).
  - **Migrations run at startup via the backend service's entrypoint**, applied once before the server serves. Preferred mechanism: **embedded `sqlx::migrate!`** at backend boot if STR-002/the implementer can expose it cleanly, because it ships no extra tooling and reuses the same migration source; otherwise the entrypoint shells out to `sqlx migrate run` with the CLI installed in the runtime image. Either satisfies "migrations applied as part of bringing the stack up" and stays idempotent against an existing volume. **The implementer picks based on what STR-001/002 actually built** (whether `main.rs` already runs migrations or not) — flag if neither path is clean.
  - **sqlx offline build reaffirmed in the Dockerfile** (`ENV SQLX_OFFLINE=true` + committed `.sqlx/`) so `docker build` never needs a database — the explicit acceptance criterion.
  - **Startup ordering via healthcheck, not just `depends_on`.** A bare `depends_on` only waits for container start, not Postgres readiness. Add a `pg_isready`-based healthcheck on the postgres service and gate the backend with `condition: service_healthy` so the migration step doesn't race a not-yet-listening database.
  - **Multi-stage images** for both services so the final images are slim (no Rust toolchain, no Node runtime) — a basic, non-negotiable hygiene choice, not production hardening.

---

## Success Criteria
- [ ] From a clean checkout with no existing volumes, `docker compose up` brings up all three services with no manual steps and no crash-on-boot DB race.
- [ ] `docker compose build` (or the build step of `up`) completes the backend image with no database reachable — confirming `SQLX_OFFLINE=true` + committed `.sqlx/` works in the image build.
- [ ] After `docker compose up`, the `recipes` table exists and is seeded (migrations applied on startup); running `docker compose up` again against the persisted volume re-applies cleanly without duplicating rows or erroring.
- [ ] Opening the frontend's published port in a browser renders the seeded recipes, fetched via `/api/recipes` proxied to the backend, with no CORS errors in the console.
- [ ] `curl http://localhost:<frontend-port>/api/recipes` returns the seeded JSON array (proving the nginx `/api` proxy reaches the backend).
- [ ] Backend, frontend, and postgres resolve each other by service name (no hardcoded container IPs).
- [ ] A fresh developer can run the stack using only `README.md` (prerequisites, the `docker compose up` command, and where to point the browser).

---

## Tasks
Ordered by dependency.

- [ ] **Backend image + migration-on-startup:** Add `backend/Dockerfile` (multi-stage, release build with `ENV SQLX_OFFLINE=true`, slim runtime stage) and `backend/.dockerignore`. Add the startup path that applies migrations before serving — embedded `sqlx::migrate!` at boot if clean, else `backend/docker-entrypoint.sh` running `sqlx migrate run` then `exec`'ing the server. Verify the image builds with no DB available, and that a container against a running Postgres applies migrations and serves `/api/recipes`. Inspect what STR-001/STR-002 produced (`main.rs` bind host, whether migrations already run on boot) and adapt; flag any mismatch rather than editing slice logic.

- [ ] **Frontend image + single-origin nginx:** Add `frontend/Dockerfile` (Node build stage producing the `adapter-static` output, nginx serve stage), `frontend/.dockerignore`, and `frontend/nginx.conf` (static asset serving with SPA `try_files` fallback + `proxy_pass /api/` → the backend service). Confirm the actual build output directory STR-004 emits. Verify the built image serves the SPA and that `/api/*` is forwarded to the backend.

- [ ] **Compose orchestration:** Extend root `docker-compose.yml` with `backend` and `frontend` services on the shared network. Set `backend` env (`DATABASE_URL` → `postgres` service, `YARA_HOST=0.0.0.0`, port), add a `pg_isready` healthcheck to `postgres`, gate `backend` on `condition: service_healthy`, and `frontend depends_on backend`. Publish the frontend port. Update root `.env.example` for any new Compose-level vars. Verify a clean `docker compose up` brings the full slice up end-to-end and a browser shows the seeded recipes.

- [ ] **README:** Write root `README.md` — prerequisites (Docker + Compose; host toolchains only for the dev workflow), the canonical `docker compose up` command and the URL to open, the per-service dev workflow (frontend `npm run dev` + Vite proxy from STR-005, backend `cargo run`/`cargo watch` + the sqlx/migrations workflow from STR-001/STR-002), and a note that single `docker compose up` is the canonical entrypoint and deployment is out of scope. Verify the instructions are sufficient from a clean checkout.

---

## Considerations
- **`YARA_HOST` must be overridden to `0.0.0.0` in the backend service.** STR-001 defaults the bind host to `127.0.0.1`, which inside a container only accepts loopback connections — nginx in the frontend container could not reach it. Set `YARA_HOST=0.0.0.0` in the compose `backend.environment`. This is a config override, not a code change; if STR-001 hardcoded the bind host without honoring the env var, that is a wiring break to flag, not to patch here.
- **`DATABASE_URL` host differs from local dev.** STR-002's `.env.example` points `DATABASE_URL` at `localhost:<published-port>` for the host-run backend. The in-Compose backend must instead use the `postgres` service name and the internal `5432` port. Keep both forms documented; the compose service sets the in-network form explicitly.
- **Migration idempotency against a persisted volume.** The named Postgres volume from STR-002 survives `docker compose down`/`up`. The startup migration must be safe to re-run: sqlx's migration ledger skips already-applied migrations, and STR-002's seed uses `ON CONFLICT DO NOTHING`. Do not add a destructive reset step.
- **Build context size / reproducibility.** Without `.dockerignore`, the Rust `target/` (gigabytes) and `frontend/node_modules/` get sent to the daemon, slowing builds and risking host-arch artifacts leaking into the image. The `.dockerignore` files are load-bearing for a clean build, not optional polish.
- **`adapter-static` output directory.** SvelteKit's static output location depends on STR-004's adapter config (commonly `build/`, sometimes a custom `pages`/`assets` dir). The frontend Dockerfile must copy the directory STR-004 actually produces — confirm it rather than assuming `build/`.
- **nginx SPA fallback is required.** Because the frontend is a client-side router (`ssr=false`), deep links / refreshes on non-root paths must fall back to `index.html` (`try_files $uri $uri/ /index.html;`) or they 404. The `/api/` proxy block must be matched before the fallback.
- **This is the integration checkpoint.** If any STR-001..005 assumption proves wrong when wired together (bind host, migration entry point, build output path, the `/api` route shape, proxy-target configurability), the story instruction is explicit: **flag it**, don't paper over it by mutating earlier slice code inside this packaging story.
- **Backend hot reload is a host workflow, not a container concern.** The README documents `cargo watch`/`npm run dev` on the host for the inner dev loop; `docker compose up` is the integration/run entrypoint. Do not attempt to wire in-container hot reload — out of scope.
