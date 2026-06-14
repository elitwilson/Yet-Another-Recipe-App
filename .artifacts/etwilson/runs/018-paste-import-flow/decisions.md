# Decisions — 018-paste-import-flow

## Assumptions

- `parseRecipeText` and sample fixtures are exported from `$lib/parser/index.ts` (confirmed).
- `ReviewPanel` is at `$lib/components/review/ReviewPanel.svelte`, accepts `draft: ParsedDraft`, `onBack`, `onSave`, and optional `backLabel` (confirmed).
- `ParsedDraft` from `$lib/types/recipe` is the type used for the draft handed to ReviewPanel (`EditableRecipe` + `confidence` + `warnings` + `source`).
- `ParsedRecipeDraft` from the parser does not include `source`; `draftFromParse` in `add-recipe-logic.ts` attaches the paste source to produce a `ParsedDraft`.
- The `Segmented` component uses a callback prop (`onchange`) rather than a bindable value to avoid Svelte 5 runes issues with `bind:value` on custom components.
- `ParseProgress` uses `$effect` + `setTimeout` for timer advancement; cleanup uses a returned cleanup fn from `$effect`.
- The `/recipes/new` route does not need a `+page.ts` load file since there is no server data to load.
- "Add recipe" button in the library header is placed next to the `<h1>` heading, matching existing page conventions.
