import type { Recipe, RecipeInput } from '$lib/types/recipe';

export async function fetchRecipes(): Promise<Recipe[]> {
	const response = await fetch('/api/recipes');
	if (!response.ok) {
		throw new Error(`Failed to fetch recipes: ${response.status}`);
	}
	return response.json() as Promise<Recipe[]>;
}

export async function fetchRecipe(id: number): Promise<Recipe> {
	const response = await fetch(`/api/recipes/${id}`);
	if (!response.ok) {
		throw new Error(`Failed to fetch recipe: ${response.status}`);
	}
	return response.json() as Promise<Recipe>;
}

export async function createRecipe(data: RecipeInput): Promise<Recipe> {
	const response = await fetch('/api/recipes', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(data)
	});
	if (!response.ok) {
		throw new Error(`Failed to create recipe: ${response.status}`);
	}
	return response.json() as Promise<Recipe>;
}

export async function updateRecipe(id: number, data: RecipeInput): Promise<Recipe> {
	const response = await fetch(`/api/recipes/${id}`, {
		method: 'PUT',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(data)
	});
	if (!response.ok) {
		throw new Error(`Failed to update recipe: ${response.status}`);
	}
	return response.json() as Promise<Recipe>;
}

export async function deleteRecipe(id: number): Promise<void> {
	const response = await fetch(`/api/recipes/${id}`, { method: 'DELETE' });
	if (!response.ok) {
		throw new Error(`Failed to delete recipe: ${response.status}`);
	}
}
