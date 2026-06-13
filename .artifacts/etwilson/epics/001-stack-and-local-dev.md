---
id: EPIC-001
title: Stack & Local Dev Environment
status: ready
created: 2026-06-12
---

## Goal
Stand up the foundational technical scaffold for YARA so feature work can begin against a known-good stack. By the end of this epic, the full stack runs locally via a single `docker compose up` and a trivial end-to-end vertical slice proves every layer is wired correctly: the Svelte frontend reads real data from the Rust/Axum backend, which queries Postgres via sqlx. This epic resolves the "resolve-early" stack unknowns from the vision (API style, web framework, DB access layer) and produces no real domain features — it is pure scaffolding.

---

## Scope In
- Monorepo layout: `frontend/` (Svelte + Vite) and `backend/` (Rust + Axum) at the repo root, with a root `docker-compose.yml`.
- Frontend scaffold: Svelte built with Vite, Tailwind CSS, and shadcn-svelte wired up and rendering.
- Backend scaffold: Rust web server on Axum, serving a REST API, structured for future REST endpoints.
- Database: Postgres running as a Docker Compose service, with sqlx for data access and compile-time-checked queries.
- Migrations: sqlx migrations under `backend/migrations/`, applied on startup or via a documented command, creating a single seeded `recipes` table for the vertical slice.
- End-to-end vertical slice: a `GET /api/recipes` Axum endpoint queries the seeded `recipes` table via sqlx and returns the rows; the Svelte frontend fetches that endpoint and renders the list. Proves frontend → backend → DB wiring.
- Docker Compose orchestration of all three services (frontend, backend, postgres) such that `docker compose up` brings the whole stack to a working state.
- Developer tooling and conventions: hot-reload/dev ergonomics for both frontend and backend, formatting/linting setup appropriate to each stack, and a README documenting how to run the stack locally.

## Scope Out
- Deployment / hosting (no CI/CD, no cloud provisioning) — deferred to a later epic. Local dev only.
- Client-side / local-first persistence (localStorage vs IndexedDB) — deferred; the slice is server-backed only.
- Authentication, accounts, and server sync.
- Recipe import (URL or paste parsing).
- Share-by-link.
- Ownership-based authorization.
- Any real domain features or finalized data model — the `recipes` table is a throwaway slice fixture, not the production schema.
- GraphQL — explicitly rejected in favor of REST.

---

## Key Decisions
- **API style: REST.** GraphQL judged overkill for a single-developer personal project. Resolves the vision's open question.
- **Backend framework: Axum.** Modern Tokio-ecosystem default; strong REST support; chosen to build Rust web-server experience per the vision.
- **Database: Postgres.** Server-backed relational DB, run as a Docker Compose service.
- **Data access: sqlx.** Raw, visible SQL (no ORM abstraction) with compile-time query verification against the live schema and parameterized queries for injection safety. Chosen to keep queries explicit while leaning on the library for correctness and security.
- **Component library: shadcn-svelte.** Copy-in, Tailwind-native components for full control over markup and styling. Resolves the vision's component-library preference.
- **Repo structure: monorepo.** `frontend/` and `backend/` at root, orchestrated by a root `docker-compose.yml`; migrations live in `backend/migrations/`.
- **Definition of done: working end-to-end vertical slice.** The finish line is the three layers talking to each other through a real (seeded) DB read rendered in the UI — not independently-runnable pieces. This validates the stack choices in practice before feature work begins.
- **Local dev: Docker Compose.** Single `docker compose up` is the canonical way to run the full stack locally.
