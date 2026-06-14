<script lang="ts">
	import { parseRecipeText } from '$lib/parser';
	import type { ParsedDraft } from '$lib/types/recipe';
	import { Segmented } from '$lib/components/ui/segmented';
	import { draftFromParse } from './add-recipe-logic';
	import PasteMethod from './PasteMethod.svelte';
	import ParseProgress from './ParseProgress.svelte';
	import ReviewPanel from '$lib/components/review/ReviewPanel.svelte';

	interface Props {
		onSave: (draft: ParsedDraft) => void;
	}

	let { onSave }: Props = $props();

	type Method = 'link' | 'paste' | 'hand';
	type Stage = 'input' | 'parsing' | 'review';

	let method = $state<Method>('paste');
	let stage = $state<Stage>('input');
	let reviewDraft = $state<ParsedDraft | null>(null);
	let pendingText = $state('');

	const PASTE_STEPS = [
		'Reading the text…',
		'Detecting sections (ingredients vs steps)…',
		'Parsing quantities & units…',
		'Flagging anything unclear…',
	];

	const tabOptions = [
		{ value: 'link', label: 'From a link', disabled: true },
		{ value: 'paste', label: 'Paste text', disabled: false },
		{ value: 'hand', label: 'By hand', disabled: true },
	];

	function handleParseRequest(text: string) {
		pendingText = text;
		stage = 'parsing';
	}

	function handleParseDone() {
		const parsed = parseRecipeText(pendingText);
		reviewDraft = draftFromParse(parsed);
		stage = 'review';
	}

	function handleBack() {
		reviewDraft = null;
		stage = 'input';
	}

	function handleSave(draft: ParsedDraft) {
		onSave(draft);
	}
</script>

<div class="flex flex-col gap-6">
	<Segmented
		value={method}
		options={tabOptions}
		onchange={(v) => { method = v as Method; }}
	/>

	{#if stage === 'input' && method === 'paste'}
		<PasteMethod onparse={handleParseRequest} />
	{:else if stage === 'parsing'}
		<ParseProgress steps={PASTE_STEPS} onDone={handleParseDone} />
	{:else if stage === 'review' && reviewDraft !== null}
		<ReviewPanel
			bind:draft={reviewDraft}
			onBack={handleBack}
			onSave={handleSave}
			backLabel="Start over"
		/>
	{/if}
</div>
