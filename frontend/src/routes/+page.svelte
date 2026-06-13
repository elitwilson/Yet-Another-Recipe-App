<script lang="ts">
	import { onMount } from 'svelte';
	import { fetchRecipes, updateRecipe } from '$lib/api/recipes';
	import { filterAndSortRecipes } from '$lib/library/filter';
	import type { Recipe, RecipeInput } from '$lib/types/recipe';
	import type { SortMode } from '$lib/library/filter';
	import RecipeCard from '$lib/components/library/RecipeCard.svelte';
	import LibraryControls from '$lib/components/library/LibraryControls.svelte';
	import EmptyState from '$lib/components/library/EmptyState.svelte';
	import { Button } from '$lib/components/ui/button/index.js';

	let recipes = $state<Recipe[]>([]);
	let loading = $state(true);
	let error = $state<string | null>(null);

	let query = $state('');
	let sort = $state<SortMode>('recent');
	let favoritesOnly = $state(false);

	const visible = $derived(filterAndSortRecipes(recipes, { query, sort, favoritesOnly }));

	onMount(async () => {
		try {
			recipes = await fetchRecipes();
		} catch (e) {
			error = e instanceof Error ? e.message : 'Failed to load recipes';
		} finally {
			loading = false;
		}
	});

	async function handleFavoriteToggle(recipe: Recipe, input: RecipeInput) {
		const updated = await updateRecipe(recipe.id, input);
		recipes = recipes.map(r => (r.id === updated.id ? updated : r));
	}
</script>

<main class="mx-auto max-w-5xl px-4 py-8">
	<h1 class="mb-6 text-3xl font-bold">My Recipes</h1>

	{#if loading}
		<p data-test="loading-state" class="text-muted-foreground">Loading recipes...</p>
	{:else if error}
		<div data-test="error-state" class="flex flex-col items-start gap-3">
			<p class="text-destructive">Error: {error}</p>
			<Button variant="outline" onclick={() => location.reload()}>Retry</Button>
		</div>
	{:else if recipes.length === 0}
		<EmptyState variant="empty-library" />
	{:else}
		<div class="mb-6">
			<LibraryControls bind:query bind:sort bind:favoritesOnly />
		</div>

		{#if visible.length === 0}
			<EmptyState variant="no-results" />
		{:else}
			<ul class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
				{#each visible as recipe (recipe.id)}
					<li>
						<RecipeCard
							{recipe}
							onfavoritetoggle={(input) => handleFavoriteToggle(recipe, input)}
						/>
					</li>
				{/each}
			</ul>
		{/if}
	{/if}
</main>
