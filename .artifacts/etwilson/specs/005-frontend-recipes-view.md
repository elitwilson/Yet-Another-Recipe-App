---
number: 005
story: STR-005
status: complete
base_branch: main
depends_on: [STR-003, STR-004]
scope_files:
  - frontend/vite.config.ts
  - frontend/src/lib/api/recipes.ts
  - frontend/src/lib/types/recipe.ts
  - frontend/src/routes/+page.svelte
  - frontend/src/routes/+page.ts
  - frontend/src/lib/api/recipes.test.ts
  - frontend/.env.example
---

# Feature: Frontend Recipes View

## Summary
Close the EPIC-001 vertical slice in the UI. The SvelteKit SPA (STR-004) fetches `GET /api/recipes` client-side and renders the seeded recipes as a list using a shadcn-svelte component, with explicit loading and error states. A Vite dev proxy routes `/api` → the backend so the browser stays single-origin (no CORS config in dev). The fetched recipe shape is typed at the boundary to match the backend's JSON response (STR-003: an array of `{ id, name }`). This is the final story that proves the full frontend → backend → Postgres path renders a real value in the browser.

---

## Requirements
- With the backend running, loading the app's landing page displays the seeded recipes fetched from `/api/recipes`, rendered as a list using a shadcn-svelte component.
- The fetch targets the relative path `/api/recipes` (not an absolute backend URL), so the browser issues a same-origin request that the Vite dev server proxies to the backend.
- The Vite dev server proxies `/api` requests to the backend, with the proxy target configurable (env var / Vite config) so STR-006 can repoint it at the Compose backend service.
- While the request is in flight, a loading state is shown.
- If the request fails (network error or non-2xx response), an error state is shown instead of the list — the app does not crash or render a blank page.
- An empty array response renders gracefully (an empty list or a brief "no recipes" message), distinct from the error state.
- The fetched recipe shape is explicitly typed at the boundary (`{ id, name }`) — no `any`.
- Data fetching is client-side (CSR), consistent with the pure-SPA / `ssr = false` posture from STR-004 — no server `load` and no SSR fetch.

---

## Scope

### In Scope
- A landing-page component (`frontend/src/routes/+page.svelte`) that fetches `/api/recipes` client-side and renders the result as a list via a shadcn-svelte component.
- A small typed fetch helper (`frontend/src/lib/api/recipes.ts`) returning the parsed, typed recipe array, with non-2xx responses surfaced as a thrown error.
- A `Recipe` type at the API boundary (`frontend/src/lib/types/recipe.ts`).
- Loading, error, and empty states in the view.
- Vite dev proxy config (`/api` → backend) in `frontend/vite.config.ts`, target read from an env var with a sensible default; `frontend/.env.example` documenting it.
- One shadcn-svelte list component installed if STR-004 did not already install one suitable for list rendering.
- A unit test for the fetch helper covering success, non-2xx, and (if cheap) network-failure paths.

### Out of Scope
- Full Docker orchestration and production serving of the frontend (STR-006).
- Styling/polish beyond rendering the list legibly.
- Any write/CRUD interaction, forms, or recipe detail views.
- Pagination, filtering, sorting, search.
- Auth / ownership.
- CORS handling (the dev proxy makes it single-origin; intentionally not configured).
- Changes to the backend endpoint (STR-003 owns it).

---

## Technical Approach
- **Entry point:** `frontend/src/routes/+page.svelte` — the existing landing page from STR-004. Replace the placeholder content with the recipes view. Fetch on mount (Svelte `onMount`, or a `+page.ts` `load` explicitly marked CSR-only). Given `ssr = false` is set at the root layout in STR-004, `onMount` is the simplest faithful choice and keeps fetch logic out of a `load` contract; prefer it unless STR-004 established a `load`-based convention.
- **Fetch helper:** `frontend/src/lib/api/recipes.ts` exposes `export async function fetchRecipes(): Promise<Recipe[]>`. It calls `fetch('/api/recipes')`, throws on `!response.ok` (with a message including the status), and returns `await response.json()` typed as `Recipe[]`. Keep it a plain function (functional-first); this is the unit-testable seam — the component stays thin and delegates to it.
- **Boundary type:** `frontend/src/lib/types/recipe.ts` exports `export interface Recipe { id: number; name: string }`. Match STR-003's response shape exactly. If STR-003's `id` type is uncertain at implement time, confirm against the built endpoint or its spec; do not guess silently — `id` is the Postgres primary key and is expected to be an integer.
- **View state:** Hold three reactive pieces of state in the component — `recipes: Recipe[]`, `loading: boolean`, `error: string | null`. Initialize `loading = true`; on success set `recipes` and `loading = false`; on throw set `error` and `loading = false`. Template branches: loading → spinner/text; error → error message; otherwise the list (empty array → empty-state message).
- **List rendering:** Use a shadcn-svelte component to render the list (the story explicitly wants the component library exercised against real data). A Card per recipe, or a styled list, is sufficient — pick whatever shadcn-svelte component STR-004 installed, or install one (e.g. Card) via the shadcn-svelte CLI if none fits.
- **Vite dev proxy:** In `frontend/vite.config.ts`, add `server.proxy` so `/api` forwards to the backend. Target read from an env var (e.g. `VITE_API_PROXY_TARGET`) with a default of `http://localhost:3000` (the backend's STR-001 default port). Document the var in `frontend/.env.example`. Do not hardcode the target — STR-006 repoints it at the Compose service name. Note: `VITE_`-prefixed vars are exposed to client code, but here it is consumed in `vite.config.ts` at dev-server config time; either a `VITE_`-prefixed var via `loadEnv` or a plain build-time env read is acceptable — keep it readable and documented.
- **Key design decisions:**
  - Relative `/api/recipes` fetch (not an absolute URL) is what makes the single-origin proxy work and matches the eventual single-origin production setup (STR-006).
  - Fetch logic lives in a standalone function, not inline in the component, so it can be unit-tested without mounting Svelte and so the component is a thin view over `{ recipes, loading, error }`.
  - Client-side fetch via `onMount` honors the `ssr = false` posture — no server `load`, no Node process in the data path.

---

## Success Criteria
- [ ] With the backend (STR-003) running and the DB seeded, `npm run dev` then loading the page shows the seeded recipes as a list rendered with a shadcn-svelte component.
- [ ] The browser's network tab shows a same-origin request to `/api/recipes` proxied to the backend (no CORS error, no absolute backend URL in the request).
- [ ] Stopping the backend (or pointing the proxy at a dead port) causes the page to show the error state, not a crash or blank page.
- [ ] An empty `[]` response renders the empty state, not the error state.
- [ ] `fetchRecipes` is typed `Promise<Recipe[]>`; no `any` appears in the new code; type-check / build passes.
- [ ] The fetch-helper unit test passes (success returns typed array; non-2xx throws).
- [ ] The proxy target is configurable via env var and documented in `frontend/.env.example`.

---

## Tasks
Ordered by dependency.

- [ ] **Boundary type + fetch helper (TDD):** Add `frontend/src/lib/types/recipe.ts` (`Recipe { id: number; name: string }`) and `frontend/src/lib/api/recipes.ts` (`fetchRecipes(): Promise<Recipe[]>` — fetch `/api/recipes`, throw on non-2xx, return typed JSON). Write `frontend/src/lib/api/recipes.test.ts` first (mock `fetch`): success returns the typed array; non-2xx throws; network rejection propagates. Must pass before wiring the view.
- [ ] **Vite dev proxy:** In `frontend/vite.config.ts`, add `server.proxy` mapping `/api` → the backend, target from an env var (default `http://localhost:3000`). Add `frontend/.env.example` documenting the var. Verify a `/api/recipes` request from the running dev server reaches the backend.
- [ ] **Recipes view + states:** Rewrite `frontend/src/routes/+page.svelte` to fetch via `fetchRecipes()` in `onMount`, holding `recipes`/`loading`/`error` state. Render loading, error, empty, and populated branches; use a shadcn-svelte component for the list (install one via the shadcn-svelte CLI if STR-004 left none suitable). Keep the component thin — it delegates fetching to the helper.
- [ ] **End-to-end verification:** With the backend up, confirm the page renders seeded recipes through the proxy; confirm the error state by stopping the backend; confirm type-check/build is clean and the unit test passes.

---

## Considerations
- **Depends on unbuilt work.** STR-003 and STR-004 do not exist yet at spec time; this spec designs against their documented shapes (STR-003: JSON array of `{id, name}` under `/api/...`; STR-004: SvelteKit + `adapter-static` + `ssr = false` + Tailwind + shadcn-svelte). At implement time, verify the actual `+page.svelte` location, the root-layout `ssr = false` setting, and the real `Recipe` JSON shape before coding against assumptions. If either dependency's reality diverges materially (e.g. `id` is a string/UUID, or STR-004 used a `load`-based convention), follow what's built — do not blindly follow this spec's defaults.
- **`id` type.** This spec assumes integer `id` (Postgres serial PK). Confirm against STR-003's serialized shape; serde may emit it as a number. Adjust the `Recipe` type to match exactly — the goal is a faithful boundary type, not a guess.
- **CSR-only fetch.** Do not introduce a server `load` or anything that runs at SSR time — the app has `ssr = false`. If using a `+page.ts` `load` instead of `onMount`, it must be CSR-only and must not break the static build.
- **Proxy target must stay configurable.** STR-006 repoints `/api` at the backend's Compose service name. Hardcoding `localhost:3000` would force a STR-006 edit — read it from an env var with that as the default.
- **No CORS.** The single-origin proxy is the whole point; do not add CORS headers on the backend or `mode`/credentials gymnastics on the fetch. A CORS error in the network tab means the request bypassed the proxy (likely an absolute URL) — fix the request, not by adding CORS.
- **Testing altitude.** Unit-test the fetch helper (logic), per the project's Svelte/TS testing guidance — favor testing the composable/helper over mounting the component. A component test is not required for this slice; the end-to-end check covers the rendered states manually.
- **shadcn-svelte component install.** If STR-004 already installed a suitable component, reuse it. If not, installing one (e.g. Card) via the shadcn-svelte CLI will add files under the project's component directory (commonly `frontend/src/lib/components/ui/**`) and may touch config — that is expected and in scope; commit those generated files.
