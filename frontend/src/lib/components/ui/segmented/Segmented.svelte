<script lang="ts">
	import { cn } from '$lib/utils.js';

	interface SegmentOption {
		value: string;
		label: string;
		disabled?: boolean;
	}

	interface Props {
		value: string;
		options: SegmentOption[];
		onchange?: (value: string) => void;
	}

	let { value, options, onchange }: Props = $props();
</script>

<div role="tablist" class="inline-flex rounded-lg border border-[var(--border)] bg-[var(--muted)] p-1">
	{#each options as option}
		<button
			role="tab"
			type="button"
			data-test="segment-{option.value}"
			aria-selected={value === option.value}
			disabled={option.disabled}
			class={cn(
				'rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
				value === option.value
					? 'bg-background text-foreground shadow-sm'
					: 'text-muted-foreground hover:text-foreground',
				option.disabled && 'cursor-not-allowed opacity-50'
			)}
			onclick={() => {
				if (!option.disabled) {
					onchange?.(option.value);
				}
			}}
		>
			{option.label}
		</button>
	{/each}
</div>
