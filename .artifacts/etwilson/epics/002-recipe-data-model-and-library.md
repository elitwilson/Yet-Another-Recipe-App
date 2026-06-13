---
id: EPIC-002
title: Recipe Data Model & Library CRUD
status: ready
created: 2026-06-13
---

## Goal

Replace the throwaway `Recipe { id, name }` scaffold from EPIC-001 with the real production schema and deliver the complete recipe library: view, search, sort, favorites, detail, edit, and delete. This epic establishes the shared foundation — the data model, REST endpoints, TypeScript types, editor form component, and library UI — that every ingestion epic builds on. It ships without a Create button; recipes arrive once the import epics land.

> **Prototype reference**: `.artifacts/etwilson/design/prototype/` — open `YARA.html` in a browser for interactive behavioral reference. Most relevant files: `library.jsx` (card grid, search, sort, favorites, empty state), `recipe-form.jsx` (editor form layout, ingredient rows, step rows, detail view). `data.js` contains `SEED_RECIPES` which can inform seed migration fixtures. **The prototype is React + JSX; this project is SvelteKit + Rust. Use it as a behavioral and layout spec only — do not port the code.**

---

## Scope In

- **Schema migration**: drop the throwaway `recipes` table; create the production schema with all fields from the recipe shape proposed in `.artifacts/etwilson/design/recipe-ingestion-brief.md` (`title`, `servings`, `total_time`, `tags`, `favorite`, `ingredients`, `steps`, `notes`, `source`, `created_at`). Ingredient storage mechanism (JSONB vs separate table) is an implementation decision for the coder. The `source` field must be present from day one to avoid a future migration.
- **Rust model structs** updated to match the production schema; `Recipe` and `Ingredient` types fully serializable.
- **TypeScript types** updated to match — `Recipe`, `Ingredient`, `RecipeSource` interfaces in `frontend/src/lib/types/`.
- **REST endpoints**: `GET /api/recipes` (list), `GET /api/recipes/:id` (detail), `POST /api/recipes` (create), `PUT /api/recipes/:id` (update), `DELETE /api/recipes/:id` (delete). Query layer in `queries.rs` per the backend-query-layer rule.
- **Library view**: card grid, search across title/tags/ingredients, sort (recent / A–Z / quickest), favorites filter, per-card metadata (title, total time, source type icon), empty state.
- **Recipe detail view**: read-only display of all fields — title, servings, total time, tags, ingredient list (qty + unit + item), numbered steps, notes.
- **Shared editor form**: the `RecipeForm` equivalent — title, servings, total time, tags (with inline add/remove), ingredient rows (qty / unit / item, drag-to-reorder, add/remove), step rows (drag-to-reorder, add/remove). This component is reused by edit, and by every subsequent ingestion epic.
- **Edit flow**: detail view → edit button → editor form pre-populated → save. Validation: title required, at least one ingredient and one step.
- **Delete with confirm**: confirmation dialog before deletion.
- **Seed migration**: include a small set of seed recipes in the development migration so the library view is exercisable without a Create UI.

## Scope Out

- No Create UI / "Add recipe" button — ships without it; Create arrives in EPIC-003 or EPIC-004.
- Provenance pill in library cards — the `source` field is stored, but the UI pill is deferred to EPIC-003 (when multiple source types first exist and the display is meaningful).
- Any import flow (URL, paste, freeform).
- Local-first / localStorage persistence — a separate concern for a later epic.
- Authentication, accounts, server sync.
- Normalized ingredient quantity (`amount DECIMAL`, `canonical_unit`) — known future migration point; deferred to v2 shopping-list epic.

---

## Key Decisions

- **Production schema defined here.** This migration replaces the throwaway. Every subsequent epic inherits this shape; changes after this point require migrations.
- **`source` field in schema from day one.** Even though only `manual` entries exist until import epics ship, adding the field now avoids a migration later. All seed recipes use `source: { type: 'manual' }`.
- **Normalized ingredient quantity deferred.** `qty` is a free-form string (`"1/2"`, `"a couple"`). A future `ALTER TABLE ADD COLUMN amount DECIMAL NULL, canonical_unit TEXT NULL` is the migration path when the v2 shopping-list epic defines what normalization it needs.
- **Ships without a Create UI.** The library is a read-only + edit experience in this epic. Seed data in the development migration provides content to exercise it during development. This is intentional — not an oversight.
- **Shared editor form built here.** Because edit requires the form, it lands in this epic and is reused (not rebuilt) by EPIC-003, EPIC-004, and EPIC-005.
- **Query layer pattern.** All DB access goes through `backend/src/recipes/queries.rs`, taking `&PgPool`, returning `Result<T, sqlx::Error>`. Handlers map errors via `AppError`.
