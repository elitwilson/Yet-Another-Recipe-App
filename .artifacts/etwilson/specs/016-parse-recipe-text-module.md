---
number: 016
story: STR-015
status: complete
base_branch: main
depends_on: [STR-014]
scope_files:
  - frontend/src/lib/parser/index.ts
  - frontend/src/lib/parser/parse-recipe-text.ts
  - frontend/src/lib/parser/parse-ingredient.ts
  - frontend/src/lib/parser/units.ts
  - frontend/src/lib/parser/patterns.ts
  - frontend/src/lib/parser/fixtures.ts
  - frontend/src/lib/parser/parse-recipe-text.test.ts
  - frontend/src/lib/parser/parse-ingredient.test.ts
---

# Feature: parseRecipeText parser module

## Summary
A pure, client-side TypeScript module that turns arbitrary pasted recipe text into a structured, editable draft with a confidence score and a warnings list. It is the testable heart of recipe ingestion: a header-aware section splitter with a heuristic fallback, per-line ingredient parsing (quantity / unit / item), inline comma-list splitting, and meta detection for servings and total time. It exports two pure functions — `parseRecipeText(text)` for the whole document and `parseIngredient(line)` for a single line — plus the TypeScript type of the returned draft, so the Review panel (STR-016), freeform entry (EPIC-004), and URL import (EPIC-005) can consume it without redeclaring. No network, no DOM, no framework imports.

---

## Requirements
- `parseRecipeText(text: string)` returns a `ParsedRecipeDraft` with shape `{ title: string; servings: number | null; totalTime: number | null; ingredients: EditableIngredient[]; steps: string[]; notes: string[]; warnings: string[]; confidence: number }`.
- When `Ingredients:`/`Instructions:`/`Notes:` headers (and the variants below) are present, sections are split cleanly by header with no "guessed split" warning.
- When no ingredient header is present, a heuristic fallback splits the body and emits a "split was guessed" warning.
- Each ingredient line is parsed into `{ qty, unit, item, lowConf }`: quantity covers integers, decimals, unicode fractions (`½`), ascii fractions (`1/2`), and ranges (`35-40`, `2 to 3`); unit is matched against a unit dictionary; the remainder is the item.
- Bullets and numbering (`-`, `*`, `•`, `·`, `1.`, `1)`, `Step 1:`) are stripped from lines before parsing.
- An inline header + comma list (`you need: a, b (x, y), c and d`) is split into separate ingredients, and commas / the word "and" inside parentheses do **not** trigger a split.
- Meta detection extracts `servings` (`serves N`, `N servings`, `yields N`, `makes [enough for] N`) and `totalTime` in minutes (`N min`, `N hr M min`, and ranges → upper bound).
- An ingredient is flagged `lowConf` when it has no detectable quantity and is not a known always-present seasoning (salt, pepper, oil, water, "to taste", garnish).
- A leading chatty greeting/preamble line, before any real content, is dropped rather than emitted as an ingredient or step.
- `confidence` is computed by the weighted formula (base 50; +25 ingredient header; +10 title; +10 any steps; −4 per lowConf) and clamped to `[20, 98]`.
- `warnings` accumulates: guessed split, lowConf count, missing steps, missing title.
- `parseIngredient(line: string)` is independently exported and returns `{ qty, unit, item, lowConf }` for a single line.
- Empty, whitespace-only, or null/undefined-ish input is handled without throwing.

---

## Scope

### In Scope
- A new pure module under `frontend/src/lib/parser/`.
- Public surface: `parseRecipeText`, `parseIngredient`, and the exported `ParsedRecipeDraft` type.
- The two canonical fixtures `SAMPLE_PASTE_CLEAN` and `SAMPLE_PASTE_MESSY`, lifted verbatim from `data.js`, used by the tests (and re-exportable for downstream paste-flow UI).
- Internal helpers (unit dictionary, quantity/header regexes, bullet stripping, inline-list split, sentence split) decomposed as the implementer sees fit, kept non-public.

### Out of Scope
- Any UI, route, Svelte component, or store — logic only.
- The parse-progress animation (STR-017) and the paste flow itself.
- LLM-assisted parsing — heuristics only.
- Server-side parsing — client-side TS exclusively.
- Editing `frontend/src/lib/types/recipe.ts` to make `servings`/`totalTime` nullable; that is STR-014's deliverable. This module's `ParsedRecipeDraft` declares its own nullable fields and does not depend on that edit landing.

---

## Technical Approach
- **Entry points / interfaces:** `frontend/src/lib/parser/index.ts` is the barrel — re-exports `parseRecipeText`, `parseIngredient`, the `ParsedRecipeDraft` type, and the two sample fixtures. Consumers import via `$lib/parser`.
- **Key modules / components:**
  - `parse-ingredient.ts` — `parseIngredient(line)` plus `cleanBullet` and `looksLikeIngredient` helpers.
  - `parse-recipe-text.ts` — `parseRecipeText(text)`, the `ParsedRecipeDraft` type, section detection, the heuristic fallback, `detectMeta`, `splitInlineList`, `pushSentences`, and the confidence/warnings assembly.
  - `units.ts` — the `UNITS` array and the compiled `UNIT_RE`.
  - `patterns.ts` — shared compiled regexes (`QTY_RE`, `INGREDIENT_HEADER`, `STEP_HEADER`, `NOTES_HEADER`, inline-header patterns). Sharing `QTY_RE` between the two parse functions keeps quantity detection consistent.
  - `fixtures.ts` — `SAMPLE_PASTE_CLEAN`, `SAMPLE_PASTE_MESSY` (verbatim from `data.js`).
- **Data model:** Reuse `EditableIngredient` (already has optional `lowConf`) from `$lib/types/recipe` for the `ingredients` array. Declare and export `ParsedRecipeDraft` in `parse-recipe-text.ts`. Note: `parseIngredient` returns `EditableIngredient` (`{ qty, unit, item, lowConf }`); the prototype's extra `raw` field is dropped — it is not in the domain type and downstream consumers do not need it. Keep `lowConf` always set (boolean) on parser output even though the type marks it optional, so `lowCount` and downstream flagging are reliable.
- **Key design decisions:**
  - Re-implement idiomatically in typed TS — no `window` globals, no `??` on `parseInt` results returning `NaN`; guard meta parses so a failed `parseInt` yields `null`, not `NaN`.
  - `ParsedRecipeDraft` is self-contained (declares `servings: number | null`, `totalTime: number | null`) rather than aliasing `EditableRecipe`, so it does not block on STR-014's `recipe.ts` edit and aligns with the nullable domain model once STR-014 lands. `depends_on` records STR-014 for ordering/alignment.
  - The prototype returns `null` for empty input; this spec instead returns a fully-formed empty `ParsedRecipeDraft` (empty arrays, `confidence` clamped to 20, appropriate warnings) so callers never have to null-check the result. This is the one deliberate deviation from `data.js` — see Considerations.
  - Keep the confidence formula and clamp exactly as in the story unless the two canonical cases misclassify.

---

## Success Criteria
- [ ] `parseRecipeText(SAMPLE_PASTE_CLEAN)` → title set, 8 ingredients, 4 steps, `warnings: []`, high confidence; `400 g spaghetti` → `{ qty: '400', unit: 'g', item: 'spaghetti' }`; `servings: 4`, `totalTime: 25`.
- [ ] `parseRecipeText(SAMPLE_PASTE_MESSY)` → includes the "split was guessed" warning, empty title (with a missing-title warning), ~8 ingredients with several `lowConf`, 2 steps, Low confidence; `servings: 2`, `totalTime: 40`.
- [ ] `chicken thighs (like 6, bone in)` parses as a single ingredient (the parenthetical comma does not split it).
- [ ] The leading "hey! here's that…" greeting in the messy fixture appears as neither an ingredient nor a step.
- [ ] Quantity parsing verified for integer, decimal, `½`, `1/2`, and `35-40` (range → upper bound where applicable); bullets/numbering (`-`, `•`, `1.`, `Step 1:`) stripped.
- [ ] `parseIngredient('1/2 tsp chili flakes')` → `{ qty: '1/2', unit: 'tsp', item: 'chili flakes', lowConf: false }` and is callable without `parseRecipeText`.
- [ ] `parseRecipeText('')` and `parseRecipeText('   \n  ')` return a valid draft without throwing.
- [ ] `ParsedRecipeDraft` is importable from `$lib/parser`.

---

## Tasks
Ordered by dependency.

- [ ] **Constants & fixtures:** Create `units.ts` (UNITS + UNIT_RE), `patterns.ts` (QTY_RE, header + inline-header regexes), and `fixtures.ts` (the two sample strings verbatim from `data.js`). No tests of their own; they are exercised through the parse functions.
- [ ] **`parseIngredient` + helpers (fully tested before next task):** Implement `cleanBullet`, `looksLikeIngredient`, and `parseIngredient` in `parse-ingredient.ts`, returning `EditableIngredient`. Write `parse-ingredient.test.ts` covering quantity variants (int/decimal/`½`/`1/2`/range), unit dictionary hits and misses, bullet/numbering/`Step N:` stripping, `of`-prefix trimming, and the `lowConf` seasoning rule. Get this green before composing the document parser.
- [ ] **`parseRecipeText` document parser:** Implement section detection, header-driven extraction, the heuristic fallback (inline header + comma-list via `splitInlineList`, greeting skip, prose→sentences via `pushSentences`), `detectMeta`, the confidence formula, and warnings assembly in `parse-recipe-text.ts`. Declare and export `ParsedRecipeDraft`. Handle empty/whitespace input by returning an empty draft.
- [ ] **Document-parser tests:** Write `parse-recipe-text.test.ts` driving Case A (clean) and Case B (messy) against the fixtures, plus the parenthetical-comma, greeting-drop, and empty-input cases from Success Criteria.
- [ ] **Barrel export:** Create `index.ts` re-exporting `parseRecipeText`, `parseIngredient`, `ParsedRecipeDraft`, and the fixtures; confirm `$lib/parser` resolves.

---

## Considerations
- **Empty-input deviation:** `data.js` returns `null` for empty input; this spec returns an empty `ParsedRecipeDraft` instead so STR-016/EPIC-004 never null-check. The implementer must pick exact empty-state values (confidence 20; warnings for missing title/steps). This is intentional — flag it in run `decisions.md`, do not silently mirror the prototype's `null`.
- **`raw` field dropped:** the prototype's `parseIngredient` returns a `raw` field; the domain `EditableIngredient` has no such field. Do not add it — `item` falls back to the cleaned raw line when nothing else parses.
- **`lowConf` always boolean on output:** the type marks it optional, but the parser should always set it so `confidence` and downstream red-row flagging are deterministic.
- **Meta `NaN` guard:** `parseInt` on a non-numeric capture yields `NaN`; coerce to `null` so `servings`/`totalTime` are never `NaN`. The prototype's `meta.servings || null` masks this for `0`/`NaN` but be explicit.
- **Range → upper bound:** `35-40 min` must yield `40`. Confirm the time regex/extraction takes the upper bound, not the first number, for time ranges.
- **Exact ingredient counts are assertion-sensitive:** Case A expects exactly 8 ingredients and 4 steps; Case B "~8 ingredients (~6 lowConf), 2 steps". Treat Case A counts as exact; for Case B, assert the warning presence, servings/time, the parenthetical-comma invariant, and the greeting drop as hard checks, and treat the fuzzy counts as ranges (e.g. `ingredients.length >= 7`) to avoid brittle tests on heuristic output. If the ported heuristics misclassify, adjust the heuristic — not the canonical fixture.
- **No `any`:** model line/section intermediates with real types; use `unknown` + guards only where genuinely needed (it should not be needed here).
