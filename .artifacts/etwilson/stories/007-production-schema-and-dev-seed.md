---
id: STR-007
title: Production schema & dev seed
epic: EPIC-002
status: specced
priority: high
---

## Goal

Replace the throwaway `recipes` table with the real production schema and update the Rust model structs to match. Provide dev seed fixtures so the library view is exercisable without a Create UI. Everything downstream in this epic depends on this story landing first.

---

## Scope

### In
- New migration: drop the throwaway `recipes` table; create the production `recipes` table with all fields (`title`, `servings`, `total_time`, `tags`, `favorite`, `ingredients`, `steps`, `notes`, `source`, `created_at`)
- New seed migration: replace the name-only seed with 3–4 full recipe fixtures (all fields populated)
- Rust `Recipe` struct updated to match the full schema and derives `Serialize`
- `Ingredient` and `RecipeSource` Rust types (inline structs or separate, per architect's decision on storage)
- Offline sqlx cache regenerated (`cargo sqlx prepare`)

### Out
- REST endpoints (STR-008)
- TypeScript types (STR-009)
- Any UI changes

---

## Acceptance Criteria

- [ ] `cargo sqlx migrate run` succeeds with the new migrations applied
- [ ] Seed data is present after migration: at least 3 recipes, each with `title`, `servings`, `total_time`, `tags`, `favorite`, `ingredients` (each with `qty`/`unit`/`item`), `steps`, `source`
- [ ] Rust `Recipe` struct has all production fields and derives `Serialize`
- [ ] `sqlx::query_as!(Recipe, ...)` compiles against the new schema (offline cache updated)
- [ ] `cargo test` passes — existing tests updated as needed for the new struct shape

---

## Context & Decisions

- **Ingredient storage is the architect's call.** JSONB column in `recipes` vs a separate `recipe_ingredients` table are both valid. Either way, the `Recipe` struct must expose `Vec<Ingredient>` to callers. The epic deliberately defers this to implementation.
- **`source` field is required from day one**, even though only `manual` entries exist until import epics ship. JSONB is a natural fit given its variable structure (`{ type, host?, url?, method? }`). See `.artifacts/etwilson/design/recipe-ingestion-brief.md` for the full shape.
- **`qty` is a free-form string** (`"1/2"`, `"a couple"`). Do not attempt normalization — that is a known deferred migration point for the v2 shopping-list epic.
- Seed fixtures can draw from `SEED_RECIPES` in `.artifacts/etwilson/design/prototype/data.js` for realistic data.

---

## Dependencies

- **Depends on:** none (EPIC-001 scaffold is complete)
- **Blocks:** STR-008 (endpoints need the schema for sqlx compile-time checks), STR-009 (types are derived from the schema)

---

## Notes

- Two existing migrations to deal with: `20240101000000_create_recipes.sql` and `20240101000001_seed_recipes.sql`. Add new migrations that drop and recreate rather than editing the existing files — sqlx migration history tracks by filename.
- Regenerating the offline cache (`cargo sqlx prepare`) is required after any schema change for compile-time query verification to work in CI.
