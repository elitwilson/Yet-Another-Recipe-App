import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('$lib/api/recipes', () => ({
	fetchRecipe: vi.fn()
}));

vi.mock('@sveltejs/kit', () => ({
	error: vi.fn((status: number, message: string) => {
		const e = new Error(message) as Error & { status: number };
		e.status = status;
		throw e;
	})
}));

import { fetchRecipe } from '$lib/api/recipes';
import { load } from './+page';

const mockRecipe = {
	id: 42,
	title: 'Garlic Pasta',
	servings: 4,
	totalTime: 30,
	tags: ['pasta', 'quick'],
	favorite: false,
	ingredients: [{ qty: '200g', unit: '', item: 'pasta' }],
	steps: ['Boil water', 'Cook pasta'],
	notes: ['Season well'],
	source: { type: 'manual' as const },
	createdAt: '2026-06-13T00:00:00Z'
};

describe('load (recipe edit)', () => {
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
