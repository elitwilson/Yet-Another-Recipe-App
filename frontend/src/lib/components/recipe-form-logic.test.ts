import { describe, it, expect } from 'vitest';
import {
	isRecipeValid,
	reorder,
	normalizeTag,
	addTag,
	removeTag,
	addIngredient,
	removeAt,
	updateAt,
	addStep,
} from './recipe-form-logic';
import type { EditableRecipe, EditableIngredient } from '$lib/types/recipe';

const blankDraft = (): EditableRecipe => ({
	title: '',
	servings: 0,
	totalTime: 0,
	tags: [],
	favorite: false,
	ingredients: [],
	steps: [],
	notes: [],
	source: { type: 'manual' },
});

describe('isRecipeValid', () => {
	it('returns false when title is empty', () => {
		const draft = blankDraft();
		draft.ingredients = [{ qty: '', unit: '', item: 'salt' }];
		draft.steps = ['Boil water'];
		expect(isRecipeValid(draft)).toBe(false);
	});

	it('returns false when title is only whitespace', () => {
		const draft = blankDraft();
		draft.title = '   ';
		draft.ingredients = [{ qty: '', unit: '', item: 'salt' }];
		draft.steps = ['Boil water'];
		expect(isRecipeValid(draft)).toBe(false);
	});

	it('returns false when no ingredient has a non-empty item', () => {
		const draft = blankDraft();
		draft.title = 'Soup';
		draft.ingredients = [{ qty: '1', unit: 'cup', item: '' }];
		draft.steps = ['Boil water'];
		expect(isRecipeValid(draft)).toBe(false);
	});

	it('returns false when ingredients array is empty', () => {
		const draft = blankDraft();
		draft.title = 'Soup';
		draft.ingredients = [];
		draft.steps = ['Boil water'];
		expect(isRecipeValid(draft)).toBe(false);
	});

	it('returns false when no step is non-empty', () => {
		const draft = blankDraft();
		draft.title = 'Soup';
		draft.ingredients = [{ qty: '', unit: '', item: 'salt' }];
		draft.steps = [''];
		expect(isRecipeValid(draft)).toBe(false);
	});

	it('returns false when steps array is empty', () => {
		const draft = blankDraft();
		draft.title = 'Soup';
		draft.ingredients = [{ qty: '', unit: '', item: 'salt' }];
		draft.steps = [];
		expect(isRecipeValid(draft)).toBe(false);
	});

	it('returns true when title, ingredient item, and step are all present', () => {
		const draft = blankDraft();
		draft.title = 'Soup';
		draft.ingredients = [{ qty: '', unit: '', item: 'salt' }];
		draft.steps = ['Boil water'];
		expect(isRecipeValid(draft)).toBe(true);
	});

	it('returns true when one of many ingredients has a non-empty item', () => {
		const draft = blankDraft();
		draft.title = 'Soup';
		draft.ingredients = [
			{ qty: '', unit: '', item: '' },
			{ qty: '1', unit: 'cup', item: 'water' },
		];
		draft.steps = ['Boil water'];
		expect(isRecipeValid(draft)).toBe(true);
	});
});

describe('reorder', () => {
	it('moves an item down', () => {
		expect(reorder(['a', 'b', 'c'], 0, 2)).toEqual(['b', 'c', 'a']);
	});

	it('moves an item up', () => {
		expect(reorder(['a', 'b', 'c'], 2, 0)).toEqual(['c', 'a', 'b']);
	});

	it('returns the same array content when from === to', () => {
		expect(reorder(['a', 'b', 'c'], 1, 1)).toEqual(['a', 'b', 'c']);
	});

	it('returns unchanged array when source index is out of range', () => {
		expect(reorder(['a', 'b'], 5, 0)).toEqual(['a', 'b']);
	});

	it('returns unchanged array when source index is null/undefined (negative guard)', () => {
		expect(reorder(['a', 'b'], -1, 0)).toEqual(['a', 'b']);
	});
});

describe('normalizeTag', () => {
	it('trims whitespace', () => {
		expect(normalizeTag('  hello  ')).toBe('hello');
	});

	it('lowercases', () => {
		expect(normalizeTag('PASTA')).toBe('pasta');
	});

	it('strips leading #', () => {
		expect(normalizeTag('#vegan')).toBe('vegan');
	});

	it('handles combined whitespace, case, and hash', () => {
		expect(normalizeTag('  #Vegetarian  ')).toBe('vegetarian');
	});
});

describe('addTag', () => {
	it('adds a normalized tag', () => {
		expect(addTag(['pasta'], '#Vegan ')).toEqual(['pasta', 'vegan']);
	});

	it('ignores empty string after normalization', () => {
		expect(addTag(['pasta'], '  ')).toEqual(['pasta']);
	});

	it('ignores a tag that already exists after normalization', () => {
		expect(addTag(['vegan'], '#vegan')).toEqual(['vegan']);
	});

	it('ignores a duplicate regardless of input casing', () => {
		expect(addTag(['vegan'], 'VEGAN')).toEqual(['vegan']);
	});
});

describe('removeTag', () => {
	it('removes the specified tag', () => {
		expect(removeTag(['pasta', 'vegan'], 'vegan')).toEqual(['pasta']);
	});

	it('returns unchanged array when tag is not present', () => {
		expect(removeTag(['pasta'], 'vegan')).toEqual(['pasta']);
	});
});

describe('addIngredient', () => {
	it('appends a blank ingredient row', () => {
		const rows: EditableIngredient[] = [{ qty: '1', unit: 'cup', item: 'water' }];
		const result = addIngredient(rows);
		expect(result).toHaveLength(2);
		expect(result[1]).toEqual({ qty: '', unit: '', item: '' });
	});

	it('does not mutate the original array', () => {
		const rows: EditableIngredient[] = [];
		const result = addIngredient(rows);
		expect(rows).toHaveLength(0);
		expect(result).toHaveLength(1);
	});
});

describe('addStep', () => {
	it('appends a blank step', () => {
		const steps = ['Boil water'];
		const result = addStep(steps);
		expect(result).toHaveLength(2);
		expect(result[1]).toBe('');
	});

	it('does not mutate the original array', () => {
		const steps: string[] = [];
		const result = addStep(steps);
		expect(steps).toHaveLength(0);
		expect(result).toHaveLength(1);
	});
});

describe('removeAt', () => {
	it('removes the item at the given index', () => {
		expect(removeAt(['a', 'b', 'c'], 1)).toEqual(['a', 'c']);
	});

	it('does not mutate the original array', () => {
		const arr = ['a', 'b'];
		removeAt(arr, 0);
		expect(arr).toHaveLength(2);
	});
});

describe('updateAt', () => {
	it('merges a patch into the item at the given index', () => {
		const rows: EditableIngredient[] = [{ qty: '1', unit: 'cup', item: 'water' }];
		expect(updateAt(rows, 0, { qty: '2' })).toEqual([{ qty: '2', unit: 'cup', item: 'water' }]);
	});

	it('clears lowConf when qty is updated', () => {
		const rows: EditableIngredient[] = [{ qty: '1', unit: 'cup', item: 'salt', lowConf: true }];
		expect(updateAt(rows, 0, { qty: '2', lowConf: false })[0].lowConf).toBe(false);
	});

	it('preserves lowConf when only unit is updated', () => {
		const rows: EditableIngredient[] = [{ qty: '1', unit: 'cup', item: 'salt', lowConf: true }];
		expect(updateAt(rows, 0, { unit: 'tbsp' })[0].lowConf).toBe(true);
	});

	it('does not mutate the original array', () => {
		const rows: EditableIngredient[] = [{ qty: '1', unit: 'cup', item: 'water' }];
		updateAt(rows, 0, { qty: '99' });
		expect(rows[0].qty).toBe('1');
	});
});
