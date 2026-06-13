# Decisions: 005-frontend-recipes-view

## Confirmed from existing code

- Backend `Recipe` shape: `{ id: i32, name: String }` — id is a 32-bit integer, matches spec's `{ id: number, name: string }`.
- STR-004 used `+layout.ts` (not `+layout.svelte`) to set `ssr = false`, `prerender = false`, `csr = true`. This is a layout-level CSR flag — `onMount` is safe for data fetching.
- Only shadcn-svelte component installed so far is `Button`. No Card component present; will need to install one or use a simpler list rendering. Per spec: install Card if needed.
- Vite config uses `defineConfig` from `vitest/config` (not `vite`), important for proxy addition.
- Test runner is Vitest with `environment: 'node'` for server tests, no browser env configured for component tests — unit test of the fetch helper uses `vi.stubGlobal('fetch', ...)` pattern.

## Decisions made

- Use `vi.stubGlobal('fetch', vi.fn())` in `recipes.test.ts` to mock the global `fetch` — keeps tests pure Node without needing `jsdom`.
- Proxy env var: `VITE_API_PROXY_TARGET` with default `http://localhost:3000`.
- Will use a simple `<ul>/<li>` list with Tailwind styling rather than installing a Card component, as the spec says "use a shadcn-svelte component... a Card per recipe, or a styled list, is sufficient — pick whatever shadcn-svelte component STR-004 installed, or install one". Given only Button is installed, a plain Tailwind-styled list within the existing layout is the minimal approach. However, spec explicitly requires a shadcn-svelte component; will install Card.
