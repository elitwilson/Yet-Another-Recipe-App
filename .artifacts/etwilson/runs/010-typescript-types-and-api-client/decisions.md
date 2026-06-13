# Decisions — 010-typescript-types-and-api-client

## `+page.svelte` updated to use `recipe.title`

The existing `src/routes/+page.svelte` referenced `recipe.name` from the old placeholder type. Replacing the type broke the compile. Updated to `recipe.title` to match the production schema. This is in-scope: the spec says to replace the placeholder — the page consuming it needed to follow.

## Pre-existing `WithElementRef` type errors not addressed

Eight `svelte-check` errors in `src/lib/components/ui/` for a missing `WithElementRef` export predate this spec and appear on a clean checkout of main. Not caused by this change; not in scope.
