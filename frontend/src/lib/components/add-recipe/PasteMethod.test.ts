import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';

const pasteFile = resolve(
	process.cwd(),
	'src/lib/components/add-recipe/PasteMethod.svelte'
);

describe('PasteMethod — file exists', () => {
	it('PasteMethod.svelte exists', () => {
		expect(existsSync(pasteFile)).toBe(true);
	});
});

describe('PasteMethod — props contract', () => {
	it('accepts an onparse callback prop', () => {
		const src = readFileSync(pasteFile, 'utf-8');
		expect(src).toMatch(/onparse/);
	});
});

describe('PasteMethod — textarea', () => {
	it('has a textarea element', () => {
		const src = readFileSync(pasteFile, 'utf-8');
		expect(src).toMatch(/<textarea/);
	});

	it('binds textarea to local text state', () => {
		const src = readFileSync(pasteFile, 'utf-8');
		expect(src).toMatch(/bind:value.*text|text.*\$state/);
	});
});

describe('PasteMethod — example buttons', () => {
	it('has a Clean example button', () => {
		const src = readFileSync(pasteFile, 'utf-8');
		expect(src).toMatch(/[Cc]lean/);
	});

	it('has a Messy example button', () => {
		const src = readFileSync(pasteFile, 'utf-8');
		expect(src).toMatch(/[Mm]essy/);
	});

	it('imports SAMPLE_PASTE_CLEAN from the parser', () => {
		const src = readFileSync(pasteFile, 'utf-8');
		expect(src).toMatch(/SAMPLE_PASTE_CLEAN/);
	});

	it('imports SAMPLE_PASTE_MESSY from the parser', () => {
		const src = readFileSync(pasteFile, 'utf-8');
		expect(src).toMatch(/SAMPLE_PASTE_MESSY/);
	});
});

describe('PasteMethod — Clear button', () => {
	it('has a Clear button', () => {
		const src = readFileSync(pasteFile, 'utf-8');
		expect(src).toMatch(/[Cc]lear/);
	});

	it('Clear button is only shown when textarea has content', () => {
		const src = readFileSync(pasteFile, 'utf-8');
		// Should conditionally render clear based on text being non-empty
		expect(src).toMatch(/#if.*text|text.*#if/);
	});
});

describe('PasteMethod — line count', () => {
	it('displays a live line count', () => {
		const src = readFileSync(pasteFile, 'utf-8');
		// Should reference countLines or line count
		expect(src).toMatch(/countLines|line/i);
	});
});

describe('PasteMethod — parse button', () => {
	it('has a Parse recipe button', () => {
		const src = readFileSync(pasteFile, 'utf-8');
		expect(src).toMatch(/[Pp]arse/);
	});

	it('Parse button is disabled when text is empty or whitespace', () => {
		const src = readFileSync(pasteFile, 'utf-8');
		expect(src).toMatch(/disabled/);
		// Disabled is gated on empty/whitespace text
		expect(src).toMatch(/trim\(\)|\.trim/);
	});

	it('Parse button calls onparse with current text on click', () => {
		const src = readFileSync(pasteFile, 'utf-8');
		expect(src).toMatch(/onparse.*text|onparse\(text\)|onparse\s*\(\s*text/);
	});
});

describe('PasteMethod — data-test hooks', () => {
	it('has data-test="parse-btn" on the parse button', () => {
		const src = readFileSync(pasteFile, 'utf-8');
		expect(src).toMatch(/data-test="parse-btn"|data-test='parse-btn'/);
	});

	it('has data-test="clear-btn" or similar on clear button', () => {
		const src = readFileSync(pasteFile, 'utf-8');
		expect(src).toMatch(/data-test="clear|data-test='clear/);
	});
});
