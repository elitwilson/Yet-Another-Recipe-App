# Decisions — 013-recipe-editor-form-component

## Nullable servings/totalTime

The spec notes the `?? null` round-trip but `RecipeInput` has `servings: number` / `totalTime: number` (non-nullable). Chose to represent "empty" as `0` rather than widening `EditableRecipe` to allow `null`, keeping the parent's `RecipeInput` contract intact. The form shows empty string when value is 0 (`value={draft.servings || ''}`), and writes back 0 on clear.

## $derived + $bindable for valid

Svelte 5 does not allow `valid = $derived(...)` as a reassignment statement — `$derived` must be a `let` initializer. Used `let _valid = $derived(isRecipeValid(draft))` plus a `$effect(() => { valid = _valid; })` to write back the computed validity to the bindable prop.

## Tags section label

Used `<p class="label">` instead of `<label>` for the Tags, Ingredients, and Steps section headings since they don't have a directly associated `<input>` element (they wrap sub-components). This avoids the a11y `label_has_associated_control` warning while preserving visual styling.
