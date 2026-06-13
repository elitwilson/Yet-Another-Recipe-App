<script lang="ts">
	import { addTag, removeTag } from './recipe-form-logic';

	interface Props {
		tags: string[];
		onChange: (next: string[]) => void;
	}

	const { tags, onChange }: Props = $props();

	let val = $state('');

	function commit() {
		onChange(addTag(tags, val));
		val = '';
	}

	function handleKeyDown(e: KeyboardEvent) {
		if (e.key === 'Enter' || e.key === ',') {
			e.preventDefault();
			commit();
		} else if (e.key === 'Backspace' && !val && tags.length) {
			onChange(tags.slice(0, -1));
		}
	}
</script>

<div class="flex min-h-9 flex-wrap items-center gap-1.5 rounded-[calc(var(--radius)-2px)] border border-input px-2 py-1.5">
	{#each tags as tag (tag)}
		<span class="badge flex items-center gap-0.5 pr-1">
			{tag}
			<button
				type="button"
				class="focusable flex cursor-pointer items-center rounded p-px text-muted-foreground hover:text-foreground"
				onclick={() => onChange(removeTag(tags, tag))}
				aria-label="Remove {tag}"
			>
				<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
					<line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
				</svg>
			</button>
		</span>
	{/each}
	<input
		type="text"
		bind:value={val}
		onkeydown={handleKeyDown}
		placeholder={tags.length ? 'Add tag…' : 'pasta, fast, vegetarian…'}
		class="min-w-[90px] flex-1 border-0 bg-transparent font-[inherit] text-sm text-foreground outline-none"
		style="height: 1.6rem;"
	/>
</div>
