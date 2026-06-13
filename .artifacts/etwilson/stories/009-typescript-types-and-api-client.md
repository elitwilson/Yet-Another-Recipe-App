---
id: STR-009
title: TypeScript types & API client
epic: EPIC-002
status: specced
priority: high
---

## Goal

Define the canonical TypeScript interfaces matching the production schema and the complete set of API client functions the frontend needs to interact with all five endpoints. Everything that touches recipes on the frontend builds on these.

---

## Scope

### In
- `Recipe`, `Ingredient`, `RecipeSource` TypeScript interfaces in `frontend/src/lib/types/recipe.ts` (replace existing placeholder)
- `RecipeInput` type for create/update payloads (all recipe fields minus `id` and `createdAt`)
- API client functions in `frontend/src/lib/api/recipes.ts`: `fetchRecipes`, `fetchRecipe(id)`, `createRecipe(data)`, `updateRecipe(id, data)`, `deleteRecipe(id)`
- Unit tests for all API client functions (mocking `fetch`)

### Out
- Svelte components or stores
- Backend types
- Any UI

---

## Acceptance Criteria

- [ ] `Recipe` interface has all production fields: `id`, `title`, `servings`, `totalTime`, `tags`, `favorite`, `ingredients` (typed `Ingredient[]`), `steps`, `notes`, `source` (typed `RecipeSource`), `createdAt`
- [ ] `Ingredient` interface has `qty: string`, `unit: string`, `item: string`
- [ ] `RecipeSource` interface covers all fields: `type: 'url' | 'paste' | 'manual'`, `host?: string`, `url?: string`, `method?: string`
- [ ] No `any` anywhere in types or API client
- [ ] All five API client functions are exported and fully typed
- [ ] Non-ok HTTP responses throw with a descriptive message (following existing `fetchRecipes` pattern)
- [ ] Unit tests pass for success and error paths for each function

---

## Context & Decisions

- **camelCase in TypeScript** even if the DB column is snake_case (`totalTime`, `createdAt`). The backend serialization layer handles the mapping — confirm the Rust `serde` rename strategy is consistent.
- **No `any`** — all types must be fully specified per the TypeScript code style rules.
- **Follow the existing pattern** in `frontend/src/lib/api/recipes.ts`: fetch → check `response.ok` → throw on error → return typed JSON.
- `RecipeSource` can be a single interface with optional fields or a discriminated union — whichever makes consuming code cleaner; the architect should pick one and be consistent.

---

## Dependencies

- **Depends on:** STR-007 (schema defines the types)
- **Blocks:** STR-010 (library view), STR-011 (detail view), STR-012 (editor form)

---

## Notes

- The existing `Recipe` interface (`{ id: number; name: string }`) and `fetchRecipes` function are replaced wholesale — not extended alongside.
- The existing `frontend/src/lib/api/recipes.test.ts` file should be updated to cover the full function set.
- `lowConf` is a parser-side field on `Ingredient` (added in EPIC-003) — do not add it to the type here. The EPIC-003 story will extend `Ingredient` at that point.
