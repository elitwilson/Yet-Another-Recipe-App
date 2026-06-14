---
number: 015
story: STR-014
status: complete
base_branch: main
depends_on: []
scope_files:
  - frontend/src/lib/types/recipe.ts
  - frontend/src/lib/api/recipes.ts
  - frontend/src/lib/api/recipes.test.ts
  - frontend/src/lib/components/RecipeForm.svelte
  - frontend/src/lib/library/filter.ts
  - frontend/src/lib/library/filter.test.ts
  - frontend/src/lib/library/format.test.ts
  - frontend/src/lib/components/recipe-form-logic.test.ts
  - backend/tests/recipes.rs
---

# Feature: Nullable servings & total time

## Summary
The EPIC-002 editor used `0` as a sentinel for "unset" `servings` and `totalTime` because the frontend `Recipe`/`RecipeInput` types modeled those fields as non-nullable `number`. This story makes both fields honestly `number | null` end to end on the frontend, so "unknown" stays distinct from "zero." This is a no-new-UI prerequisite for the text parser (STR-015), which routinely returns recipes with no stated servings/time — without it, a parsed draft would save as `0` and then render as "0 min" / "serves 0" and sort as the quickest recipe. The wire format and the Rust backend already model both columns as nullable, so this change is frontend-local plus one backend round-trip verification test.

---

## Requirements
- `Recipe.servings`, `Recipe.totalTime`, and therefore `RecipeInput`/`EditableRecipe` are typed `number | null`.
- A recipe fetched from the backend with absent servings/total time arrives as `servings === null` / `totalTime === null` — never coerced to `0`.
- Saving a recipe with empty Serves / Total time fields sends `null` (not `0`) on the wire for those fields.
- Clearing a previously-populated Serves or Total time input writes `null` to the draft.
- The detail view and library card render no servings/time line when the value is `null`.
- Quickest-sort places recipes with `null` total time after all recipes that have a total time.
- `formatTotalTime(null)` returns an empty string.
- A backend integration test confirms a recipe POSTed with `null` servings and `null` total_time reads back with both still `null`.

---

## Scope

### In Scope
- Frontend type change: `servings` / `totalTime` → `number | null` in `recipe.ts`.
- Wire mapping: drop the `?? 0` coercion in `recipeFromWire`; pass `null` through. Replace the misleading sentinel comment above `recipeFromWire`.
- `RecipeForm.svelte`: the two `oninput` handlers write `null` (not `0`) when the input is emptied.
- `filter.ts` quickest-sort: confirm/keep `null`-last behavior (the existing `|| Infinity` already handles `null`); cover it with a test.
- Test updates: `recipes.test.ts`, `recipe-form-logic.test.ts`, `filter.test.ts`, `format.test.ts`.
- Backend: add an integration test in `backend/tests/recipes.rs` round-tripping `null` servings/total_time.

### Out of Scope
- Any new UI or component.
- Backend schema or model changes — `servings`/`total_time` are already `Option<i32>` and the DB columns are already nullable. This story only verifies.
- Touching the parser, Review panel, or any later-story code.
- A "new recipe" / blank-draft route (does not exist yet).

---

## Technical Approach
- **Entry points / interfaces:**
  - `frontend/src/lib/types/recipe.ts` — the type definitions every consumer flows through.
  - `frontend/src/lib/api/recipes.ts` `recipeFromWire` — the single inbound coercion point.
  - `frontend/src/lib/components/RecipeForm.svelte` — the only outbound write point (two `oninput` handlers).
- **Key modules / components:**
  - `recipe.ts`: change `servings: number` → `servings: number | null` and `totalTime: number` → `totalTime: number | null`. `RecipeInput` (`Omit`) and `EditableRecipe` inherit automatically.
  - `recipes.ts`: `servings: w.servings ?? 0` → `servings: w.servings` and likewise for `totalTime`. The `RecipeWire` interface is already `number | null` and `recipeToWire` already passes the value straight through, so no change there. Update the comment block above `recipeFromWire` (currently documents the `0` sentinel) to state that `null` now passes through unchanged.
  - `RecipeForm.svelte`: in both handlers change `v ? parseInt(v, 10) : 0` → `v ? parseInt(v, 10) : null`. The `value={draft.servings || ''}` / `value={draft.totalTime || ''}` bindings already render blank for `null`, so no template change.
- **Already-correct consumers (verify, do not change):**
  - Detail view `routes/recipes/[id]/+page.svelte` guards with `{#if recipe.servings}` / `{#if recipe.totalTime}` — falsy for both `0` and `null`, so it already hides the line.
  - `RecipeCard.svelte` renders via `formatTotalTime`, which returns `''` for `null` and is guarded by `{#if formattedTime}`.
  - `routes/recipes/[id]/edit/+page.svelte` copies `data.recipe.servings`/`totalTime` straight into the draft — same field type, flows cleanly.
- **Data model:** Frontend `servings: number | null`, `totalTime: number | null`. Wire `servings: number | null`, `total_time: number | null` (already so). Backend `Option<i32>` for both (already so).
- **Key design decisions:** Keep the change minimal and type-driven — the type widening plus removing one coercion and changing one form default is the whole behavioral change; everything else is test coverage and a backend verification test. Do not refactor the `|| Infinity` sort or the `|| ''` form bindings; they already behave correctly for `null`.

---

## Success Criteria
- [ ] `recipe.ts` types both fields as `number | null`; `tsc`/`svelte-check` passes with no new errors.
- [ ] `recipeFromWire` returns `null` (not `0`) when the wire field is `null`, proven by a test in `recipes.test.ts`.
- [ ] Emptying a populated Serves/Total time input writes `null` to the draft (form-handler logic test).
- [ ] `formatTotalTime(null)` returns `''` (test).
- [ ] Quickest-sort orders a `null`-time recipe after timed recipes (test in `filter.test.ts`).
- [ ] Backend integration test in `recipes.rs` POSTs `null` servings/total_time and asserts both read back as `null`.
- [ ] Full frontend test suite and `cargo test --test recipes` pass.

---

## Tasks
Ordered by dependency.

- [ ] **Widen types and inbound mapping:** In `frontend/src/lib/types/recipe.ts` change `servings` and `totalTime` to `number | null`. In `frontend/src/lib/api/recipes.ts` remove the `?? 0` coercion in `recipeFromWire` (pass `null` through) and rewrite the sentinel comment above it to describe pass-through behavior. Update `recipes.test.ts` to add a wire fixture with `servings: null` / `total_time: null` and assert it maps to `null` (alongside the existing populated case). Must compile/typecheck before the next task.
- [ ] **Form writes null on empty:** In `frontend/src/lib/components/RecipeForm.svelte` change both `oninput` handler defaults from `0` to `null`. Add/extend coverage in `recipe-form-logic.test.ts` (or the relevant form-handler test) asserting that clearing a populated field yields `null`. Note: if the handler logic is inline-only in the SFC, assert the behavior through whatever test seam the existing form tests use; do not introduce a new component test if a logic-level test suffices.
- [ ] **Confirm sort and format are null-safe:** Add a test to `filter.test.ts` proving quickest-sort places a `null`-totalTime recipe after timed recipes, and a test to `format.test.ts` proving `formatTotalTime(null)` returns `''`. No source change expected for `filter.ts`/`format.ts` — if a test reveals a defect, fix it minimally without refactoring the `|| Infinity` / `!minutes` guards.
- [ ] **Backend round-trip verification:** Add a `#[tokio::test]` to `backend/tests/recipes.rs` that POSTs a recipe body with `"servings": null` and `"total_time": null`, then reads it back (via the POST response and/or a follow-up GET) and asserts both are `null` in the JSON. Follow the existing `recipe_body()` / `unique_title()` patterns. No model or migration change.

---

## Considerations
- The detail view and card already use truthiness guards (`{#if recipe.servings}`, `{#if formattedTime}`), so they hide correctly for `null` — but they also hid for the old `0`. The acceptance criterion "no 0 min / serves 0" is satisfied by the absence of any `0`-valued recipe after this change, not by new guard logic.
- `value={draft.servings || ''}` uses `||`, so a legitimate `0` would also render blank — acceptable here since `0` servings/time is not a meaningful value and the field is now `null` for "unset."
- Grep confirmed the only `0`-comparison/truthiness sites for these fields are the five touch points named in the story; no other code compares `servings`/`totalTime` against `0`.
- The backend test requires a live Postgres (`DATABASE_URL`, default `postgres://yara:yara@localhost:5433/yara`) per the header comment in `recipes.rs`; it runs in the same harness as the existing integration tests.
- `recipeToWire` already forwards `servings`/`totalTime` unchanged, so a `null` draft serializes to `null` on the wire with no mapping change.
