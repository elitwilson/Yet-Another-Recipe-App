<script lang="ts">
	import { scheduleSteps } from './add-recipe-logic';

	interface Props {
		steps: string[];
		onDone: () => void;
	}

	let { steps, onDone }: Props = $props();

	let current = $state(0);

	$effect(() => {
		const cleanup = scheduleSteps(
			steps.length,
			800,
			600,
			(i) => { current = i; },
			onDone
		);
		return cleanup;
	});
</script>

<div data-test="parse-progress" class="flex flex-col gap-3 py-4">
	{#each steps as step, i}
		<div
			data-test="step-{i}"
			class="flex items-center gap-3 text-sm transition-colors"
		>
			<span
				class={[
					'flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs',
					i < current
						? 'bg-primary text-primary-foreground'
						: i === current
							? 'border-2 border-primary bg-background'
							: 'border border-[var(--border)] bg-[var(--muted)] text-[var(--muted-foreground)]',
				].join(' ')}
			>
				{#if i < current}
					<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
						<polyline points="20 6 9 17 4 12"/>
					</svg>
				{:else}
					{i + 1}
				{/if}
			</span>
			<span
				class={[
					i < current
						? 'text-[var(--muted-foreground)] line-through'
						: i === current
							? 'font-medium text-foreground'
							: 'text-[var(--muted-foreground)]',
				].join(' ')}
			>
				{step}
			</span>
		</div>
	{/each}
</div>
