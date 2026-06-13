<script lang="ts">
	import { navigating } from '$app/state';
	import { goto } from '$app/navigation';
	import { deleteRecipe } from '$lib/api/recipes';
	import { Button } from '$lib/components/ui/button';
	import {
		Dialog,
		DialogContent,
		DialogHeader,
		DialogTitle,
		DialogDescription,
		DialogFooter
	} from '$lib/components/ui/dialog';
	import { formatTime } from '$lib/utils/time';
	import type { Recipe } from '$lib/types/recipe';

	const { data }: { data: { recipe: Recipe } } = $props();
	const recipe = $derived(data.recipe);

	let confirmingDelete = $state(false);
	let deleting = $state(false);
	let error = $state<string | null>(null);

	async function confirmDelete() {
		deleting = true;
		error = null;
		try {
			await deleteRecipe(recipe.id);
			goto('/');
		} catch (e) {
			error = e instanceof Error ? e.message : 'Failed to delete recipe';
		} finally {
			deleting = false;
		}
	}
</script>

{#if navigating}
	<main class="flex min-h-screen flex-col items-center justify-center p-8">
		<p class="text-muted-foreground">Loading recipe...</p>
	</main>
{:else}
	<main class="mx-auto flex max-w-2xl flex-col gap-6 p-8">
		<div class="flex items-center justify-between">
			<a href="/" class="text-muted-foreground text-sm hover:underline">Back to library</a>
			<div class="flex gap-2">
				<Button variant="outline" href="/recipes/{recipe.id}/edit">Edit</Button>
				<Button variant="destructive" onclick={() => { confirmingDelete = true; }}>Delete</Button>
			</div>
		</div>

		{#if error}
			<p class="text-destructive text-sm">{error}</p>
		{/if}

		<h1 class="text-3xl font-bold">{recipe.title}</h1>

		<div class="text-muted-foreground flex flex-wrap gap-4 text-sm">
			{#if recipe.servings}
				<span>{recipe.servings} servings</span>
			{/if}
			{#if recipe.totalTime}
				<span>{formatTime(recipe.totalTime)}</span>
			{/if}
		</div>

		{#if recipe.tags && recipe.tags.length > 0}
			<div class="flex flex-wrap gap-2">
				{#each recipe.tags as tag}
					<span class="bg-muted rounded px-2 py-0.5 text-xs">{tag}</span>
				{/each}
			</div>
		{/if}

		{#if recipe.ingredients.length > 0}
			<section>
				<h2 class="mb-2 text-lg font-semibold">Ingredients</h2>
				<ul class="flex flex-col gap-1">
					{#each recipe.ingredients as ing}
						<li class="flex gap-3">
							<span class="font-mono w-20 shrink-0 text-sm">
								{[ing.qty, ing.unit].filter(Boolean).join(' ') || '—'}
							</span>
							<span>{ing.item}</span>
						</li>
					{/each}
				</ul>
			</section>
		{/if}

		{#if recipe.steps.length > 0}
			<section>
				<h2 class="mb-2 text-lg font-semibold">Steps</h2>
				<ol class="flex flex-col gap-3">
					{#each recipe.steps as step, i}
						<li class="flex gap-3">
							<span class="bg-muted flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-medium">
								{i + 1}
							</span>
							<span class="pt-0.5">{step}</span>
						</li>
					{/each}
				</ol>
			</section>
		{/if}

		{#if recipe.notes}
			<section>
				<h2 class="mb-2 text-lg font-semibold">Notes</h2>
				<p class="text-muted-foreground">{recipe.notes}</p>
			</section>
		{/if}
	</main>

	<Dialog bind:open={confirmingDelete}>
		<DialogContent>
			<DialogHeader>
				<DialogTitle>Delete recipe?</DialogTitle>
				<DialogDescription>
					This will permanently delete "{recipe.title}". This action cannot be undone.
				</DialogDescription>
			</DialogHeader>
			<DialogFooter>
				<Button variant="outline" onclick={() => { confirmingDelete = false; }} disabled={deleting}>
					Cancel
				</Button>
				<Button variant="destructive" onclick={confirmDelete} disabled={deleting}>
					{deleting ? 'Deleting…' : 'Delete recipe'}
				</Button>
			</DialogFooter>
		</DialogContent>
	</Dialog>
{/if}
