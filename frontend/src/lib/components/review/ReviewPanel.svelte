<script lang="ts">
	import type { ParsedDraft } from '$lib/types/recipe';
	import { isRecipeValid } from '../recipe-form-logic';
	import { sourceMeta } from './source-meta';
	import { confidenceTone, confidenceColor } from './confidence';
	import RecipeForm from '../RecipeForm.svelte';

	interface Props {
		draft: ParsedDraft;
		onBack: () => void;
		onSave: (draft: ParsedDraft) => void;
		backLabel?: string;
	}

	let { draft = $bindable(), onBack, onSave, backLabel = 'Back' }: Props = $props();

	let meta = $derived(sourceMeta(draft.source));
	let valid = $derived(isRecipeValid(draft));
</script>

<div class="flex flex-col gap-6">
	<!-- Provenance pill -->
	<div data-test="provenance" class="flex items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--muted)] px-3 py-2 text-sm text-[var(--muted-foreground)]">
		{#if meta.icon === 'globe'}
			<svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
				<circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
			</svg>
		{:else if meta.icon === 'wand'}
			<svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
				<path d="m15 5 4 4"/><path d="M13 7 8.7 2.7a2.41 2.41 0 0 0-3.4 3.4L9.6 10"/><path d="m9.6 10 2.17 2.17"/><path d="m19 5-1.4 1.4"/><path d="m14 10 1.4-1.4"/><path d="M10 13.9 4.9 19a2.41 2.41 0 0 0 3.4 3.4l5.1-5.1"/>
			</svg>
		{:else}
			<!-- clipboard -->
			<svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
				<rect width="8" height="4" x="8" y="2" rx="1" ry="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/>
			</svg>
		{/if}
		<span class="font-medium text-foreground">{meta.label}</span>
		<span class="text-[var(--muted-foreground)]">&middot;</span>
		<span>{meta.sub}</span>
	</div>

	<!-- Confidence meter (gated on draft.confidence != null) -->
	{#if draft.confidence !== null && draft.confidence != null}
		<div data-test="confidence" class="flex flex-col gap-1.5">
			<div class="flex items-center justify-between text-sm">
				<span class="text-[var(--muted-foreground)]">Parse confidence</span>
				<span class="font-medium" style="color: {confidenceColor(draft.confidence)}">
					{confidenceTone(draft.confidence)}
				</span>
			</div>
			<div class="h-1.5 w-full overflow-hidden rounded-full bg-[var(--muted)]">
				<div
					class="h-full rounded-full transition-all"
					style="width: {draft.confidence}%; background: {confidenceColor(draft.confidence)};"
				></div>
			</div>
		</div>
	{/if}

	<!-- Warnings list (gated on non-empty warnings) -->
	{#if draft.warnings && draft.warnings.length > 0}
		<ul data-test="warnings" class="flex flex-col gap-1.5">
			{#each draft.warnings as warning}
				<li class="flex items-start gap-2 text-sm text-[var(--muted-foreground)]">
					<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="mt-0.5 shrink-0" aria-hidden="true">
						<circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
					</svg>
					{warning}
				</li>
			{/each}
		</ul>
	{/if}

	<!-- Editable form — draft is bindable, edits propagate to parent -->
	<RecipeForm bind:draft />

	<!-- Sticky footer -->
	<div class="flex flex-col gap-2 border-t border-[var(--border)] pt-4">
		{#if !valid}
			<p class="text-sm text-[var(--muted-foreground)]">
				Needs a title, at least one ingredient, and one step.
			</p>
		{/if}
		<div class="flex gap-2">
			<button
				data-test="back"
				type="button"
				class="btn btn-secondary"
				onclick={() => onBack()}
			>
				{backLabel}
			</button>
			<button
				data-test="save"
				type="button"
				class="btn btn-primary"
				disabled={!valid}
				onclick={() => onSave(draft)}
			>
				Save to library
			</button>
		</div>
	</div>
</div>
