---
number: 017
story: STR-016
status: ready
base_branch: main
depends_on: [STR-014, STR-015]
scope_files:
  - frontend/src/lib/components/review/ReviewPanel.svelte
  - frontend/src/lib/components/review/source-meta.ts
  - frontend/src/lib/components/review/source-meta.test.ts
  - frontend/src/lib/components/review/confidence.ts
  - frontend/src/lib/components/review/confidence.test.ts
  - frontend/src/lib/components/review/ReviewPanel.test.ts
  - frontend/src/lib/types/recipe.ts
  - frontend/src/lib/components/IngredientRows.svelte
---

# Feature: Shared Review Panel

## Summary
The Review panel is the shared screen every import path (paste now, URL later) lands on before a recipe is saved. Given a parsed draft, it shows where the recipe came from (a provenance pill), how confident the parse was (a confidence meter), what the user should double-check (a warnings list), and the fully editable `RecipeForm` below — with low-confidence ingredient rows visually flagged. It is a pure, caller-agnostic component: it receives a ready draft plus `onBack` and `onSave` callbacks and knows nothing about paste vs URL. The provenance source→icon/label mapping is extracted into a shared helper (`sourceMeta`) so the library card (STR-018) reuses the same single source of truth.

---

## Requirements
- Given a draft, the panel renders a provenance pill, the confidence meter (when applicable), the warnings list (when non-empty), and an editable `RecipeForm` reflecting the draft's fields.
- The provenance pill is driven by `draft.source.type`: `url` → globe icon, `paste` → clipboard icon, `manual` → wand icon. Each maps to a label and a method sub-label.
- The confidence meter renders only when `draft.confidence != null`. It shows a tone label of **High** (≥ 85), **Medium** (≥ 60), or **Low** (< 60), each with a distinct color, and a fill bar whose width reflects the value.
- The warnings section is hidden when `draft.warnings` is empty/absent and otherwise lists each warning with an info icon.
- Ingredient rows where `lowConf === true` are visually flagged; rows without the flag render normally. This affordance must not break existing `IngredientRows` callers (the edit flow), which pass rows without `lowConf`.
- The footer has a **Back** button that invokes `onBack`, and a **Save to library** button that is disabled until the draft is valid (title + ≥ 1 ingredient with an item + ≥ 1 non-empty step) and invokes `onSave(draft)` when enabled.
- When the draft is invalid, the hint "Needs a title, at least one ingredient, and one step." is shown.
- Edits in the form (title, servings, total time, tags, ingredients, steps) propagate to the draft the parent holds.
- `notes` are pass-through only — carried on the draft, never rendered as an editable field here.

---

## Scope

### In Scope
- A `ReviewPanel.svelte` component under `frontend/src/lib/components/review/`.
- A shared `sourceMeta(source)` helper returning `{ icon, label, sub }`, exported for reuse by STR-018.
- A pure confidence helper (`confidenceTone`/`confidenceColor` or a single `confidenceMeta`) encoding the 85/60 thresholds and color mapping.
- Adding `lowConf` row flagging to `IngredientRows.svelte` — **verify current state first** (the flagging may already be present; see Considerations).
- Defining the parsed-draft TypeScript type the panel renders, in `frontend/src/lib/types/recipe.ts`, if STR-015 has not already added it (see Considerations).

### Out of Scope
- The route, tab shell, paste textarea, and parse-progress animation (STR-017) — this component receives a ready draft.
- Persisting the recipe — `onSave` is a callback; the caller owns the API call.
- The library-card provenance rendering (STR-018), though it consumes `sourceMeta` built here.
- A notes editing field — notes pass through only.
- Re-deriving prototype colors literally — map High/Medium/Low to theme tokens (see Considerations).

---

## Technical Approach
- **Entry point / interface:** `ReviewPanel.svelte` props (Svelte 5 runes, `$props`):
  ```ts
  interface Props {
    draft: ParsedDraft;                 // bindable
    onBack: () => void;
    onSave: (draft: ParsedDraft) => void;
    backLabel?: string;                 // default "Back"
  }
  ```
  Use `let { draft = $bindable(), onBack, onSave, backLabel = 'Back' }: Props = $props();` so form edits flow back to the parent, mirroring how `RecipeForm` already exposes `draft = $bindable()`.

- **Draft type:** `ParsedDraft` extends the existing `EditableRecipe` with the parse metadata the prototype carries:
  ```ts
  export type ParsedDraft = EditableRecipe & {
    confidence: number | null;
    warnings: string[];
    source: RecipeSource;
  };
  ```
  `EditableRecipe` already carries `notes: string[]` (pass-through) and `ingredients: EditableIngredient[]` (with optional `lowConf`). If STR-015's spec already defines this type, import it rather than redefining — do not create a duplicate. Reconcile names with whatever STR-015 landed.

- **sourceMeta helper** (`review/source-meta.ts`):
  ```ts
  export function sourceMeta(source: RecipeSource): { icon: 'globe' | 'clipboard' | 'wand'; label: string; sub: string }
  ```
  Mapping from the prototype: `url` → `{ icon: 'globe', label: source.host ?? <fallback>, sub: source.method ?? 'imported from URL' }`; `paste` → `{ icon: 'clipboard', label: 'Pasted text', sub: source.method ?? 'parsed from text' }`; `manual` → `{ icon: 'wand', label: 'Freeform entry', sub: source.method ?? 'parsed as you type' }`. Unknown types fall back to the paste entry. This is the single type→icon source of truth STR-018 imports — keep it framework-free (plain TS, returns an icon *name*, not markup), since the codebase uses inline SVGs per-component rather than an icon library.

- **confidence helper** (`review/confidence.ts`): pure functions encoding the thresholds — `confidenceTone(value): 'High' | 'Medium' | 'Low'` (≥85 / ≥60 / else) and `confidenceColor(value): string` returning a theme-token CSS value. This keeps the threshold logic unit-testable without mounting the component.

- **Icons:** the project has no icon library (`lucide` absent); icons are inline SVG `<svg>` markup per component (see `RecipeCard.svelte`, `IngredientRows.svelte`). Render the provenance/confidence/warning/back/save icons as inline SVGs in the component, selected by the `icon` name from `sourceMeta`. Do not introduce an icon dependency.

- **Styling:** re-implement the prototype layout against existing Tailwind utility classes and theme tokens (`var(--primary)`, `var(--destructive)`, `var(--muted)`, `var(--secondary)`, `var(--border)`, `var(--muted-foreground)`). Map the prototype's amber `oklch(0.72 0.15 75)` (Medium) to the nearest existing theme token used for warning/amber tone; if none exists, use a Tailwind amber utility consistent with the theme rather than re-deriving a raw oklch literal.

- **Validation:** import and call `isRecipeValid` from `recipe-form-logic.ts`. Do not reimplement the title/ingredient/step rule. `RecipeForm` already exposes a bindable `valid` derived from `isRecipeValid`; the panel may bind that or call `isRecipeValid(draft)` directly — pick one and be consistent.

- **lowConf flagging:** `IngredientRows.svelte` already renders a destructive-tinted background when `row.lowConf` is true and clears `lowConf` on qty/item edit. Verify this is intact and sufficient; only extend if the visual flag is missing or incomplete. Any change must remain data-driven (keyed off the optional `lowConf` field) so existing callers passing rows without the flag are unaffected.

---

## Success Criteria
- [ ] `ReviewPanel.svelte` exists under `frontend/src/lib/components/review/` and accepts `draft` (bindable), `onBack`, `onSave`, and optional `backLabel`.
- [ ] `sourceMeta` returns the correct `{ icon, label, sub }` for `url`, `paste`, and `manual` source types and falls back to the paste mapping for unknown types — covered by unit tests.
- [ ] `confidenceTone`/`confidenceColor` return High/Medium/Low and distinct colors at the 85 and 60 boundaries — covered by unit tests including boundary values (84/85, 59/60).
- [ ] The component source gates the confidence meter on `draft.confidence != null` and the warnings section on a non-empty `warnings` list.
- [ ] The Save button is disabled via `isRecipeValid` (imported, not reimplemented) and the invalid-state hint text is present in the source.
- [ ] Editing the form propagates changes to the parent draft (bindable wiring present in source).
- [ ] `IngredientRows` flags `lowConf` rows and existing edit-flow callers still pass typecheck and tests.
- [ ] `npm run test`, typecheck (`svelte-check`/`tsc`), and lint pass.

---

## Tasks
Ordered by dependency.

- [ ] **Confirm/define the `ParsedDraft` type:** Check whether STR-015 added a parsed-draft type to `frontend/src/lib/types/recipe.ts`. If present, reuse it. If absent, add `ParsedDraft = EditableRecipe & { confidence: number | null; warnings: string[]; source: RecipeSource }`. Must be settled before the component is written.
- [ ] **`sourceMeta` helper + tests (RED → GREEN):** Write `review/source-meta.test.ts` covering all four cases (url/paste/manual/unknown), then implement `review/source-meta.ts`. Fully tested before reuse. This is the shared helper STR-018 depends on.
- [ ] **`confidence` helper + tests (RED → GREEN):** Write `review/confidence.test.ts` covering tone and color at boundary values, then implement `review/confidence.ts`.
- [ ] **`ReviewPanel.svelte`:** Build the component using the helpers above, `RecipeForm`, and `isRecipeValid`. Provenance pill, confidence meter (gated on `confidence != null`), warnings list (gated on non-empty), editable form, sticky footer with Back/Save and invalid hint. Wire `draft` as `$bindable`.
- [ ] **`IngredientRows` lowConf verification:** Confirm the existing `lowConf` flagging is correct and complete; extend only if needed. Run the existing edit-flow tests to confirm no regression.
- [ ] **`ReviewPanel.test.ts`:** Following the established source-assertion test pattern (see `RecipeCard.test.ts` / `RecipeDetail.test.ts` — vitest runs in a Node-only environment, no DOM mounting), assert the component source wires the helpers, gates the meter/warnings, imports `isRecipeValid`, renders the form, and exposes the documented props/`data-test` selectors.

---

## Considerations
- **No DOM test environment.** The vitest config is Node-server only — there is no jsdom/happy-dom, so full Svelte component mounting is unavailable. Existing component tests (`RecipeCard.test.ts`, `RecipeDetail.test.ts`) test *pure logic* directly and assert on the component *source as a string* for wiring/contract. Follow that pattern: put all branching logic (source mapping, confidence thresholds, validity) in pure TS helpers with real unit tests, and use source-string assertions for the `.svelte` wiring. Do **not** add a DOM test dependency unless the story explicitly asks. Add `data-test` attributes to key elements (e.g. `data-test="provenance"`, `data-test="confidence"`, `data-test="warnings"`, `data-test="save"`, `data-test="back"`) so future E2E/manual tests have stable selectors, matching the RecipeCard convention.
- **`lowConf` flagging may already exist.** As of this writing `IngredientRows.svelte` already applies a `color-mix(... var(--destructive) ...)` background when `row.lowConf` is true and `EditableIngredient` already has the optional `lowConf` field. Verify before assuming new work is needed — the task may reduce to confirming behavior and adding a `data-test` hook rather than net-new flagging.
- **`RecipeForm` uses `onChange`/`$bindable`, not `setDraft`.** The prototype's `setDraft` prop does not exist in the Svelte form — `RecipeForm` takes `draft = $bindable()` plus an optional `onChange`. Bind `draft` through to it; do not invent a `setDraft` prop.
- **Theme tokens, not prototype literals.** The prototype hardcodes `var(--primary)`, an amber `oklch(...)`, and `var(--destructive)`. Map High/Medium/Low to existing theme tokens; only the amber Medium tone may lack a direct token — choose the nearest existing warning/amber utility rather than copying the raw oklch.
- **Caller-agnostic.** The component must contain no paste- or URL-specific logic. Differences between import paths are entirely data on the draft (`source`, `warnings`, `confidence`). This is what lets EPIC-005 reuse it unchanged.
- **Dependency timing.** This story depends on STR-014 (nullable form types) and STR-015 (draft shape). Their specs (015, 016) are being drafted in the same wave. If STR-015's draft type name differs from `ParsedDraft`, conform to whatever it landed — the type is one definition shared across the parse and review layers, not two.
