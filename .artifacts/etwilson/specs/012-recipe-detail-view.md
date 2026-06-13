---
number: 012
story: STR-011
status: complete
base_branch: main
depends_on: [STR-008, STR-009]
scope_files:
  - frontend/src/routes/recipes/[id]/+page.ts
  - frontend/src/routes/recipes/[id]/+page.svelte
  - frontend/src/routes/recipes/[id]/+error.svelte
  - frontend/src/lib/utils/time.ts
  - frontend/src/lib/utils/time.test.ts
---

# Feature: Recipe Detail View

## Summary
Adds a read-only recipe detail page at `/recipes/[id]` that displays every field of a single recipe: title, servings, formatted total time, tags, ingredients (qty + unit + item per row), numbered steps, and notes. The page loads its data through a SvelteKit `+page.ts` load function calling `fetchRecipe(id)`, renders a loading state during navigation, and surfaces a distinct "not found" (404) state versus a generic error state via a `+error.svelte` boundary. It also establishes the `/recipes/[id]` route and load pattern that the edit and delete flows (STR-013) will extend, and renders non-functional "Edit" and "Delete" buttons plus a back link to the library (`/`).

---

## Requirements
- Navigating to `/recipes/[id]` loads the recipe via `fetchRecipe(id)` in a `+page.ts` load function and renders all fields.
- The view renders: title, servings, formatted total time, tags, the ingredient list (each row showing qty + unit together in a monospace column and item as the main label), numbered steps, and notes.
- Total time is rendered through a reusable formatting helper that converts a minute count into a human-readable label (e.g. `90` → `1h 30m`, `45` → `45m`).
- A loading state renders while the load function is in flight during client-side navigation.
- When the recipe ID does not exist, the page renders a distinct 404 / "recipe not found" state.
- Any other load failure renders a generic error state.
- A back link returns the user to the library at `/`.
- "Edit" and "Delete" buttons are present in the layout but non-functional in this story (wired in STR-013).
- Optional fields render conditionally: the notes section renders only when the recipe has at least one note; tags, servings, and total time render only when present.

---

## Scope

### In Scope
- SvelteKit route directory `frontend/src/routes/recipes/[id]/` with `+page.ts`, `+page.svelte`, and `+error.svelte`.
- Read-only display of all `Recipe` fields per the prototype `RecipeView` behavioral reference.
- A `formatTime(minutes)` utility in `frontend/src/lib/utils/time.ts` with unit tests.
- Loading, 404, and generic-error states.
- Back navigation to `/`.
- Presence (not behavior) of Edit and Delete controls.

### Out of Scope
- Edit functionality and the `/recipes/[id]/edit` route itself (STR-013).
- Delete functionality (STR-013).
- Provenance / source pill (deferred to EPIC-003).
- The `Recipe`/`Ingredient`/`RecipeSource` types and `fetchRecipe` client function — owned by STR-009; this story consumes them.
- The `GET /api/recipes/:id` endpoint — owned by STR-008.

---

## Technical Approach
- **Entry point:** `frontend/src/routes/recipes/[id]/+page.ts` exports a `load` function that reads `params.id`, calls `fetchRecipe(params.id)`, and returns `{ recipe }`. The project runs `ssr = false` / `csr = true` globally (`frontend/src/routes/+layout.ts`) under `adapter-static` with a `200.html` SPA fallback, so this load executes in the browser — no server load file is needed.
- **404 vs generic error:** `fetchRecipe` throws on non-ok responses (STR-009 contract). In the load function, catch the thrown error, inspect its message/status, and re-throw via SvelteKit's `error(404, ...)` helper when the response was a 404, otherwise `error(500, ...)`. A co-located `+error.svelte` reads `page.status` / `page.error` and renders the not-found copy when status is 404 and a generic message otherwise. This keeps the happy-path component free of error branching.
  - Note: `fetchRecipe` (per STR-009) throws a generic `Error` whose message includes the status code (following the existing `fetchRecipes` pattern, e.g. `Failed to fetch recipe: 404`). Detect 404 by checking for the `404` status in that error rather than relying on a typed status field. If STR-009 lands with a richer error shape, prefer the status field — but do not depend on one that may not exist.
- **Loading state:** During client-side navigation SvelteKit exposes navigation state; render the loading indicator using `$app/state`'s `navigating` (or the page-level await of load data). A simple "Loading recipe…" indicator matching the library page's existing `text-muted-foreground` treatment is sufficient.
- **Display component:** `+page.svelte` receives `data.recipe` via `$props()` and renders idiomatic Svelte 5 (runes mode, `$state`/`$props`) mirroring the prototype `RecipeView` layout — NOT a port of the JSX. Use Tailwind utility classes consistent with the existing `+page.svelte` and the `mono` / `muted-foreground` design tokens. Ingredient rows: a fixed-width monospace column showing `[qty, unit].filter(Boolean).join(' ') || '—'`, then the item label. Steps: numbered ordered list with the index badge. Notes: bulleted list rendered only when `recipe.notes.length > 0`.
- **Edit/Delete controls:** Render using the existing `Button` component (`$lib/components/ui/button`). It supports anchor attributes, so STR-013 can later turn Edit into an `href` to `/recipes/[id]/edit`. In this story they are present but inert (disabled or no-op).
- **Time helper:** `frontend/src/lib/utils/time.ts` exports `formatTime(minutes: number): string`. Pure function, unit-tested. The prototype references `fmtTime`; this story owns the real implementation since STR-009 scopes only types + API client.

### Key design decision — edit location (required by EPIC-002)
**Edit lives at a separate `/recipes/[id]/edit` sub-route, NOT an inline toggle on the detail page.** STR-013 should add `frontend/src/routes/recipes/[id]/edit/+page.svelte` (and its load) as a sibling route reusing the same data-loading pattern established here; the detail page remains permanently read-only and its "Edit" button becomes a link to that sub-route. Rationale: it matches SvelteKit's file-based routing idiom, keeps the read view free of editor state, gives edit its own URL (shareable, back-button friendly), and avoids a mode flag threading through this component. STR-013 depends on this choice.

### Data model
Consumes the STR-009 `Recipe` interface: `id`, `title`, `servings`, `totalTime`, `tags`, `favorite`, `ingredients` (`Ingredient[]` of `{ qty: string; unit: string; item: string }`), `steps` (`string[]`), `notes` (`string[]`), `source` (`RecipeSource`), `createdAt`. This view reads title, servings, totalTime, tags, ingredients, steps, and notes; it does not render `favorite`, `source`, or `createdAt`.

---

## Success Criteria
- [ ] `/recipes/[id]` renders a recipe's title, servings, formatted total time, tags, ingredient rows (qty+unit monospace column + item label), numbered steps, and notes.
- [ ] Total time renders via `formatTime` (e.g. 90 → "1h 30m", 45 → "45m"); the helper's unit tests pass.
- [ ] Visiting an unknown ID renders the 404 "recipe not found" state (not the generic error).
- [ ] A non-404 load failure renders the generic error state.
- [ ] A loading indicator shows during navigation before data resolves.
- [ ] The back link navigates to `/`.
- [ ] Edit and Delete buttons are visible in the layout.
- [ ] Notes section is absent when the recipe has no notes; tags/servings/total-time sections are absent when those fields are empty/null.

---

## Tasks
Ordered by dependency.

- [ ] **`formatTime` helper + tests:** Create `frontend/src/lib/utils/time.ts` exporting `formatTime(minutes: number): string` and `frontend/src/lib/utils/time.test.ts`. Cover: minutes only (`45` → "45m"), exact hours (`120` → "2h"), hours + minutes (`90` → "1h 30m"), and the zero/edge case. Fully tested before the component task uses it.
- [ ] **Load function:** Create `frontend/src/routes/recipes/[id]/+page.ts` with a `load` that calls `fetchRecipe(params.id)`, returns `{ recipe }`, and translates a 404 failure into `error(404, …)` and other failures into `error(500, …)`.
- [ ] **Error boundary:** Create `frontend/src/routes/recipes/[id]/+error.svelte` that renders a "recipe not found" message when `page.status === 404` and a generic error message otherwise, each with a back link to `/`.
- [ ] **Detail view component:** Create `frontend/src/routes/recipes/[id]/+page.svelte` rendering all fields per the prototype `RecipeView` layout (conditional tags/servings/time/notes), the loading indicator, the back link, and inert Edit/Delete buttons via the `Button` component.

---

## Considerations
- `params.id` arrives as a string from the route; `fetchRecipe` (STR-009) takes the id — pass it as the client signature expects. If the client takes a `number`, coerce with `Number(params.id)` and treat a `NaN` result as a 404 rather than issuing a bad request.
- Because the app is `csr`-only with a `200.html` fallback, a hard refresh on `/recipes/[id]` is served the SPA shell and the client load runs — so the loading and error states must be robust to a cold client-side fetch, not just in-app navigation.
- Do not port the prototype's inline `style={{…}}` objects or its React drag-reorder/editor components — those belong to the editor (STR-012), not this read-only view. Use Tailwind classes and the existing design tokens.
- The prototype's `Stat` row (clock / users / ingredient-count chips) is the intended header treatment; reproduce it idiomatically but it is not a hard acceptance requirement beyond showing servings and formatted total time.
- Keep the load/error pattern clean and minimal — STR-013 will extend this exact route directory, so avoid baking in anything edit-specific now.

---
