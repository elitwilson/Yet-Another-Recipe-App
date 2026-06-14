<script lang="ts">
	import { goto } from '$app/navigation';
	import { createRecipe } from '$lib/api/recipes';
	import type { ParsedDraft } from '$lib/types/recipe';
	import AddRecipe from '$lib/components/add-recipe/AddRecipe.svelte';

	let error = $state<string | null>(null);

	async function handleSave(draft: ParsedDraft) {
		error = null;
		try {
			const recipe = await createRecipe({
				title: draft.title,
				servings: draft.servings,
				totalTime: draft.totalTime,
				tags: draft.tags,
				favorite: draft.favorite,
				ingredients: draft.ingredients.filter((ing) => ing.item.trim().length > 0).map(({ qty, unit, item }) => ({ qty, unit, item })),
				steps: draft.steps.filter((s) => s.trim().length > 0),
				notes: draft.notes,
				source: draft.source,
			});
			goto(`/recipes/${recipe.id}`);
		} catch (e) {
			error = e instanceof Error ? e.message : 'Failed to save recipe';
		}
	}
</script>

<main class="mx-auto max-w-2xl px-4 py-8">
	<div class="mb-6 flex items-center gap-4">
		<a href="/" class="text-muted-foreground text-sm hover:underline">Back to library</a>
	</div>

	<h1 class="mb-6 text-2xl font-bold">Add recipe</h1>

	{#if error}
		<p class="mb-4 text-sm text-destructive">{error}</p>
	{/if}

	<AddRecipe onSave={handleSave} />
</main>
