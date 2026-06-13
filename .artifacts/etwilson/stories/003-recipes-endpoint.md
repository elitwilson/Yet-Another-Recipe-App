---
id: STR-003
title: GET /api/recipes endpoint
epic: EPIC-001
status: specced
priority: high
---

## Goal

Implement the backend half of the vertical slice: a REST endpoint that reads the seeded `recipes` table via sqlx and returns it as JSON. Proves the Axum → sqlx → Postgres path end-to-end on the server side.

---

## Scope

### In
- `GET /api/recipes` Axum handler.
- A sqlx query selecting the seeded rows, using **compile-time-checked** query macros against the schema.
- A typed `Recipe` Rust struct serialized to JSON via serde.
- Correct `application/json` content type and a JSON array response shape.

### Out
- Filtering, pagination, sorting.
- Any write/CRUD endpoints.
- Frontend consumption (STR-005).
- Auth / ownership (out of epic scope entirely).

---

## Acceptance Criteria

- [ ] `GET /api/recipes` returns a JSON array of the seeded recipes (correct fields, correct content type).
- [ ] The query uses sqlx compile-time checking (verified against the schema / offline metadata).
- [ ] The handler returns a clear error response if the query fails, rather than panicking.

---

## Context & Decisions

- **REST** (EPIC-001) — this is the canonical example endpoint the rest of the API will follow in shape and style.
- Response shape should be a plain JSON array of recipe objects; keep it minimal and matched to the seeded columns (e.g. `id`, `name`).
- Use sqlx's compile-time-checked query macros (`query_as!` / `query!`) so the slice also demonstrates the safety property that motivated choosing sqlx.

---

## Dependencies

- **Depends on:** STR-001 (Axum server), STR-002 (recipes table, sqlx pool, offline metadata)
- **Blocks:** STR-005 (frontend fetches this endpoint)

---

## Notes

- Keep the handler functional and thin; map DB errors to an appropriate HTTP status.
- The route path `/api/...` is deliberate — the frontend dev server proxies `/api` to the backend (STR-005), so all backend routes should live under that prefix.
