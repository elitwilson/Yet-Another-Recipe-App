---
number: 011
story: STR-010
status: complete
base_branch: main
depends_on: ["STR-008", "STR-009"]
scope_files:
  - frontend/src/routes/+page.svelte
  - frontend/src/lib/components/library/RecipeCard.svelte
  - frontend/src/lib/components/library/RecipeCard.test.ts
  - frontend/src/lib/components/library/LibraryControls.svelte
  - frontend/src/lib/components/library/EmptyState.svelte
  - frontend/src/lib/library/filter.ts
  - frontend/src/lib/library/filter.test.ts
  - frontend/src/lib/library/format.ts
  - frontend/src/lib/library/format.test.ts
---

# Feature: Recipe Library View

## Summary
The recipe library is YARA's home screen at `/` and its primary navigation surface. It loads the user's full recipe collection on mount and renders it as a scannable card grid. Each card shows the recipe title, formatted total time, tags, and a favorite indicator that can be toggled in place. A control bar above the grid offers real-time client-side search (across title, tags, and ingredient item names), a sort selector (recent / A–Z / quickest), and a favorites-only filter — all composing together over the loaded set. Loading, error, empty-library, and no-search-results states are all handled. Clicking a card navigates to the recipe detail route. The governing principle is low friction: everything happens over data already in memory, with no extra round trips beyond the initial fetch and the favorite-toggle persistence.

---

## Requirements
- On mount, the page fetches all recipes via the API client's list call and renders them as a card grid.
- A loading state renders while the initial fetch is in progress.
- An error state renders if the initial fetch fails.
- Each card displays: the recipe title, the formatted total time, the recipe's tags, and a favorite indicator reflecting current favorite state.
- Clicking anywhere on a card (other than the favorite control) navigates to `/recipes/[id]`.
- Each card has a favorite toggle. Activating it calls the API client's update call with the full recipe and the `favorite` flag flipped, and the UI reflects the new favorite state immediately. Activating the favorite toggle must not trigger card navigation.
- A search input filters the visible cards in real time. A recipe matches if the query (case-insensitive, trimmed) is a substring of its title, any of its tags, or any of its ingredients' item names.
- A sort control offers three orderings applied to the filtered set:
  - **recent** (default): newest first, by creation time descending.
  - **A–Z**: by title, case-insensitive ascending.
  - **quickest**: by total time ascending; recipes with no total time sort last.
- A favorites-only toggle, when active, restricts the visible set to favorited recipes.
- Search, sort, and favorites-only compose correctly: the favorites filter and search filter both narrow the set, and the sort orders whatever remains.
- An empty state renders when (a) the user has no recipes at all, and (b) a search/filter combination returns no matching recipes. These two cases may render distinct messaging.

---

## Scope

### In Scope
- Replacing the throwaway `frontend/src/routes/+page.svelte` entirely with the library view.
- The card grid and individual recipe cards.
- Client-side search, sort, and favorites-only filtering over the loaded recipe set.
- Favorite toggle on each card, persisted via the update API call.
- Loading, error, empty-library, and no-results states.
- Navigation to `/recipes/[id]` on card click.
- Pure, unit-tested filter/sort and time-formatting logic.

### Out of Scope
- "Add recipe" button / any Create UI (no Create until EPIC-003/004).
- Provenance/source pill on cards (deferred to EPIC-003; the `source` field exists in data but is not displayed here).
- The `/recipes/[id]` detail route itself — this story only links to it.
- Pagination and server-side search.
- The recipe detail/edit sheet and delete flow (separate stories).
- Defining the `Recipe`/`Ingredient` TypeScript types and the API client functions — those are delivered by STR-009; this story consumes them.

---

## Technical Approach
- **Entry point:** `frontend/src/routes/+page.svelte` is the route at `/`. It owns the data lifecycle (fetch on mount, loading/error state) and the reactive filter/sort UI state, and composes the child components.
- **State (Svelte 5 runes):** Follow the existing `+page.svelte` pattern — `$state` for `recipes`, `loading`, `error`. Add `$state` for `query` (string), `sort` (union of `'recent' | 'az' | 'quickest'`), and `favoritesOnly` (boolean). Derive the visible list with `$derived` from those inputs by calling the pure filter/sort function. Co-locating this state in the page component is sufficient — a Pinia-style store is unnecessary for a single-screen view; do not introduce one.
- **Data loading:** Reuse the existing `onMount` + `try/catch/finally` shape already in `+page.svelte`. Use the STR-009 list function (the current `fetchRecipes` in `frontend/src/lib/api/recipes.ts`, which STR-009 will retype to the production `Recipe`).
- **Pure logic, separately tested:**
  - `frontend/src/lib/library/filter.ts` — a `filterAndSortRecipes(recipes, { query, sort, favoritesOnly })` function returning the visible array. This is the testable heart of search/sort/favorites composition and must be unit-tested independently of any component.
  - `frontend/src/lib/library/format.ts` — `formatTotalTime(minutes)` producing the human-readable time label shown on cards (and handling the no-time case).
- **Components:**
  - `frontend/src/lib/components/library/RecipeCard.svelte` — presents one recipe (title, formatted time, tags, favorite indicator); emits/raises a favorite-toggle and exposes click-to-open navigation. Uses `data-test` attributes for testable selectors per the Vue/Svelte testing rules.
  - `frontend/src/lib/components/library/LibraryControls.svelte` — the search input, favorites-only toggle, and sort `<select>`, bound to the page's state.
  - `frontend/src/lib/components/library/EmptyState.svelte` — the empty/no-results presentation (message varies by which case).
  - Reuse the existing `$lib/components/ui` primitives (`Card`, `Button`) where they fit rather than restyling from scratch.
- **Favorite toggle / update contract:** The favorite toggle sends the **full recipe** to the update endpoint with `favorite` flipped (per the story note — all fields must round-trip through PUT). Use the STR-009 `updateRecipe` client function. On success, update the in-memory recipe so the derived list re-renders; the toggle is the only write this view performs.
- **Navigation:** Use SvelteKit navigation to `/recipes/${id}` (e.g. an anchor `href` or `goto`), with the favorite control stopping propagation so it does not trigger the open.
- **Key design decisions:**
  - Filtering/sorting is pure and lives outside components so it can be unit-tested without mounting — matches the "test logic, not components" rule.
  - The prototype `library.jsx` is the **behavioral/layout reference only**; implement idiomatically in Svelte 5 runes — do not port the React/inline-style code.

---

## Success Criteria
- [ ] Navigating to `/` fetches all recipes and renders one card per recipe in a grid.
- [ ] While the initial fetch is pending, a loading state is visible; on fetch failure, an error state is visible.
- [ ] Each card shows title, formatted total time, tags, and a favorite indicator matching the recipe's `favorite` state.
- [ ] Clicking a card (not the favorite control) navigates to `/recipes/[id]`.
- [ ] Toggling favorite on a card calls `updateRecipe` with the full recipe and flipped flag, and the card's indicator updates immediately without a full reload.
- [ ] Typing in search filters cards in real time across title, tags, and ingredient item names (case-insensitive).
- [ ] The sort control reorders the filtered set correctly for recent / A–Z / quickest, with no-total-time recipes sorting last under quickest.
- [ ] Favorites-only, search, and sort compose: enabling favorites + a query narrows the set and the result is sorted by the current sort.
- [ ] An empty-library state renders when there are zero recipes; a distinct no-results state renders when filters match nothing.
- [ ] `filterAndSortRecipes` and `formatTotalTime` have passing unit tests covering happy paths and the documented edge cases (empty query, no matches, missing total time, favorites composition).

---

## Tasks
Ordered by dependency.

- [ ] **Time formatting utility:** Implement `formatTotalTime` in `frontend/src/lib/library/format.ts` with unit tests in `format.test.ts`. Cover: typical minute values, the no-total-time case. Must be fully tested before use in the card.
- [ ] **Filter/sort core:** Implement `filterAndSortRecipes` in `frontend/src/lib/library/filter.ts` with unit tests in `filter.test.ts`. Cover: search across title/tags/ingredient items (case-insensitive, trimmed), each sort mode, quickest with missing total time sorting last, favorites-only, and composition of all three. Must be fully tested before wiring into the page.
- [ ] **RecipeCard component:** Build `RecipeCard.svelte` (title, formatted time, tags, favorite indicator, click-to-open, favorite-toggle that stops propagation) with `data-test` selectors. Add a focused component test (`RecipeCard.test.ts`) for the observable behavior: renders fields, raises favorite-toggle on activation, does not navigate when the favorite control is used.
- [ ] **Controls + empty state components:** Build `LibraryControls.svelte` (search input, favorites toggle, sort select) and `EmptyState.svelte` (library-empty vs no-results messaging).
- [ ] **Assemble the page:** Replace `frontend/src/routes/+page.svelte` with the library view — fetch on mount (loading/error/data), `$state` for query/sort/favoritesOnly, `$derived` visible list via `filterAndSortRecipes`, grid of `RecipeCard`s, the controls bar, empty/no-results/loading/error branches, and the favorite-toggle handler that calls `updateRecipe` and updates in-memory state.

---

## Considerations
- **Dependency contract — read STR-009's types before coding.** STR-010 consumes the production `Recipe`/`Ingredient` types and the `fetchRecipes`/`updateRecipe` API client from STR-009, and the list endpoint from STR-008. As of this spec, both are still `open` and the frontend still carries the throwaway `Recipe { id, name }` and a `fetchRecipes`-only client. Do **not** invent field names or serialization casing. Before implementing, read the committed `frontend/src/lib/types/recipe.ts` and `frontend/src/lib/api/recipes.ts` and conform exactly. The epic's intended shape is `title`, `servings`, `total_time`, `tags`, `favorite`, `ingredients` (each with `qty`/`unit`/`item`), `steps`, `notes`, `source`, `created_at` — but whether the TS surface exposes `totalTime`/`createdAt` (camelCase) or `total_time`/`created_at`, and whether the timestamp is an ISO string or epoch number, is STR-009's decision. The sort comparisons (recent = creation time desc; quickest = total time asc) must use whatever those fields are actually named and typed.
- **Search field names follow STR-009.** The substring match targets title, tag values, and ingredient *item* names (`ingredient.item` in the epic shape). Use the actual property names from the delivered `Ingredient` type.
- **Favorite toggle must round-trip the full recipe.** The PUT update payload is the entire recipe with `favorite` flipped — all fields must survive the round trip. If `updateRecipe` returns the updated recipe, prefer using the response to refresh in-memory state over local mutation, to avoid drift from any server-side normalization.
- **"recent" default and missing data.** Default sort is recent. Quickest must place recipes lacking a total time last (the prototype uses a large sentinel; an explicit "missing sorts last" comparator is cleaner — either is acceptable as long as behavior matches).
- **Two empty states are distinct.** "Your library is empty" (zero recipes) differs from "nothing matches your search" (filters exclude everything). The prototype shows the empty-library state instead of the grid when there are zero recipes, and the no-results state inside the grid area when filters match nothing.
- **No source pill.** The `source` field is present in the data but must not be rendered on cards in this epic (deferred to EPIC-003). The prototype card shows a source label — do not replicate it here.
- **Seed data.** STR-008's migration seeds sample recipes, so the library is exercisable without a Create UI; manual verification depends on that seed being present.
