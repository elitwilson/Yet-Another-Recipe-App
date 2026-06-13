---
id: STR-004
title: Frontend scaffold (SvelteKit SPA + Tailwind + shadcn-svelte)
epic: EPIC-001
status: specced
priority: high
---

## Goal

Stand up the frontend as a SvelteKit project configured as a pure client-side SPA, with Tailwind CSS and shadcn-svelte wired up and rendering. Runnable standalone, independent of the backend.

---

## Scope

### In
- `frontend/` SvelteKit project at the repo root (monorepo layout).
- **`adapter-static` with SSR disabled** (`export const ssr = false`) — the app builds to plain static assets (no Node server), acting as a client-side SPA + router.
- Tailwind CSS configured and working.
- shadcn-svelte initialized, with at least one component installed and rendered on a placeholder page.
- Vite dev server with a documented run command.

### Out
- Any calls to the backend / `/api/recipes` (STR-005).
- The Vite dev proxy config (added in STR-005 when it's first needed).
- Docker / orchestration (STR-006).
- Routing beyond a single landing page.

---

## Acceptance Criteria

- [ ] `npm run dev` (or equivalent) serves the SvelteKit app.
- [ ] Tailwind utility classes apply correctly.
- [ ] At least one shadcn-svelte component renders on the page.
- [ ] A production build via `adapter-static` emits static assets with **no SSR / Node-server requirement**.

---

## Context & Decisions

- **SvelteKit chosen over plain Svelte+Vite** because shadcn-svelte officially targets SvelteKit (its CLI and install flow assume it). The vision's "Svelte built with Vite" is satisfied — SvelteKit is built on Vite.
- **Pure-SPA posture** (`adapter-static` + `ssr = false`): SvelteKit's server layer is deliberately *not* used. This keeps Axum the single source of truth for the API (BYO backend), keeps no Node process in the stack, and aligns with the vision's decoupled-API goal (a future mobile client reuses the same backend).
- shadcn-svelte's copy-in component model (Tailwind-native) was chosen for full control over markup/styling (EPIC-001).

---

## Dependencies

- **Depends on:** none — runs in parallel with the backend track (STR-001/002/003)
- **Blocks:** STR-005 (recipes view builds on this scaffold)

---

## Notes

- Disable SSR at the root layout so no server-side rendering is attempted anywhere; verify the static build does not emit a Node server entry.
- Establish the `frontend/` directory and frontend tooling conventions (formatter/linter) here.
