---
id: EPIC-003
title: Text Parser & Paste Import
status: ready
created: 2026-06-13
---

## Goal

Implement the client-side `parseRecipeText` TypeScript module and the paste-text import flow — the first path that gets real recipes into the library. A user pastes arbitrary recipe text (clean, messy, LLM-generated, texted by a friend), clicks parse, watches a brief progress animation, then lands on a Review screen with the structured result fully editable before saving. This epic also ships the Review panel (provenance pill, confidence meter, warnings, editable form) that URL import reuses in EPIC-005, and activates the per-card provenance pill in the library.

> **Prototype reference**: `.artifacts/etwilson/design/prototype/` — open `YARA.html` in a browser for interactive behavioral reference. Most relevant files: `add-recipe.jsx` (paste flow, parse progress animation, Review panel behavior), `data.js` (reference implementation of `parseRecipeText` and `parseIngredient`; `SAMPLE_PASTE_CLEAN` and `SAMPLE_PASTE_MESSY` fixture strings). **The prototype is React + JSX; this project is SvelteKit + Rust.**
>
> **TDD note — parser only**: `data.js` is the right source for test case derivation. The functions define the behavioral contract: given these inputs, expect these outputs. Lift `SAMPLE_PASTE_CLEAN` and `SAMPLE_PASTE_MESSY` verbatim as test fixtures; derive assertions from the Case A / Case B outcomes in `.artifacts/etwilson/design/recipe-ingestion-brief.md`. Port the algorithm to TypeScript — do not copy the JS directly or reference the React component code when writing tests.

---

## Scope In

- **`parseRecipeText` TypeScript module** — client-side, in `frontend/src/lib/`. Pure function: takes raw text, returns a structured draft with `title`, `servings`, `totalTime`, `ingredients[]`, `steps[]`, `notes[]`, `warnings[]`, `confidence` (0–100). No network calls, no side effects. Portable to freeform entry (EPIC-004) without duplication.
- **Parser behavior** (all required, not optional):
  - Section detection: `Ingredients:` / `Instructions:` header patterns → clean split; fallback to heuristic split when absent (emits "split was guessed" warning).
  - Ingredient parsing per line: `qty` (integer, decimal, unicode/ascii fraction, range), `unit` (against dictionary), `item`; bullet/number stripping.
  - Inline header + comma-list handling: `you need: a, b (x, y), c` → split respecting parentheses.
  - Meta detection from full text: `servings` (serves N / N servings / makes N), `totalTime` in minutes.
  - `lowConf` flag: ingredient lines with no detectable quantity and not a known always-present seasoning.
  - Greeting/preamble skip: leading chatty lines before any real content are dropped.
  - Confidence score (0–100): weighted formula based on header presence, title detection, step count, lowConf count; clamped to [20, 98].
  - Warnings list: missing title, missing steps, lowConf count, guessed split.
- **TDD seed fixtures** — lift verbatim from `.artifacts/etwilson/design/prototype/data.js` (`SAMPLE_PASTE_CLEAN` and `SAMPLE_PASTE_MESSY` string constants):
  - Case A (`SAMPLE_PASTE_CLEAN`): headered text → high confidence, no warnings, 8 ingredients, 4 steps.
  - Case B (`SAMPLE_PASTE_MESSY`): chatty texted recipe → Low confidence, "split was guessed" warning, lowConf ingredients flagged, parenthesized comma not split.
- **Paste import flow**:
  - "Add recipe" entry point added to the library (button / nav item).
  - "Paste text" tab in Add Recipe surface with textarea, "Parse recipe" button, "Clean" and "Messy" example buttons.
  - Parse progress animation (four steps, sequential): "Reading the text…" → "Detecting sections…" → "Parsing quantities & units…" → "Flagging anything unclear…"
  - On completion: transition to Review panel.
- **Review panel** (shared component, reused by EPIC-005):
  - Provenance pill (clipboard icon + "Pasted text" label + method sub-label).
  - Confidence meter: animated fill bar, tone label (High ≥ 85 / Medium ≥ 60 / Low < 60), color-coded.
  - Warnings list below the meter (info icon per item).
  - Fully editable RecipeForm (from EPIC-002) below, with lowConf ingredient rows visually flagged.
  - "Back" button (returns to paste textarea, clears draft) and "Save to library" button (disabled until title + ≥1 ingredient + ≥1 step).
- **Provenance stored on recipe**: `source: { type: 'paste', method: 'parsed from pasted text' }`.
- **Provenance pill activated in library cards**: source icon per card (globe = url, clipboard = paste, wand = manual). This is the first epic where multiple source types exist.

## Scope Out

- URL import (EPIC-005).
- Freeform manual entry (EPIC-004) — the parser module is built here and reused there; the freeform UI surface is not.
- LLM-assisted parsing — heuristics only.
- Server-side parsing — parser is client-side TypeScript exclusively.
- "By hand / structured form" create path.

---

## Cleanup from EPIC-002

- **Fix nullable `servings`/`totalTime` in form and types.** The EPIC-002 editor form used `0` as a sentinel for "unset" rather than `null`, because the `RecipeInput` type didn't cleanly support nullable number fields. This means a recipe with no servings saves as `0` instead of blank — a bug that becomes visible the moment the parser returns a recipe with missing servings/totalTime (common). The stories decomposition should include a cleanup story to: (1) update `Recipe`/`RecipeInput` types to use `number | null` for these fields, (2) update the form component to write `null` when the inputs are empty, (3) verify the backend round-trips `null` correctly (schema columns are already nullable). This story has no new UI and is a prerequisite to the parser returning correct drafts.

---

## Key Decisions

- **Parser is client-side TypeScript.** Enables instant feedback in freeform mode (EPIC-004), works offline, no API round trip. The parser logic has no I/O and is a clean port from the reference implementation in `.artifacts/etwilson/design/prototype/data.js` — port the algorithm, not the JSX scaffolding. If a mobile client is ever built, the parser can be re-exposed via API at that point; don't build for that now.
- **Heuristics only — no LLM.** The Review step is the correction mechanism for low-confidence parses. LLM integration would conflict with offline/local-first use and adds operational complexity. Revisit in v2 if real usage shows users struggling.
- **Confidence meter kept.** It's the visual explanation for why some ingredient rows are flagged red. Not load-bearing for save logic, but meaningful UX.
- **Review panel is a shared component.** Built here, reused by EPIC-005 (URL import). Do not duplicate it.
- **Provenance pill activates in this epic.** The `source` field exists in the schema since EPIC-002; the library card UI for it is deferred until here, when two source types (manual + paste) first coexist.
