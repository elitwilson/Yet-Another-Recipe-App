import type { Recipe, RecipeInput, Ingredient, RecipeSource } from '$lib/types/recipe';

// Wire format — mirrors the backend's serde output exactly (snake_case).
// The backend is the source of truth for this shape; everything past this
// module speaks the camelCase domain model. Translation lives here only.
interface RecipeWire {
	id: number;
	title: string;
	servings: number | null;
	total_time: number | null;
	tags: string[];
	favorite: boolean;
	ingredients: Ingredient[];
	steps: string[];
	notes: string[];
	source: RecipeSource;
	created_at: string;
}

type RecipeInputWire = Omit<RecipeWire, 'id' | 'created_at'>;

// Backend models servings/total_time as nullable; null passes through unchanged
// so "unknown" stays distinct from any numeric value.
function recipeFromWire(w: RecipeWire): Recipe {
	return {
		id: w.id,
		title: w.title,
		servings: w.servings,
		totalTime: w.total_time,
		tags: w.tags,
		favorite: w.favorite,
		ingredients: w.ingredients,
		steps: w.steps,
		notes: w.notes,
		source: w.source,
		createdAt: w.created_at
	};
}

function recipeToWire(input: RecipeInput): RecipeInputWire {
	return {
		title: input.title,
		servings: input.servings,
		total_time: input.totalTime,
		tags: input.tags,
		favorite: input.favorite,
		ingredients: input.ingredients,
		steps: input.steps,
		notes: input.notes,
		source: input.source
	};
}

export async function fetchRecipes(): Promise<Recipe[]> {
	const response = await fetch('/api/recipes');
	if (!response.ok) {
		throw new Error(`Failed to fetch recipes: ${response.status}`);
	}
	const wire = (await response.json()) as RecipeWire[];
	return wire.map(recipeFromWire);
}

export async function fetchRecipe(id: number): Promise<Recipe> {
	const response = await fetch(`/api/recipes/${id}`);
	if (!response.ok) {
		throw new Error(`Failed to fetch recipe: ${response.status}`);
	}
	return recipeFromWire((await response.json()) as RecipeWire);
}

export async function createRecipe(data: RecipeInput): Promise<Recipe> {
	const response = await fetch('/api/recipes', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(recipeToWire(data))
	});
	if (!response.ok) {
		throw new Error(`Failed to create recipe: ${response.status}`);
	}
	return recipeFromWire((await response.json()) as RecipeWire);
}

export async function updateRecipe(id: number, data: RecipeInput): Promise<Recipe> {
	const response = await fetch(`/api/recipes/${id}`, {
		method: 'PUT',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(recipeToWire(data))
	});
	if (!response.ok) {
		throw new Error(`Failed to update recipe: ${response.status}`);
	}
	return recipeFromWire((await response.json()) as RecipeWire);
}

export async function deleteRecipe(id: number): Promise<void> {
	const response = await fetch(`/api/recipes/${id}`, { method: 'DELETE' });
	if (!response.ok) {
		throw new Error(`Failed to delete recipe: ${response.status}`);
	}
}
