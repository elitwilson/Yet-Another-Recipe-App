---
id: STR-005
title: Frontend recipes view
epic: EPIC-001
status: specced
priority: high
---

## Goal

Close the vertical slice in the UI: the SvelteKit frontend fetches `GET /api/recipes` and renders the seeded recipes using a shadcn-svelte component. Proves the full frontend → backend → DB path renders a real value.

---

## Scope

### In
- A page/component that fetches `GET /api/recipes` client-side and renders the result as a list, using a shadcn-svelte component.
- **Vite dev proxy** routing `/api` → the backend, so the browser stays single-origin and no CORS config is needed in dev.
- Basic loading and error states.

### Out
- Full Docker orchestration (STR-006).
- Styling/polish beyond rendering the list legibly.
- Any write/CRUD interaction.
- Production serving of the frontend (STR-006).

---

## Acceptance Criteria

- [ ] With the backend running, the frontend page displays the seeded recipes fetched from `/api/recipes`.
- [ ] The request is routed through the Vite dev proxy (no CORS handling required).
- [ ] A loading state shows while fetching and an error state shows if the request fails.

---

## Context & Decisions

- **Vite dev proxy** (decision from planning): `/api` → backend. Mirrors a single-origin production setup (STR-006) and avoids CORS in dev.
- Because the app is a **pure SPA with SSR disabled** (STR-004), data fetching is client-side (e.g. in `onMount` or a CSR `load`) — not a server `load`.
- Reuse a shadcn-svelte component for the list rendering to exercise the component library against real data.

---

## Dependencies

- **Depends on:** STR-003 (the endpoint it fetches), STR-004 (the frontend scaffold it builds on)
- **Blocks:** STR-006 (orchestration brings up this completed slice)

---

## Notes

- Type the fetched recipe shape on the frontend to match the backend's JSON response (STR-003).
- Keep the proxy target configurable (env / Vite config) so STR-006 can point it at the backend service in Compose.
