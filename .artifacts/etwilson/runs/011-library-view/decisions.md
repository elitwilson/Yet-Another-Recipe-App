# Decisions — 011-library-view

## Type field names
STR-009 delivered camelCase types: `totalTime` (number, minutes), `createdAt` (ISO string). Sorting uses these directly.

## Ingredient search field
`Ingredient.item` is the field to substring-match per spec and matches actual type.

## updateRecipe signature
`updateRecipe(id, RecipeInput)` — strips `id` and `createdAt` to match `RecipeInput = Omit<Recipe, 'id' | 'createdAt'>`. On favorite toggle, spreads the full recipe minus id/createdAt with `favorite` flipped.

## RecipeCard component test — environment mismatch (needs human review)

The spec requires `RecipeCard.test.ts` to test three observable behaviors:
1. Card renders title, formatted time, tags, and favorite indicator
2. Favorite toggle raises a favorite-toggle event on activation
3. Favorite toggle activation does not trigger card navigation (stops propagation)

**Blocker:** `vite.config.ts` only has a `server` (Node) Vitest project; `*.svelte.test.ts` files are excluded and no jsdom/happy-dom project is configured. Svelte component mounting is genuinely unavailable without adding a browser-environment Vitest project.

**Decision:** Proceeded with `RecipeCard.test.ts` covering the card's pure-logic dependencies (formatTotalTime, favorite toggle payload construction) and documenting the data-test attribute selectors. The three spec-required component behaviors remain unverified by automated tests — they require manual verification or E2E tests, or a follow-up to add a browser Vitest project. Reviewer (reviewer-2) confirmed this is a spec/environment mismatch, not a coder error. **Team-lead should assess whether to add a browser Vitest environment.**

## No source pill
`source` field exists in the `Recipe` type but is not displayed on cards per spec requirements.

## Empty states
Two distinct states: "library empty" (zero recipes fetched) vs "no results" (filters return nothing from non-empty set).
