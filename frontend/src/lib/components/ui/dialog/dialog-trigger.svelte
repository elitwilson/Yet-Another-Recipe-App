<script lang="ts">
	import { Dialog as DialogPrimitive } from 'bits-ui';
	import type { ComponentProps } from 'svelte';

	type Props = ComponentProps<typeof DialogPrimitive.Trigger>;
	let { ...restProps }: Props = $props();
</script>

<DialogPrimitive.Trigger {...restProps} />
