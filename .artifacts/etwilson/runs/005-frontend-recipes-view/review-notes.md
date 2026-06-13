# Review Notes — 005-frontend-recipes-view

## Boundary type + fetch helper (TDD)

## Verdict: APPROVED

**Task:** Boundary type + fetch helper (TDD)
**Spec:** .artifacts/etwilson/specs/005-frontend-recipes-view.md

**Scope issues:** none

**Coverage gaps:** none

All five required requirements are covered:
- Success path returns typed Recipe array (test: "returns a typed array of recipes on success")
- Non-2xx throws with status info (tests: "throws on non-2xx response", "throws on 404 response")
- Network rejection propagates (test: "propagates network errors")
- Relative path `/api/recipes` is asserted (test: "returns a typed array of recipes on success" — `expect(fetch).toHaveBeenCalledWith('/api/recipes')`)
- Empty array returns gracefully and distinct from error (test: "returns an empty array when the API returns an empty array")

## Vite dev proxy

## Verdict: APPROVED

**Task:** Vite dev proxy
**Spec:** .artifacts/etwilson/specs/005-frontend-recipes-view.md

**Scope issues:** none

**Coverage gaps:** none

Configuration task — no tests required. All spec requirements met:
- `/api` proxied to backend via `server.proxy`
- Target read from `VITE_API_PROXY_TARGET` env var with default `http://localhost:3000`
- `frontend/.env.example` documents the var with clear usage instructions

## Recipes view + states

## Verdict: APPROVED

**Task:** Recipes view + states
**Spec:** .artifacts/etwilson/specs/005-frontend-recipes-view.md

**Scope issues:** `frontend/src/tests/scaffold.test.ts` is not listed in the spec's scope_files. However, the change is a stale-test fix forced by this spec replacing the STR-004 placeholder page — the spec itself anticipates the page rewrite. The update loosens an assertion to remain true under the new content without changing the requirement being tested (shadcn-svelte component is used). Not a spec violation.

**Coverage gaps:** none

All view requirements met: loading/error/empty/populated branches all present; `onMount` CSR-only fetch; delegates to `fetchRecipes()` helper (thin component); `Recipe` type used throughout; no `any`; shadcn-svelte Card component used for list rendering.
