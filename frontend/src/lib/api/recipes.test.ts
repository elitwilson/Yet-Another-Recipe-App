import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { fetchRecipes } from './recipes';

describe('fetchRecipes', () => {
	beforeEach(() => {
		vi.stubGlobal('fetch', vi.fn());
	});

	afterEach(() => {
		vi.unstubAllGlobals();
	});

	it('returns a typed array of recipes on success', async () => {
		const mockData = [
			{ id: 1, name: 'Pasta Carbonara' },
			{ id: 2, name: 'Chicken Tikka Masala' }
		];
		vi.mocked(fetch).mockResolvedValue({
			ok: true,
			json: async () => mockData
		} as Response);

		const result = await fetchRecipes();

		expect(fetch).toHaveBeenCalledWith('/api/recipes');
		expect(result).toEqual(mockData);
		expect(result[0].id).toBe(1);
		expect(result[0].name).toBe('Pasta Carbonara');
	});

	it('returns an empty array when the API returns an empty array', async () => {
		vi.mocked(fetch).mockResolvedValue({
			ok: true,
			json: async () => []
		} as Response);

		const result = await fetchRecipes();

		expect(result).toEqual([]);
	});

	it('throws on non-2xx response', async () => {
		vi.mocked(fetch).mockResolvedValue({
			ok: false,
			status: 500
		} as Response);

		await expect(fetchRecipes()).rejects.toThrow('500');
	});

	it('throws on 404 response', async () => {
		vi.mocked(fetch).mockResolvedValue({
			ok: false,
			status: 404
		} as Response);

		await expect(fetchRecipes()).rejects.toThrow('404');
	});

	it('propagates network errors', async () => {
		vi.mocked(fetch).mockRejectedValue(new Error('Network failure'));

		await expect(fetchRecipes()).rejects.toThrow('Network failure');
	});
});
