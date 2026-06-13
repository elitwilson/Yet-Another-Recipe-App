---
id: EPIC-005
title: URL Import
status: ready
created: 2026-06-13
---

## Goal

Add URL-based recipe import — paste a link to any recipe page, the server fetches it and extracts the structured `schema.org/Recipe` JSON-LD that most cooking sites publish, and the result lands in the shared Review panel before saving. This is the only ingestion path requiring new backend surface; CORS prevents the client from fetching arbitrary URLs, so the fetch and extraction happen server-side.

> **Prototype reference**: `.artifacts/etwilson/design/prototype/` — open `YARA.html` in a browser for interactive behavioral reference. Most relevant file: `add-recipe.jsx`, specifically the `UrlMethod` component and the `ParseProgress` animation. **The prototype is React + JSX; this project is SvelteKit + Rust. Use it as a behavioral and layout spec only — do not port the code. Note that `importFromUrl` in `data.js` is entirely mocked (canned fixtures with a fake delay); the real implementation is the server-side endpoint described in this epic.**

---

## Scope In

- **Backend endpoint**: `POST /api/recipes/import/url` — accepts `{ url: string }`, fetches the page server-side, locates and parses `schema.org/Recipe` JSON-LD, returns a structured recipe draft matching the `Recipe` shape. Query/service layer in `backend/src/recipes/`.
- **Structured extraction from JSON-LD**: map `name`, `recipeYield`/`yield` → `servings`, `totalTime`/`cookTime`+`prepTime` → `totalTime` (minutes), `recipeIngredient[]` → `ingredients[]` (best-effort qty/unit/item split), `recipeInstructions[]` → `steps[]`, `keywords`/`recipeCategory` → `tags`.
- **Error response when no JSON-LD found**: return a structured error (not a 500); the client surfaces a message and a "try pasting the text instead" CTA.
- **"From a link" tab** in the Add Recipe surface: URL input field (with link icon), "Fetch & parse" button, example recipe link chips (populate the input for demo/testing).
- **Parse progress animation** (client-side, sequential steps): "Fetching the page…" → "Scanning for schema.org Recipe markup…" → "Found JSON-LD — reading fields…" → "Structuring ingredients & steps…"
- **Review panel** (the shared component from EPIC-003): provenance pill (`source.type = 'url'`, globe icon, hostname, "schema.org Recipe (JSON-LD)" method label), confidence display, warnings if any fields were missing or ambiguous, fully editable RecipeForm, Save button.
- **Provenance stored on recipe**: `source: { type: 'url', url, host, method: 'schema.org Recipe (JSON-LD)' }`.

## Scope Out

- HTML scraping fallback — if no JSON-LD is found, the error UX handles it; no attempt to parse raw HTML.
- LLM-assisted extraction.
- Client-side URL fetching — must be server-side (CORS).
- Rate limiting or abuse prevention — personal app, not needed in v1.
- Handling sites behind authentication or paywalls.

---

## Key Decisions

- **Must be server-side.** CORS prevents the client from fetching arbitrary external URLs. The backend endpoint is the only viable path.
- **JSON-LD only — no HTML scraping fallback.** Most modern recipe sites publish `schema.org/Recipe` JSON-LD; sites that don't should prompt the user to paste instead. Scraping raw HTML is fragile and out of scope.
- **Error UX: informative message + suggest paste.** When no JSON-LD is found, the UI shows a clear explanation and a "try pasting the text instead" CTA that navigates to the Paste tab. No silent fallback, no auto-redirect.
- **Review panel is shared with EPIC-003.** Do not re-implement it. EPIC-005 depends on EPIC-002 for the editor form; the Review panel component from EPIC-003 must be importable and reused here. Sequence accordingly.
- **Ingredient parsing from JSON-LD strings is best-effort.** `recipeIngredient` entries are often prose strings ("2 cups flour, sifted"). Apply the same `parseIngredient` function from EPIC-003 to split qty/unit/item; lowConf flag applies if no quantity is detected. The Review step is the correction mechanism.
