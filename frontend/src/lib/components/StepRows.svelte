<script lang="ts">
	import { addStep, removeAt, reorder } from './recipe-form-logic';

	interface Props {
		rows: string[];
		onChange: (next: string[]) => void;
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
				class="grid items-start gap-1.5 rounded-lg"
				style="grid-template-columns: 20px 24px 1fr 30px; outline: {overIndex === i ? '2px dashed var(--ring)' : 'none'}; outline-offset: 2px;"
			>
				<span
					role="button"
					tabindex="0"
					draggable={true}
					ondragstart={() => { dragIndex = i; }}
					ondragend={() => { overIndex = null; }}
					title="Drag to reorder"
					class="flex cursor-grab justify-center pt-2 text-muted-foreground"
				>
					<svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
						<circle cx="9" cy="12" r="1"/><circle cx="9" cy="5" r="1"/><circle cx="9" cy="19" r="1"/>
						<circle cx="15" cy="12" r="1"/><circle cx="15" cy="5" r="1"/><circle cx="15" cy="19" r="1"/>
					</svg>
				</span>
				<span class="mono pt-[9px] text-center text-xs text-muted-foreground">{i + 1}</span>
				<textarea
					class="textarea min-h-[2.4rem]"
					rows={2}
					placeholder="Describe this step…"
					value={row}
					oninput={(e) => {
						const next = rows.map((r, idx) => idx === i ? (e.target as HTMLTextAreaElement).value : r);
						onChange(next);
					}}
				></textarea>
				<button
					type="button"
					class="btn btn-ghost btn-icon btn-sm mt-1 text-muted-foreground"
					onclick={() => onChange(removeAt(rows, i))}
					aria-label="Remove step {i + 1}"
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
		onclick={() => onChange(addStep(rows))}
	>
		<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
			<line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
		</svg>
		Add step
	</button>
</div>
