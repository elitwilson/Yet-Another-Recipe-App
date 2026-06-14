# Decisions — 017-shared-review-panel

## ParsedDraft type location
ParsedDraft is not present in recipe.ts as of this run. Adding it there per spec instructions.
The existing EditableIngredient already has optional `lowConf` field, and RecipeSource is already defined.
No conflict with STR-015 output — will add ParsedDraft as an extension of EditableRecipe.

## IngredientRows lowConf flagging
Verified: IngredientRows.svelte (line 34) already applies a color-mix destructive background when
row.lowConf is true, and clears lowConf on qty/item edit. No new work needed — flagging is complete.
The task reduces to confirming existing behavior passes typecheck and tests.

## confidenceColor mapping
No direct amber/warning theme token exists in the project. Will use Tailwind amber utility class
approach consistent with the spec guidance: map Medium to amber (not a raw oklch literal).
Specifically, using CSS variable approach with 'var(--primary)' for High, amber-500 equivalent
for Medium, and 'var(--destructive)' for Low. Returns CSS color strings.

## ReviewPanel test approach
Following the established source-assertion pattern from RecipeCard.test.ts and RecipeDetail.test.ts:
pure logic in TS helpers with full unit tests, source-string assertions for Svelte wiring.
No DOM test dependency added.

## Draft binding approach
Using $bindable() for draft prop, calling isRecipeValid(draft) directly (not binding RecipeForm's
valid prop) for consistency and simplicity.
