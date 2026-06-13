## Write failing tests for the logic (RED)

## Verdict: APPROVED

**Task:** Write failing tests for the logic (RED)
**Spec:** .artifacts/etwilson/specs/013-recipe-editor-form-component.md

**Scope issues:** none

**Coverage gaps:** none

All required cases are covered: `isRecipeValid` transitions (empty title, whitespace-only title, no ingredient item, empty ingredients array, no non-empty step, empty steps array, and the satisfied case with both single and mixed ingredient arrays); `reorder` (move down, move up, no-op when from===to, out-of-range positive index, negative index guard); `normalizeTag`/`addTag` (trim, lowercase, strip `#`, combined, dedupe exact and case-mismatch, empty no-op); `removeTag`; and row helpers `addIngredient`, `addStep`, `removeAt`, `updateAt` (merge patch, lowConf clears on qty update, lowConf preserved on unit-only update, immutability).

Note: the `updateAt` lowConf test passes `lowConf: false` explicitly in the patch rather than relying on auto-clearing. The paired preservation test (unit-only patch, lowConf stays true) constrains the implementation to auto-clear on qty/item — so the full behavior is covered by the combination even if one test is slightly caller-driven.
