import { describe, it, expect } from 'vitest';
import { parseRecipeText } from './parse-recipe-text';
import { SAMPLE_PASTE_CLEAN, SAMPLE_PASTE_MESSY } from './fixtures';

describe('parseRecipeText', () => {
	describe('Case A — clean fixture (header-driven)', () => {
		it('extracts the title', () => {
			const draft = parseRecipeText(SAMPLE_PASTE_CLEAN);
			expect(draft.title).toBe('Garlic Butter Weeknight Pasta');
		});

		it('extracts exactly 8 ingredients', () => {
			const draft = parseRecipeText(SAMPLE_PASTE_CLEAN);
			expect(draft.ingredients).toHaveLength(8);
		});

		it('extracts exactly 4 steps', () => {
			const draft = parseRecipeText(SAMPLE_PASTE_CLEAN);
			expect(draft.steps).toHaveLength(4);
		});

		it('has no warnings', () => {
			const draft = parseRecipeText(SAMPLE_PASTE_CLEAN);
			expect(draft.warnings).toHaveLength(0);
		});

		it('has a high confidence (>= 80)', () => {
			const draft = parseRecipeText(SAMPLE_PASTE_CLEAN);
			expect(draft.confidence).toBeGreaterThanOrEqual(80);
		});

		it('parses "400 g spaghetti" correctly', () => {
			const draft = parseRecipeText(SAMPLE_PASTE_CLEAN);
			const spaghetti = draft.ingredients[0];
			expect(spaghetti.qty).toBe('400');
			expect(spaghetti.unit).toBe('g');
			expect(spaghetti.item).toBe('spaghetti');
		});

		it('extracts servings = 4', () => {
			const draft = parseRecipeText(SAMPLE_PASTE_CLEAN);
			expect(draft.servings).toBe(4);
		});

		it('extracts totalTime = 25', () => {
			const draft = parseRecipeText(SAMPLE_PASTE_CLEAN);
			expect(draft.totalTime).toBe(25);
		});
	});

	describe('Case B — messy fixture (heuristic fallback)', () => {
		it('emits a "split was guessed" warning', () => {
			const draft = parseRecipeText(SAMPLE_PASTE_MESSY);
			expect(draft.warnings.some((w) => /split was guessed/i.test(w))).toBe(true);
		});

		it('has an empty title (and a missing-title warning)', () => {
			const draft = parseRecipeText(SAMPLE_PASTE_MESSY);
			expect(draft.title).toBe('');
			expect(draft.warnings.some((w) => /no title/i.test(w))).toBe(true);
		});

		it('finds at least 7 ingredients', () => {
			const draft = parseRecipeText(SAMPLE_PASTE_MESSY);
			expect(draft.ingredients.length).toBeGreaterThanOrEqual(7);
		});

		it('has several lowConf ingredients', () => {
			const draft = parseRecipeText(SAMPLE_PASTE_MESSY);
			const lowCount = draft.ingredients.filter((i) => i.lowConf).length;
			expect(lowCount).toBeGreaterThanOrEqual(3);
		});

		it('finds at least 1 step', () => {
			const draft = parseRecipeText(SAMPLE_PASTE_MESSY);
			expect(draft.steps.length).toBeGreaterThanOrEqual(1);
		});

		it('has a low confidence (<= 60)', () => {
			const draft = parseRecipeText(SAMPLE_PASTE_MESSY);
			expect(draft.confidence).toBeLessThanOrEqual(60);
		});

		it('extracts servings = 2', () => {
			const draft = parseRecipeText(SAMPLE_PASTE_MESSY);
			expect(draft.servings).toBe(2);
		});

		it('extracts totalTime = 40 (upper bound of range)', () => {
			const draft = parseRecipeText(SAMPLE_PASTE_MESSY);
			expect(draft.totalTime).toBe(40);
		});
	});

	describe('parenthetical-comma invariant', () => {
		it('keeps "chicken thighs (like 6, bone in)" as one ingredient', () => {
			// The comma inside parens must not split the ingredient
			const draft = parseRecipeText(SAMPLE_PASTE_MESSY);
			const chicken = draft.ingredients.find((i) =>
				i.item.toLowerCase().includes('chicken')
			);
			expect(chicken).toBeDefined();
			expect(chicken!.item).toMatch(/bone in/i);
		});
	});

	describe('greeting drop', () => {
		it('does not include the chatty preamble as an ingredient or step', () => {
			const draft = parseRecipeText(SAMPLE_PASTE_MESSY);
			const allText = [
				...draft.ingredients.map((i) => i.item),
				...draft.steps,
			].join(' ');
			expect(allText).not.toMatch(/hey!/i);
			expect(allText).not.toMatch(/here'?s that/i);
		});
	});

	describe('empty-input handling', () => {
		it('returns a valid draft for empty string without throwing', () => {
			expect(() => parseRecipeText('')).not.toThrow();
			const draft = parseRecipeText('');
			expect(draft.ingredients).toEqual([]);
			expect(draft.steps).toEqual([]);
			expect(draft.confidence).toBe(20);
		});

		it('returns a valid draft for whitespace-only input', () => {
			expect(() => parseRecipeText('   \n  ')).not.toThrow();
			const draft = parseRecipeText('   \n  ');
			expect(draft.ingredients).toEqual([]);
			expect(draft.confidence).toBe(20);
		});
	});
});
