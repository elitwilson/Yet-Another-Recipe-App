# Decisions — 016-parse-recipe-text-module

## Empty-input deviation from prototype

The prototype (`data.js`) returns `null` for empty input. This spec intentionally returns a fully-formed empty `ParsedRecipeDraft` instead (empty arrays, `confidence` clamped to 20, warnings for missing title and missing steps). This ensures callers never need to null-check the result. Downstream consumers (STR-016, EPIC-004) can always destructure the result safely.

## `raw` field dropped

The prototype's `parseIngredient` returns a `raw` field alongside `qty`, `unit`, `item`, `lowConf`. The domain `EditableIngredient` type has no `raw` field. It is not included in parser output. The `item` field falls back to the cleaned raw line when nothing else parses (same behavior, no extra field).

## `lowConf` always boolean on output

`EditableIngredient.lowConf` is typed as `boolean | undefined`, but the parser always sets it to `true` or `false`. This makes `lowCount` calculation and downstream red-row flagging deterministic.

## Meta `NaN` guard

`parseInt` on a non-numeric capture yields `NaN`. The prototype uses `meta.servings || null` which masks this for `0`/`NaN`. This implementation explicitly checks with `Number.isNaN` and returns `null` rather than passing `NaN` into the draft.

## Range time → upper bound

For time ranges like `35-40 min`, the spec requires yielding the upper bound (40). The time regex is written to capture both numbers in a range and take the larger value.

## `ParsedRecipeDraft` self-contained

`ParsedRecipeDraft` declares `servings: number | null` and `totalTime: number | null` directly rather than aliasing `EditableRecipe`. This avoids a dependency on STR-014's `recipe.ts` edits landing first, even though those edits are already in (per git history).
