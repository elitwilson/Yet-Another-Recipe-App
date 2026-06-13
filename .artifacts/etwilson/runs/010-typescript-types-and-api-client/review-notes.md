## Write failing tests for the client (RED)

## Verdict: APPROVED

**Task:** Write failing tests for the client (RED)
**Spec:** .artifacts/etwilson/specs/010-typescript-types-and-api-client.md

**Scope issues:** none

**Coverage gaps:** none

All ten expected test cases are present:
- fetchRecipes: success path (correct URL, returns parsed array) — covered
- fetchRecipes: non-ok throws with status — covered
- fetchRecipe: success path (correct URL with id, returns parsed recipe) — covered
- fetchRecipe: non-ok throws with status — covered
- createRecipe: success path (POST with JSON body and Content-Type header, returns recipe) — covered
- createRecipe: non-ok throws with status — covered
- updateRecipe: success path (PUT with JSON body and correct header, returns recipe) — covered
- updateRecipe: non-ok throws with status — covered
- deleteRecipe: success path (DELETE, resolves to undefined, no body parse) — covered
- deleteRecipe: non-ok throws with status — covered

Fixtures use the production Recipe shape (all fields including Ingredient, RecipeSource, createdAt). fetch is mocked via vi.stubGlobal/vi.unstubAllGlobals per-describe block, matching the spec's prescribed pattern. deleteRecipe correctly asserts result is undefined without calling json().
