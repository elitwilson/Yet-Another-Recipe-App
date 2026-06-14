---
id: STR-018
title: Library card provenance pill
epic: EPIC-003
status: specced
priority: medium
---

## Goal

Activate the per-card provenance indicator in the library: each recipe card shows a small source icon (where the recipe came from). This is the first epic where multiple source types coexist — manual seed data plus pasted recipes — so the indicator finally carries meaning.

---

## Scope

### In
- A source icon on `RecipeCard` driven by `recipe.source.type`: globe = url, clipboard = paste, wand = manual.
- Reuse the shared source-icon/label helper built in STR-016 (`sourceMeta`) so the card and the Review panel pill stay in sync.
- Sensible placement on the card (e.g. near the title or in a corner) consistent with the prototype; include an accessible label (e.g. `aria-label`/`title` describing the source).

### Out
- The full provenance pill with method sub-label — that's the Review panel (STR-016); the card shows just the icon (optionally with a tooltip/label).
- Any change to how `source` is stored or fetched — the field has existed since EPIC-002.
- Filtering or sorting by source.

---

## Acceptance Criteria

- [ ] Each library card renders the correct source icon for its `source.type` (globe / clipboard / wand).
- [ ] The icon has an accessible label conveying the source.
- [ ] The icon mapping is the shared helper from STR-016, not a second copy.
- [ ] A card with seeded manual recipes and a card with a pasted recipe show different, correct icons.

### Out
-

---

## Context & Decisions

- **Deferred to this epic by design.** The `source` field has been in the schema since EPIC-002, but the card UI was intentionally held until now, when paste import makes a second source type real and the indicator becomes informative.
- **Shared mapping, single source of truth.** The `type → icon` mapping is defined once in STR-016's helper and consumed here; do not duplicate the icon/label logic.
- **Card shows icon only.** The verbose pill (icon + host/label + method) belongs to the Review panel; the card stays compact.

---

## Dependencies

- **Depends on:** STR-016 (the shared source-icon helper)
- **Blocks:** none

---

## Notes

- Reference: the `Provenance` component in `.artifacts/etwilson/design/prototype/add-recipe.jsx` (icon mapping) and the per-card source treatment in `.artifacts/etwilson/design/prototype/library.jsx`.
- Touch point: `frontend/src/lib/components/library/RecipeCard.svelte`; existing test `RecipeCard.test.ts` should gain a case per source type.
- Independent of STR-017 — can be built in parallel once STR-016's helper exists.
</content>
