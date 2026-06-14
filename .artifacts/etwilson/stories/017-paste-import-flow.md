---
id: STR-017
title: Paste import flow & Add Recipe surface
epic: EPIC-003
status: specced
priority: high
---

## Goal

Wire everything into the first working ingestion path: an "Add recipe" entry point, the `/recipes/new` Add Recipe surface with its tabbed shell, the paste textarea with examples, the parse-progress animation, and the hand-off to the Review panel and save. This is the integration story that turns the parser (STR-015) and Review panel (STR-016) into a feature a user can actually use.

---

## Scope

### In
- **Route `/recipes/new`** (SvelteKit page route — frontend only; Save uses the existing `POST /api/recipes` via `createRecipe()`). Slots alongside the existing `/recipes/[id]` and `/recipes/[id]/edit` resourceful routes.
- **Add Recipe entry points:** a button in the library header and a CTA in the empty-library `EmptyState` ("Add your first recipe"), both navigating to `/recipes/new`.
- **Tabbed shell:** a `Segmented` control with three tabs — "From a link", "Paste text", "By hand". **Only "Paste text" is active**; the other two render **disabled** (visible, not hidden) so the surface's final shape is clear and EPIC-004/005 only flip them on.
- **Paste tab:** textarea, "Clean" and "Messy / texted" example buttons (populate the textarea with `SAMPLE_PASTE_CLEAN` / `SAMPLE_PASTE_MESSY`), a Clear button, a line count, and a "Parse recipe" button (disabled when empty).
- **Parse-progress animation:** a reusable, parameterized `ParseProgress` component driven by a list of step labels. For paste: "Reading the text…" → "Detecting sections…" → "Parsing quantities & units…" → "Flagging anything unclear…". Built reusable because EPIC-005 uses it with different labels.
- **On parse completion:** call `parseRecipeText(text)`, attach `source: { type: 'paste', method: 'parsed from pasted text' }`, and transition to the Review panel (STR-016) with the draft.
- **Save:** `onSave` → `createRecipe()` → navigate to the library (or the new recipe's detail view). **Back** from Review → return to the paste textarea and clear the draft.

### Out
- The parser internals (STR-015) and the Review panel internals (STR-016).
- The "From a link" and "By hand" tab contents (EPIC-005, EPIC-004) — placeholders only.
- Any backend change — `createRecipe` / `POST /api/recipes` already exists.
- Library-card provenance icon (STR-018).

---

## Acceptance Criteria

- [ ] An "Add recipe" control in the library navigates to `/recipes/new`; the empty-library state also offers a CTA that navigates there.
- [ ] `/recipes/new` shows a three-tab Segmented shell with "Paste text" active and the other two visibly disabled.
- [ ] The "Clean" / "Messy" buttons populate the textarea with the corresponding sample text; Clear empties it; "Parse recipe" is disabled while the textarea is empty.
- [ ] Clicking "Parse recipe" shows the four-step progress animation, then lands on the Review panel populated from `parseRecipeText`.
- [ ] The reviewed draft carries `source: { type: 'paste', method: 'parsed from pasted text' }`.
- [ ] Saving a valid reviewed recipe calls `createRecipe` and the recipe appears in the library; Back returns to the paste textarea with the draft cleared.

---

## Context & Decisions

- **Tabbed shell built now, Paste-only active.** Both EPIC-004 ("By hand" tab) and EPIC-005 ("From a link" tab) describe themselves as adding a tab to *this* surface. Building the full three-tab shell now (others disabled) means they slot in without restructuring.
- **`/recipes/new` is a UI route, not an API endpoint.** REST create stays `POST /api/recipes`; `/recipes/new` is the resourceful page-route convention (Rails-style: index `/recipes`, new-form `/recipes/new`, show `/recipes/:id`, edit `/recipes/:id/edit`), matching the existing routes.
- **`ParseProgress` is reusable and parameterized** by step labels specifically so EPIC-005 reuses it. The animation is presentational (timed step advance) — not a unit-test target; assert wiring/behavior, not timing.
- **Source provenance is set at the flow boundary**, not inside the parser — the parser is path-agnostic; this flow stamps `type: 'paste'`.

---

## Dependencies

- **Depends on:** STR-015 (parser), STR-016 (Review panel)
- **Blocks:** none within the epic (STR-018 is independent); unblocks the end-to-end paste experience

---

## Notes

- Behavioral/layout reference: `.artifacts/etwilson/design/prototype/add-recipe.jsx` — `AddRecipe` shell (`Segmented` method switch), `PasteMethod`, and `ParseProgress`. The prototype switches views via state; here use a real SvelteKit route. Re-implement in Svelte against the shadcn/Tailwind theme; do not port JSX.
- Sample fixtures `SAMPLE_PASTE_CLEAN` / `SAMPLE_PASTE_MESSY` should come from the parser module's exports (STR-015) rather than being re-pasted here.
- Existing pieces: `+page.svelte` (library, where the entry button goes), `EmptyState.svelte` (CTA), `createRecipe()` in `$lib/api/recipes`, `goto` from `$app/navigation`. Check whether a `Segmented`/tabs UI primitive exists under `lib/components/ui/`; if not, build a minimal one (the prototype's `Segmented` is the reference).
</content>
