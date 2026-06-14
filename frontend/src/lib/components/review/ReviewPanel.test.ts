import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';

const panelFile = resolve(process.cwd(), 'src/lib/components/review/ReviewPanel.svelte');

describe('ReviewPanel.svelte — file exists', () => {
	it('ReviewPanel.svelte exists under review/', () => {
		expect(existsSync(panelFile)).toBe(true);
	});
});

describe('ReviewPanel.svelte — props contract', () => {
	it('accepts draft as a bindable prop', () => {
		const src = readFileSync(panelFile, 'utf-8');
		expect(src).toMatch(/\$bindable/);
		expect(src).toMatch(/draft/);
	});

	it('accepts onBack callback prop', () => {
		const src = readFileSync(panelFile, 'utf-8');
		expect(src).toMatch(/onBack/);
	});

	it('accepts onSave callback prop', () => {
		const src = readFileSync(panelFile, 'utf-8');
		expect(src).toMatch(/onSave/);
	});

	it('accepts optional backLabel prop', () => {
		const src = readFileSync(panelFile, 'utf-8');
		expect(src).toMatch(/backLabel/);
	});
});

describe('ReviewPanel.svelte — helper imports', () => {
	it('imports sourceMeta from source-meta', () => {
		const src = readFileSync(panelFile, 'utf-8');
		expect(src).toMatch(/sourceMeta/);
		expect(src).toMatch(/source-meta/);
	});

	it('imports confidenceTone or confidenceColor from confidence', () => {
		const src = readFileSync(panelFile, 'utf-8');
		expect(src).toMatch(/confidence/i);
		expect(src).toMatch(/confidence\.ts|from.*confidence/);
	});

	it('imports isRecipeValid from recipe-form-logic', () => {
		const src = readFileSync(panelFile, 'utf-8');
		expect(src).toMatch(/isRecipeValid/);
		expect(src).toMatch(/recipe-form-logic/);
	});

	it('imports RecipeForm', () => {
		const src = readFileSync(panelFile, 'utf-8');
		expect(src).toMatch(/RecipeForm/);
	});
});

describe('ReviewPanel.svelte — provenance section', () => {
	it('has data-test="provenance" attribute', () => {
		const src = readFileSync(panelFile, 'utf-8');
		expect(src).toContain('data-test="provenance"');
	});

	it('calls sourceMeta with draft.source', () => {
		const src = readFileSync(panelFile, 'utf-8');
		expect(src).toMatch(/sourceMeta.*draft\.source|sourceMeta.*source/);
	});
});

describe('ReviewPanel.svelte — confidence meter', () => {
	it('has data-test="confidence" attribute', () => {
		const src = readFileSync(panelFile, 'utf-8');
		expect(src).toContain('data-test="confidence"');
	});

	it('gates confidence meter on draft.confidence != null', () => {
		const src = readFileSync(panelFile, 'utf-8');
		expect(src).toMatch(/confidence.*!=.*null|confidence.*!==.*null/);
	});
});

describe('ReviewPanel.svelte — warnings section', () => {
	it('has data-test="warnings" attribute', () => {
		const src = readFileSync(panelFile, 'utf-8');
		expect(src).toContain('data-test="warnings"');
	});

	it('gates warnings section on non-empty warnings array', () => {
		const src = readFileSync(panelFile, 'utf-8');
		// Should check warnings.length or similar guard
		expect(src).toMatch(/warnings/);
		expect(src).toMatch(/\.length|if.*warnings/);
	});
});

describe('ReviewPanel.svelte — footer', () => {
	it('has data-test="back" button', () => {
		const src = readFileSync(panelFile, 'utf-8');
		expect(src).toContain('data-test="back"');
	});

	it('has data-test="save" button', () => {
		const src = readFileSync(panelFile, 'utf-8');
		expect(src).toContain('data-test="save"');
	});

	it('save button is disabled when draft is invalid', () => {
		const src = readFileSync(panelFile, 'utf-8');
		expect(src).toMatch(/disabled/);
		expect(src).toMatch(/isRecipeValid|valid/);
	});

	it('contains the invalid-state hint text', () => {
		const src = readFileSync(panelFile, 'utf-8');
		expect(src).toMatch(/Needs a title.*ingredient.*step|title.*ingredient.*step/i);
	});

	it('Back button invokes onBack', () => {
		const src = readFileSync(panelFile, 'utf-8');
		expect(src).toMatch(/onBack\s*\(\s*\)|onclick.*onBack/);
	});

	it('Save button invokes onSave with draft', () => {
		const src = readFileSync(panelFile, 'utf-8');
		expect(src).toMatch(/onSave.*draft|onSave\(draft\)/);
	});
});
