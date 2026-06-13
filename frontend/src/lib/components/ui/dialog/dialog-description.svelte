<script lang="ts">
	import { Dialog as DialogPrimitive } from 'bits-ui';
	import { cn } from '$lib/utils.js';
	import type { ComponentProps } from 'svelte';

	type Props = ComponentProps<typeof DialogPrimitive.Description> & { class?: string };
	let { class: className, ...restProps }: Props = $props();
</script>

<DialogPrimitive.Description
	class={cn('text-muted-foreground text-sm', className)}
	{...restProps}
/>
