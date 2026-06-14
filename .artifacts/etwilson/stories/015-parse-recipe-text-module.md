---
id: STR-015
title: parseRecipeText parser module
epic: EPIC-003
status: specced
priority: high
---

## Goal

Implement `parseRecipeText` — a pure, client-side TypeScript module that turns arbitrary pasted recipe text into a structured, editable draft with confidence and warnings. This is the testable heart of the ingestion work and the shared engine reused by freeform entry (EPIC-004) and, via `parseIngredient`, by URL import (EPIC-005).

---

## Scope

### In
- A pure module in `frontend/src/lib/` (no network, no side effects, no framework imports). Suggested location: `frontend/src/lib/parser/`.
- Export **both** `parseRecipeText(text)` and `parseIngredient(line)` as independent functions — EPIC-005 calls `parseIngredient` directly on JSON-LD ingredient strings.
- Port the algorithm from `.artifacts/etwilson/design/prototype/data.js` (do **not** copy the JS verbatim; re-implement idiomatically in typed TS).
- Parser behavior (all required):
  - **Section detection:** `Ingredients:` / `Instructions:` (and the header variants in `data.js`) → clean split; when absent, heuristic fallback that emits a "split was guessed" warning.
  - **Ingredient line parsing:** `qty` (integer, decimal, unicode + ascii fraction, range), `unit` (against the unit dictionary), `item`; strip bullets / numbering / `Step N:`.
  - **Inline header + comma-list:** `you need: a, b (x, y), c` → split into separate ingredients, respecting parentheses (the comma inside `(like 6, bone in)` must not split).
  - **Meta detection:** `servings` (serves N / N servings / makes N) and `totalTime` in minutes (incl. hour+minute and ranges → upper bound).
  - **`lowConf` flag** per ingredient: no detectable quantity and not a known always-present seasoning.
  - **Greeting/preamble skip:** leading chatty lines before any real content are dropped.
  - **Confidence (0–100):** weighted by header presence, title detection, step count, lowConf count; clamped to [20, 98].
  - **Warnings:** missing title, missing steps, lowConf count, guessed split.
- Return shape: `{ title: string; servings: number | null; totalTime: number | null; ingredients: EditableIngredient[]; steps: string[]; notes: string[]; warnings: string[]; confidence: number }`. Reuse `EditableIngredient` (already has `lowConf`) from `$lib/types/recipe`.
- Export the draft's TypeScript type so STR-016 (Review panel) and EPIC-004 can import it rather than redeclare it.

### Out
- Any UI, route, or component — this story is logic only.
- The parse-progress animation (STR-017).
- LLM-assisted parsing — heuristics only.
- Server-side parsing — client-side TS exclusively.

---

## Acceptance Criteria

Driven by the two canonical fixtures, lifted **verbatim** from `data.js` as `SAMPLE_PASTE_CLEAN` and `SAMPLE_PASTE_MESSY`.

- [ ] **Case A (clean, headered):** detects `Ingredients:`/`Instructions:` headers → 8 ingredients, 4 steps, title set, **no warnings**, high confidence. `400 g spaghetti` → `{ qty: '400', unit: 'g', item: 'spaghetti' }`. `Serves 4 · 25 minutes` → `servings: 4`, `totalTime: 25`.
- [ ] **Case B (messy, no headers):** emits the "split was guessed" warning; title empty (and warned); ~8 ingredients with several `lowConf`; 2 steps; **Low** confidence. `makes enough for 2` → `servings: 2`; `35-40 min` → `totalTime: 40`.
- [ ] **Parenthetical comma not split:** `chicken thighs (like 6, bone in)` stays a single ingredient.
- [ ] **Greeting dropped:** the leading "hey! here's that…" line is not emitted as an ingredient or step.
- [ ] **Quantity parsing** covers integers, decimals, unicode (`½`) and ascii (`1/2`) fractions, and ranges (`35-40`); bullets/numbering (`-`, `•`, `1.`, `Step 1:`) are stripped.
- [ ] `parseIngredient` is independently callable and returns `{ qty, unit, item, lowConf }` for a single line.
- [ ] Empty / whitespace-only input is handled without throwing.

---

## Context & Decisions

- **Client-side TypeScript — authoritative decision.** Enables instant feedback for freeform entry (EPIC-004) and offline use; the logic is pure text manipulation with no I/O. Do not introduce a server round-trip.
- **Heuristics only, no LLM.** The Review step (STR-016) is the correction mechanism for low-confidence parses. This ceiling is accepted for v1.
- **`data.js` is the behavioral contract, not the source to copy.** Lift the two sample strings verbatim as fixtures and derive assertions from the Case A / Case B descriptions in `.artifacts/etwilson/design/recipe-ingestion-brief.md`. Re-implement the algorithm in idiomatic typed TS — no `window`-globals, no JS-isms.
- **`parseIngredient` is a first-class export**, not a private helper, specifically because EPIC-005 reuses it standalone for best-effort splitting of JSON-LD ingredient strings.
- **Nullable meta:** `servings`/`totalTime` are `null` when absent — depends on STR-014 landing the nullable types so the draft aligns with `EditableRecipe`.

---

## Dependencies

- **Depends on:** STR-014 (nullable `servings`/`totalTime` types; the draft return shape must match the domain model)
- **Blocks:** STR-017 (paste flow consumes the parser), and downstream EPIC-004 (live preview) and EPIC-005 (`parseIngredient`)

---

## Notes

- Reference implementation and fixtures: `.artifacts/etwilson/design/prototype/data.js` (`parseRecipeText`, `parseIngredient`, `splitInlineList`, `detectMeta`, `cleanBullet`, `looksLikeIngredient`, `pushSentences`, `SAMPLE_PASTE_CLEAN`, `SAMPLE_PASTE_MESSY`). Behavioral spec: `.artifacts/etwilson/design/recipe-ingestion-brief.md` (Parser contract → TDD seed cases).
- The reference confidence formula: base 50, +25 if ingredient header found, +10 if title, +10 if any steps, −4 per lowConf, clamped to [20, 98]. Keep this unless tests show it misclassifies the two canonical cases.
- Decompose the internal helpers (qty regex, unit dictionary, bullet stripping, inline-list split) as you see fit, but keep the public surface to `parseRecipeText` + `parseIngredient` + the exported draft type.
- `notes[]` is produced when a `Notes:`/`Tips:` header is present. Neither canonical fixture exercises it, but keep the field on the return shape (it passes through to the detail view — see STR-017 notes decision).
</content>
