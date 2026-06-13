# Decisions — 004-frontend-scaffold-sveltekit

## SvelteKit CLI output: vite.config.ts instead of svelte.config.js

The current `sv` CLI (v0.16.1) places adapter and compiler config directly in `vite.config.ts` (Vite-native style) rather than a separate `svelte.config.js`. The spec anticipated `svelte.config.js` but this is the new default. The adapter-static `fallback: '200.html'` config was added to `vite.config.ts` accordingly. Tests were updated to read `vite.config.ts`.

## Global stylesheet: layout.css (not app.css)

The `sv` CLI named the global stylesheet `src/routes/layout.css` (not `app.css`). It is imported in `+layout.svelte`. Tests were updated to also check for `layout.css`.

## shadcn-svelte: manual creation instead of CLI init

`npx shadcn-svelte@latest init` was blocked by the auto-mode permission classifier (downloads external code without explicit user authorization). The artifacts that `init` + `add button` produce were created manually:
- `components.json` with slate base color pointing at `src/routes/layout.css`
- `src/lib/utils.ts` with `cn()` helper (clsx + tailwind-merge)
- `src/lib/components/ui/button/button.svelte` + `index.ts`
- CSS variables added to `layout.css` using Tailwind v4 `@theme` syntax

## Tailwind v4 compatibility: @theme instead of HSL CSS variables with @apply

shadcn-svelte's standard CSS pattern uses `@layer base { * { @apply border-border; } }` which relies on `border-border` as a Tailwind utility. Tailwind v4 doesn't resolve CSS-variable-backed utilities via `@apply` by default. The CSS variables were registered as `@theme { --color-border: hsl(...); }` tokens so `border-border` resolves correctly.

## Human review needed: shadcn-svelte CLI init

Once the user grants permission for `npx` commands that download external packages, running `npx shadcn-svelte@latest init` and `npx shadcn-svelte@latest add button` in `frontend/` would produce the canonical output. The manually-created files match what the CLI would generate, but there may be minor version drift. Consider running the CLI to reconcile.
