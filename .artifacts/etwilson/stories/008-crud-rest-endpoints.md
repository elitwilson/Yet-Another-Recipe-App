---
id: STR-008
title: CRUD REST endpoints
epic: EPIC-002
status: specced
priority: high
---

## Goal

Implement all five recipe CRUD endpoints so the frontend has a complete API to work against. Extends the existing `list_recipes` pattern to full CRUD following established project conventions.

---

## Scope

### In
- `GET /api/recipes` — list all recipes; update to return full `Recipe` shape (not just `id`/`name`)
- `GET /api/recipes/:id` — single recipe by ID; 404 if not found
- `POST /api/recipes` — create recipe from JSON body; return created recipe with server-generated `id` and `created_at`
- `PUT /api/recipes/:id` — full replace; return updated recipe; 404 if not found
- `DELETE /api/recipes/:id` — delete recipe; return 204; 404 if not found
- All queries in `queries.rs`, handlers in `handler.rs`, routes wired in `app.rs`
- Integration tests covering happy path and 404 cases for each endpoint

### Out
- TypeScript API client (STR-009)
- Partial update (PATCH) — not needed in v1
- Any UI

---

## Acceptance Criteria

- [ ] `GET /api/recipes` returns full recipe objects (all production fields, not just id/name)
- [ ] `GET /api/recipes/:id` returns a single recipe; returns 404 JSON error for unknown ID
- [ ] `POST /api/recipes` creates and returns the recipe with generated `id` and `created_at`
- [ ] `PUT /api/recipes/:id` updates all fields and returns the updated recipe; 404 for unknown ID
- [ ] `DELETE /api/recipes/:id` deletes the recipe and returns 204 No Content; 404 for unknown ID
- [ ] All non-2xx responses use the existing `AppError` shape
- [ ] Integration tests pass for happy path and 404 path for every endpoint

---

## Context & Decisions

- **Query layer pattern**: all DB access in `queries.rs` taking `&PgPool`, returning `Result<T, sqlx::Error>`. Handlers map errors via `AppError` using `?`. This is the established pattern in `backend/src/recipes/`.
- **404 handling**: `sqlx::Error::RowNotFound` should map to a 404 `AppError` variant. Check whether `AppError` already has this; add it if not.
- **Request body for POST/PUT**: accept the full recipe payload minus `id` and `created_at` (server-generated). Define a `RecipeInput` or `RecipePayload` struct for deserialization.

---

## Dependencies

- **Depends on:** STR-007 (production schema required for sqlx compile-time query verification)
- **Blocks:** STR-010 (library view needs list endpoint), STR-011 (detail view needs get endpoint)

---

## Notes

- `app.rs` currently registers only `GET /api/recipes` — extend `create_router_with_state` with the remaining four routes.
- The existing `list_recipes` handler and query will need updating to return full `Recipe` structs once STR-007 lands.
- Integration test pattern is established in `backend/tests/recipes.rs` — follow that file's approach.
