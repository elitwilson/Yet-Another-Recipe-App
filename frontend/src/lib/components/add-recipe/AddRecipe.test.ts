import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';

const addRecipeFile = resolve(
	process.cwd(),
	'src/lib/components/add-recipe/AddRecipe.svelte'
);

describe('AddRecipe — file exists', () => {
	it('AddRecipe.svelte exists', () => {
		expect(existsSync(addRecipeFile)).toBe(true);
	});
});

describe('AddRecipe — props contract', () => {
	it('accepts an onSave callback prop', () => {
		const src = readFileSync(addRecipeFile, 'utf-8');
		expect(src).toMatch(/onSave/);
	});
});

describe('AddRecipe — Segmented tab shell', () => {
	it('imports and uses Segmented component', () => {
		const src = readFileSync(addRecipeFile, 'utf-8');
		expect(src).toMatch(/Segmented/);
	});

	it('defines three tab options (link, paste, hand)', () => {
		const src = readFileSync(addRecipeFile, 'utf-8');
		expect(src).toMatch(/link|url/i);
		expect(src).toMatch(/paste/i);
		expect(src).toMatch(/hand|manual/i);
	});

	it('defaults method state to paste', () => {
		const src = readFileSync(addRecipeFile, 'utf-8');
		expect(src).toMatch(/paste/);
		expect(src).toMatch(/\$state/);
	});

	it('the link and hand tabs are disabled', () => {
		const src = readFileSync(addRecipeFile, 'utf-8');
		expect(src).toMatch(/disabled.*true|disabled:\s*true/);
	});
});

describe('AddRecipe — stage machine', () => {
	it('defines input/parsing/review stages', () => {
		const src = readFileSync(addRecipeFile, 'utf-8');
		expect(src).toMatch(/input/);
		expect(src).toMatch(/parsing/);
		expect(src).toMatch(/review/);
	});

	it('uses $state for stage tracking', () => {
		const src = readFileSync(addRecipeFile, 'utf-8');
		expect(src).toMatch(/stage.*\$state|\$state.*stage/);
	});
});

describe('AddRecipe — PasteMethod wiring', () => {
	it('imports PasteMethod', () => {
		const src = readFileSync(addRecipeFile, 'utf-8');
		expect(src).toMatch(/PasteMethod/);
	});

	it('transitions to parsing stage on parse request', () => {
		const src = readFileSync(addRecipeFile, 'utf-8');
		expect(src).toMatch(/parsing/);
	});
});

describe('AddRecipe — ParseProgress wiring', () => {
	it('imports ParseProgress', () => {
		const src = readFileSync(addRecipeFile, 'utf-8');
		expect(src).toMatch(/ParseProgress/);
	});

	it('passes four paste step labels to ParseProgress', () => {
		const src = readFileSync(addRecipeFile, 'utf-8');
		// Four steps defined in the spec
		expect(src).toMatch(/Reading the text|Detecting sections|Parsing quantities|Flagging/i);
	});

	it('transitions to review on ParseProgress onDone', () => {
		const src = readFileSync(addRecipeFile, 'utf-8');
		expect(src).toMatch(/review/);
		expect(src).toMatch(/parseRecipeText/);
	});
});

describe('AddRecipe — ReviewPanel wiring', () => {
	it('imports ReviewPanel', () => {
		const src = readFileSync(addRecipeFile, 'utf-8');
		expect(src).toMatch(/ReviewPanel/);
	});

	it('passes draft to ReviewPanel', () => {
		const src = readFileSync(addRecipeFile, 'utf-8');
		expect(src).toMatch(/draft/);
	});

	it('passes a back handler that clears draft and returns to input', () => {
		const src = readFileSync(addRecipeFile, 'utf-8');
		expect(src).toMatch(/onBack|onback/);
		expect(src).toMatch(/input/);
	});

	it('passes backLabel or "Start over" to ReviewPanel', () => {
		const src = readFileSync(addRecipeFile, 'utf-8');
		expect(src).toMatch(/[Ss]tart over|backLabel/);
	});

	it('save calls onSave with the draft', () => {
		const src = readFileSync(addRecipeFile, 'utf-8');
		expect(src).toMatch(/onSave.*draft|onSave\(draft\)/);
	});
});

describe('AddRecipe — source stamping', () => {
	it('imports draftFromParse from add-recipe-logic', () => {
		const src = readFileSync(addRecipeFile, 'utf-8');
		expect(src).toMatch(/draftFromParse/);
	});

	it('imports parseRecipeText from the parser', () => {
		const src = readFileSync(addRecipeFile, 'utf-8');
		expect(src).toMatch(/parseRecipeText/);
	});
});
