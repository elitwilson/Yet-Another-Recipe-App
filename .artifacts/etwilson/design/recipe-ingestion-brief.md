# Recipe Ingestion — Prototype Brief

> Companion to `YARA.html` (interactive prototype) and `VISION.md`.
> **This is a multi-epic capability area — NOT a single epic.** Ingestion is large; it needs to be
> split into several epics. Use this document in the brainstorm where you *distribute the work into
> epics*; then run each resulting epic through `/draft --epic` on its own. It is reference material —
> not a spec, not stories, not a plan. It exists to (a) frame the overall boundary and the natural
> fault lines for splitting, (b) separate the prototype's *real logic* from its *mocks* so nothing
> fictional gets baked in, and (c) seed TDD with concrete behavioral examples.

---

## What the prototype is

A clickable, single-purpose mock of **recipe ingestion**: the foundation that gets recipes
into the system. Open `YARA.html` in a browser. It is **React + inline Babel** for fast
prototyping — **our app is SvelteKit + shadcn/Tailwind + a Rust backend**. Treat the artifact as
an *interactive spec for behavior, layout, copy, and flow*. **Do not port the code.** The
`window`-global module pattern, `useState`, and the JSX are prototyping scaffolding, not
architecture.

## Scope & boundary

**In scope (this capability area, to be split across several epics):** the personal recipe library
(view/search/edit/delete), low-friction import via **URL** and **pasted text**, and **manual
entry**. Everything needed to reliably turn "a recipe I have" into "a structured recipe in my
library."

**Out of scope entirely** (the greyed-out sidebar items are deliberate placeholders): meal
planning, shopping-list generation, share-by-link, accounts/sync. Don't let the brainstorm drift
into them. Where ingestion *constrains* one of those later areas, it's flagged below (see
Ingredient model).

## Surface → behavior map

| Surface | Behavior the prototype demonstrates |
|---|---|
| **Library** | Card grid; search across title/tag/ingredient; sort (recent / A–Z / quickest); favorites filter; per-card source provenance; empty state. |
| **Add → From a link** | Paste URL → parse animation → editable **Review** step. *(import itself is mocked — see ledger)* |
| **Add → Paste text** | Paste arbitrary recipe text → **real parse** → Review. "Clean" and "Messy/texted" examples included. |
| **Add → By hand** | Freeform (one smart field, live structured preview). |
| **Review** | Every import path lands here before saving: provenance pill, parse-confidence meter, warnings list, fully editable fields. Low-confidence ingredient lines are flagged. |
| **Detail / Edit** | Read view → inline edit (same form) → save; delete with confirm. |

## Real vs mock — read before drafting

| Piece | Status | Real implementation implication |
|---|---|---|
| `parseRecipeText` (paste + freeform) | **Real, framework-agnostic logic** in `data.js`. | Portable as-is. Implemented client-side TypeScript — see Resolved Decisions. |
| `importFromUrl` (URL import) | **Mocked** — canned fixtures keyed off the URL + a fake delay. | Needs a real **server endpoint**: fetch the page, extract `schema.org/Recipe` JSON-LD. Cannot be client-side (CORS). |
| Parse-confidence score | **UX invention.** | Kept — it's the visual explanation for lowConf row flagging in Review. |
| Persistence | **Simplified** — one `localStorage` key, seeded. | Real local-first layer + server sync + the anonymous→account migration are separate concerns (other epics). |
| "Create account" / "Share" buttons | **Stubs** (toast only). | Out of scope here. |

---

## Epic carve

Four epics, one root dependency, two that can run in parallel after the root.

```
EPIC-001 (done) → EPIC-002 → EPIC-003 → EPIC-004
                           → EPIC-005
```

| Epic | Title | Depends on |
|---|---|---|
| EPIC-002 | Recipe Data Model & Library CRUD | EPIC-001 |
| EPIC-003 | Text Parser & Paste Import | EPIC-002 |
| EPIC-004 | Freeform Manual Entry | EPIC-002, EPIC-003 |
| EPIC-005 | URL Import | EPIC-002 |

EPIC-003 and EPIC-005 are independent of each other and can execute in parallel if desired, but the project runs one epic at a time.

### EPIC-002 — Recipe Data Model & Library CRUD
Replaces the throwaway scaffold with the real production schema. Delivers the library (view/search/sort/favorites/edit/delete) and the shared editor form used by every subsequent epic. Ships without a Create UI — recipes are added once the import epics arrive.

### EPIC-003 — Text Parser & Paste Import
Implements `parseRecipeText` in client-side TypeScript and the paste → Review → save flow. The first path that gets real recipes into the library. Also ships: the Review panel (provenance pill, confidence meter, warnings, editable form), and activates the provenance pill in library cards.

### EPIC-004 — Freeform Manual Entry
The "by hand" path: freeform textarea with live structured preview as you type, powered by the EPIC-003 parser. No separate Review step — the live preview is the review. Direct save.

### EPIC-005 — URL Import
Server-side endpoint that fetches an external URL and extracts `schema.org/Recipe` JSON-LD. The only ingestion path requiring new backend surface. Reuses the Review panel from EPIC-003.

---

## Resolved decisions

These were decided during the epic-carve planning session. They are authoritative — do not re-open them during individual epic scoping.

**Parser placement: client-side TypeScript.**
The freeform live-preview (EPIC-004) requires instant feedback as the user types — impossible with server round trips. The parser is pure text logic with no I/O and ports cleanly from `data.js`. URL import is the only path that must be server-side (CORS). If a mobile client is ever built, the parser can be re-exposed via API at that point.

**Parse approach for messy text: heuristics only (no LLM) in v1.**
The prototype's heuristic ceiling is acceptable: the messy case lands Low-confidence with flagged lines, and the Review step is the correction mechanism. LLM integration would conflict with offline/local-first use and adds operational complexity for unclear gain. Revisit as a v2 enhancement if real usage shows users struggling.

**Normalized ingredient quantity: defer to v2.**
`qty` and `unit` are already split fields (not one blob). A future migration to add `amount DECIMAL NULL` + `canonical_unit TEXT NULL` is a single `ALTER TABLE ADD COLUMN` — nullable, no existing data affected. The shopping-list epic owns that migration when it knows what normalization it actually needs. EPIC-002's schema should note this as a known future migration point.

**EPIC-002 ships without a Create UI.**
With structured manual entry cut and freeform in EPIC-004, EPIC-002 delivers a read-only + edit library. A Create button arrives with the first import epic. This is acceptable — seed data in the migration exercises the library during development.

**Provenance pill in library cards: activated in EPIC-003.**
The `source` field is in the schema from EPIC-002 day one. The card-level provenance pill is deferred to EPIC-003, when multiple source types first exist and the UI is meaningful.

**Confidence meter: kept.**
It's the visual that explains why ingredient rows are flagged red in the Review panel.

**URL import error UX: informative error + suggest paste.**
When no `schema.org` JSON-LD is found, show an error message with a "try pasting the text instead" CTA. No auto-fallback, no HTML scraping.

---

## Parser contract → TDD seed cases

`parseRecipeText(text)` is the testable heart of the import work. Its observed
behavior, as ready-made test cases (input → expected structure). These map cleanly onto your TDD
red/green cycle.

**Case A — clean, headered text** (the "Clean" example):
- Detects `Ingredients:` / `Instructions:` headers → clean section split.
- `400 g spaghetti` → `{ qty: "400", unit: "g", item: "spaghetti" }`.
- `Serves 4 · 25 minutes` → `servings: 4`, `totalTime: 25`.
- Result: title set, 8 ingredients, 4 steps, **no warnings**, high confidence.

**Case B — messy chat text, no headers** (the "Messy/texted" example):
- No section headers → heuristic fallback (emits a "split was guessed" warning).
- Inline header + comma-list: `you need: chicken thighs (like 6, bone in), a couple sweet potatoes, ...`
  → split into separate ingredients, **respecting parentheses** (the comma inside `(like 6, bone in)`
  must NOT split).
- `makes enough for 2` → `servings: 2`; `roast ... 35-40 min` → `totalTime: 40`.
- Leading greeting line ("hey! here's that…") is dropped, not treated as an ingredient.
- Lines with no detectable quantity (and not a known seasoning) → flagged `lowConf`.
- Result: title empty (warned), 8 ingredients (~6 lowConf), 2 steps, **Low** confidence.

**Quantity parsing** must cover: integers, decimals, unicode + ascii fractions (`½`, `1/2`),
ranges (`35-40`), a unit dictionary (`cups`, `tbsp`, `cloves`, `can`…), and bullet/numbering
stripping (`-`, `•`, `1.`, `Step 1:`).

> Lift `SAMPLE_PASTE_CLEAN` and `SAMPLE_PASTE_MESSY` from `data.js` verbatim as fixtures.

## Proposed recipe shape (a suggestion, reconcile with the DB)

```
Recipe {
  id, title, servings: int?, totalTime: int?(minutes),
  tags: string[], favorite: bool, createdAt,
  ingredients: [{ qty: string, unit: string, item: string }],
  steps: string[], notes: string[],
  source: { type: 'url'|'paste'|'manual', host?, url?, method? }
}
```

**⚠ Cross-epic flag — `qty` is a free-form string** (`"1/2"`, `"a couple"`). Fine for ingestion,
but the **v2 shopping list must sum quantities per ingredient**. Decided: defer normalization to v2.
The `qty` + `unit` split is already partially structured; a future `ALTER TABLE ADD COLUMN` is the
migration path. See Resolved Decisions.

## Notes for coding teams

- Re-implement idiomatically in Svelte against our existing shadcn/Tailwind theme. The prototype
  uses **stock shadcn "neutral" tokens** — map to the real theme config, don't re-derive colors.
- Accessibility/hit-targets/light+dark are demonstrated in the prototype and should carry over.
