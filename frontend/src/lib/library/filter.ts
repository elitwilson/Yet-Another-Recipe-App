import type { Recipe } from '$lib/types/recipe';

export type SortMode = 'recent' | 'az' | 'quickest';

export interface FilterOptions {
	query: string;
	sort: SortMode;
	favoritesOnly: boolean;
}

export function filterAndSortRecipes(recipes: Recipe[], options: FilterOptions): Recipe[] {
	const { sort, favoritesOnly } = options;
	const query = options.query.trim().toLowerCase();

	let result = recipes;

	if (favoritesOnly) {
		result = result.filter(r => r.favorite);
	}

	if (query) {
		result = result.filter(r =>
			r.title.toLowerCase().includes(query) ||
			r.tags.some(t => t.toLowerCase().includes(query)) ||
			r.ingredients.some(i => i.item.toLowerCase().includes(query))
		);
	}

	result = [...result].sort((a, b) => {
		if (sort === 'recent') {
			return b.createdAt.localeCompare(a.createdAt);
		}
		if (sort === 'az') {
			return a.title.toLowerCase().localeCompare(b.title.toLowerCase());
		}
		// quickest: missing/zero totalTime sorts last
		const aTime = a.totalTime || Infinity;
		const bTime = b.totalTime || Infinity;
		return aTime - bTime;
	});

	return result;
}
