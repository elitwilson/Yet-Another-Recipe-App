<script lang="ts">
	import { goto } from '$app/navigation';
	import type { Recipe, RecipeInput } from '$lib/types/recipe';
	import { formatTotalTime } from '$lib/library/format';
	import { sourceMeta } from '$lib/components/review/source-meta';

	let {
		recipe,
		onfavoritetoggle
	}: {
		recipe: Recipe;
		onfavoritetoggle: (updated: RecipeInput) => void;
	} = $props();

	function handleCardClick() {
		goto(`/recipes/${recipe.id}`);
	}

	function handleFavoriteToggle(e: MouseEvent) {
		e.stopPropagation();
		const { id, createdAt, ...input } = recipe;
		onfavoritetoggle({ ...input, favorite: !recipe.favorite });
	}

	const formattedTime = $derived(formatTotalTime(recipe.totalTime));
	const sourceMd = $derived(sourceMeta(recipe.source));
</script>

<div
	data-test="recipe-card"
	class="ring-foreground/10 bg-card text-card-foreground cursor-pointer rounded-xl p-4 ring-1 transition-shadow hover:shadow-md"
	role="button"
	tabindex="0"
	onclick={handleCardClick}
	onkeydown={(e) => e.key === 'Enter' && handleCardClick()}
>
	<div class="flex items-start justify-between gap-2">
		<div class="min-w-0 flex-1">
			<h2 data-test="recipe-title" class="truncate text-base font-semibold">{recipe.title}</h2>

			{#if formattedTime}
				<p data-test="recipe-time" class="text-muted-foreground mt-0.5 text-sm">{formattedTime}</p>
			{/if}

			{#if recipe.tags.length > 0}
				<div data-test="recipe-tags" class="mt-2 flex flex-wrap gap-1">
					{#each recipe.tags as tag (tag)}
						<span class="bg-secondary text-secondary-foreground rounded-full px-2 py-0.5 text-xs">
							{tag}
						</span>
					{/each}
				</div>
			{/if}
		</div>

		<button
			data-test="favorite-toggle"
			class="text-muted-foreground hover:text-foreground shrink-0 p-1 transition-colors"
			aria-label={recipe.favorite ? 'Remove from favorites' : 'Add to favorites'}
			aria-pressed={recipe.favorite}
			onclick={handleFavoriteToggle}
		>
			{#if recipe.favorite}
				<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="size-5 text-yellow-500">
					<path fill-rule="evenodd" d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.006 5.404.434c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.434 2.082-5.005Z" clip-rule="evenodd" />
				</svg>
			{:else}
				<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-5">
					<path stroke-linecap="round" stroke-linejoin="round" d="M11.48 3.499a.562.562 0 0 1 1.04 0l2.125 5.111a.563.563 0 0 0 .475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 0 0-.182.557l1.285 5.385a.562.562 0 0 1-.84.61l-4.725-2.885a.562.562 0 0 0-.586 0L6.982 20.54a.562.562 0 0 1-.84-.61l1.285-5.386a.562.562 0 0 0-.182-.557l-4.204-3.602a.562.562 0 0 1 .321-.988l5.518-.442a.563.563 0 0 0 .475-.345L11.48 3.5Z" />
				</svg>
			{/if}
		</button>
	</div>

	<!-- Source icon — icon only, muted, accessible label from shared sourceMeta helper -->
	<div class="mt-2 flex items-center">
		<span
			data-test="recipe-source"
			class="text-muted-foreground"
			aria-label={sourceMd.label}
			title={sourceMd.label}
		>
			{#if sourceMd.icon === 'globe'}
				<svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
					<circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
				</svg>
			{:else if sourceMd.icon === 'wand'}
				<svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
					<path d="m15 5 4 4"/><path d="M13 7 8.7 2.7a2.41 2.41 0 0 0-3.4 3.4L9.6 10"/><path d="m9.6 10 2.17 2.17"/><path d="m19 5-1.4 1.4"/><path d="m14 10 1.4-1.4"/><path d="M10 13.9 4.9 19a2.41 2.41 0 0 0 3.4 3.4l5.1-5.1"/>
				</svg>
			{:else}
				<!-- clipboard (paste / fallback) -->
				<svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
					<rect width="8" height="4" x="8" y="2" rx="1" ry="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/>
				</svg>
			{/if}
		</span>
	</div>
</div>
