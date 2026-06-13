import type { Recipe } from '$lib/types/recipe';

export async function fetchRecipes(): Promise<Recipe[]> {
	const response = await fetch('/api/recipes');
	if (!response.ok) {
		throw new Error(`Failed to fetch recipes: ${response.status}`);
	}
	return response.json() as Promise<Recipe[]>;
}
