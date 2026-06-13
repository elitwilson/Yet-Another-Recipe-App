---
id: STR-006
title: Docker Compose full-stack orchestration + README
epic: EPIC-001
status: specced
priority: high
---

## Goal

Tie the whole stack together so a single `docker compose up` from a clean checkout brings up Postgres, the backend, and the frontend with the vertical slice working end-to-end. Document local dev in a README. This is the epic's definition of done.

---

## Scope

### In
- Extend the root `docker-compose.yml` (Postgres added in STR-002) with **backend** and **frontend** services.
- Backend service: Dockerfile building the Axum server using **sqlx offline mode** (no live DB at build time); migrations applied on startup; `DATABASE_URL` pointing at the Postgres service.
- Frontend service: build the static SvelteKit assets and serve them; route `/api` to the backend so the running app is single-origin (mirroring the dev proxy).
- Compose networking so frontend → backend and backend → postgres resolve by service name; sensible startup ordering / health waits.
- A `README.md` documenting prerequisites, `docker compose up`, the per-service dev workflow (hot reload, migrations), and how to view the running slice.

### Out
- Deployment / hosting / CI / cloud provisioning (later epic).
- Production hardening (secrets management, TLS, resource limits beyond the basics).

---

## Acceptance Criteria

- [ ] `docker compose up` from a clean checkout brings up postgres + backend + frontend with no manual steps.
- [ ] Migrations are applied (table created and seeded) as part of bringing the stack up.
- [ ] Visiting the frontend in a browser shows the seeded recipes, fetched through the backend from Postgres — the full slice working end-to-end.
- [ ] The backend image builds via sqlx offline mode (no running DB required during `docker build`).
- [ ] The README lets a fresh developer run the stack from scratch using only its instructions.

---

## Context & Decisions

- **Single `docker compose up`** is the canonical local-dev entrypoint (EPIC-001 definition of done).
- **Single-origin in Compose**: serve the static frontend and reverse-proxy `/api` to the backend (e.g. via the frontend's static server), mirroring the Vite dev proxy (STR-005) so the app behaves the same in both modes. The architect chooses the exact serving mechanism (e.g. nginx serving static assets + proxying `/api`).
- **sqlx offline mode** (`.sqlx/` committed in STR-002) is what makes the backend image build self-contained — reaffirm it here in the Dockerfile.
- Deployment remains explicitly out of scope; this story stops at local Compose.

---

## Dependencies

- **Depends on:** STR-001, STR-002, STR-003, STR-004, STR-005 (orchestrates the completed slice)
- **Blocks:** none

---

## Notes

- Decide where migrations run at startup (entrypoint script, an init step, or the backend applying them on boot) — keep it idempotent against an existing volume.
- Mirror the dev/prod `/api` routing so there's no behavioral drift between `npm run dev` and `docker compose up`.
- This is the integration story — if any wiring assumption from earlier stories proves wrong, this is where it surfaces; flag rather than paper over it.
