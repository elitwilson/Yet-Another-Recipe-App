---
number: 004
story: STR-004
status: ready
base_branch: main
depends_on: []
scope_files:
  - frontend/package.json
  - frontend/package-lock.json
  - frontend/svelte.config.js
  - frontend/vite.config.ts
  - frontend/tsconfig.json
  - frontend/components.json
  - frontend/.gitignore
  - frontend/.prettierrc
  - frontend/.prettierignore
  - frontend/eslint.config.js
  - frontend/README.md
  - frontend/src/**
  - frontend/static/**
---

# Feature: Frontend Scaffold — SvelteKit SPA + Tailwind + shadcn-svelte

## Summary
Stand up the YARA frontend at `frontend/` (the second top-level directory in the monorepo, alongside `backend/`) as a SvelteKit project configured as a pure client-side SPA. The app builds to plain static assets via `adapter-static` with SSR disabled — no Node server is part of the stack, keeping Axum the single source of truth for the API. Tailwind CSS and shadcn-svelte are wired up, with at least one shadcn-svelte component rendered on a single placeholder landing page to prove the styling and component pipeline works end to end. The app runs standalone (`npm run dev`) with no dependency on the backend. This is pure scaffolding: no backend calls, no dev proxy, no routing beyond the landing page — those arrive in STR-005.

---

## Requirements
- Running `npm run dev` from `frontend/` serves the SvelteKit app in the browser.
- The project is a SvelteKit app using TypeScript throughout (no `any`).
- SSR is disabled app-wide via the root layout, so no server-side rendering is attempted on any route.
- A production build via `adapter-static` emits only static assets (HTML/CSS/JS) — no Node server entry point is produced.
- Tailwind CSS utility classes apply correctly on the landing page.
- shadcn-svelte is initialized and at least one shadcn-svelte component (e.g. Button) renders on the landing page.
- The app runs and renders fully without the backend running.
- Frontend formatter and linter are configured and pass clean on the scaffolded code.
- `frontend/README.md` documents prerequisites and the dev run command, plus the production build/preview commands.

---

## Scope

### In Scope
- New `frontend/` SvelteKit project at the repo root (establishes the `frontend/` monorepo convention; `backend/` already exists from STR-001).
- `@sveltejs/adapter-static` configured for SPA mode with an SPA fallback page.
- Root layout (`src/routes/+layout.ts`) disabling SSR (`ssr = false`) and prerendering (`prerender = false`), with client-side rendering on (`csr = true`).
- Tailwind CSS configured and working (via the SvelteKit `tailwindcss` add-on; current Tailwind-v4 / `@tailwindcss/vite` flow).
- shadcn-svelte initialized (`components.json`, path aliases, global stylesheet, base color), with at least one component added under `$lib/components/ui/` and rendered on the landing page.
- A single landing page (`src/routes/+page.svelte`) demonstrating a Tailwind utility class and the shadcn-svelte component.
- Formatter (Prettier + `prettier-plugin-svelte`) and linter (ESLint) configured, matching the SvelteKit add-on output.
- `frontend/.gitignore` for `node_modules/`, `.svelte-kit/`, and `build/`.
- `frontend/README.md` documenting prerequisites, dev, build, and preview commands.

### Out of Scope
- Any calls to the backend or `/api/recipes` (STR-005).
- The Vite dev proxy config for `/api` → backend (STR-005, when first needed).
- Dockerfile / `docker-compose.yml` / orchestration (STR-006).
- Routing beyond the single landing page; layouts/nav structure for real features.
- Any real domain UI (recipe lists, forms, detail views).
- Client-side persistence / local-first storage (explicitly out of EPIC-001).
- Deployment, CI, hosting-specific fallback tuning.

---

## Technical Approach
- **Project creation:** Scaffold with the SvelteKit CLI non-interactively from the repo root, targeting a `frontend/` directory:
  `npx sv create frontend --template minimal --types ts --add tailwindcss eslint prettier vitest --no-install` (then `npm install` inside `frontend/`). The `tailwindcss` add-on wires Tailwind (current v4 flow via `@tailwindcss/vite` and a `src/app.css` importing Tailwind); `eslint`/`prettier` establish the lint/format tooling the story calls for. `vitest` is included so the frontend has a test runner consistent with the project's TypeScript-testing convention, even though this scaffold's deliverable is verified primarily by build output rather than unit tests. If the interactive-only prompt cannot be fully driven by flags in the installed `sv` version, the implementer may run `sv create` and accept these same selections — the resulting file set is what matters.
- **SPA / static adapter:** Replace the default adapter with `@sveltejs/adapter-static` in `frontend/svelte.config.js`, configured with an SPA fallback:
  ```js
  adapter: adapter({ fallback: '200.html' })
  ```
  The `fallback` page is what makes a client-routed SPA work without a server. (`200.html` is a conventional fallback name; `index.html` is an acceptable alternative — pick one and keep it.)
- **Disable SSR app-wide:** Create `frontend/src/routes/+layout.ts` exporting:
  ```ts
  export const ssr = false;
  export const prerender = false;
  export const csr = true;
  ```
  Disabling SSR at the root layout applies to every route, satisfying the story's explicit "no SSR anywhere" decision and keeping the build server-free. (Note: SvelteKit docs observe that `ssr = false` is not strictly required for a static SPA, but the story mandates it explicitly as the BYO-backend posture — honor it.)
- **Tailwind:** Provided by the `tailwindcss` add-on. Verify the global stylesheet (`src/app.css` or equivalent) is imported in the root layout/markup so utility classes resolve. shadcn-svelte's `init` will also touch the global stylesheet (CSS variables / base color).
- **shadcn-svelte:** Initialize with `npx shadcn-svelte@latest init` inside `frontend/`, accepting defaults (base color e.g. Slate; global CSS the add-on's stylesheet; aliases under `$lib`). This writes `frontend/components.json` and may adjust `svelte.config.js` aliases and the global CSS. Then add one component: `npx shadcn-svelte@latest add button`. Components land under `frontend/src/lib/components/ui/button/` and import as `import { Button } from "$lib/components/ui/button/index.js";`.
- **Landing page:** `frontend/src/routes/+page.svelte` renders a minimal placeholder: a heading styled with a Tailwind utility class and the shadcn-svelte `Button` component, proving both pipelines render in the browser. Use `<script lang="ts">`; keep SFC block order script → markup → style (no `<style>` block needed if Tailwind-only).
- **Tooling config:** Prettier (`.prettierrc`, `.prettierignore`, with `prettier-plugin-svelte`) and ESLint (`eslint.config.js`) as emitted by the add-ons; ensure both run clean against the scaffolded source. Add npm scripts if the add-on didn't (e.g. `lint`, `format`).
- **Key design decisions:**
  - SvelteKit (not plain Svelte+Vite) because shadcn-svelte's CLI/install flow assumes SvelteKit; SvelteKit is Vite-based, so the vision's "Svelte built with Vite" still holds.
  - `adapter-static` + `ssr = false`: SvelteKit's server layer is deliberately unused — no Node process in the stack, Axum stays the single API source of truth, aligns with the decoupled-API goal.
  - shadcn-svelte's copy-in component model keeps full control over markup/styling (Tailwind-native).
  - No dev proxy here — the app must run standalone; `/api` proxying is STR-005's concern.

---

## Success Criteria
- [ ] `cd frontend && npm install && npm run dev` serves the app; the landing page loads in the browser with no backend running.
- [ ] A Tailwind utility class on the landing page visibly applies (e.g. spacing/color/typography).
- [ ] The shadcn-svelte `Button` (or chosen component) renders on the landing page.
- [ ] `npm run build` completes and `frontend/build/` contains static assets (`.html`/`.js`/`.css`) plus the SPA fallback (`200.html`), with **no Node server entry** emitted (no `index.js`/server handler).
- [ ] `npm run preview` serves the built static output and the page renders identically.
- [ ] The frontend linter and formatter pass clean on the scaffolded source (`npm run lint` / format check, per the add-on's scripts).
- [ ] `frontend/README.md` documents prerequisites and the dev, build, and preview commands.

---

## Tasks
Ordered by dependency.

- [ ] **Scaffold the SvelteKit project + tooling:** From the repo root, create `frontend/` via the `sv` CLI with the `tailwindcss`, `eslint`, `prettier`, and `vitest` add-ons and TypeScript. Run `npm install`. Add `frontend/.gitignore` (`node_modules/`, `.svelte-kit/`, `build/`) if not generated. Confirm `npm run dev` serves the default app and `npm run lint`/format pass clean. Establishes the `frontend/` monorepo convention.
- [ ] **Convert to a static SPA:** Install `@sveltejs/adapter-static` and configure it in `svelte.config.js` with `fallback: '200.html'`. Add `src/routes/+layout.ts` exporting `ssr = false`, `prerender = false`, `csr = true`. Verify `npm run build` succeeds and emits static assets with the fallback page and **no Node server entry**. Complete and build-verified before the next task.
- [ ] **Wire Tailwind + shadcn-svelte:** Confirm Tailwind is active (global stylesheet imported, a utility class resolves). Run `shadcn-svelte init` accepting defaults; run `shadcn-svelte add button`. Verify `components.json`, the `$lib/components/ui/` button, and any alias/global-CSS changes are in place and the build still passes.
- [ ] **Build the landing page:** Implement `src/routes/+page.svelte` (`<script lang="ts">`) rendering a heading with a Tailwind utility class and the shadcn-svelte `Button`. Run `npm run dev` and confirm both the Tailwind styling and the component render with the backend not running. Re-run lint/format clean.
- [ ] **Document dev ergonomics:** Write `frontend/README.md` covering prerequisites (Node version, npm), the dev command (`npm run dev`), the production build (`npm run build`) and preview (`npm run preview`) commands, and a note that the app is a standalone static SPA with no Node server and no backend dependency yet.

---

## Considerations
- The story explicitly mandates `ssr = false` at the root layout. SvelteKit's own docs note this is technically optional for a static SPA, but it is a deliberate product decision here (BYO Axum backend, no Node server) — implement it as specified rather than "optimizing" it away.
- The decisive acceptance check is the build output: inspect `frontend/build/` and confirm it contains the SPA fallback (`200.html`) and static assets only, with no server/Node entry file. This is the mechanical proof that the SPA posture holds.
- shadcn-svelte's `init` mutates files the Tailwind add-on already created (the global stylesheet, possibly `svelte.config.js` aliases). Run Tailwind setup first, then `init`, then re-verify the build — don't hand-write CSS variables that `init` is meant to generate.
- shadcn-svelte and the SvelteKit `sv` CLI evolve quickly (Svelte 5 / Tailwind v4 / `@tailwindcss/vite` is the current flow). Prefer the CLI's interactive defaults over hand-rolling config; if a flag in the example commands isn't recognized by the installed CLI version, fall back to the interactive flow and accept the equivalent selections — the resulting file set is the contract, not the exact invocation.
- Do not add a Vite dev proxy, any `fetch('/api/...')` call, or a second route — those are STR-005. Keep this to a single standalone landing page.
- Do not create `docker-compose.yml` or any Docker artifact (STR-006), and do not touch `backend/`.
- Use TypeScript throughout (no `any`), functional-first; component files PascalCase. The single placeholder page may be lowercase `+page.svelte` per SvelteKit's required routing filenames — that's the framework convention, not a violation.
