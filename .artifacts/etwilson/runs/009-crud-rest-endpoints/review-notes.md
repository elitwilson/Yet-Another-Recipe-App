## Add 404 to AppError

## Verdict: APPROVED

**Task:** Add 404 to AppError
**Spec:** .artifacts/etwilson/specs/009-crud-rest-endpoints.md

**Scope issues:** none — backend/src/error/tests.rs is the existing test submodule for backend/src/error.rs, declared via `mod tests;`. It is within scope of the spec's error.rs file.

**Coverage gaps:** none

All four required behaviors are tested:
- sqlx::Error::RowNotFound converts to AppError::NotFound — covered (row_not_found_maps_to_not_found_variant)
- AppError::NotFound returns HTTP 404 — covered (not_found_returns_404)
- 404 response body has { "error": ... } JSON shape — covered (not_found_body_has_error_field)
- Other sqlx errors still map to AppError::Database (500) — covered (other_sqlx_errors_still_map_to_database_variant)

Existing three tests for Database/500 behavior are preserved.

## RecipeInput struct

## Verdict: APPROVED

**Task:** RecipeInput struct
**Spec:** .artifacts/etwilson/specs/009-crud-rest-endpoints.md

**Scope issues:** none — backend/src/recipes/model/tests.rs is the existing test submodule for model.rs (declared via `mod tests;`). Within scope of backend/src/recipes/model.rs.

**Coverage gaps:** none

All four requirements covered:
- RecipeInput derives Deserialize — exercised by recipe_input_deserializes_from_json
- RecipeInput does not have id field — covered by recipe_input_does_not_have_id_or_created_at
- RecipeInput does not have created_at field — same test
- RecipeInput contains all client-writable fields (title, servings, total_time, tags, favorite, ingredients, steps, notes, source) — covered by recipe_input_deserializes_from_json with field-by-field assertions

## Query layer + Handlers + Routes + Integration tests (Tasks 3, 4, 5)

## Verdict: APPROVED

**Task:** Query layer + Handlers + Routes + Integration tests
**Spec:** .artifacts/etwilson/specs/009-crud-rest-endpoints.md

**Scope issues:** none — only backend/tests/recipes.rs modified, which is in scope.

**Coverage gaps:** none

All eight integration test requirements covered:
- GET /api/recipes happy path — existing passing tests
- GET /api/recipes/:id 200 for known id — get_api_recipe_by_id_returns_200_for_known_id (creates via POST to get real id, then GETs)
- GET /api/recipes/:id 404 for unknown id — get_api_recipe_by_id_returns_404_for_unknown_id (asserts error field)
- POST /api/recipes 201 with server-generated id and created_at — post_api_recipes_returns_201_with_created_recipe
- PUT /api/recipes/:id 200 with updated fields — put_api_recipe_returns_200_with_updated_recipe
- PUT /api/recipes/:id 404 for unknown id — put_api_recipe_returns_404_for_unknown_id (asserts error field)
- DELETE /api/recipes/:id 204 with empty body — delete_api_recipe_returns_204_for_known_id (asserts body bytes empty)
- DELETE /api/recipes/:id 404 for unknown id — delete_api_recipe_returns_404_for_unknown_id (asserts error field)

Tests currently fail with 405 (routes not yet wired) — correct RED state. Test logic uses create-then-operate pattern for known ids rather than hardcoded ids, per spec guidance.
