---
number: 013
story: STR-012
status: ready
base_branch: main
depends_on: ["STR-009"]
scope_files:
  - frontend/src/lib/components/RecipeForm.svelte
  - frontend/src/lib/components/TagInput.svelte
  - frontend/src/lib/components/IngredientRows.svelte
  - frontend/src/lib/components/StepRows.svelte
  - frontend/src/lib/components/recipe-form-logic.ts
  - frontend/src/lib/components/recipe-form-logic.test.ts
  - frontend/src/lib/types/recipe.ts
---

# Feature: Recipe editor form component

## Summary
A shared, controlled Svelte editor form for recipes. The parent owns the draft state and passes it in; the component renders editable fields (title, servings, total time, tags, ingredient rows, step rows) and emits the updated draft on every change. It exposes a derived validity signal so the parent can gate saving. This is the most complex frontend piece in EPIC-002 and is deliberately decoupled — it knows nothing about saving, routing, or its callers — so the edit flow (STR-013), the paste Review panel (EPIC-003), freeform live preview (EPIC-004), and URL import (EPIC-005) can all reuse it without knowing about each other. Behavior follows the prototype at `.artifacts/etwilson/design/prototype/recipe-form.jsx` (`RecipeForm`, `IngredientRows`, `StepRows`, `TagInput`).

---

## Requirements
- The component is **controlled**: it accepts a draft (a `RecipeInput`-shaped object) as a prop and emits the full updated draft on every edit. It holds no source-of-truth draft state of its own beyond transient local UI state (e.g. the TagInput's in-progress text, drag tracking).
- Renders and accepts input for: title (text), servings (number, nullable), totalTime (number minutes, nullable), tags (TagInput), ingredient rows, step rows.
- **TagInput:** pressing Enter or comma adds the current text as a tag; Backspace on an empty input removes the last tag; each tag renders as a removable chip with a remove control. A tag is normalized (trimmed, lowercased, leading `#` stripped) and duplicates are ignored.
- **Ingredient rows:** each row has qty / unit / item inputs; rows can be added and removed; rows can be reordered via native HTML5 drag-and-drop (`draggable` + `dragstart` / `dragover` / `drop`).
- **`lowConf` per-row flag:** when an ingredient row's `lowConf` is true, the row gets a red/muted visual treatment; editing that row's qty or item clears the flag (editing unit does not, matching the prototype).
- **Step rows:** numbered textareas; steps can be added and removed; steps can be reordered via native HTML5 drag-and-drop.
- **Validity** is exposed to the parent and is true only when: title is non-empty (after trim), at least one ingredient has a non-empty `item`, and at least one step is non-empty (after trim).
- No `any` anywhere. Svelte 5 runes mode (`$props`, `$state`, `$derived`, `$bindable`).

---

## Scope

### In Scope
- `RecipeForm.svelte` and its three sub-components (`TagInput.svelte`, `IngredientRows.svelte`, `StepRows.svelte`) in `frontend/src/lib/components/`.
- `recipe-form-logic.ts` — the pure, framework-free functions the components delegate to (validation, array reorder, tag normalization/add/remove, row add/remove/update). This is the unit-tested surface.
- A `lowConf` extension to the ingredient row shape (see Technical Approach) added to `frontend/src/lib/types/recipe.ts`.
- Vitest unit tests for `recipe-form-logic.ts`.

### Out of Scope
- Save/submit logic — the parent handles persistence (STR-013).
- Provenance pill, confidence meter, warnings — Review-panel concerns (EPIC-003).
- Any route, page, or store.
- The read-only `RecipeView` from the prototype (separate concern; not this story).
- Component-mount DOM tests — the project's Vitest config has only a node project and no Svelte component-testing harness; do not add one (see Considerations).

---

## Technical Approach
- **Entry points / interfaces:**
  - `RecipeForm.svelte` props: `draft` (bindable) and an `onChange` callback emitting the next draft, plus a bindable/derived `valid` exposure. Concretely, support **both** Svelte binding and a callback so any parent context works:
    ```ts
    interface RecipeFormProps {
      draft: EditableRecipe;            // $bindable — parent owns it
      onChange?: (next: EditableRecipe) => void;  // optional callback mirror of the binding
      valid?: boolean;                  // $bindable, written by the component
    }
    ```
    The component computes `valid` with `$derived` and writes it back through the bindable prop; it also calls `onChange` (when provided) on every edit. Parents may use either `bind:draft` / `bind:valid` or the `onChange` callback — pick whichever their state model favors.
- **Key modules / components:**
  - `RecipeForm.svelte` — owns layout and the top-level `set(patch)` that merges a field patch into the draft and re-emits. Delegates each section to a sub-component.
  - `TagInput.svelte` — chips + text input; local `$state` for the in-progress value; calls logic helpers for add/remove/normalize.
  - `IngredientRows.svelte` — grid rows with drag handles; local `$state` for `dragIndex` and `overIndex`; `lowConf` visual treatment via a Tailwind class bound to the row flag.
  - `StepRows.svelte` — numbered textareas with drag handles; same drag pattern as ingredients.
  - `recipe-form-logic.ts` — pure functions, no Svelte imports:
    - `isRecipeValid(draft): boolean`
    - `reorder<T>(rows: T[], from: number, to: number): T[]`
    - `normalizeTag(raw: string): string`
    - `addTag(tags: string[], raw: string): string[]` (normalizes, dedupes, no-ops on empty)
    - `removeTag(tags: string[], tag: string): string[]`
    - row helpers as needed (`addIngredient`, `removeAt`, `updateAt`) — keep these pure and return new arrays.
- **Data model:**
  - STR-009 defines `Ingredient` as exactly `{ qty: string; unit: string; item: string }` and `RecipeInput = Omit<Recipe, 'id' | 'createdAt'>`. `lowConf` must **not** pollute the canonical `Ingredient` (STR-009 explicitly excludes it). Introduce an editor-local extension in `recipe.ts`:
    ```ts
    export interface EditableIngredient extends Ingredient {
      lowConf?: boolean;
    }
    export type EditableRecipe = Omit<RecipeInput, 'ingredients'> & {
      ingredients: EditableIngredient[];
    };
    ```
    The form operates on `EditableRecipe`; the parent strips `lowConf` (or simply ignores it) when building the `RecipeInput` it sends to `createRecipe`/`updateRecipe`. `qty` stays a `string` (never widen to number), per STR-009.
- **Key design decisions:**
  - **Logic lives in `recipe-form-logic.ts`, not in the components.** The story mandates testing reorder/validation/tag/add-remove by calling functions directly, and the project has no component-mount test harness. Keeping this logic pure and framework-free makes it directly unit-testable in the existing node Vitest project and keeps the `.svelte` files thin.
  - **Rune arrays mutated via reassignment, not in-place splice** (`rows = reorder(rows, from, to)`), matching the story note and Svelte 5 reactivity.
  - **Native HTML5 DnD** — `draggable` on the grip, `dragstart` records the source index into local `$state`, `dragover` sets the hover index (and `preventDefault`s), `drop` calls `reorder` and re-emits. No DnD library.
  - **Dual prop API (binding + callback)** so the varied parent contexts in later epics (store-backed, `$state`-backed, callback-driven) all integrate cleanly — this is the reuse contract the story stresses.

---

## Success Criteria
- [ ] `RecipeForm.svelte`, `TagInput.svelte`, `IngredientRows.svelte`, `StepRows.svelte` exist in `frontend/src/lib/components/` and render all fields.
- [ ] Editing any field re-emits the updated draft (via binding and via `onChange` when provided); the component keeps no stale internal copy of the draft.
- [ ] TagInput: Enter and comma each add a normalized tag; duplicates are ignored; Backspace on empty input removes the last tag; chips are removable.
- [ ] Ingredient rows add/remove; drag-to-reorder produces the correct new order; `lowConf: true` applies the red/muted class and editing qty or item clears it.
- [ ] Step rows add/remove; numbering reflects position; drag-to-reorder produces the correct new order.
- [ ] `valid` is true only when title non-empty + ≥1 ingredient with non-empty item + ≥1 non-empty step; false otherwise.
- [ ] `recipe-form-logic.ts` is pure (no Svelte imports) and its unit tests pass under `npm run test`.
- [ ] `npm run check` passes with no type errors and no `any`.

---

## Tasks
Ordered by dependency.

- [ ] **Add editor types:** In `frontend/src/lib/types/recipe.ts`, add `EditableIngredient` (extends `Ingredient` with optional `lowConf`) and `EditableRecipe`. Do not modify the canonical `Ingredient`/`RecipeInput` shapes from STR-009. Must compile before logic/components import them.
- [ ] **Write failing tests for the logic (RED):** Create `recipe-form-logic.test.ts` covering: `isRecipeValid` transitions (empty title, no ingredient item, no step, all-satisfied); `reorder` (move down, move up, no-op when from===to, out-of-range/null source ignored); `normalizeTag`/`addTag` (trim, lowercase, strip leading `#`, dedupe, empty no-op); `removeTag`; ingredient/step `addAt`/`removeAt`/`updateAt`. Fully test before implementing.
- [ ] **Implement the logic (GREEN):** Create `recipe-form-logic.ts` with the pure functions; make all tests pass. No Svelte imports.
- [ ] **Build the sub-components:** `TagInput.svelte`, `IngredientRows.svelte`, `StepRows.svelte` — runes mode, delegating to the logic module; native HTML5 DnD via local `$state` drag tracking; `lowConf` visual class on ingredient rows that clears on qty/item edit.
- [ ] **Build `RecipeForm.svelte`:** Compose the sub-components; implement the dual prop API (`$bindable` draft + `valid`, plus `onChange`); compute `valid` with `$derived`. Verify `npm run check` is clean.

---

## Considerations
- **No component test harness exists.** `vite.config.ts` defines only a `server` (node) Vitest project and excludes `*.svelte.{test,spec}` files; there is no jsdom/browser project and no `@testing-library/svelte`. Do not stand one up for this story — put all testable behavior in `recipe-form-logic.ts` and test it there. The `.svelte` files are verified via `npm run check` and manual/integration use in STR-013, not unit tests.
- **`requireAssertions: true`** is set in the Vitest config — every test must contain at least one assertion.
- **`lowConf` must not leak into the canonical types.** STR-009 deliberately omits it (it arrives semantically in EPIC-003); confining it to `EditableIngredient` keeps the API-client contract clean. The parent is responsible for not sending `lowConf` to the backend — out of scope here, but note it in the component's prop docs.
- **Drag-and-drop reactivity gotcha:** mutate rune arrays by reassignment (`rows = reorder(...)`), never in-place `splice`, or Svelte won't react. The prototype uses a React `useRef` for the drag source index; in Svelte use a local `$state` value.
- **Editing `unit` does NOT clear `lowConf`** — only qty and item do, per the prototype (`update(i, { unit })` omits the `lowConf: false` reset). Preserve that exactly.
- **Nullable numbers:** servings/totalTime come in as numbers but the inputs must handle the empty string → `null` round-trip like the prototype (`e.target.value ? parseInt(...) : null`). `EditableRecipe` inherits `servings: number` / `totalTime: number` from `RecipeInput`; allow the in-form value to be cleared. If the canonical type forbids `null`, treat an empty input as `0` or coordinate the nullable widening in the editor types — prefer keeping the parent's `RecipeInput` contract intact and representing "empty" consistently; document the choice in the component.

---
