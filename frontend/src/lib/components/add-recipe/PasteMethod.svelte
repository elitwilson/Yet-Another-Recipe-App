<script lang="ts">
	import { SAMPLE_PASTE_CLEAN, SAMPLE_PASTE_MESSY } from '$lib/parser';
	import { countLines } from './add-recipe-logic';

	interface Props {
		onparse: (text: string) => void;
	}

	let { onparse }: Props = $props();

	let text = $state('');

	let lines = $derived(countLines(text));
	let canParse = $derived(text.trim().length > 0);
</script>

<div class="flex flex-col gap-4">
	<div class="flex flex-wrap gap-2">
		<button
			type="button"
			class="btn btn-secondary text-xs"
			onclick={() => { text = SAMPLE_PASTE_CLEAN; }}
		>
			Clean example
		</button>
		<button
			type="button"
			class="btn btn-secondary text-xs"
			onclick={() => { text = SAMPLE_PASTE_MESSY; }}
		>
			Messy / texted example
		</button>
		{#if text}
			<button
				data-test="clear-btn"
				type="button"
				class="btn btn-ghost text-xs"
				onclick={() => { text = ''; }}
			>
				Clear
			</button>
		{/if}
	</div>

	<textarea
		bind:value={text}
		placeholder="Paste your recipe here…"
		rows={12}
		class="w-full resize-y rounded-lg border border-[var(--border)] bg-[var(--muted)] p-3 text-sm text-foreground placeholder:text-[var(--muted-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
	></textarea>

	<div class="flex items-center justify-between">
		<span class="text-xs text-[var(--muted-foreground)]">
			{lines} line{lines === 1 ? '' : 's'}
		</span>
		<button
			data-test="parse-btn"
			type="button"
			class="btn btn-primary"
			disabled={!canParse}
			onclick={() => onparse(text)}
		>
			Parse recipe
		</button>
	</div>
</div>
