---
number: 019
story: STR-018
status: ready
base_branch: main
depends_on: [STR-016]
scope_files:
  - frontend/src/lib/components/library/RecipeCard.svelte
  - frontend/src/lib/components/library/RecipeCard.test.ts
---

# Feature: Library card provenance pill

## Summary
Each recipe card in the library grid gains a small source icon showing where the recipe came from: globe = url, clipboard = paste, wand = manual. Until now the `source` field (present in the schema since EPIC-002) was invisible; with paste import landing in EPIC-003, multiple source types finally coexist and the indicator carries real meaning. The card shows the icon only (with an accessible label) — not the verbose provenance pill, which belongs to the Review panel. The type→icon/label mapping is the shared `sourceMeta` helper built in STR-016 (spec 016), reused here so the card and the Review panel never drift.

---

## Requirements
- Every `RecipeCard` renders a source icon derived from `recipe.source.type`.
- The icon matches the source type: `url` → globe, `paste` → clipboard, `manual` → wand.
- The icon carries an accessible label conveying the source (e.g. `aria-label`/`title` such as "Pasted text", "Imported", "Entered by hand"), sourced from the same shared helper — not a hand-written second copy.
- The icon/label mapping is the shared `sourceMeta` helper from STR-016; this story creates no second type→icon mapping.
- A manual recipe and a pasted recipe render visibly different, correct icons.
- The card shows the icon only — no host, no method sub-label, no verbose pill.

---

## Scope

### In Scope
- Adding a source-icon element to `frontend/src/lib/components/library/RecipeCard.svelte`, driven by `recipe.source.type` via the shared `sourceMeta` helper.
- An accessible label on that icon (aria-label and/or title).
- A `data-test="recipe-source"` selector on the icon element for E2E/manual verification, consistent with the card's existing `data-test` contract.
- Extending `RecipeCard.test.ts` with the type→icon/label contract: one case per source type (url / paste / manual) asserting the helper returns the expected icon and label.

### Out of Scope
- The verbose provenance pill (icon + host/label + method) — that is the Review panel, STR-016.
- Building the `sourceMeta` helper — it is built and exported by STR-016 (spec 016); this story consumes it.
- Any change to how `source` is stored, fetched, or typed (`RecipeSource` already exists in `$lib/types/recipe`).
- Filtering or sorting the library by source.
- Adding an icon library / dependency — icons follow the existing inline-SVG convention.

---

## Technical Approach
- **Entry point:** `frontend/src/lib/components/library/RecipeCard.svelte`. The card already has a header row (`flex items-start justify-between`) holding the title and the favorite button. The source icon is a compact, muted element placed consistent with the prototype — in the prototype (`library.jsx`) it sits on a footer row alongside the tags; on this card a sensible placement is near the title/meta or in the card footer area. Keep it visually quiet (muted foreground, small size ~size-4) so it does not compete with the favorite control.
- **Shared helper (dependency):** STR-016 exports `sourceMeta(source) → { icon, label, sub }` (planned location under the review feature, e.g. `frontend/src/lib/components/review/` — confirm the exact import path against STR-016's delivered code before importing). The card calls `sourceMeta(recipe.source)` and uses `.icon` and `.label` only; it ignores `.sub` (that sub-label is the Review panel's verbose treatment).
- **Icon rendering:** This codebase has no icon library — existing icons (e.g. the favorite star) are inline SVGs. How `sourceMeta` expresses `.icon` is owned by STR-016: it may return an icon-name string mapped to an SVG, or a component/snippet. The card must render whatever shape STR-016 settled on. If STR-016 returns a bare name string, the card needs a tiny name→SVG lookup for the three glyphs (globe, clipboard, wand) following the existing inline-SVG pattern; if STR-016 already exposes a renderable icon, reuse it directly. Decide at implementation time by reading STR-016's delivered helper — do not duplicate the type→icon *mapping* either way; only the SVG glyph rendering, if any, is local.
- **Data model:** `RecipeSource { type: 'url' | 'paste' | 'manual'; host?; url?; method? }` from `$lib/types/recipe`. Only `type` is read on the card. `recipe.source` is always present (non-optional on `Recipe`), but the helper should tolerate a missing/unknown type defensively (the prototype falls back to the paste/manual icon).
- **Key design decisions:** Icon-only on the card (compactness); single shared mapping (consistency with Review panel); follow the prototype's muted, small treatment mapped to theme tokens (`text-muted-foreground`, Tailwind size utilities) rather than porting the JSX inline styles.

---

## Success Criteria
- [ ] A `manual` recipe renders the wand icon; a `paste` recipe renders the clipboard icon; a `url` recipe renders the globe icon.
- [ ] The icon element exposes an accessible label describing the source.
- [ ] The icon/label come from the shared `sourceMeta` helper — grep confirms no second type→icon mapping object in `RecipeCard.svelte`.
- [ ] `RecipeCard.test.ts` has a case per source type asserting the helper's icon/label for that type.
- [ ] The card still shows only the icon (no host/method sub-label).
- [ ] Existing card behavior (title, time, tags, favorite toggle, navigation) is unchanged.

---

## Tasks
Ordered by dependency.

- [ ] **Confirm the helper contract:** Read STR-016's delivered `sourceMeta` helper to confirm its exact export path and the shape of its `icon` field (name string vs. renderable). This determines how the card renders the glyph. Do not start the card until this is known. (If STR-016 is not yet merged into the working branch, this is the gating dependency — see Considerations.)
- [ ] **Add the source-icon test cases (RED):** Extend `frontend/src/lib/components/library/RecipeCard.test.ts` with one case per source type asserting `sourceMeta` returns the expected icon and label for `url` / `paste` / `manual`. Mirror the file's existing pure-logic test style (the suite tests logic/contracts, not mounted components, per the file's header note). Add `data-test="recipe-source"` to the documented selector registry test.
- [ ] **Render the icon on the card (GREEN):** In `RecipeCard.svelte`, import and call `sourceMeta(recipe.source)`, render the icon (icon-only) with an accessible label and `data-test="recipe-source"`, placed per the prototype and styled with theme tokens. Render whatever icon shape STR-016 exposes; if a local name→SVG lookup is needed, follow the existing inline-SVG pattern. Verify the manual seed recipe and a pasted recipe show different icons.

Aim for 3 tasks; the helper-contract confirmation gates the other two.

---

## Considerations
- **Hard dependency on STR-016.** This story consumes the `sourceMeta` helper STR-016 builds and exports. The story is *independent of STR-017* and can run in parallel, but it cannot complete until STR-016's helper exists on the working branch. If executing before STR-016 is merged, the implementer must either base off STR-016's branch or wait. The architect could not pin the helper's exact import path or icon-field shape because STR-016 is unwritten at spec time — confirm both by reading the delivered helper (first task) rather than assuming.
- **No icon library exists.** Icons in this codebase are inline SVGs (see the favorite star in `RecipeCard.svelte`). Three glyphs are needed: globe, clipboard, wand. Where the SVG markup lives depends on STR-016's helper shape (see Technical Approach) — but the *mapping* from type to glyph must remain single-sourced in the helper.
- **Component tests don't mount.** Per the header comment in `RecipeCard.test.ts`, the current vitest config has no jsdom/happy-dom environment, so the suite tests pure logic and documents `data-test` selectors rather than rendering the component. Test the icon/label via the `sourceMeta` helper's return values and register the new selector — do not attempt to mount the card unless the test environment is added (out of scope here).
- **`source` is non-optional but defend anyway.** `Recipe.source` is required by the type, but the helper should fall back gracefully on an unexpected/missing `type` (the prototype defaults to the paste/manual icon) rather than rendering nothing or throwing.
- **Keep it compact.** The prototype's card source treatment is small and muted (size ~11px, muted foreground). Match that restraint so the icon reads as metadata, not a primary control.
