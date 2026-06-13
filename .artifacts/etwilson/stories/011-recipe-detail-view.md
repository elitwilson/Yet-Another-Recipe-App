---
id: STR-011
title: Recipe detail view
epic: EPIC-002
status: specced
priority: high
---

## Goal

Add the read-only recipe detail page at `/recipes/[id]` so users can view all fields of a single recipe. Also establishes the route and data-loading pattern that the edit and delete flows (STR-013) will extend.

---

## Scope

### In
- SvelteKit route at `/recipes/[id]`
- Read-only display of all recipe fields: title, servings, total time (formatted), tags, ingredients (each as qty + unit + item), numbered steps, notes
- Loading state while fetching
- Error state including 404 (recipe not found)
- Back navigation to the library (`/`)
- "Edit" and "Delete" buttons present in the UI (wired in STR-013 — can be visible but non-functional or disabled in this story)

### Out
- Edit functionality (STR-013)
- Delete functionality (STR-013)
- Provenance pill (deferred to EPIC-003)

---

## Acceptance Criteria

- [ ] Navigating to `/recipes/[id]` fetches the recipe via `fetchRecipe(id)` and renders all fields
- [ ] Title, servings, formatted total time, tags, ingredient list (qty + unit + item per row), numbered steps, and notes all render correctly
- [ ] Loading state renders while the fetch is in progress
- [ ] 404 state renders when the recipe ID does not exist
- [ ] Generic error state renders on other fetch failures
- [ ] Back link returns to `/` (the library)
- [ ] "Edit" and "Delete" buttons are present in the layout

---

## Context & Decisions

- **`recipe-form.jsx` → `RecipeView` component** in `.artifacts/etwilson/design/prototype/` is the behavioral reference for the field layout and ingredient/step display. Implement idiomatically in Svelte.
- **Ingredient display**: `qty` and `unit` displayed together in a fixed-width monospace column (e.g. `"400 g"`); `item` as the main readable label. Match the prototype's column layout.
- **SvelteKit data loading pattern**: use a `+page.ts` load function with `fetchRecipe(params.id)` rather than fetching inside `onMount`. This enables proper error handling via SvelteKit's error page conventions.

---

## Dependencies

- **Depends on:** STR-008 (`GET /api/recipes/:id` endpoint), STR-009 (types + API client)
- **Blocks:** STR-013 (edit and delete flows extend this route)

---

## Notes

- The architect should decide here whether edit will live as an inline toggle on this route (a `$state` boolean switching between `RecipeView` and `RecipeForm`) or as a separate `/recipes/[id]/edit` sub-route. Either is valid; document the choice so STR-013 can depend on it. Inline toggle is lower friction; separate route is cleaner for browser history and direct linking.
- Notes field is optional — render the section only when `recipe.notes.length > 0`.
