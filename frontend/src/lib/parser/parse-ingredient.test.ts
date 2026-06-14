import { describe, it, expect } from 'vitest';
import { parseIngredient } from './parse-ingredient';

describe('parseIngredient', () => {
	describe('quantity parsing', () => {
		it('parses an integer quantity', () => {
			const result = parseIngredient('3 cloves garlic');
			expect(result.qty).toBe('3');
			expect(result.unit).toBe('cloves');
			expect(result.item).toBe('garlic');
		});

		it('parses a decimal quantity', () => {
			const result = parseIngredient('2.5 cups flour');
			expect(result.qty).toBe('2.5');
			expect(result.unit).toBe('cups');
			expect(result.item).toBe('flour');
		});

		it('parses a unicode fraction (½)', () => {
			const result = parseIngredient('½ tsp salt');
			expect(result.qty).toBe('½');
			expect(result.unit).toBe('tsp');
		});

		it('parses an ascii fraction (1/2)', () => {
			const result = parseIngredient('1/2 tsp chili flakes');
			expect(result.qty).toBe('1/2');
			expect(result.unit).toBe('tsp');
			expect(result.item).toBe('chili flakes');
		});

		it('parses a range (35-40) and keeps the full range string', () => {
			const result = parseIngredient('35-40 min roasting time');
			expect(result.qty).toBe('35-40');
		});

		it('parses a mixed number + ascii fraction (1 1/2)', () => {
			const result = parseIngredient('1 1/2 cups milk');
			expect(result.qty).toBe('1 1/2');
			expect(result.unit).toBe('cups');
			expect(result.item).toBe('milk');
		});
	});

	describe('unit dictionary', () => {
		it('recognises a known unit', () => {
			const result = parseIngredient('400 g spaghetti');
			expect(result.unit).toBe('g');
			expect(result.item).toBe('spaghetti');
		});

		it('recognises a unit with a trailing period', () => {
			const result = parseIngredient('2 tbsp. olive oil');
			expect(result.unit).toBe('tbsp');
			expect(result.item).toBe('olive oil');
		});

		it('leaves unit empty when no known unit follows the quantity', () => {
			const result = parseIngredient('2 eggs');
			expect(result.qty).toBe('2');
			expect(result.unit).toBe('');
			expect(result.item).toBe('eggs');
		});
	});

	describe('bullet and numbering stripping', () => {
		it('strips a leading dash bullet', () => {
			const result = parseIngredient('- 400 g spaghetti');
			expect(result.qty).toBe('400');
			expect(result.item).toBe('spaghetti');
		});

		it('strips a leading asterisk bullet', () => {
			const result = parseIngredient('* 2 cups flour');
			expect(result.qty).toBe('2');
			expect(result.item).toBe('flour');
		});

		it('strips a unicode bullet (•)', () => {
			const result = parseIngredient('• 1 tsp paprika');
			expect(result.qty).toBe('1');
			expect(result.item).toBe('paprika');
		});

		it('strips a numbered list prefix (1.)', () => {
			const result = parseIngredient('1. 200 g butter');
			expect(result.qty).toBe('200');
			expect(result.item).toBe('butter');
		});

		it('strips a Step N: prefix', () => {
			const result = parseIngredient('Step 2: 3 cloves garlic');
			expect(result.qty).toBe('3');
			expect(result.item).toBe('garlic');
		});
	});

	describe('"of" prefix trimming', () => {
		it('strips a leading "of" from the item', () => {
			const result = parseIngredient('1 cup of milk');
			expect(result.item).toBe('milk');
		});
	});

	describe('lowConf flag', () => {
		it('sets lowConf false when quantity is present', () => {
			const result = parseIngredient('2 tbsp olive oil');
			expect(result.lowConf).toBe(false);
		});

		it('sets lowConf false for salt (known seasoning, no quantity)', () => {
			const result = parseIngredient('salt');
			expect(result.lowConf).toBe(false);
		});

		it('sets lowConf false for "to taste" lines', () => {
			const result = parseIngredient('salt and pepper to taste');
			expect(result.lowConf).toBe(false);
		});

		it('sets lowConf true for an unquantified unknown ingredient', () => {
			const result = parseIngredient('red onion');
			expect(result.lowConf).toBe(true);
		});
	});

	describe('spec example', () => {
		it('parses "1/2 tsp chili flakes" correctly', () => {
			const result = parseIngredient('1/2 tsp chili flakes');
			expect(result).toEqual({ qty: '1/2', unit: 'tsp', item: 'chili flakes', lowConf: false });
		});
	});

	describe('edge cases', () => {
		it('handles an empty string without throwing', () => {
			expect(() => parseIngredient('')).not.toThrow();
			const result = parseIngredient('');
			expect(result.qty).toBe('');
			expect(result.unit).toBe('');
		});
	});
});
