import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { countLines, pasteSource, draftFromParse, scheduleSteps } from './add-recipe-logic';
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

describe('scheduleSteps', () => {
	beforeEach(() => {
		vi.useFakeTimers();
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	it('calls onStep for each step index in order', () => {
		const onStep = vi.fn();
		const onDone = vi.fn();
		scheduleSteps(3, 100, 50, onStep, onDone);

		vi.advanceTimersByTime(0);
		expect(onStep).toHaveBeenCalledWith(0);

		vi.advanceTimersByTime(100);
		expect(onStep).toHaveBeenCalledWith(1);

		vi.advanceTimersByTime(100);
		expect(onStep).toHaveBeenCalledWith(2);

		expect(onStep).toHaveBeenCalledTimes(3);
	});

	it('calls onDone after the final step plus finalDelay', () => {
		const onDone = vi.fn();
		scheduleSteps(3, 100, 50, vi.fn(), onDone);

		// Advance through all step timers (0ms, 100ms, 200ms) plus finalDelay (50ms)
		vi.advanceTimersByTime(250);
		expect(onDone).toHaveBeenCalledTimes(1);
	});

	it('does not call onDone before the last step fires', () => {
		const onDone = vi.fn();
		scheduleSteps(3, 100, 50, vi.fn(), onDone);

		// Only advance through first two steps — last step at 200ms not yet fired
		vi.advanceTimersByTime(199);
		expect(onDone).not.toHaveBeenCalled();
	});

	it('cleanup cancels pending timers so onDone never fires', () => {
		const onDone = vi.fn();
		const cleanup = scheduleSteps(3, 100, 50, vi.fn(), onDone);

		// Cancel before last step fires
		cleanup();
		vi.advanceTimersByTime(1000);
		expect(onDone).not.toHaveBeenCalled();
	});

	it('returns a no-op for 0 steps without throwing', () => {
		const onDone = vi.fn();
		const cleanup = scheduleSteps(0, 100, 50, vi.fn(), onDone);
		vi.advanceTimersByTime(1000);
		expect(onDone).not.toHaveBeenCalled();
		expect(() => cleanup()).not.toThrow();
	});
});
