---
id: EPIC-004
title: Freeform Manual Entry
status: ready
created: 2026-06-13
---

## Goal

Add the recommended "by hand" recipe creation path: a two-panel freeform entry surface where the user writes a recipe as a loose note and sees it structured live on the right as they type. Powered by the `parseRecipeText` module from EPIC-003, with the structured preview serving as the review step — no separate Review screen. The user writes, the app structures, the user saves.

> **Prototype reference**: `.artifacts/etwilson/design/prototype/` — open `YARA.html` in a browser for interactive behavioral reference. Most relevant file: `add-recipe.jsx`, specifically the `FreeformManual` and `LivePreview` components. **The prototype is React + JSX; this project is SvelteKit + Rust. Use it as a behavioral and layout spec only — do not port the code.**

---

## Scope In

- **"By hand" tab** in the Add Recipe surface (alongside "From a link" and "Paste text").
- **Two-panel layout**: freeform textarea on the left ("You write"), live structured preview on the right ("YARA structures →"). Preview updates on every keystroke.
- **Live parse**: calls `parseRecipeText` (from EPIC-003) on each input change; preview reflects the latest parse result — title, time, servings, ingredient list (with lowConf flagging), numbered steps.
- **Empty preview state**: when the textarea is blank, the right panel shows a wand icon and "Start typing on the left. Structure appears here as you go."
- **lowConf ingredient lines** flagged in the preview (red/muted quantity column).
- **Direct save**: "Save to library" button (disabled until title + ≥1 ingredient + ≥1 step, same validation as elsewhere). No separate Review screen — the live preview is the review.
- **Provenance stored on recipe**: `source: { type: 'manual', method: 'parsed as you type' }`.

## Scope Out

- Structured form entry mode — cut; freeform only.
- A separate Review / confidence screen for manual entry — the live preview replaces it.
- Any import flow (URL, paste) — those are EPIC-003 and EPIC-005.

---

## Key Decisions

- **Freeform only — structured form cut.** The freeform path is the recommended default and the structured form adds surface area without a distinct use case. Can be revisited if user feedback demands it.
- **Live preview is the review.** The user sees the structured output as they type; there is no friction-adding intermediate Review step. This is the lowest-friction manual entry path.
- **Reuses `parseRecipeText` from EPIC-003.** The parser is not re-implemented or duplicated. EPIC-004 depends on EPIC-003 shipping first.
- **Reuses the editor form from EPIC-002.** The underlying `RecipeForm` component is not rebuilt; it is used in the live preview and (implicitly) validates the draft before save.
