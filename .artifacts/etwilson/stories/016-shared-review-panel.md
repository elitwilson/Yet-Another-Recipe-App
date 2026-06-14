---
id: STR-016
title: Shared Review panel component
epic: EPIC-003
status: specced
priority: high
---

## Goal

Build the Review panel: the shared screen every import path lands on before saving. It shows where the recipe came from (provenance pill), how confident the parse was (confidence meter), what to double-check (warnings), and the fully editable recipe form with low-confidence ingredient rows flagged. Built as a standalone, importable component because EPIC-005 (URL import) reuses it unchanged.

---

## Scope

### In
- A `ReviewPanel` component (suggested `frontend/src/lib/components/review/`) that takes a draft (the parser's return shape from STR-015) plus `onBack` and `onSave` handlers.
- **Provenance pill:** icon + label + method sub-label, driven by `source.type` (url = globe, paste = clipboard, manual = wand). Implement as a shared source-icon/label helper (e.g. `sourceMeta(source) → { icon, label, sub }`) so STR-018 (library card) reuses the same mapping.
- **Confidence meter:** animated fill bar with tone label and color — High ≥ 85, Medium ≥ 60, Low < 60. Shown only when `confidence != null`.
- **Warnings list:** each warning rendered with an info icon; section hidden when empty.
- **Editable form:** the EPIC-002 `RecipeForm` below the meta block, bound to the draft.
- **lowConf row flagging:** `IngredientRows` visually flags ingredient rows where `lowConf` is true (e.g. red/muted quantity column). This adds the flagging affordance to the existing component without breaking its current callers.
- **Footer actions:** Back button (clears the draft / returns control to the caller) and "Save to library" button, disabled until the draft is valid (title + ≥1 ingredient with an item + ≥1 non-empty step). Reuse `isRecipeValid` from `recipe-form-logic.ts`. Show the "Needs a title, at least one ingredient, and one step" hint when invalid.

### Out
- The route, tab shell, paste textarea, and parse animation (STR-017) — this is a pure component that receives a ready draft.
- Persisting the recipe — `onSave` is a callback; the caller owns the API call.
- The library-card provenance icon (STR-018), though it consumes the helper built here.
- Notes editing — per epic decision, notes are not editable in the form (pass-through only; see STR-017).

---

## Acceptance Criteria

- [ ] Given a draft, the panel renders the provenance pill, confidence meter, warnings, and an editable form reflecting the draft's fields.
- [ ] The confidence meter shows **High / Medium / Low** at the 85 / 60 thresholds with distinct colors, and is hidden when `confidence` is null.
- [ ] Ingredient rows with `lowConf === true` are visually flagged in the form; non-lowConf rows render normally.
- [ ] The warnings section is hidden when there are no warnings and lists each warning with an info icon otherwise.
- [ ] "Save to library" is disabled until the draft has a title, ≥1 ingredient with an item, and ≥1 non-empty step; clicking it when enabled invokes `onSave` with the current draft.
- [ ] "Back" invokes `onBack` (caller decides what that means — for paste, returning to the textarea and clearing the draft).
- [ ] Edits in the form (title, servings, ingredients, steps, tags) update the draft the parent holds.

---

## Context & Decisions

- **Shared component — do not duplicate.** EPIC-005 imports this exact component for URL import; its only differences (globe provenance, different warnings) are data, not structure. Keep it caller-agnostic: it takes a draft + callbacks and knows nothing about paste vs URL.
- **Provenance mapping is a shared helper, not inlined**, because the library card (STR-018) needs the same `type → icon` mapping. Build it once here and export it.
- **lowConf flagging lives in `IngredientRows`**, the shared row component, so the same flag surfaces anywhere the form is used (including EPIC-004's preview if it reuses the form). Make the flag opt-in/driven by the data so existing callers (the edit flow) are unaffected.
- **Validation reuses `isRecipeValid`** — do not reimplement the title/ingredient/step rule.
- **Notes pass through, not edited.** Per the epic decision, the form gains no notes field this epic; parsed `notes` are carried on the draft and shown read-only on the detail view after save.

---

## Dependencies

- **Depends on:** STR-014 (nullable form types), STR-015 (the draft shape/type the panel renders)
- **Blocks:** STR-017 (paste flow renders this panel), STR-018 (reuses the source-icon helper); also unblocks EPIC-005

---

## Notes

- Behavioral/layout reference: `.artifacts/etwilson/design/prototype/add-recipe.jsx` — `ReviewPanel`, `Confidence`, and `Provenance` components. Re-implement in Svelte against the existing shadcn/Tailwind theme; do not port JSX or re-derive colors (map to theme tokens).
- Existing pieces to build on: `RecipeForm.svelte`, `IngredientRows.svelte`, `recipe-form-logic.ts` (`isRecipeValid`), `$lib/types/recipe` (`EditableRecipe`, `EditableIngredient`, `RecipeSource`).
- The prototype gates the meter on `draft.confidence != null` and uses `var(--primary)` / amber / `var(--destructive)` for High/Medium/Low — map these to theme tokens.
</content>
