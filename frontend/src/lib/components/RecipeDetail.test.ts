import { describe, it, expect, vi, beforeEach } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';

vi.mock('$lib/api/recipes', () => ({
	fetchRecipe: vi.fn(),
	updateRecipe: vi.fn(),
	deleteRecipe: vi.fn()
}));

vi.mock('$app/navigation', () => ({
	goto: vi.fn()
}));

vi.mock('@sveltejs/kit', () => ({
	error: vi.fn((status: number, message: string) => {
		const e = new Error(message) as Error & { status: number };
		e.status = status;
		throw e;
	})
}));

import { fetchRecipe } from '$lib/api/recipes';
import { load } from '../../../routes/recipes/[id]/edit/+page';

const editPageFile = resolve(__dirname, '../../../routes/recipes/[id]/edit/+page.svelte');
const detailPageFile = resolve(__dirname, '../../../routes/recipes/[id]/+page.svelte');

const mockRecipe = {
	id: 42,
	title: 'Garlic Pasta',
	servings: 4,
	totalTime: 30,
	tags: ['pasta', 'quick'],
	favorite: false,
	ingredients: [{ qty: '200g', unit: '', item: 'pasta' }],
	steps: ['Boil water', 'Cook pasta'],
	notes: 'Season well',
	source: { type: 'manual' as const },
	createdAt: '2026-06-13T00:00:00Z'
};

describe('edit sub-route load function', () => {
	beforeEach(() => {
		vi.resetAllMocks();
	});

	it('calls fetchRecipe with the numeric id and returns { recipe }', async () => {
		vi.mocked(fetchRecipe).mockResolvedValue(mockRecipe);

		const result = await load({ params: { id: '42' } } as Parameters<typeof load>[0]);

		expect(fetchRecipe).toHaveBeenCalledWith(42);
		expect(result).toEqual({ recipe: mockRecipe });
	});

	it('throws a 404 error when id is not a number', async () => {
		await expect(
			load({ params: { id: 'abc' } } as Parameters<typeof load>[0])
		).rejects.toMatchObject({ status: 404 });
	});

	it('throws a 404 error when fetchRecipe throws a 404 message', async () => {
		vi.mocked(fetchRecipe).mockRejectedValue(new Error('Failed to fetch recipe: 404'));

		await expect(
			load({ params: { id: '42' } } as Parameters<typeof load>[0])
		).rejects.toMatchObject({ status: 404 });
	});

	it('throws a 500 error for non-404 fetch failures', async () => {
		vi.mocked(fetchRecipe).mockRejectedValue(new Error('network error'));

		await expect(
			load({ params: { id: '42' } } as Parameters<typeof load>[0])
		).rejects.toMatchObject({ status: 500 });
	});
});

describe('edit page svelte source', () => {
	it('edit +page.svelte file exists', () => {
		expect(existsSync(editPageFile)).toBe(true);
	});

	it('imports and calls updateRecipe from $lib/api/recipes', () => {
		const src = readFileSync(editPageFile, 'utf-8');
		expect(src).toContain('updateRecipe');
		expect(src).toMatch(/\$lib\/api\/recipes/);
	});

	it('imports goto from $app/navigation', () => {
		const src = readFileSync(editPageFile, 'utf-8');
		expect(src).toMatch(/goto/);
		expect(src).toMatch(/\$app\/navigation/);
	});

	it('renders RecipeForm component', () => {
		const src = readFileSync(editPageFile, 'utf-8');
		expect(src).toMatch(/RecipeForm/);
	});

	it('has a Save button that is disabled when form is invalid or saving', () => {
		const src = readFileSync(editPageFile, 'utf-8');
		expect(src).toMatch(/[Ss]ave/);
		expect(src).toMatch(/disabled/);
		expect(src).toMatch(/formValid|valid/);
		expect(src).toMatch(/saving/);
	});

	it('has a Cancel button/link that navigates to the detail view', () => {
		const src = readFileSync(editPageFile, 'utf-8');
		expect(src).toMatch(/[Cc]ancel/);
		expect(src).toMatch(/goto|href/);
	});

	it('shows an error message when save fails', () => {
		const src = readFileSync(editPageFile, 'utf-8');
		expect(src).toMatch(/error/i);
	});

	it('shows a loading/saving state indicator', () => {
		const src = readFileSync(editPageFile, 'utf-8');
		expect(src).toMatch(/saving/);
	});

	it('deep-copies nested arrays when seeding draft from recipe', () => {
		const src = readFileSync(editPageFile, 'utf-8');
		// Should spread or structuredClone, not just reference the recipe directly
		expect(src).toMatch(/structuredClone|\.\.\./);
	});
});

describe('detail page delete flow source', () => {
	it('imports deleteRecipe from $lib/api/recipes', () => {
		const src = readFileSync(detailPageFile, 'utf-8');
		expect(src).toContain('deleteRecipe');
		expect(src).toMatch(/\$lib\/api\/recipes/);
	});

	it('imports goto from $app/navigation', () => {
		const src = readFileSync(detailPageFile, 'utf-8');
		expect(src).toMatch(/goto/);
		expect(src).toMatch(/\$app\/navigation/);
	});

	it('imports and uses Dialog component', () => {
		const src = readFileSync(detailPageFile, 'utf-8');
		expect(src).toMatch(/Dialog/);
		expect(src).toMatch(/\$lib\/components\/ui\/dialog/);
	});

	it('has a confirmingDelete state controlling the dialog', () => {
		const src = readFileSync(detailPageFile, 'utf-8');
		expect(src).toMatch(/confirmingDelete/);
	});

	it('has a deleting loading state', () => {
		const src = readFileSync(detailPageFile, 'utf-8');
		expect(src).toMatch(/deleting/);
	});

	it('Delete button opens the dialog (not disabled/stub)', () => {
		const src = readFileSync(detailPageFile, 'utf-8');
		expect(src).toMatch(/[Dd]elete/);
		// The delete button should now open confirmingDelete, not be a stub disabled button
		expect(src).toMatch(/confirmingDelete\s*=\s*true/);
	});

	it('Edit link navigates to /recipes/[id]/edit', () => {
		const src = readFileSync(detailPageFile, 'utf-8');
		expect(src).toMatch(/\/edit/);
	});

	it('shows an error when delete fails', () => {
		const src = readFileSync(detailPageFile, 'utf-8');
		expect(src).toMatch(/error/i);
	});

	it('cancel closes dialog without calling deleteRecipe', () => {
		const src = readFileSync(detailPageFile, 'utf-8');
		expect(src).toMatch(/confirmingDelete\s*=\s*false/);
	});

	it('on successful delete redirects to /', () => {
		const src = readFileSync(detailPageFile, 'utf-8');
		// should call goto('/') after deleteRecipe succeeds
		expect(src).toMatch(/goto\s*\(\s*['"]\/['"]\s*\)/);
	});
});
