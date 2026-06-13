<script lang="ts">
	import { onMount } from 'svelte';
	import { fetchRecipes } from '$lib/api/recipes';
	import { Card } from '$lib/components/ui/card/index.js';
	import type { Recipe } from '$lib/types/recipe';

	let recipes = $state<Recipe[]>([]);
	let loading = $state(true);
	let error = $state<string | null>(null);

	onMount(async () => {
		try {
			recipes = await fetchRecipes();
		} catch (e) {
			error = e instanceof Error ? e.message : 'Failed to load recipes';
		} finally {
			loading = false;
		}
	});
</script>

<main class="flex min-h-screen flex-col items-center justify-center gap-6 p-8">
	<h1 class="text-4xl font-bold">Yet Another Recipe App</h1>
	<p class="text-muted-foreground text-lg">Your personal recipe collection</p>

	{#if loading}
		<p class="text-muted-foreground">Loading recipes...</p>
	{:else if error}
		<p class="text-destructive">Error: {error}</p>
	{:else if recipes.length === 0}
		<p class="text-muted-foreground">No recipes yet.</p>
	{:else}
		<ul class="flex w-full max-w-md flex-col gap-3">
			{#each recipes as recipe (recipe.id)}
				<li>
					<Card class="px-4 py-3">
						<span class="font-medium">{recipe.name}</span>
					</Card>
				</li>
			{/each}
		</ul>
	{/if}
</main>
