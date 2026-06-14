## Widen types and inbound mapping

## Verdict: APPROVED

**Task:** Widen types and inbound mapping
**Spec:** .artifacts/etwilson/specs/015-nullable-servings-and-total-time.md

**Scope issues:** none

**Coverage gaps:** none

Both null-mapping requirements are covered (servings and totalTime) across both fetchRecipes and fetchRecipe call sites. The existing populated-field test remains intact. Tests assert observable output from recipeFromWire, not implementation internals.

---

## Form writes null on empty

## Verdict: APPROVED

**Task:** Form writes null on empty
**Spec:** .artifacts/etwilson/specs/015-nullable-servings-and-total-time.md

**Scope issues:** none

**Coverage gaps:** none

The null-on-empty requirement is covered by `returns null for empty string (field cleared)`. The whitespace-only case is bonus coverage. The non-null parse path is confirmed by the integer tests. Extracting `parseNumericInput` to `recipe-form-logic.ts` is the correct seam per the spec's own note. Tests assert observable behavior, not implementation internals.

---

## Confirm sort and format are null-safe

## Verdict: APPROVED

**Task:** Confirm sort and format are null-safe
**Spec:** .artifacts/etwilson/specs/015-nullable-servings-and-total-time.md

**Scope issues:** none

**Coverage gaps:** none

Quickest-sort null-last requirement is covered by the new test in filter.test.ts (id 5 placed last). formatTotalTime(null) returning '' was already present in format.test.ts and confirmed passing — correct not to duplicate it. No source changes to filter.ts or format.ts, consistent with the spec's expectation.

---

## Backend round-trip verification

## Verdict: APPROVED

**Task:** Backend round-trip verification
**Spec:** .artifacts/etwilson/specs/015-nullable-servings-and-total-time.md

**Scope issues:** none

**Coverage gaps:** none

POST with null servings/total_time asserted null in the response (lines 233-234). Follow-up GET asserts both still null (lines 248-250). Follows established unique_title()/app().clone().oneshot() patterns. No model or migration changes.
