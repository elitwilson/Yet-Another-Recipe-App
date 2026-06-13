<script lang="ts">
	import { Dialog as DialogPrimitive } from 'bits-ui';
	import type { ComponentProps } from 'svelte';

	type Props = ComponentProps<typeof DialogPrimitive.Root>;
	let { open = $bindable(false), ...restProps }: Props = $props();
</script>

<DialogPrimitive.Root bind:open {...restProps} />
