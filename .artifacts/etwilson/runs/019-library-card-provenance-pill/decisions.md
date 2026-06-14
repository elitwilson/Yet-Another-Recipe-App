# Decisions — 019-library-card-provenance-pill

## Helper icon shape

`sourceMeta` returns `icon` as a name string (`'globe' | 'clipboard' | 'wand'`), not a renderable component. Confirmed by reading `frontend/src/lib/components/review/source-meta.ts` before implementation.

## SVG markup reuse

The three inline SVG glyphs (globe, wand, clipboard) were copied verbatim from `ReviewPanel.svelte`, which already had them for the verbose provenance pill. This avoids inventing new SVG paths and keeps the icon shapes visually consistent between the card and the Review panel. The type→icon *mapping* remains single-sourced in the `sourceMeta` helper; only the SVG rendering is local to each component.

## Placement

The source icon is placed in a footer row (`mt-2 flex items-center`) below the header row (title + favorite button) and the tags. This matches the prototype's footer positioning and keeps the icon visually separate from the primary content.

## Accessible label

The `<span>` carrying `data-test="recipe-source"` has both `aria-label` and `title` set to `sourceMd.label`. The SVG itself carries `aria-hidden="true"` so screen readers read only the span label, not the SVG paths. For `url` source, the label is the host name (or `'imported URL'` if no host) — the spec says "sourced from the same shared helper," so we use whatever the helper returns rather than hardcoding "Imported".

## No second type→icon mapping

The card's `{#if sourceMd.icon === 'globe'}` block switches on the helper's output, not on `recipe.source.type` directly. This satisfies the spec's requirement that grep shows no second type→icon mapping in `RecipeCard.svelte`.
