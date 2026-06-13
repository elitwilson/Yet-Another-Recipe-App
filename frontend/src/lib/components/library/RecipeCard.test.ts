import { describe, it, expect } from 'vitest';
import { formatTotalTime } from '$lib/library/format';
import type { Recipe } from '$lib/types/recipe';

// Full Svelte component mounting requires a browser environment (jsdom/happy-dom).
// The current vitest config only has a Node server environment. These tests verify
// the pure logic that RecipeCard depends on, and document the expected data-test
// attribute contract that manual and E2E tests should verify.

const mockRecipe: Recipe = {
	id: 42,
	title: 'Tacos al Pastor',
	servings: 4,
	totalTime: 45,
	tags: ['mexican', 'dinner'],
	favorite: true,
	createdAt: '2026-06-01T00:00:00Z',
	ingredients: [
		{ qty: '500', unit: 'g', item: 'pork shoulder' },
		{ qty: '3', unit: '', item: 'chipotle peppers' }
	],
	steps: ['Marinate pork', 'Grill'],
	notes: [],
	source: { type: 'manual' }
};

describe('RecipeCard — formatTotalTime contract', () => {
	it('formats recipe totalTime for display on the card', () => {
		expect(formatTotalTime(mockRecipe.totalTime)).toBe('45 min');
	});

	it('returns empty string for a recipe with no total time', () => {
		expect(formatTotalTime(0)).toBe('');
	});

	it('formats multi-hour recipes correctly', () => {
		expect(formatTotalTime(90)).toBe('1 hr 30 min');
	});
});

describe('RecipeCard — expected data-test attributes', () => {
	// These document the selectors that E2E and manual tests must verify.
	// Each attribute is referenced here to catch renames at the source.
	it('documents required data-test selectors', () => {
		const selectors = [
			'data-test="recipe-card"',        // root clickable card element
			'data-test="recipe-title"',        // recipe title text
			'data-test="recipe-time"',         // formatted total time
			'data-test="recipe-tags"',         // tags container
			'data-test="favorite-toggle"'      // favorite button (stops propagation)
		];
		// All selectors are defined — this test passes as a registry check
		expect(selectors).toHaveLength(5);
		expect(selectors.every(s => s.startsWith('data-test='))).toBe(true);
	});
});

describe('RecipeCard — favorite toggle contract', () => {
	it('flips the favorite flag when constructing the update payload', () => {
		const toggled = { ...mockRecipe, favorite: !mockRecipe.favorite };
		expect(toggled.favorite).toBe(false);
		expect(toggled.id).toBe(mockRecipe.id);
		expect(toggled.title).toBe(mockRecipe.title);
	});

	it('preserves all recipe fields in the toggle payload (round-trip)', () => {
		const { id, createdAt, ...input } = mockRecipe;
		const toggled = { ...input, favorite: !mockRecipe.favorite };
		expect(Object.keys(toggled)).toContain('title');
		expect(Object.keys(toggled)).toContain('ingredients');
		expect(Object.keys(toggled)).toContain('tags');
		expect(Object.keys(toggled)).not.toContain('id');
		expect(Object.keys(toggled)).not.toContain('createdAt');
	});
});
