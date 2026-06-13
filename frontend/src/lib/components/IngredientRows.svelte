<script lang="ts">
	import type { EditableIngredient } from '$lib/types/recipe';
	import { addIngredient, removeAt, updateAt, reorder } from './recipe-form-logic';

	interface Props {
		rows: EditableIngredient[];
		onChange: (next: EditableIngredient[]) => void;
	}

	const { rows, onChange }: Props = $props();

	let dragIndex = $state<number | null>(null);
	let overIndex = $state<number | null>(null);

	function handleDrop(i: number) {
		if (dragIndex === null || dragIndex === i) {
			overIndex = null;
			return;
		}
		onChange(reorder(rows, dragIndex, i));
		dragIndex = null;
		overIndex = null;
	}
</script>

<div>
	<div class="flex flex-col gap-1.5">
		{#each rows as row, i (i)}
			<div
				role="listitem"
				ondragover={(e) => { e.preventDefault(); overIndex = i; }}
				ondrop={() => handleDrop(i)}
				class="grid items-center gap-1.5 rounded-lg px-0.5 py-0.5"
				style="grid-template-columns: 20px 64px 88px 1fr 30px; outline: {overIndex === i ? '2px dashed var(--ring)' : 'none'}; outline-offset: 2px; background: {row.lowConf ? 'color-mix(in oklch, var(--destructive) 8%, transparent)' : 'transparent'};"
			>
				<span
					role="button"
					tabindex="0"
					draggable={true}
					ondragstart={() => { dragIndex = i; }}
					ondragend={() => { overIndex = null; }}
					title="Drag to reorder"
					class="flex cursor-grab justify-center text-muted-foreground"
				>
					<svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
						<circle cx="9" cy="12" r="1"/><circle cx="9" cy="5" r="1"/><circle cx="9" cy="19" r="1"/>
						<circle cx="15" cy="12" r="1"/><circle cx="15" cy="5" r="1"/><circle cx="15" cy="19" r="1"/>
					</svg>
				</span>
				<input
					class="input h-8 px-[0.45rem] text-center"
					value={row.qty}
					placeholder="qty"
					oninput={(e) => onChange(updateAt(rows, i, { qty: (e.target as HTMLInputElement).value, lowConf: false }))}
				/>
				<input
					class="input h-8 px-[0.45rem]"
					value={row.unit}
					placeholder="unit"
					oninput={(e) => onChange(updateAt(rows, i, { unit: (e.target as HTMLInputElement).value }))}
				/>
				<input
					class="input h-8 px-[0.55rem]"
					value={row.item}
					placeholder="ingredient"
					oninput={(e) => onChange(updateAt(rows, i, { item: (e.target as HTMLInputElement).value, lowConf: false }))}
				/>
				<button
					type="button"
					class="btn btn-ghost btn-icon btn-sm text-muted-foreground"
					onclick={() => onChange(removeAt(rows, i))}
					title="Remove"
				>
					<svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
						<line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
					</svg>
				</button>
			</div>
		{/each}
	</div>
	<button
		type="button"
		class="btn btn-ghost btn-sm mt-2 text-muted-foreground"
		onclick={() => onChange(addIngredient(rows))}
	>
		<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
			<line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
		</svg>
		Add ingredient
	</button>
</div>
