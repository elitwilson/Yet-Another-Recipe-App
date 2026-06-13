---
id: STR-010
title: Library view
epic: EPIC-002
status: specced
priority: high
---

## Goal

Deliver the recipe library: a card grid with real-time search, sort, and favorites filtering that gives the user a fast, scannable view of their collection. This is the app's home screen and the primary navigation surface.

---

## Scope

### In
- Route at `/` (replaces the throwaway page)
- Card grid: each card shows title, total time (formatted), tags, and a favorite indicator
- Favorite toggle on each card — persists via `updateRecipe`
- Search: client-side, real-time filter across title, tags, and ingredient item names
- Sort control: recent (default) / A–Z / quickest; applied to the filtered set
- Favorites filter: toggle to show only favorited recipes; composable with search and sort
- Empty state: shown when no recipes exist or when no search results match
- Clicking a card navigates to `/recipes/[id]`
- Loading and error states on initial fetch

### Out
- "Add recipe" button — no Create UI in this epic
- Provenance pill on cards — deferred to EPIC-003 (activates when multiple source types exist)
- Pagination
- Server-side search

---

## Acceptance Criteria

- [ ] Library loads all recipes from `GET /api/recipes` on mount and renders them as cards
- [ ] Each card shows title, formatted total time, tags, and a favorite indicator
- [ ] Clicking a card navigates to `/recipes/[id]`
- [ ] Favoriting a card calls `updateRecipe` and the UI reflects the new state immediately
- [ ] Search input filters visible cards in real time across title, tag values, and ingredient item names
- [ ] Sort control switches order between recent / A–Z / quickest
- [ ] Search and sort and favorites filter compose correctly (sort the filtered set)
- [ ] Empty state renders for: (a) no recipes at all, (b) search returns no results
- [ ] Loading state renders while the initial fetch is in progress
- [ ] Error state renders if the initial fetch fails

---

## Context & Decisions

- **Client-side filtering**: all recipes are loaded upfront; no server-side search endpoint. Acceptable for a personal library.
- **`library.jsx`** in `.artifacts/etwilson/design/prototype/` is the behavioral reference for card layout, search, sort, and favorites interactions. Implement idiomatically in Svelte — do not port the React code.
- State for search query, sort selection, and favorites-only toggle can live in `$state` runes on the page or in a lightweight Svelte store if shared state is needed later.

---

## Dependencies

- **Depends on:** STR-008 (list endpoint), STR-009 (types + API client)
- **Blocks:** none

---

## Notes

- The existing `+page.svelte` is the throwaway library — replace it entirely.
- The favorite toggle needs `updateRecipe` from the API client (STR-009). The update payload should send the full recipe with `favorite` flipped — or, if it's cleaner, a minimal PATCH-style call. Either works since `PUT` is a full replace; just make sure all fields round-trip correctly.
- The sort option "quickest" sorts by `totalTime` ascending; recipes with no `totalTime` should sort last.
