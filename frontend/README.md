# YARA Frontend

SvelteKit SPA with Tailwind CSS and shadcn-svelte. Builds to static assets — no Node server, no backend dependency.

## Prerequisites

- Node 20+
- npm 10+

## Development

```bash
npm install
npm run dev
```

Opens at `http://localhost:5173`.

## Production Build

```bash
npm run build
```

Emits static assets to `build/`. Includes `200.html` as the SPA fallback for client-side routing.

## Preview Built Output

```bash
npm run preview
```

Serves the `build/` directory locally to verify the production output.

## Notes

- The app is a standalone static SPA. No backend or Node server is required to run it.
- Backend integration (`/api/recipes`) arrives in a later story.
- Lint: `npm run lint` — Prettier + ESLint
- Type check: `npm run check`
