import { describe, it, expect } from 'vitest';
import { filterAndSortRecipes } from './filter';
import type { Recipe } from '$lib/types/recipe';

const base: Omit<Recipe, 'id' | 'title' | 'totalTime' | 'tags' | 'favorite' | 'createdAt' | 'ingredients'> = {
	servings: 2,
	steps: [],
	notes: '',
	source: { type: 'manual' }
};

const recipes: Recipe[] = [
	{
		...base,
		id: 1,
		title: 'Apple Pie',
		totalTime: 90,
		tags: ['dessert', 'baking'],
		favorite: true,
		createdAt: '2026-01-01T00:00:00Z',
		ingredients: [{ qty: '2', unit: 'cups', item: 'flour' }]
	},
	{
		...base,
		id: 2,
		title: 'Banana Bread',
		totalTime: 60,
		tags: ['breakfast', 'baking'],
		favorite: false,
		createdAt: '2026-02-01T00:00:00Z',
		ingredients: [{ qty: '3', unit: '', item: 'bananas' }]
	},
	{
		...base,
		id: 3,
		title: 'Caesar Salad',
		totalTime: 0,
		tags: ['salad'],
		favorite: false,
		createdAt: '2026-03-01T00:00:00Z',
		ingredients: [{ qty: '1', unit: 'head', item: 'romaine' }]
	},
	{
		...base,
		id: 4,
		title: 'Dark Chocolate Cake',
		totalTime: 120,
		tags: ['dessert'],
		favorite: true,
		createdAt: '2026-04-01T00:00:00Z',
		ingredients: [{ qty: '200', unit: 'g', item: 'dark chocolate' }]
	}
];

describe('filterAndSortRecipes', () => {
	describe('empty query (no filter)', () => {
		it('returns all recipes when query is empty string', () => {
			const result = filterAndSortRecipes(recipes, { query: '', sort: 'recent', favoritesOnly: false });
			expect(result).toHaveLength(4);
		});

		it('returns all recipes when query is whitespace only', () => {
			const result = filterAndSortRecipes(recipes, { query: '   ', sort: 'recent', favoritesOnly: false });
			expect(result).toHaveLength(4);
		});
	});

	describe('search filtering', () => {
		it('matches by title substring (case-insensitive)', () => {
			const result = filterAndSortRecipes(recipes, { query: 'apple', sort: 'recent', favoritesOnly: false });
			expect(result.map(r => r.id)).toContain(1);
			expect(result).toHaveLength(1);
		});

		it('matches by title case-insensitively', () => {
			const result = filterAndSortRecipes(recipes, { query: 'BANANA', sort: 'recent', favoritesOnly: false });
			expect(result.map(r => r.id)).toContain(2);
		});

		it('matches by tag substring', () => {
			const result = filterAndSortRecipes(recipes, { query: 'baking', sort: 'recent', favoritesOnly: false });
			expect(result.map(r => r.id)).toEqual(expect.arrayContaining([1, 2]));
			expect(result).toHaveLength(2);
		});

		it('matches by ingredient item name', () => {
			const result = filterAndSortRecipes(recipes, { query: 'dark chocolate', sort: 'recent', favoritesOnly: false });
			expect(result.map(r => r.id)).toContain(4);
			expect(result).toHaveLength(1);
		});

		it('matches ingredient item case-insensitively', () => {
			const result = filterAndSortRecipes(recipes, { query: 'ROMAINE', sort: 'recent', favoritesOnly: false });
			expect(result.map(r => r.id)).toContain(3);
		});

		it('returns empty array when no recipes match', () => {
			const result = filterAndSortRecipes(recipes, { query: 'zzznomatch', sort: 'recent', favoritesOnly: false });
			expect(result).toHaveLength(0);
		});

		it('trims query before matching', () => {
			const result = filterAndSortRecipes(recipes, { query: '  apple  ', sort: 'recent', favoritesOnly: false });
			expect(result.map(r => r.id)).toContain(1);
		});
	});

	describe('sort: recent', () => {
		it('sorts by createdAt descending (newest first)', () => {
			const result = filterAndSortRecipes(recipes, { query: '', sort: 'recent', favoritesOnly: false });
			const ids = result.map(r => r.id);
			expect(ids).toEqual([4, 3, 2, 1]);
		});
	});

	describe('sort: az', () => {
		it('sorts by title ascending case-insensitively', () => {
			const result = filterAndSortRecipes(recipes, { query: '', sort: 'az', favoritesOnly: false });
			const titles = result.map(r => r.title);
			expect(titles).toEqual(['Apple Pie', 'Banana Bread', 'Caesar Salad', 'Dark Chocolate Cake']);
		});
	});

	describe('sort: quickest', () => {
		it('sorts by totalTime ascending', () => {
			const result = filterAndSortRecipes(recipes, { query: '', sort: 'quickest', favoritesOnly: false });
			const ids = result.map(r => r.id);
			// Caesar Salad has totalTime 0 (missing) — sorts last
			// Banana Bread (60) < Apple Pie (90) < Dark Chocolate Cake (120) < Caesar Salad (0/missing)
			expect(ids[0]).toBe(2); // 60 min
			expect(ids[1]).toBe(1); // 90 min
			expect(ids[2]).toBe(4); // 120 min
			expect(ids[3]).toBe(3); // 0/missing — last
		});

		it('places recipes with no totalTime (0) last', () => {
			const result = filterAndSortRecipes(recipes, { query: '', sort: 'quickest', favoritesOnly: false });
			expect(result[result.length - 1].id).toBe(3);
		});
	});

	describe('favoritesOnly', () => {
		it('returns only favorited recipes when enabled', () => {
			const result = filterAndSortRecipes(recipes, { query: '', sort: 'recent', favoritesOnly: true });
			expect(result.every(r => r.favorite)).toBe(true);
			expect(result).toHaveLength(2);
		});

		it('returns all recipes when disabled', () => {
			const result = filterAndSortRecipes(recipes, { query: '', sort: 'recent', favoritesOnly: false });
			expect(result).toHaveLength(4);
		});
	});

	describe('composition', () => {
		it('applies favoritesOnly and query together', () => {
			// Only favorited recipes matching 'dessert' tag
			const result = filterAndSortRecipes(recipes, { query: 'dessert', sort: 'recent', favoritesOnly: true });
			expect(result.every(r => r.favorite)).toBe(true);
			expect(result.map(r => r.id)).toEqual(expect.arrayContaining([1, 4]));
		});

		it('applies search and sort together', () => {
			// baking tag matches ids 1 and 2; sorted az → Banana Bread before Apple Pie
			const result = filterAndSortRecipes(recipes, { query: 'baking', sort: 'az', favoritesOnly: false });
			expect(result.map(r => r.title)).toEqual(['Apple Pie', 'Banana Bread']);
		});

		it('applies all three: favoritesOnly + query + sort', () => {
			// favoritesOnly → [Apple Pie (1), Dark Choc (4)]; query 'dessert' → both match; sort az → Apple Pie, Dark Choc
			const result = filterAndSortRecipes(recipes, { query: 'dessert', sort: 'az', favoritesOnly: true });
			expect(result.map(r => r.title)).toEqual(['Apple Pie', 'Dark Chocolate Cake']);
		});

		it('returns empty when composition matches nothing', () => {
			const result = filterAndSortRecipes(recipes, { query: 'breakfast', sort: 'recent', favoritesOnly: true });
			expect(result).toHaveLength(0);
		});
	});
});
