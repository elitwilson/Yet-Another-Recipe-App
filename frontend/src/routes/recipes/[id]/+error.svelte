<script lang="ts">
	import { page } from '$app/state';
</script>

<main class="flex min-h-screen flex-col items-center justify-center gap-4 p-8">
	{#if page.status === 404}
		<h1 class="text-2xl font-bold">Recipe not found</h1>
		<p class="text-muted-foreground">The recipe you're looking for doesn't exist or has been removed.</p>
	{:else}
		<h1 class="text-2xl font-bold">Something went wrong</h1>
		<p class="text-muted-foreground">An error occurred while loading this recipe.</p>
	{/if}
	<a href="/" class="text-primary underline-offset-4 hover:underline">Back to library</a>
</main>
