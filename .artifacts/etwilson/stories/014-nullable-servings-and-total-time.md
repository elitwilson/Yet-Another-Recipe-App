---
id: STR-014
title: Nullable servings & total time
epic: EPIC-003
status: specced
priority: high
---

## Goal

Make `servings` and `totalTime` honestly nullable end to end, removing the `0`-as-"unset" sentinel introduced in EPIC-002. This is a no-new-UI foundation story: the parser (STR-015) routinely returns recipes with no servings/time, and the current `0` coercion would silently turn "unknown" into "zero" the moment a parsed draft is saved.

---

## Scope

### In
- `Recipe` and `RecipeInput` (`frontend/src/lib/types/recipe.ts`): change `servings` and `totalTime` from `number` to `number | null`. `EditableRecipe` inherits this.
- Wire mapping (`frontend/src/lib/api/recipes.ts`): `recipeFromWire` stops coercing with `?? 0` — pass `null` through for both fields. Update the misleading comment that documents the `0` sentinel.
- `RecipeForm.svelte`: the Serves / Total time inputs write `null` (not `0`) when emptied. Display still blanks on `null` (the existing `value={draft.servings || ''}` already renders blank for `null`).
- `filter.ts` quickest-sort: confirm `null` sorts last (the existing `|| Infinity` already covers `null`; add/adjust a test rather than refactor if it works).
- `format.ts` `formatTotalTime`: already accepts `number | null | undefined` — confirm with a test, no change expected.
- Verify the backend round-trips `null` for both columns (POST a recipe with null servings/time, read it back).

### Out
- Any new UI or component.
- Backend schema changes — columns are already nullable (per EPIC-003's cleanup note); this story only verifies, it does not migrate.
- Touching the parser or Review panel (later stories).

---

## Acceptance Criteria

- [ ] A recipe with no servings and no total time saves and reloads with `servings === null` and `totalTime === null` — never `0`.
- [ ] The detail view and library card show no time/servings line for a `null` recipe (no "0 min", no "serves 0").
- [ ] The editor form leaves the Serves / Total time fields blank for a `null` recipe and writes `null` (not `0`) when a populated field is cleared.
- [ ] Quickest-sort places `null`-time recipes after all timed recipes.
- [ ] A backend round-trip test confirms `null` persists for both columns.

### Out
-

---

## Context & Decisions

- **Why this is a prerequisite, not cleanup-for-its-own-sake:** the parser (STR-015) returns `servings: null` / `totalTime: null` for the common case of a recipe that doesn't state them. With the `0` sentinel still in place, the Review → Save path would persist `0`, which then renders as "0 min" / "serves 0" and sorts as the quickest recipe. Fixing the type and the form first keeps every later story honest.
- **The wire format is already nullable.** `RecipeWire.servings` / `total_time` are already `number | null`; only the inbound coercion (`?? 0`) and the form's outbound `0` need to change. The DB columns are already nullable. So the change is small and frontend-local — confirm the backend rather than modify it.
- **Sentinel origin:** EPIC-002's editor used `0` for "unset" because `RecipeInput` didn't cleanly support nullable numbers (documented in the EPIC-003 "Cleanup from EPIC-002" section). This story closes that out.

---

## Dependencies

- **Depends on:** none
- **Blocks:** STR-015 (parser draft shape uses nullable meta), STR-016 (Review panel's editable form)

---

## Notes

- Touch points found during planning: `frontend/src/lib/types/recipe.ts`, `frontend/src/lib/api/recipes.ts` (`recipeFromWire` + the sentinel comment), `frontend/src/lib/components/RecipeForm.svelte` (the two `oninput` handlers writing `0`), `frontend/src/lib/library/filter.ts` (quickest sort), `frontend/src/lib/library/format.ts` (already null-safe).
- Existing tests to update/extend: `recipe-form-logic.test.ts`, `filter.test.ts`, `format.test.ts`, and the recipes API client test.
- Watch for any code that compares `servings`/`totalTime` against `0` or relies on truthiness in a way that breaks on `null` — grep before assuming the five touch points above are exhaustive.
</content>
