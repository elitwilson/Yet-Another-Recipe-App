# Decisions — 014-edit-and-delete-flows

## Test file location

The spec lists `frontend/src/lib/components/RecipeDetail.test.ts` as the test file. Co-located load tests were additionally added at `frontend/src/routes/recipes/[id]/edit/page.load.test.ts` to avoid module resolution issues with `[id]` bracket directories when importing from a distant relative path.

Vitest's `__dirname` in the node environment strips the `src/` prefix for files outside the route directory. The source-level string tests in `RecipeDetail.test.ts` were updated to use `process.cwd()` instead of `__dirname` for reliable path resolution.

## Svelte `untrack` for draft initialization

`$state` initialization in Svelte 5 warns when reactive props (`data.recipe.*`) are referenced directly in the initializer. Used `untrack(() => structuredClone(...))` to explicitly signal that the draft captures the load-time snapshot intentionally, matching the spec's deep-copy requirement.

## `id` as `$derived`

The recipe `id` is derived from `data.recipe.id` using `$derived` to satisfy the Svelte reactivity model, even though the id does not change during an edit session.
