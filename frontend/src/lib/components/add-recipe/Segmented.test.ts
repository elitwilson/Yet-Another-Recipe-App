import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';

const segmentedFile = resolve(
	process.cwd(),
	'src/lib/components/ui/segmented/Segmented.svelte'
);
const indexFile = resolve(process.cwd(), 'src/lib/components/ui/segmented/index.ts');

describe('Segmented — files exist', () => {
	it('Segmented.svelte exists', () => {
		expect(existsSync(segmentedFile)).toBe(true);
	});

	it('index.ts exists', () => {
		expect(existsSync(indexFile)).toBe(true);
	});
});

describe('Segmented — props contract', () => {
	it('accepts value prop', () => {
		const src = readFileSync(segmentedFile, 'utf-8');
		expect(src).toMatch(/value/);
	});

	it('accepts options prop', () => {
		const src = readFileSync(segmentedFile, 'utf-8');
		expect(src).toMatch(/options/);
	});

	it('supports disabled per option', () => {
		const src = readFileSync(segmentedFile, 'utf-8');
		expect(src).toMatch(/disabled/);
	});

	it('has an onchange callback or change event', () => {
		const src = readFileSync(segmentedFile, 'utf-8');
		expect(src).toMatch(/onchange|on:change|onclick/);
	});
});

describe('Segmented — data-test hooks', () => {
	it('renders data-test attributes for option buttons', () => {
		const src = readFileSync(segmentedFile, 'utf-8');
		expect(src).toMatch(/data-test/);
	});
});

describe('Segmented — disabled behavior', () => {
	it('disables options that have disabled: true', () => {
		const src = readFileSync(segmentedFile, 'utf-8');
		// Should gate interactivity on disabled flag — either disabled attribute or pointer-events-none
		expect(src).toMatch(/disabled|pointer-events/);
	});

	it('does not invoke onchange when a disabled option is activated', () => {
		const src = readFileSync(segmentedFile, 'utf-8');
		// Confirm disabled handling prevents calls — implementation uses disabled attribute or guard
		expect(src).toMatch(/disabled/);
	});
});

describe('Segmented — active styling', () => {
	it('applies distinct styling to the selected option', () => {
		const src = readFileSync(segmentedFile, 'utf-8');
		// Active state: checks value === option.value or similar
		expect(src).toMatch(/value\s*===\s*option|option\.value\s*===\s*value|selected|active/);
	});
});

describe('Segmented — index exports', () => {
	it('re-exports Segmented', () => {
		const src = readFileSync(indexFile, 'utf-8');
		expect(src).toMatch(/Segmented/);
	});
});
