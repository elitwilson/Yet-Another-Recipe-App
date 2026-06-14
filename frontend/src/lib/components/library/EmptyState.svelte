<script lang="ts">
	let {
		variant
	}: {
		variant: 'empty-library' | 'no-results';
	} = $props();
</script>

<div data-test="empty-state" class="text-muted-foreground flex flex-col items-center gap-2 py-16 text-center">
	{#if variant === 'empty-library'}
		<p data-test="empty-library-message" class="text-lg font-medium">Your library is empty</p>
		<p class="text-sm">Add your first recipe to get started.</p>
		<a href="/recipes/new" class="btn btn-primary mt-2 text-sm">Add recipe</a>
	{:else}
		<p data-test="no-results-message" class="text-lg font-medium">No recipes match your search</p>
		<p class="text-sm">Try adjusting your filters or search terms.</p>
	{/if}
</div>
