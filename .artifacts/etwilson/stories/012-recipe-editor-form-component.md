---
id: STR-012
title: Recipe editor form component
epic: EPIC-002
status: specced
priority: high
---

## Goal

Build the shared Svelte editor form component used by the edit flow in this epic and reused by every import epic (EPIC-003 Review panel, EPIC-004 freeform entry, EPIC-005 Review panel). The interface must be clean enough that all those callers work without knowing about each other.

---

## Scope

### In
- `RecipeForm` Svelte component in `frontend/src/lib/components/`
- Fields: title (text input), servings (number input), totalTime (number input, minutes), tags (TagInput), ingredient rows, step rows
- **TagInput**: chips with add-on-enter or add-on-comma, backspace removes last tag, existing tags shown as removable chips
- **Ingredient rows**: qty / unit / item column inputs per row; add row; remove row; drag-to-reorder via native HTML5 drag-and-drop; `lowConf` prop flag visually marks a row (red/muted background)
- **Step rows**: textarea per step, numbered; add step; remove step; drag-to-reorder via native HTML5 drag-and-drop
- Validation state exposed to parent: valid when title is non-empty and ≥1 ingredient item and ≥1 step are non-empty
- Controlled component: accepts a draft prop, emits updates via callback or Svelte binding — parent owns the state

### Out
- Save/submit logic — the parent (edit flow, Review panel) handles saving
- Provenance pill, confidence meter, warnings — those are Review panel concerns in EPIC-003
- Any route or page

---

## Acceptance Criteria

- [ ] All fields render and accept input: title, servings, totalTime, tags, ingredient rows, step rows
- [ ] TagInput: Enter or comma adds a tag; Backspace on empty input removes the last tag; each tag renders as a removable chip
- [ ] Ingredient rows: each row has qty, unit, item inputs; "Add ingredient" appends a blank row; remove button deletes a row; rows can be reordered via drag-and-drop
- [ ] Step rows: each step has a numbered textarea; "Add step" appends a blank step; remove button deletes a step; rows can be reordered via drag-and-drop
- [ ] Drag-and-drop reorder works correctly for both ingredient and step rows (correct final order after drop)
- [ ] Validation state reflects correctly: true only when title, ≥1 ingredient item, and ≥1 step are all non-empty
- [ ] An ingredient row with `lowConf: true` receives a red/muted visual treatment; editing qty or item clears the flag
- [ ] Component operates correctly as a controlled component (parent drives state)

---

## Context & Decisions

- **Native HTML5 drag-and-drop** — no library. The prototype uses the `draggable`, `dragstart`, `dragover`, `drop` pattern; this translates directly to Svelte event handlers. No additional dependency.
- **Controlled component** (draft in, change events out) is required because multiple parent contexts own draft state differently: the edit flow holds a pre-populated recipe, the Review panel holds a parsed draft, the freeform entry holds a live-parsed result.
- **`lowConf` on ingredient rows**: this field is set by the parser (arriving in EPIC-003). Add it to the `Ingredient` type's optional props or accept it as a separate per-row prop — whichever is cleaner. Editing qty or item should clear it.
- **`recipe-form.jsx`** in `.artifacts/etwilson/design/prototype/` is the behavioral reference — `RecipeForm`, `IngredientRows`, `StepRows`, and `TagInput` components show the exact interaction model. Implement idiomatically in Svelte; do not port the React code.

---

## Dependencies

- **Depends on:** STR-009 (`Recipe`, `Ingredient` types)
- **Blocks:** STR-013 (edit flow uses this component)

---

## Notes

- This is the most complex frontend piece in the epic. The interface design matters more than the implementation details — get the prop/event API right so EPIC-003 and EPIC-004 can consume it cleanly.
- The architect should consider how to handle the Svelte reactivity model for drag-and-drop array mutations — `$state` rune arrays behave differently from plain arrays; mutating via splice vs reassignment matters.
- Vitest unit tests should cover: validation state transitions, TagInput add/remove, ingredient/step add/remove. Drag-and-drop logic can be unit-tested by calling the reorder function directly rather than simulating DOM events.
