<script lang="ts">
	import type { HTMLAttributes } from 'svelte/elements';
	import { cn } from '$lib/utils.js';

	interface Props extends HTMLAttributes<HTMLDivElement> {}

	let { class: className, children, ...rest }: Props = $props();
</script>

<div
	class={cn(
		'bg-card text-card-foreground rounded-lg border shadow-sm',
		className
	)}
	{...rest}
>
	{@render children?.()}
</div>
