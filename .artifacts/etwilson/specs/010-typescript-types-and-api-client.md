---
number: 010
story: STR-009
status: ready
base_branch: main
depends_on: ["STR-007"]
scope_files:
  - frontend/src/lib/types/recipe.ts
  - frontend/src/lib/api/recipes.ts
  - frontend/src/lib/api/recipes.test.ts
---

# Feature: TypeScript types & API client

## Summary
Defines the canonical frontend TypeScript interfaces (`Recipe`, `Ingredient`, `RecipeSource`, `RecipeInput`) matching the EPIC-002 production recipe schema, and the complete set of typed `fetch`-based API client functions (`fetchRecipes`, `fetchRecipe`, `createRecipe`, `updateRecipe`, `deleteRecipe`) covering all five recipe endpoints. This is the shared foundation every frontend recipe feature (library view, detail view, editor, edit/delete flows) builds on. It replaces the throwaway `Recipe { id, name }` interface and the single `fetchRecipes` function with the real, fully-typed surface.

---

## Requirements
- `Recipe` interface exposes all production fields: `id: number`, `title: string`, `servings: number`, `totalTime: number`, `tags: string[]`, `favorite: boolean`, `ingredients: Ingredient[]`, `steps: string[]`, `notes: string`, `source: RecipeSource`, `createdAt: string`.
- `Ingredient` interface has exactly `qty: string`, `unit: string`, `item: string`. (`qty` is a free-form string, never a number.)
- `RecipeSource` interface has `type: 'url' | 'paste' | 'manual'` plus optional `host?: string`, `url?: string`, `method?: string`.
- `RecipeInput` is the create/update payload type: every `Recipe` field except `id` and `createdAt`.
- All field names are camelCase (TypeScript convention), matching the JSON the backend emits via its serde rename layer.
- No `any` appears anywhere in the types or the API client.
- `fetchRecipes(): Promise<Recipe[]>` — GET `/api/recipes`.
- `fetchRecipe(id: number): Promise<Recipe>` — GET `/api/recipes/:id`.
- `createRecipe(data: RecipeInput): Promise<Recipe>` — POST `/api/recipes` with JSON body.
- `updateRecipe(id: number, data: RecipeInput): Promise<Recipe>` — PUT `/api/recipes/:id` with JSON body.
- `deleteRecipe(id: number): Promise<void>` — DELETE `/api/recipes/:id`.
- Every function throws an `Error` with a descriptive message (including the HTTP status) on a non-ok response.
- Network/fetch rejections propagate unchanged.
- Unit tests cover the success path and the non-ok error path for each of the five functions, mocking `fetch`.

---

## Scope

### In Scope
- `frontend/src/lib/types/recipe.ts` — replace placeholder with `Recipe`, `Ingredient`, `RecipeSource`, `RecipeInput`.
- `frontend/src/lib/api/recipes.ts` — replace placeholder with the five typed client functions.
- `frontend/src/lib/api/recipes.test.ts` — replace the single-function test suite with coverage for all five functions.

### Out of Scope
- Svelte components, stores, or any UI.
- Backend types, schema, migrations, or serde attributes (owned by STR-007).
- The `lowConf` parser field on `Ingredient` (arrives in EPIC-003 — do not add).
- Source-provenance UI / card pill (deferred to EPIC-003).
- Client-side validation of `RecipeInput` beyond TypeScript typing.

---

## Technical Approach
- **Entry points / interfaces:** Consumers import types from `$lib/types/recipe` and functions from `$lib/api/recipes`. Function signatures are the contract downstream stories (STR-010–013) build against.
- **Key modules / components:**
  - `frontend/src/lib/types/recipe.ts` — pure type declarations, no runtime code.
  - `frontend/src/lib/api/recipes.ts` — thin `fetch` wrappers, one per endpoint.
  - `frontend/src/lib/api/recipes.test.ts` — Vitest suite mocking `globalThis.fetch`.
- **Data model:**
  ```ts
  interface Ingredient { qty: string; unit: string; item: string; }
  interface RecipeSource {
    type: 'url' | 'paste' | 'manual';
    host?: string;
    url?: string;
    method?: string;
  }
  interface Recipe {
    id: number;
    title: string;
    servings: number;
    totalTime: number;
    tags: string[];
    favorite: boolean;
    ingredients: Ingredient[];
    steps: string[];
    notes: string;
    source: RecipeSource;
    createdAt: string;
  }
  type RecipeInput = Omit<Recipe, 'id' | 'createdAt'>;
  ```
- **Key design decisions:**
  - **Follow the established client pattern** already in `recipes.ts`: `await fetch(...)` → `if (!response.ok) throw new Error(...)` → `return response.json() as Promise<T>`. No shared abstraction or wrapper is introduced — three to five near-identical functions are clearer than a premature helper.
  - **`RecipeInput` via `Omit`** keeps it mechanically tied to `Recipe`; adding a field to `Recipe` flows into the payload type automatically.
  - **`createdAt` typed as `string`** — JSON carries timestamps as ISO strings; no `Date` parsing in this layer.
  - **`deleteRecipe` returns `Promise<void>`** — it checks `response.ok` and does not parse a body.
  - **Mutation functions** set `method`, `headers: { 'Content-Type': 'application/json' }`, and `body: JSON.stringify(data)`.
  - **Error messages** include the verb and status, e.g. `` `Failed to create recipe: ${response.status}` `` — mirrors the existing `fetchRecipes` message style.

---

## Success Criteria
- [ ] `frontend/src/lib/types/recipe.ts` exports `Recipe`, `Ingredient`, `RecipeSource`, and `RecipeInput` with the field shapes above; no `name`-only placeholder remains.
- [ ] `frontend/src/lib/api/recipes.ts` exports all five functions, fully typed, with no `any`.
- [ ] Each function hits the correct URL and HTTP method; mutations send a JSON body with the correct content-type header.
- [ ] Each function throws an `Error` whose message contains the HTTP status on a non-ok response.
- [ ] `npm run test` passes with success-path and error-path coverage for all five functions.
- [ ] `npm run check` (svelte-check / tsc) passes with no type errors.

---

## Tasks
Ordered by dependency.

- [ ] **Define the types:** Replace `frontend/src/lib/types/recipe.ts` with `Ingredient`, `RecipeSource`, `Recipe`, and `RecipeInput` (`Omit<Recipe, 'id' | 'createdAt'>`). No runtime code, no `any`. Must compile before the client is written, since the client imports these.
- [ ] **Write failing tests for the client (RED):** Rewrite `frontend/src/lib/api/recipes.test.ts` to cover all five functions — success path (correct URL/method/body, returns parsed JSON) and non-ok path (throws with status) for each. Mock `fetch` via `vi.stubGlobal('fetch', vi.fn())` in `beforeEach`, `vi.unstubAllGlobals()` in `afterEach`, following the existing test's structure. Use realistic `Recipe`/`RecipeInput` fixtures matching the new shape.
- [ ] **Implement the client (GREEN):** Replace `frontend/src/lib/api/recipes.ts` with the five functions. Follow the existing fetch→check→throw→return pattern. Make all tests pass.

---

## Considerations
- The existing test fixtures use the old `{ id, name }` shape — they must be rewritten to the production shape, not extended.
- `deleteRecipe` has no response body to parse; assert only that it throws on non-ok and resolves (to `undefined`) on ok. Don't call `response.json()` in the delete path.
- camelCase field names are an epic-level decision; the backend serde layer (STR-007) is responsible for emitting them. This layer trusts that contract — do not add snake_case fallbacks or remapping.
- Backend route shapes (`/api/recipes/:id`, PUT vs PATCH, POST body envelope) are defined by STR-008. This spec assumes the conventional REST surface in the story's acceptance criteria (POST collection, PUT/DELETE on `/:id`). If STR-008 lands with a different convention, the URLs/methods here are the single point to reconcile — but the story's AC fixes these five operations, so no blocker.
- `qty` must remain a `string` even for values like `"2"`; never widen to `number`.

---
