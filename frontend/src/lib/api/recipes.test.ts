import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { fetchRecipes, fetchRecipe, createRecipe, updateRecipe, deleteRecipe } from './recipes';
import type { Recipe, RecipeInput } from '$lib/types/recipe';

const ingredients = [
	{ qty: '200', unit: 'g', item: 'spaghetti' },
	{ qty: '100', unit: 'g', item: 'pancetta' }
];
const steps = ['Boil pasta', 'Fry pancetta', 'Combine'];

// What the backend actually sends/accepts on the wire (snake_case, notes array).
const wireRecipe = {
	id: 1,
	title: 'Pasta Carbonara',
	servings: 4,
	total_time: 30,
	tags: ['italian', 'pasta'],
	favorite: false,
	ingredients,
	steps,
	notes: ['Use guanciale if available'],
	source: { type: 'manual' },
	created_at: '2026-06-13T00:00:00Z'
};

// The camelCase domain object the client should return after mapping.
const mockRecipe: Recipe = {
	id: 1,
	title: 'Pasta Carbonara',
	servings: 4,
	totalTime: 30,
	tags: ['italian', 'pasta'],
	favorite: false,
	ingredients,
	steps,
	notes: ['Use guanciale if available'],
	source: { type: 'manual' },
	createdAt: '2026-06-13T00:00:00Z'
};

const mockInput: RecipeInput = {
	title: 'Pasta Carbonara',
	servings: 4,
	totalTime: 30,
	tags: ['italian', 'pasta'],
	favorite: false,
	ingredients,
	steps,
	notes: ['Use guanciale if available'],
	source: { type: 'manual' }
};

// The snake_case body the client should send for mockInput.
const wireInput = {
	title: 'Pasta Carbonara',
	servings: 4,
	total_time: 30,
	tags: ['italian', 'pasta'],
	favorite: false,
	ingredients,
	steps,
	notes: ['Use guanciale if available'],
	source: { type: 'manual' }
};

describe('fetchRecipes', () => {
	beforeEach(() => {
		vi.stubGlobal('fetch', vi.fn());
	});

	afterEach(() => {
		vi.unstubAllGlobals();
	});

	it('GETs /api/recipes and returns array of recipes on success', async () => {
		vi.mocked(fetch).mockResolvedValue({
			ok: true,
			json: async () => [wireRecipe]
		} as Response);

		const result = await fetchRecipes();

		expect(fetch).toHaveBeenCalledWith('/api/recipes');
		expect(result).toEqual([mockRecipe]);
	});

	it('throws with status on non-ok response', async () => {
		vi.mocked(fetch).mockResolvedValue({
			ok: false,
			status: 500
		} as Response);

		await expect(fetchRecipes()).rejects.toThrow('500');
	});
});

describe('fetchRecipe', () => {
	beforeEach(() => {
		vi.stubGlobal('fetch', vi.fn());
	});

	afterEach(() => {
		vi.unstubAllGlobals();
	});

	it('GETs /api/recipes/:id and returns a recipe on success', async () => {
		vi.mocked(fetch).mockResolvedValue({
			ok: true,
			json: async () => wireRecipe
		} as Response);

		const result = await fetchRecipe(1);

		expect(fetch).toHaveBeenCalledWith('/api/recipes/1');
		expect(result).toEqual(mockRecipe);
	});

	it('throws with status on non-ok response', async () => {
		vi.mocked(fetch).mockResolvedValue({
			ok: false,
			status: 404
		} as Response);

		await expect(fetchRecipe(99)).rejects.toThrow('404');
	});
});

describe('createRecipe', () => {
	beforeEach(() => {
		vi.stubGlobal('fetch', vi.fn());
	});

	afterEach(() => {
		vi.unstubAllGlobals();
	});

	it('POSTs to /api/recipes with JSON body and returns created recipe', async () => {
		vi.mocked(fetch).mockResolvedValue({
			ok: true,
			json: async () => wireRecipe
		} as Response);

		const result = await createRecipe(mockInput);

		expect(fetch).toHaveBeenCalledWith('/api/recipes', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(wireInput)
		});
		expect(result).toEqual(mockRecipe);
	});

	it('throws with status on non-ok response', async () => {
		vi.mocked(fetch).mockResolvedValue({
			ok: false,
			status: 400
		} as Response);

		await expect(createRecipe(mockInput)).rejects.toThrow('400');
	});
});

describe('updateRecipe', () => {
	beforeEach(() => {
		vi.stubGlobal('fetch', vi.fn());
	});

	afterEach(() => {
		vi.unstubAllGlobals();
	});

	it('PUTs to /api/recipes/:id with JSON body and returns updated recipe', async () => {
		vi.mocked(fetch).mockResolvedValue({
			ok: true,
			json: async () => wireRecipe
		} as Response);

		const result = await updateRecipe(1, mockInput);

		expect(fetch).toHaveBeenCalledWith('/api/recipes/1', {
			method: 'PUT',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(wireInput)
		});
		expect(result).toEqual(mockRecipe);
	});

	it('throws with status on non-ok response', async () => {
		vi.mocked(fetch).mockResolvedValue({
			ok: false,
			status: 422
		} as Response);

		await expect(updateRecipe(1, mockInput)).rejects.toThrow('422');
	});
});

describe('deleteRecipe', () => {
	beforeEach(() => {
		vi.stubGlobal('fetch', vi.fn());
	});

	afterEach(() => {
		vi.unstubAllGlobals();
	});

	it('DELETEs /api/recipes/:id and resolves to undefined on success', async () => {
		vi.mocked(fetch).mockResolvedValue({
			ok: true
		} as Response);

		const result = await deleteRecipe(1);

		expect(fetch).toHaveBeenCalledWith('/api/recipes/1', { method: 'DELETE' });
		expect(result).toBeUndefined();
	});

	it('throws with status on non-ok response', async () => {
		vi.mocked(fetch).mockResolvedValue({
			ok: false,
			status: 403
		} as Response);

		await expect(deleteRecipe(1)).rejects.toThrow('403');
	});
});
