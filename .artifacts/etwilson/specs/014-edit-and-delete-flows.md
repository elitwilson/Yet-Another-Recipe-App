---
number: 014
story: STR-013
status: complete
base_branch: main
depends_on: ["STR-011", "STR-012"]
scope_files:
  - frontend/src/routes/recipes/[id]/+page.svelte
  - frontend/src/routes/recipes/[id]/edit/+page.svelte
  - frontend/src/routes/recipes/[id]/edit/+page.ts
  - frontend/src/lib/components/ui/dialog/**
  - frontend/src/lib/components/RecipeForm.svelte
  - frontend/src/lib/components/RecipeDetail.test.ts
  - frontend/package.json
---

# Feature: Edit & Delete Flows

## Summary
Wire up the edit and delete interactions on the recipe detail view (`/recipes/[id]`) so a user can update or remove a recipe, completing the full CRUD loop for the library. The "Edit" button placed by STR-011 navigates to a separate `/recipes/[id]/edit` sub-route that renders the pre-populated `RecipeForm` (STR-012); "Save" calls `updateRecipe` and, on success, redirects back to the read-only detail view showing server-confirmed data. The "Delete" button opens a shadcn-svelte confirmation Dialog on the detail view; confirming calls `deleteRecipe` and redirects to the library (`/`). Save is disabled while the draft is invalid, both operations show a loading state, and a failed call surfaces an inline error without navigating away.

---

## Requirements
- Clicking "Edit" on the detail view navigates to `/recipes/[id]/edit`, which renders `RecipeForm` pre-populated with the current recipe's fields (title, servings, totalTime, tags, ingredients, steps, notes).
- All recipe fields are editable through the form while in edit mode.
- The "Save" button is disabled whenever the draft is invalid — valid means a non-empty title, at least one ingredient with a non-empty item, and at least one non-empty step. Validity is read from `RecipeForm`'s exposed validation state, not re-derived here.
- Clicking "Save" on a valid draft calls `updateRecipe(id, input)` (`PUT /api/recipes/:id`).
- On a successful save, the user is redirected to `/recipes/[id]` (the read-only detail view) which re-fetches and renders server-confirmed data (no optimistic update).
- If `updateRecipe` rejects, an error message renders and the view stays in edit mode with the user's draft intact (no navigation).
- "Cancel" on the edit route navigates back to `/recipes/[id]` and silently discards unsaved edits — no confirmation dialog.
- Clicking "Delete" opens a confirmation Dialog with a destructive warning and two actions: a destructive confirm and a cancel.
- Confirming delete calls `deleteRecipe(id)` (`DELETE /api/recipes/:id`) and, on success, redirects to `/`.
- Cancelling the delete Dialog (or dismissing it) closes it and returns to the detail view with no change.
- If `deleteRecipe` rejects, an error message renders and the user remains on the detail view (no redirect).
- A loading indicator renders while the save call is in flight, and while the delete call is in flight; the relevant action buttons are disabled during the call to prevent double-submit.

---

## Scope

### In Scope
- `/recipes/[id]/edit` sub-route: `+page.ts` load function (re-fetches the recipe to pre-populate the form), `+page.svelte` rendering `RecipeForm` with Save/Cancel behavior.
- Delete confirmation Dialog on the detail view (`/recipes/[id]`) and its confirm/cancel wiring, including the post-confirm redirect to `/`.
- Save-disabled-when-invalid binding to `RecipeForm`'s validation state.
- Loading and error states for both the save and delete operations.
- Generating the shadcn-svelte `dialog` component into `frontend/src/lib/components/ui/dialog/` (it does not exist yet) — or adding `bits-ui`-backed Dialog primitives following the existing `button`/`card` registry convention.

### Out of Scope
- The read-only detail view itself, the route, and its load/error states — owned by STR-011. This story extends that route; it does not rebuild it.
- The `RecipeForm` component internals (fields, TagInput, ingredient/step rows, drag-reorder, validation logic) — owned by STR-012. This story consumes it as a controlled component.
- The API client functions `updateRecipe` / `deleteRecipe` — owned by STR-009 (spec 010). This story calls them.
- Discard/cancel confirmation — explicitly out; navigating away discards silently.
- Optimistic updates — explicitly out; the view reflects the server response.
- Create flow / "Add recipe" — not in this epic.

---

## Technical Approach
- **Entry points / interfaces:** The "Edit" button on the detail page (`/recipes/[id]`, STR-011) is a link to `/recipes/[id]/edit`. This story creates the edit sub-route. The "Delete" button remains on the detail page — this story wires it there. The app is a client-side SPA (`ssr = false`, `csr = true` in `+layout.ts`), so all mutation and navigation happen client-side.
- **Edit sub-route:** `frontend/src/routes/recipes/[id]/edit/+page.ts` exports a `load` function that calls `fetchRecipe(params.id)` and returns `{ recipe }` (same pattern as the detail view's load — re-fetches the recipe fresh for the edit form). `frontend/src/routes/recipes/[id]/edit/+page.svelte` seeds a local editable draft from the loaded recipe and renders `RecipeForm`. Cancel navigates to `/recipes/[id]` via `goto`. Save calls `updateRecipe`, and on success navigates to `/recipes/[id]` (which re-fetches via its own load, showing server-confirmed state).
- **Draft state:** Seed the draft from the loaded recipe with a deep copy of nested arrays (`ingredients`, `steps`, `tags`) so edits don't mutate the load data (important: a failed save must leave the draft intact for the user to correct). `RecipeForm` is controlled — it receives the draft and emits changes per STR-012's contract (prop in / change out, or `bind:`). The edit page owns the draft; `RecipeForm` does not save.
- **Save:** Build a `RecipeInput` from the draft (drop `id`/`createdAt`), set a `saving` `$state` true, call `await updateRecipe(id, input)`. On success, `goto('/recipes/[id]')`. On rejection, set an error string and stay on the edit page with draft intact. `finally` clears `saving`. The Save button's `disabled` is `!formValid || saving`.
- **Delete:** A `confirmingDelete` `$state<boolean>` on the detail page controls the Dialog open state. The destructive confirm handler sets a `deleting` `$state`, calls `await deleteRecipe(id)`, and on success uses `goto('/')`. On rejection, set an error on the detail view. Cancel sets `confirmingDelete = false`.
- **Dialog component:** Use shadcn-svelte's `Dialog` (backed by the already-installed `bits-ui@^2.18.1`). The `dialog` registry component is not yet generated under `frontend/src/lib/components/ui/`; generate/add it following the same structure as the existing `button` and `card` directories, then import it on the detail page. The destructive confirm button reuses the existing `Button` with the destructive variant.
- **Data model:** Consumes `Recipe` and `RecipeInput` from `$lib/types/recipe` (spec 010). `RecipeInput = Omit<Recipe, 'id' | 'createdAt'>`. No new types are introduced by this story.
- **Key design decisions:**
  - **Separate `/recipes/[id]/edit` sub-route** — matches SvelteKit's file-based routing idiom, keeps the detail view permanently read-only, gives edit its own URL (back-button navigates from edit to detail naturally), and avoids a mode flag on the detail component. Aligns with spec 012's explicit decision.
  - **Server state after save, not optimistic** — per epic decision; navigating back to the detail view re-fetches, guaranteeing it reflects what the server persisted.
  - **Deep-copied draft** — so a failed save leaves the draft intact for the user to correct.

---

## Success Criteria
- [ ] Clicking "Edit" shows `RecipeForm` pre-populated with every current field; the read-only view is hidden.
- [ ] Editing any field updates the draft without mutating the underlying loaded recipe.
- [ ] The "Save" button is disabled when the draft is invalid (empty title, or no non-empty ingredient item, or no non-empty step) and enabled when valid.
- [ ] Saving a valid draft calls `updateRecipe(id, input)` with a `RecipeInput` body and, on success, returns to the read-only view rendering the response data.
- [ ] A rejected save renders an error message and keeps the form open with the draft intact — no navigation.
- [ ] Clicking "Delete" opens a Dialog with a destructive warning, a destructive confirm button, and a cancel button.
- [ ] Confirming delete calls `deleteRecipe(id)` and, on success, navigates to `/`.
- [ ] Cancelling/dismissing the Dialog closes it and leaves the detail view unchanged (no API call).
- [ ] A rejected delete renders an error and keeps the user on the detail view.
- [ ] A loading indicator renders during save and during delete; the action buttons are disabled while their call is in flight.
- [ ] `npm run test` passes (logic-level tests for save/delete/validation wiring) and `npm run check` passes with no type errors and no `any`.

---

## Tasks
Ordered by dependency.

- [ ] **Add the Dialog UI component:** Generate/add the shadcn-svelte `dialog` component into `frontend/src/lib/components/ui/dialog/` (backed by the installed `bits-ui`), matching the structure and export convention of the existing `button` and `card` components. Verify it imports and renders. No app wiring yet. Must exist before the delete flow can use it.
- [ ] **Write failing tests for the edit/delete wiring (RED):** Add `frontend/src/lib/components/RecipeDetail.test.ts` (or extend STR-011's detail-page test file if one exists — match the directory's convention). Mock `updateRecipe`/`deleteRecipe` from `$lib/api/recipes` and `goto` from `$app/navigation` via `vi.mock`. Cover: Save disabled while invalid / enabled while valid; Save calls `updateRecipe` with the right `RecipeInput` and returns to read-only on success; failed Save surfaces an error and stays in edit mode; confirming delete calls `deleteRecipe` then `goto('/')`; cancelling the dialog makes no API call; failed delete surfaces an error and does not navigate. Drive validity via `RecipeForm`'s exposed validation state. Tests must fail for the right reason (wiring absent).
- [ ] **Implement edit flow (GREEN):** Create `frontend/src/routes/recipes/[id]/edit/+page.ts` with a `load` function calling `fetchRecipe(params.id)` (same pattern as the detail view). Create `frontend/src/routes/recipes/[id]/edit/+page.svelte`: deep-copy the loaded recipe into a draft `$state`, render `RecipeForm` bound to the draft, wire Save (build `RecipeInput`, call `updateRecipe`, `goto('/recipes/[id]')` on success, error on failure, `saving` loading state) and Cancel (`goto('/recipes/[id]')`). Bind Save `disabled` to `!formValid || saving`. Update the "Edit" button/link in the detail view to point to `/recipes/[id]/edit`.
- [ ] **Implement delete flow (GREEN):** Wire the "Delete" button to open the Dialog; implement confirm (`deleting` state, `deleteRecipe(id)`, `goto('/')` on success, error on failure) and cancel (close, no-op). Disable the confirm button while `deleting`. Make all tests from the RED task pass.

---

## Considerations
- **Edit sub-route alignment with STR-011:** Spec 012 (STR-011) explicitly chose the `/recipes/[id]/edit` sub-route and documents it as the key design decision. This spec aligns with that choice. The detail view (`+page.svelte`) remains permanently read-only; the "Edit" button in that view is a link/anchor to `/recipes/[id]/edit`. No inline toggle on the detail view.
- **`RecipeForm` contract dependency:** This story relies on STR-012 exposing (a) a way to pass in a pre-populated draft and (b) a validation-state signal the parent can read to gate the Save button. STR-012's spec defines the exact prop/event/`bind` shape; consume whatever it lands — do not assume a specific signature here. The executor sequences STR-012 first.
- **Deep copy the draft:** `Recipe` has array (`ingredients`, `steps`, `tags`) and object (`source`) fields. A shallow `{ ...recipe }` still shares those nested references — edits would mutate the loaded recipe, breaking the "failed save leaves original intact" requirement. Deep-copy the mutable nested structures when seeding the draft.
- **`RecipeInput` excludes `id`/`createdAt`:** Build the PUT body via the `RecipeInput` (`Omit`) type from spec 010; do not send `id` or `createdAt` even though the draft carries them.
- **Client-side navigation:** Use SvelteKit's `goto` from `$app/navigation` for the post-delete redirect (SPA mode, `ssr = false`); do not use a full-page `window.location` change.
- **No double-submit:** Disable Save while `saving` and the delete-confirm while `deleting`; the loading-state requirement and double-submit guard are the same mechanism.
- **Testing approach:** Per the project's Vue/Svelte testing rules, prioritize logic-level wiring tests over deep DOM simulation — assert that the correct API client function and `goto` are called with the right arguments and that state transitions (editing/saving/deleting/error) behave, rather than testing `RecipeForm`'s internals (STR-012's job).
