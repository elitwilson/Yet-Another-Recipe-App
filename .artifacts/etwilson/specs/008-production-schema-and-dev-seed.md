---
number: 008
story: STR-007
status: ready
base_branch: main
depends_on: []
scope_files:
  - backend/migrations/20240101000002_drop_scaffold_recipes.sql
  - backend/migrations/20240101000003_create_recipes.sql
  - backend/migrations/20240101000004_seed_recipes.sql
  - backend/src/recipes/model.rs
  - backend/src/recipes/model/tests.rs
  - backend/src/recipes/queries.rs
  - backend/Cargo.toml
  - backend/.sqlx/
  - backend/tests/migrations_test.rs
  - backend/tests/recipes.rs
---

# Feature: Production Recipe Schema & Dev Seed

## Summary
Replace the throwaway `recipes { id, name }` scaffold from EPIC-001 with the real production
recipe schema and update the Rust model to match. This is the foundational story of EPIC-002:
every downstream story (REST endpoints, TypeScript types, library UI) and every later ingestion
epic inherits the shape defined here. The work delivers new migrations (drop scaffold + create
production table + full-recipe seed), an expanded `Recipe` struct with `Ingredient` and
`RecipeSource` types, and a regenerated offline sqlx cache. Because the library ships without a
Create UI in this epic, seed fixtures are what make the library view exercisable during
development.

---

## Requirements
- A migration drops the scaffold `recipes` table and creates the production `recipes` table with
  all production fields: `id`, `title`, `servings`, `total_time`, `tags`, `favorite`,
  `ingredients`, `steps`, `notes`, `source`, `created_at`.
- `servings` and `total_time` are nullable (the prototype shape marks them optional).
- `source` is required (NOT NULL) from day one, stored as JSONB matching the shape
  `{ type, host?, url?, method? }`.
- `ingredients` is stored such that callers receive a `Vec<Ingredient>`, where each `Ingredient`
  has `qty: String`, `unit: String`, `item: String`. `qty` is free-form text — no normalization.
- A seed migration inserts at least 3 (target: all 4 from the prototype) fully-populated recipes,
  drawing realistic data from `SEED_RECIPES` in
  `.artifacts/etwilson/design/prototype/data.js`. The seed must be idempotent (`ON CONFLICT`).
- The Rust `Recipe` struct exposes all production fields, derives `Serialize`, and is loadable via
  `sqlx::query_as!`.
- `Ingredient` and `RecipeSource` Rust types are defined and derive `Serialize` (and
  `Deserialize` as needed for JSONB decoding).
- The offline sqlx cache (`backend/.sqlx/`) is regenerated so `SQLX_OFFLINE=true cargo build`
  and `cargo test` compile without a live database.
- Existing tests that assert the old `name`-based shape (`migrations_test.rs`, `recipes.rs`
  integration test, `model/tests.rs`) are updated to the new schema and continue to pass.

---

## Scope

### In Scope
- New migration files (do not edit the two existing migrations — sqlx tracks by filename).
- Production `recipes` table DDL and full-recipe seed data.
- `Recipe`, `Ingredient`, `RecipeSource` Rust types in `backend/src/recipes/model.rs`.
- Updating `queries::list_recipes` to select the new columns.
- Adding the required `sqlx` Cargo features (`json` for JSONB, and a date/time feature for
  `created_at`).
- Regenerating `backend/.sqlx/`.
- Updating the three existing test files that assert the old shape.

### Out of Scope
- REST endpoint changes beyond what's needed to keep `GET /api/recipes` compiling (STR-008 owns
  endpoint work).
- TypeScript types (STR-009).
- Any UI / frontend changes.
- Ingredient quantity normalization (`amount DECIMAL` / `canonical_unit`) — deferred to v2
  shopping-list epic via a future `ALTER TABLE ADD COLUMN`.
- A Create/insert path for recipes (this epic is read-only + edit; recipes arrive via seed here).

---

## Technical Approach
- **Entry points / interfaces:**
  - Migrations under `backend/migrations/`. The next filenames in sequence (existing are
    `..._000000` and `..._000001`):
    - `20240101000002_drop_scaffold_recipes.sql` — `DROP TABLE recipes;`
    - `20240101000003_create_recipes.sql` — production DDL.
    - `20240101000004_seed_recipes.sql` — full-recipe idempotent seed.
  - `backend/src/recipes/model.rs` — `Recipe`, `Ingredient`, `RecipeSource`.
  - `backend/src/recipes/queries.rs` — `list_recipes` updated to the new `query_as!`.

- **Key modules / components:**
  - `model.rs` owns the type definitions and serialization derives.
  - `queries.rs` owns all DB access (per the `backend-query-layer` rule: `&PgPool` in,
    `Result<T, sqlx::Error>` out, inline SQL in `query_as!`).
  - `handler.rs` is unchanged in logic — it just forwards `queries::list_recipes`.

- **Data model:**
  - Production `recipes` table (recommended DDL):
    ```sql
    CREATE TABLE recipes (
        id          SERIAL PRIMARY KEY,
        title       TEXT NOT NULL,
        servings    INT,
        total_time  INT,
        tags        TEXT[] NOT NULL DEFAULT '{}',
        favorite    BOOLEAN NOT NULL DEFAULT FALSE,
        ingredients JSONB NOT NULL DEFAULT '[]',
        steps       TEXT[] NOT NULL DEFAULT '{}',
        notes       TEXT[] NOT NULL DEFAULT '{}',
        source      JSONB NOT NULL,
        created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT recipes_title_unique UNIQUE (title)
    );
    ```
    A `UNIQUE` constraint on `title` gives the seed a natural `ON CONFLICT (title) DO NOTHING`
    target, preserving the existing idempotency pattern.
  - Rust types:
    ```rust
    #[derive(Debug, Serialize, Deserialize)]
    pub struct Ingredient { pub qty: String, pub unit: String, pub item: String }

    #[derive(Debug, Serialize, Deserialize)]
    pub struct RecipeSource {
        #[serde(rename = "type")] pub source_type: String,
        pub host: Option<String>,
        pub url: Option<String>,
        pub method: Option<String>,
    }

    #[derive(Debug, Serialize)]
    pub struct Recipe {
        pub id: i32,
        pub title: String,
        pub servings: Option<i32>,
        pub total_time: Option<i32>,
        pub tags: Vec<String>,
        pub favorite: bool,
        pub ingredients: Vec<Ingredient>,   // from JSONB
        pub steps: Vec<String>,
        pub notes: Vec<String>,
        pub source: RecipeSource,           // from JSONB
        pub created_at: <chrono|time type>,
    }
    ```

- **Key design decisions:**
  - **Ingredient & source storage: JSONB columns on `recipes`** (not a separate
    `recipe_ingredients` table). Rationale: the epic explicitly leaves this to the architect;
    JSONB matches the variable-structure `source` shape, keeps the whole recipe in one row (no
    joins for the library read path), and aligns with v1's "qty is free-form, no normalization"
    decision. A separate table buys nothing until quantity normalization (v2) needs relational
    queries.
  - **JSONB → typed Vec mapping** requires `sqlx`'s `json` feature and the `sqlx::types::Json`
    wrapper in the `query_as!` projection (e.g.
    `ingredients as "ingredients: Json<Vec<Ingredient>>"`), unwrapped to `Vec<Ingredient>` when
    building the struct — or model the field as `Json<Vec<Ingredient>>` directly. Pick whichever
    keeps `query_as!` compiling cleanly; document the choice in code only if non-obvious.
  - **`created_at` type** requires adding a date/time feature to `sqlx` (`chrono` or `time`) plus
    the corresponding crate. Choose `chrono` unless `time` is already pulled in elsewhere. Keep
    the field on the struct so JSON serialization includes it.
  - **`id` stays `SERIAL` (i32).** The prototype's string `uid()` ids are client-side mock
    scaffolding; the DB is authoritative and the existing model already uses `i32`.
  - **`tags`/`steps`/`notes` as Postgres `TEXT[]`** map directly to `Vec<String>` via sqlx with
    no extra feature.

---

## Success Criteria
- [ ] `cargo sqlx migrate run` against a fresh DB applies all migrations with no error and leaves
      a production `recipes` table (no `name` column; has `title`, `source`, `ingredients`, etc.).
- [ ] After migration, the table contains ≥3 recipes, each with `title`, `servings`,
      `total_time`, `tags`, `favorite`, `ingredients` (each row having `qty`/`unit`/`item`),
      `steps`, and `source`.
- [ ] The seed migration is idempotent — re-running it does not error or duplicate rows.
- [ ] `Recipe` struct exposes all production fields, derives `Serialize`, and
      `sqlx::query_as!(Recipe, ...)` in `queries.rs` compiles against the new schema.
- [ ] `backend/.sqlx/` is regenerated; `SQLX_OFFLINE=true cargo build` succeeds.
- [ ] `cargo test` passes — `migrations_test.rs`, `recipes.rs`, and `model/tests.rs` are updated
      to the new shape and green.
- [ ] `cargo fmt` and `cargo clippy` are clean.

---

## Tasks
Ordered by dependency.

- [ ] **Add sqlx features & migrations:** Add `json` and a date/time feature (`chrono` or
      `time`) to the `sqlx` dependency in `backend/Cargo.toml` (and the matching crate). Write the
      three migration files: drop scaffold, create production table, seed. Verify
      `cargo sqlx migrate run` applies cleanly against a local DB and the seed is idempotent on
      re-run. Files: `backend/Cargo.toml`, `backend/migrations/2024010100000{2,3,4}_*.sql`.

- [ ] **Update Rust model:** Define `Ingredient`, `RecipeSource`, and the expanded `Recipe` in
      `backend/src/recipes/model.rs` with the derives above. Update `model/tests.rs` to assert the
      new serialized shape (title, tags, ingredients, source) instead of `name`. Must compile and
      the model unit test must pass before the next task.

- [ ] **Update query layer & regenerate cache:** Update `queries::list_recipes` to select the new
      columns with the JSONB projection, keeping `ORDER BY id`. Run `cargo sqlx prepare` to
      regenerate `backend/.sqlx/`. Verify `SQLX_OFFLINE=true cargo build` succeeds.
      Files: `backend/src/recipes/queries.rs`, `backend/.sqlx/`.

- [ ] **Update integration tests:** Update `backend/tests/migrations_test.rs` (the
      `schema_migration_has_name_column` test now asserts `title`, not `name`; the `id` test
      stays) and `backend/tests/recipes.rs` (each recipe now has `title` rather than `name`; keep
      the `ORDER BY id` assertion). Run the full `cargo test` suite green.

---

## Considerations
- **Existing tests WILL break and must be fixed in scope.** `migrations_test.rs:59-68`
  (`schema_migration_has_name_column`) asserts a `name TEXT` column, and `recipes.rs:75-81`
  asserts each recipe JSON has a `name` field. Both are coupled to the scaffold shape and must be
  migrated to `title`. This is expected churn, not a regression — do not work around it by keeping
  a `name` column.
- **sqlx feature gap is the most likely tripwire.** The current `sqlx` features
  (`postgres`, `runtime-tokio-native-tls`, `macros`) do **not** support JSONB-typed decoding or
  `TIMESTAMPTZ`. Without adding `json` + a date/time feature, `query_as!` will fail to compile.
  Add these before writing the query.
- **`query_as!` requires a live DB at compile time** to validate SQL, then `cargo sqlx prepare`
  caches it. The integration tests in `recipes.rs` also require a live Postgres
  (`DATABASE_URL=postgres://yara:yara@localhost:5432/yara`) — the docker-compose DB from EPIC-001.
- **Seed data shape:** `SEED_RECIPES` in the prototype uses camelCase (`totalTime`, `createdAt`)
  and string `uid()` ids — these are mock scaffolding. Map to the DB's snake_case columns; let the
  DB assign `id` and default `created_at` (do not transcribe the prototype's relative timestamps).
  Some ingredient rows have empty `qty`/`unit` (e.g. `salt and pepper to taste`) — preserve them
  as empty strings; they are valid free-form values.
- **`source.type` is a SQL/Rust reserved-word collision:** the JSON key is `type`; the Rust field
  uses `#[serde(rename = "type")]`. Keep `type` as the JSON key in seed data so it round-trips.
- **Future migration point (do not implement):** v2 shopping-list adds `amount DECIMAL NULL` +
  `canonical_unit TEXT NULL` for quantity normalization. The free-form `qty`/`unit` split here is
  the deliberate forward-compatible choice.
