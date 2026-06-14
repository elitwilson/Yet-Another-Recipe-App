import { describe, it, expect } from 'vitest';
import { countLines, pasteSource, draftFromParse } from './add-recipe-logic';
import type { ParsedRecipeDraft } from '$lib/parser';

describe('countLines', () => {
	it('returns 0 for empty string', () => {
		expect(countLines('')).toBe(0);
	});

	it('returns 0 for whitespace-only string', () => {
		expect(countLines('   \n   \n  ')).toBe(0);
	});

	it('counts non-blank lines', () => {
		expect(countLines('line one\nline two\nline three')).toBe(3);
	});

	it('ignores blank lines between content', () => {
		expect(countLines('line one\n\nline two\n\nline three')).toBe(3);
	});

	it('handles trailing newlines', () => {
		expect(countLines('line one\nline two\n')).toBe(2);
	});

	it('counts a single non-blank line', () => {
		expect(countLines('just one line')).toBe(1);
	});
});

describe('pasteSource', () => {
	it('returns a source with type paste', () => {
		expect(pasteSource().type).toBe('paste');
	});

	it('returns the correct method string', () => {
		expect(pasteSource().method).toBe('parsed from pasted text');
	});

	it('returns a new object each call', () => {
		expect(pasteSource()).not.toBe(pasteSource());
	});
});

describe('draftFromParse', () => {
	const minParsed: ParsedRecipeDraft = {
		title: 'Test Recipe',
		servings: 2,
		totalTime: 30,
		ingredients: [{ qty: '1', unit: 'cup', item: 'flour' }],
		steps: ['Mix ingredients'],
		notes: [],
		warnings: [],
		confidence: 85,
	};

	it('carries all fields from the parsed result', () => {
		const draft = draftFromParse(minParsed);
		expect(draft.title).toBe('Test Recipe');
		expect(draft.servings).toBe(2);
		expect(draft.totalTime).toBe(30);
		expect(draft.ingredients).toEqual(minParsed.ingredients);
		expect(draft.steps).toEqual(minParsed.steps);
		expect(draft.notes).toEqual(minParsed.notes);
		expect(draft.warnings).toEqual(minParsed.warnings);
		expect(draft.confidence).toBe(85);
	});

	it('stamps source type paste', () => {
		const draft = draftFromParse(minParsed);
		expect(draft.source.type).toBe('paste');
	});

	it('stamps the paste method string', () => {
		const draft = draftFromParse(minParsed);
		expect(draft.source.method).toBe('parsed from pasted text');
	});

	it('includes favorite: false by default', () => {
		const draft = draftFromParse(minParsed);
		expect(draft.favorite).toBe(false);
	});

	it('includes empty tags array by default', () => {
		const draft = draftFromParse(minParsed);
		expect(draft.tags).toEqual([]);
	});
});
