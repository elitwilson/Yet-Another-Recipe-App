# Decisions — 008-production-schema-and-dev-seed

## Chrono vs time

Chose `chrono` for `created_at` (TIMESTAMPTZ). The spec recommends it and it's not already in Cargo.toml.

## JSONB field modeling

Used `sqlx::types::Json<Vec<Ingredient>>` and `sqlx::types::Json<RecipeSource>` in the `query_as!` projection, then unwrapping in the Recipe struct fields directly via `serde`. Actually modeled the Recipe fields as `Json<Vec<Ingredient>>` and `Json<RecipeSource>` and implemented custom `Serialize` to unwrap them — or used `.0` access. Final approach: store as `sqlx::types::Json<T>` internally and implement custom serialization, or use `.0` in a wrapper type. See implementation.

## notes field in Red Lentil soup

The prototype SEED_RECIPES entry for Red Lentil & Coconut Soup has no `notes` field (it's absent). Seeded as empty array `'[]'::jsonb` — not an error.

## Ginger ingredient missing from Red Lentil seed

The prototype data.js `SEED_RECIPES[2]` (Red Lentil & Coconut Soup) is missing a `ginger` ingredient that appears in URL_FIXTURES. The SEED_RECIPES version is used as specified.
