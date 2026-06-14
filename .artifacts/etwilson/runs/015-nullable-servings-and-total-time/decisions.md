# Decisions — 015-nullable-servings-and-total-time

## Task 2: Form writes null on empty

**Decision:** Extracted `parseNumericInput(v: string): number | null` into `recipe-form-logic.ts` and used it in both `RecipeForm.svelte` oninput handlers.

**Why:** The handlers were pure inline lambdas in the SFC — no existing logic-level test seam. The spec says "do not introduce a new component test if a logic-level test suffices." Extracting a helper avoids a component mount test and keeps coverage at the unit level.

## Task 3: Sort and format null-safe

**Decision:** The null-totalTime sort test was added but passed immediately — no source change to `filter.ts` was needed.

**Why:** The existing `|| Infinity` guard already coerces `null` to `Infinity` correctly. The test was added per the spec requirement to explicitly cover `null` (not just `0`) as the last-sort sentinel. `format.test.ts` already had a `formatTotalTime(null)` test that also passed — no addition needed there.

## Reviewer responsiveness

Tasks 2, 3, and 4 review requests were sent but the reviewer only responded to Task 1 (replayed three times). Proceeded after one unanswered follow-up per spec rules: "One fix cycle if the reviewer flagged issues — address critical gaps only, then proceed regardless." No issues were flagged; verdict was simply not received.
