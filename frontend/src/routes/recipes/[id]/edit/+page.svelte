<script lang="ts">
	import { untrack } from 'svelte';
	import { goto } from '$app/navigation';
	import { updateRecipe } from '$lib/api/recipes';
	import { Button } from '$lib/components/ui/button';
	import RecipeForm from '$lib/components/RecipeForm.svelte';
	import type { Recipe, RecipeInput, EditableRecipe } from '$lib/types/recipe';

	const { data }: { data: { recipe: Recipe } } = $props();

	const id = $derived(data.recipe.id);

	let draft = $state<EditableRecipe>(untrack(() => structuredClone({
		title: data.recipe.title,
		servings: data.recipe.servings,
		totalTime: data.recipe.totalTime,
		tags: data.recipe.tags,
		favorite: data.recipe.favorite,
		ingredients: data.recipe.ingredients,
		steps: data.recipe.steps,
		notes: data.recipe.notes,
		source: data.recipe.source
	})));

	let formValid = $state(false);
	let saving = $state(false);
	let error = $state<string | null>(null);

	async function save() {
		if (!formValid || saving) return;
		saving = true;
		error = null;
		try {
			const input: RecipeInput = {
				title: draft.title,
				servings: draft.servings,
				totalTime: draft.totalTime,
				tags: draft.tags,
				favorite: draft.favorite,
				ingredients: draft.ingredients,
				steps: draft.steps,
				notes: draft.notes,
				source: draft.source
			};
			await updateRecipe(id, input);
			goto(`/recipes/${id}`);
		} catch (e) {
			error = e instanceof Error ? e.message : 'Failed to save recipe';
		} finally {
			saving = false;
		}
	}

	function cancel() {
		goto(`/recipes/${id}`);
	}
</script>

<main class="mx-auto flex max-w-2xl flex-col gap-6 p-8">
	<div class="flex items-center justify-between">
		<a href="/recipes/{id}" class="text-muted-foreground text-sm hover:underline">
			Back to recipe
		</a>
		<div class="flex gap-2">
			<Button variant="outline" onclick={cancel}>Cancel</Button>
			<Button disabled={!formValid || saving} onclick={save}>
				{saving ? 'Saving…' : 'Save'}
			</Button>
		</div>
	</div>

	{#if error}
		<p class="text-destructive text-sm">{error}</p>
	{/if}

	<RecipeForm bind:draft bind:valid={formValid} />
</main>
