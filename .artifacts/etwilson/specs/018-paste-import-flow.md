---
number: 018
story: STR-017
status: complete
base_branch: main
depends_on: [STR-015, STR-016]
scope_files:
  - frontend/src/routes/recipes/new/+page.svelte
  - frontend/src/routes/recipes/new/+page.ts
  - frontend/src/routes/recipes/new/page.component.test.ts
  - frontend/src/lib/components/ui/segmented/Segmented.svelte
  - frontend/src/lib/components/ui/segmented/index.ts
  - frontend/src/lib/components/add-recipe/AddRecipe.svelte
  - frontend/src/lib/components/add-recipe/PasteMethod.svelte
  - frontend/src/lib/components/add-recipe/ParseProgress.svelte
  - frontend/src/lib/components/add-recipe/add-recipe-logic.ts
  - frontend/src/lib/components/add-recipe/add-recipe-logic.test.ts
  - frontend/src/lib/components/add-recipe/PasteMethod.test.ts
  - frontend/src/lib/components/add-recipe/ParseProgress.test.ts
  - frontend/src/lib/components/add-recipe/Segmented.test.ts
  - frontend/src/routes/+page.svelte
  - frontend/src/lib/components/library/EmptyState.svelte
  - frontend/src/lib/components/library/EmptyState.test.ts
---

# Feature: Paste Import Flow & Add Recipe Surface

## Summary
This is the integration story that turns YARA's paste-import pieces into a feature a user can actually use. It adds an "Add recipe" entry point to the library, a new SvelteKit page route at `/recipes/new`, and a three-tab Add Recipe surface whose only active tab — "Paste text" — lets a user paste arbitrary recipe text, load a "Clean" or "Messy" example, watch a four-step parse-progress animation, and land on the editable Review panel before saving. On parse, it calls `parseRecipeText(text)` (from STR-015), stamps `source: { type: 'paste', method: 'parsed from pasted text' }` onto the draft, and hands off to the Review panel (from STR-016). Save calls the existing `createRecipe()`; Back returns to a cleared paste textarea. No backend surface is added.

---

## Requirements
- A user can reach the Add Recipe surface from the library: a control in the library header and a CTA in the empty-library state both navigate to `/recipes/new`.
- `/recipes/new` renders a three-tab `Segmented` shell — "From a link", "Paste text", "By hand" — with "Paste text" active and selected by default; the other two tabs are visibly rendered but disabled (cannot be selected).
- The Paste tab shows a textarea, a "Clean" example button and a "Messy / texted" example button, a Clear button (shown only when the textarea has content), a live line count, and a "Parse recipe" button that is disabled while the textarea is empty/whitespace-only.
- Clicking "Clean" populates the textarea with `SAMPLE_PASTE_CLEAN`; clicking "Messy / texted" populates it with `SAMPLE_PASTE_MESSY`; clicking Clear empties it.
- Clicking "Parse recipe" with non-empty text shows the four-step `ParseProgress` animation ("Reading the text…" → "Detecting sections (ingredients vs steps)…" → "Parsing quantities & units…" → "Flagging anything unclear…"), then transitions to the Review panel populated from `parseRecipeText(text)`.
- The draft handed to the Review panel carries `source: { type: 'paste', method: 'parsed from pasted text' }`.
- Saving a valid reviewed recipe calls `createRecipe()` and navigates away from the Add Recipe surface (to the library or the new recipe's detail view); save errors are surfaced, not swallowed.
- From the Review panel, Back returns to the paste textarea with the draft cleared (the user starts over).
- `ParseProgress` is a reusable component parameterized by a list of step labels and an `onDone` callback, so EPIC-005 can reuse it with different labels.

---

## Scope

### In Scope
- New SvelteKit page route `/recipes/new` (`+page.svelte`, plus `+page.ts` if needed to match the directory's load convention).
- Library entry points: an "Add recipe" button in `frontend/src/routes/+page.svelte` (visible whenever the library renders, including when populated) and a CTA in `EmptyState.svelte`'s `empty-library` variant.
- A minimal `Segmented` UI primitive under `frontend/src/lib/components/ui/segmented/` (no existing tabs/segmented primitive — must be built). Supports per-option `disabled`.
- An `AddRecipe` shell component owning tab state and the input ⇄ parsing ⇄ review stage transitions for the active Paste tab.
- A `PasteMethod` component (textarea, examples, clear, line count, parse button).
- A reusable, parameterized `ParseProgress` component.
- Pure helper logic extracted to `add-recipe-logic.ts` (line counting, paste-source construction, draft validity reuse).
- Wiring to STR-015 exports (`parseRecipeText`, `SAMPLE_PASTE_CLEAN`, `SAMPLE_PASTE_MESSY`) and the STR-016 Review panel component.

### Out of Scope
- The parser internals (STR-015) and the Review panel internals (STR-016) — consumed, not built here.
- "From a link" (EPIC-005) and "By hand" (EPIC-004) tab contents — disabled placeholders only.
- Any backend change — `createRecipe()` / `POST /api/recipes` already exists.
- Library-card provenance icon (STR-018).
- Asserting `ParseProgress` animation timing — the timed advance is presentational; tests assert wiring/behavior (steps render, `onDone` fires), not durations.

---

## Technical Approach
- **Entry points / interfaces:**
  - Route: `frontend/src/routes/recipes/new/+page.svelte`. A SvelteKit page route mirroring the existing `recipes/[id]` and `recipes/[id]/edit` resourceful routes. The page renders `<AddRecipe onSave={...} />` and handles post-save navigation via `goto` from `$app/navigation`.
  - Library header button in `+page.svelte` and `EmptyState` CTA both navigate to `/recipes/new` (use an `<a href="/recipes/new">` styled as a button, or `Button` + `goto`, matching the edit page's `<a>`-as-link convention).
- **Key modules / components:**
  - `ui/segmented/Segmented.svelte` — minimal segmented control. Props: `value`, `options: { value: string; label: string; disabled?: boolean }[]`, and a change callback (`onchange` or `bind:value`). Renders `data-test` hooks per option; disabled options are non-interactive. Built with Tailwind to match the shadcn theme; reuse `cn`/`buttonVariants` styling idioms where natural.
  - `add-recipe/AddRecipe.svelte` — owns `method` (tab) state defaulting to `'paste'`, and the Paste stage machine: `'input' | 'parsing' | 'review'`. Holds the `reviewDraft`. Renders the `Segmented` shell, then the active tab body. On `PasteMethod` parse-request → set stage `parsing`; on `ParseProgress` done → run `parseRecipeText`, stamp source, set `reviewDraft`, stage `review`; render the Review panel; Back → clear draft, stage `input`; Save → call the page's `onSave`.
  - `add-recipe/PasteMethod.svelte` — textarea bound to local `text` ($state), example/clear buttons, line count, "Parse recipe" button (disabled on empty/whitespace). Emits a parse-request (callback prop) with the current text; does not call the parser itself (the shell owns parsing/stage).
  - `add-recipe/ParseProgress.svelte` — props `steps: string[]`, `onDone: () => void`. Advances through steps on a timer (Svelte `$effect` + `setTimeout`/`onDestroy` cleanup), renders each step with done/active/pending state, calls `onDone` after the last. Parameterized for EPIC-005 reuse.
  - `add-recipe/add-recipe-logic.ts` — pure helpers: `countLines(text)` (non-blank lines), `pasteSource()` returning `{ type: 'paste', method: 'parsed from pasted text' }`, and a thin `draftFromParse(parsed)` that attaches the paste source to a parser result. Reuse `isRecipeValid` from `recipe-form-logic.ts` for save-enable rather than re-implementing.
- **Data model:**
  - The draft flowing into the Review panel is the parser's result (STR-015) augmented with `source: RecipeSource`. Conform to the existing `EditableRecipe` type (`$lib/types/recipe`), which already carries `EditableIngredient.lowConf` and `source`. If STR-015/STR-016 introduce parse-specific fields (`warnings`, `confidence`), consume them via the type STR-016 exports for its panel props — do not redefine them here.
  - Save converts the reviewed `EditableRecipe` to `RecipeInput` (drop empty ingredient/step rows, same shape the edit page builds) and calls `createRecipe()`.
- **Key design decisions:**
  - **Real route, not in-component view switching.** The prototype switches via state; here `/recipes/new` is a genuine SvelteKit route per the resourceful convention. Tab/stage switching *within* the surface stays component-internal state.
  - **Three-tab shell built now, Paste-only active.** EPIC-004/005 flip the disabled tabs on without restructuring.
  - **Source stamped at the flow boundary**, not inside the parser — the parser is path-agnostic.
  - **`ParseProgress` is reusable/parameterized** specifically for EPIC-005.
  - **Logic in pure helpers, tested directly.** Component tests follow this directory's source-string assertion convention (see `recipes/[id]/page.component.test.ts`) plus `@vue/test-utils`-style mount only where behavior (button-disabled, example-population, parse-request emission) warrants it.

---

## Success Criteria
- [ ] `/recipes/new` route exists and renders the three-tab `Segmented` with "Paste text" active and the other two tabs present but disabled.
- [ ] The library (both populated and empty states) exposes a control that navigates to `/recipes/new`.
- [ ] "Clean"/"Messy" buttons populate the textarea from `SAMPLE_PASTE_CLEAN`/`SAMPLE_PASTE_MESSY`; Clear empties it; the line count reflects non-blank lines.
- [ ] "Parse recipe" is disabled on empty/whitespace text and enabled otherwise.
- [ ] Clicking "Parse recipe" shows `ParseProgress` with the four paste step labels, then renders the Review panel populated from `parseRecipeText`.
- [ ] The reviewed draft carries `source: { type: 'paste', method: 'parsed from pasted text' }`.
- [ ] Saving a valid reviewed recipe calls `createRecipe` and navigates away; Back returns to the paste textarea with the draft cleared.
- [ ] `ParseProgress` accepts arbitrary `steps` and fires `onDone` after the last step (verified without asserting exact timing).
- [ ] `npm run test`, type-check, and lint pass.

---

## Tasks
Ordered by dependency.

- [ ] **Segmented primitive + pure logic.** Build `ui/segmented/Segmented.svelte` (+ `index.ts`) with per-option `disabled` and `data-test` hooks, matching the shadcn/Tailwind theme. Add `add-recipe-logic.ts` (`countLines`, `pasteSource`, `draftFromParse`) reusing `isRecipeValid`. Write and pass `Segmented.test.ts` (disabled options non-selectable, active styling) and `add-recipe-logic.test.ts` first. Fully test before next task.
- [ ] **ParseProgress component.** Build `add-recipe/ParseProgress.svelte` (props `steps`, `onDone`; timer-driven advance with cleanup). Test (`ParseProgress.test.ts`) that all steps render and `onDone` fires after the last step — use fake timers, assert behavior not durations. Fully test before next task.
- [ ] **PasteMethod component.** Build `add-recipe/PasteMethod.svelte` (textarea, example/clear buttons, line count, parse button with empty-disable). Test (`PasteMethod.test.ts`): examples populate from the STR-015 fixtures, Clear empties, parse button disabled when empty, parse-request emitted with current text on click.
- [ ] **AddRecipe shell + parser/Review wiring.** Build `add-recipe/AddRecipe.svelte`: tab state (Paste active, others disabled), stage machine, `parseRecipeText` call, source stamping, Review-panel render (STR-016), Back-clears-draft, Save→`onSave`. Wire to STR-015/STR-016 exports at their real paths.
- [ ] **Route + library entry points.** Add `recipes/new/+page.svelte` (+ `+page.ts` if the directory convention needs it) rendering `<AddRecipe>` and handling post-save `goto`. Add the "Add recipe" button to `+page.svelte` and the CTA to `EmptyState.svelte` (`empty-library` variant). Tests: `page.component.test.ts` (route renders the surface), `EmptyState.test.ts` (CTA links to `/recipes/new`).

---

## Considerations
- **Dependency contract (load-bearing assumption).** This story consumes STR-015 and STR-016, which are specced in parallel and not yet implemented. `depends_on` sequences this spec after them. The implementer must reconcile these import points against what those stories actually shipped:
  - `parseRecipeText`, `SAMPLE_PASTE_CLEAN`, `SAMPLE_PASTE_MESSY` — expected from the STR-015 parser module (likely `$lib/parser/...`). Import from STR-015's actual export path; do not re-paste fixtures here (per the story).
  - The Review panel component and its props (`draft`, `onBack`, `onSave`, and any `backLabel`/warnings/confidence surface) — from STR-016's actual component. Match its real prop contract; the prototype `ReviewPanel`/`isDraftValid` shapes above are reference, not the final API.
  - If either upstream export path or prop shape differs from what's assumed here, follow the upstream spec — it is authoritative for its own surface.
- **Draft validity for save.** Reuse `isRecipeValid` from `recipe-form-logic.ts`; if STR-016's panel owns the save-enable/validity gate, defer to it rather than duplicating the check at the shell.
- **Svelte 5 runes.** Match the codebase: `$state`, `$props`, `$derived`, `$effect`, `$bindable`; `goto` from `$app/navigation`; `<a href>`-as-link for navigation (see the edit page). Use the existing `Button` primitive and `data-test` selector convention.
- **ParseProgress timer cleanup.** Cancel pending timers on destroy/teardown so a fast Back/navigation away doesn't fire `onDone` against a stale stage.
- **Line count semantics.** Count non-blank lines (`split('\n').filter(l => l.trim())`), matching the prototype.
- **Back wording.** The prototype labels Back "Start over" in this flow; surface that label via the Review panel's `backLabel`/equivalent if it supports one.
