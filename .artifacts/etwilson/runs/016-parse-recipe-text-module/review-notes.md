# Review Notes — 016-parse-recipe-text-module

## parseIngredient + helpers (fully tested before next task)

## Verdict: APPROVED

**Task:** parseIngredient + helpers (fully tested before next task)
**Spec:** .artifacts/etwilson/specs/016-parse-recipe-text-module.md

**Scope issues:** none

**Coverage gaps:** none

All required cases are covered: integer/decimal/unicode-fraction/ascii-fraction/range quantity variants, unit dictionary hit and miss, bullet and numbering stripping (dash, asterisk, unicode bullet, `1.`, `Step N:`), `of`-prefix trimming, `lowConf` false for quantified lines / known seasonings / "to taste", `lowConf` true for unquantified unknown ingredients, the spec canonical example (`1/2 tsp chili flakes`), and empty-string edge case. All tests are correctly scaffolded as RED.

## parseRecipeText document parser + document-parser tests

## Verdict: APPROVED

**Task:** parseRecipeText document parser + document-parser tests
**Spec:** .artifacts/etwilson/specs/016-parse-recipe-text-module.md

**Scope issues:** none

**Coverage gaps:** none

All required cases are covered: Case A title/8-ingredients/4-steps/no-warnings/high-confidence/spaghetti-parse/servings/totalTime; Case B guessed-split warning/empty-title+missing-title-warning/at-least-7-ingredients/several-lowConf/steps/low-confidence/servings/totalTime-upper-bound; parenthetical-comma invariant; greeting drop (checked across both ingredients and steps); empty-string and whitespace-only input (no throw, valid draft, confidence clamped to 20). The no-guessed-split-warning-when-headers-present requirement is implicitly covered by Case A asserting `warnings.length === 0`.
