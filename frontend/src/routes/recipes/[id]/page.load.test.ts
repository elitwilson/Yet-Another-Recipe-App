import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

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
	id: 1,
	title: 'Pasta',
	servings: 2,
	totalTime: 30,
	tags: [],
	favorite: false,
	ingredients: [],
	steps: [],
	notes: [],
	source: { type: 'manual' as const },
	createdAt: '2026-06-13T00:00:00Z'
};

describe('load (recipe detail)', () => {
	beforeEach(() => {
		vi.resetAllMocks();
	});

	it('returns { recipe } when fetchRecipe resolves', async () => {
		vi.mocked(fetchRecipe).mockResolvedValue(mockRecipe);

		const result = await load({ params: { id: '1' } } as Parameters<typeof load>[0]);

		expect(fetchRecipe).toHaveBeenCalledWith(1);
		expect(result).toEqual({ recipe: mockRecipe });
	});

	it('throws a 404 SvelteKit error when fetchRecipe throws with 404 in message', async () => {
		vi.mocked(fetchRecipe).mockRejectedValue(new Error('Failed to fetch recipe: 404'));

		await expect(load({ params: { id: '99' } } as Parameters<typeof load>[0])).rejects.toMatchObject(
			{ status: 404 }
		);
	});

	it('throws a 500 SvelteKit error for non-404 failures', async () => {
		vi.mocked(fetchRecipe).mockRejectedValue(new Error('Failed to fetch recipe: 500'));

		await expect(load({ params: { id: '1' } } as Parameters<typeof load>[0])).rejects.toMatchObject(
			{ status: 500 }
		);
	});

	it('throws a 404 SvelteKit error when params.id is not a number', async () => {
		await expect(
			load({ params: { id: 'abc' } } as Parameters<typeof load>[0])
		).rejects.toMatchObject({ status: 404 });
	});
});
