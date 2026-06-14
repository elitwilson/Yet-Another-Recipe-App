import { describe, it, expect } from 'vitest';
import { sourceMeta } from './source-meta';
import type { RecipeSource } from '$lib/types/recipe';

describe('sourceMeta — url source', () => {
	it('returns globe icon for url type', () => {
		const source: RecipeSource = { type: 'url', host: 'example.com' };
		expect(sourceMeta(source).icon).toBe('globe');
	});

	it('uses host as label for url type', () => {
		const source: RecipeSource = { type: 'url', host: 'example.com' };
		expect(sourceMeta(source).label).toBe('example.com');
	});

	it('falls back label when host is absent', () => {
		const source: RecipeSource = { type: 'url' };
		expect(typeof sourceMeta(source).label).toBe('string');
		expect(sourceMeta(source).label.length).toBeGreaterThan(0);
	});

	it('uses method as sub for url type when present', () => {
		const source: RecipeSource = { type: 'url', host: 'example.com', method: 'scraped' };
		expect(sourceMeta(source).sub).toBe('scraped');
	});

	it('falls back sub when method is absent', () => {
		const source: RecipeSource = { type: 'url', host: 'example.com' };
		expect(sourceMeta(source).sub).toBe('imported from URL');
	});
});

describe('sourceMeta — paste source', () => {
	it('returns clipboard icon for paste type', () => {
		const source: RecipeSource = { type: 'paste' };
		expect(sourceMeta(source).icon).toBe('clipboard');
	});

	it('returns "Pasted text" as label', () => {
		const source: RecipeSource = { type: 'paste' };
		expect(sourceMeta(source).label).toBe('Pasted text');
	});

	it('uses method as sub when present', () => {
		const source: RecipeSource = { type: 'paste', method: 'parsed from text' };
		expect(sourceMeta(source).sub).toBe('parsed from text');
	});

	it('falls back sub when method is absent', () => {
		const source: RecipeSource = { type: 'paste' };
		expect(sourceMeta(source).sub).toBe('parsed from text');
	});
});

describe('sourceMeta — manual source', () => {
	it('returns wand icon for manual type', () => {
		const source: RecipeSource = { type: 'manual' };
		expect(sourceMeta(source).icon).toBe('wand');
	});

	it('returns "Freeform entry" as label', () => {
		const source: RecipeSource = { type: 'manual' };
		expect(sourceMeta(source).label).toBe('Freeform entry');
	});

	it('uses method as sub when present', () => {
		const source: RecipeSource = { type: 'manual', method: 'parsed as you type' };
		expect(sourceMeta(source).sub).toBe('parsed as you type');
	});

	it('falls back sub when method is absent', () => {
		const source: RecipeSource = { type: 'manual' };
		expect(sourceMeta(source).sub).toBe('parsed as you type');
	});
});

describe('sourceMeta — unknown source type', () => {
	it('falls back to paste mapping for unknown type', () => {
		// Cast to bypass type system for testing the fallback
		const source = { type: 'unknown' } as unknown as RecipeSource;
		expect(sourceMeta(source).icon).toBe('clipboard');
		expect(sourceMeta(source).label).toBe('Pasted text');
		expect(sourceMeta(source).sub).toBe('parsed from text');
	});
});
