<script lang="ts">
	import type { SortMode } from '$lib/library/filter';

	let {
		query = $bindable(''),
		sort = $bindable<SortMode>('recent'),
		favoritesOnly = $bindable(false)
	}: {
		query: string;
		sort: SortMode;
		favoritesOnly: boolean;
	} = $props();
</script>

<div class="flex flex-wrap items-center gap-3">
	<input
		data-test="search-input"
		type="search"
		placeholder="Search recipes..."
		bind:value={query}
		class="border-input bg-background placeholder:text-muted-foreground focus-visible:ring-ring min-w-48 flex-1 rounded-lg border px-3 py-1.5 text-sm focus-visible:ring-2 focus-visible:outline-none"
	/>

	<select
		data-test="sort-select"
		bind:value={sort}
		class="border-input bg-background focus-visible:ring-ring rounded-lg border px-3 py-1.5 text-sm focus-visible:ring-2 focus-visible:outline-none"
	>
		<option value="recent">Recent</option>
		<option value="az">A–Z</option>
		<option value="quickest">Quickest</option>
	</select>

	<label class="flex cursor-pointer items-center gap-2 text-sm select-none">
		<input
			data-test="favorites-toggle"
			type="checkbox"
			bind:checked={favoritesOnly}
			class="accent-primary size-4"
		/>
		Favorites only
	</label>
</div>
