<script lang="ts">
	import type { EditableRecipe, EditableIngredient } from '$lib/types/recipe';
	import { isRecipeValid, parseNumericInput } from './recipe-form-logic';
	import TagInput from './TagInput.svelte';
	import IngredientRows from './IngredientRows.svelte';
	import StepRows from './StepRows.svelte';

	interface RecipeFormProps {
		draft: EditableRecipe;
		onChange?: (next: EditableRecipe) => void;
		valid?: boolean;
	}

	let { draft = $bindable(), onChange, valid = $bindable() }: RecipeFormProps = $props();

	let _valid = $derived(isRecipeValid(draft));

	$effect(() => {
		valid = _valid;
	});

	function set(patch: Partial<EditableRecipe>) {
		draft = { ...draft, ...patch };
		onChange?.(draft);
	}
</script>

<div class="flex flex-col gap-5">
	<div>
		<label for="rf-title" class="label mb-1.5 block">Title</label>
		<input
			id="rf-title"
			class="input h-10 w-full text-base font-medium"
			value={draft.title}
			placeholder="e.g. Garlic Butter Weeknight Pasta"
			oninput={(e) => set({ title: (e.target as HTMLInputElement).value })}
		/>
	</div>

	<div class="grid grid-cols-2 gap-3.5">
		<div>
			<label for="rf-servings" class="label mb-1.5 block">Serves</label>
			<input
				id="rf-servings"
				class="input w-full"
				type="number"
				min="1"
				value={draft.servings || ''}
				placeholder="4"
				oninput={(e) => {
					const v = (e.target as HTMLInputElement).value;
					set({ servings: parseNumericInput(v) });
				}}
			/>
		</div>
		<div>
			<label for="rf-total-time" class="label mb-1.5 block">Total time (min)</label>
			<input
				id="rf-total-time"
				class="input w-full"
				type="number"
				min="0"
				value={draft.totalTime || ''}
				placeholder="25"
				oninput={(e) => {
					const v = (e.target as HTMLInputElement).value;
					set({ totalTime: parseNumericInput(v) });
				}}
			/>
		</div>
	</div>

	<div>
		<p class="label mb-1.5">Tags</p>
		<TagInput tags={draft.tags ?? []} onChange={(tags) => set({ tags })} />
	</div>

	<div>
		<div class="mb-2 flex items-baseline justify-between">
			<p class="label">Ingredients</p>
			<span class="mono text-[0.72rem] text-muted-foreground">{(draft.ingredients ?? []).length} items</span>
		</div>
		<IngredientRows
			rows={draft.ingredients ?? []}
			onChange={(ingredients: EditableIngredient[]) => set({ ingredients })}
		/>
	</div>

	<div>
		<div class="mb-2 flex items-baseline justify-between">
			<p class="label">Steps</p>
			<span class="mono text-[0.72rem] text-muted-foreground">{(draft.steps ?? []).length} steps</span>
		</div>
		<StepRows rows={draft.steps ?? []} onChange={(steps) => set({ steps })} />
	</div>
</div>
