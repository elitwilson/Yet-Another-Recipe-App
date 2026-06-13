# Decisions — 012-recipe-detail-view

## notes field type mismatch
The spec treats `Recipe.notes` as `string[]` (e.g., "bulleted list rendered only when `recipe.notes.length > 0`").
However, the actual type in `frontend/src/lib/types/recipe.ts` defines `notes: string` (a plain string).
Decision: treat notes as `string` — render the notes section only when `recipe.notes` is a non-empty string.
The spec's bulleted list treatment does not apply since notes is a single string; render it as a paragraph instead.

## fetchRecipe takes number id
`fetchRecipe(id: number)` requires a number. Per spec Considerations, coerce `params.id` with `Number(params.id)` and treat NaN as a 404.
