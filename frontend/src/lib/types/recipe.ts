export interface Ingredient {
	qty: string;
	unit: string;
	item: string;
}

export interface RecipeSource {
	type: 'url' | 'paste' | 'manual';
	host?: string;
	url?: string;
	method?: string;
}

export interface Recipe {
	id: number;
	title: string;
	servings: number;
	totalTime: number;
	tags: string[];
	favorite: boolean;
	ingredients: Ingredient[];
	steps: string[];
	notes: string;
	source: RecipeSource;
	createdAt: string;
}

export type RecipeInput = Omit<Recipe, 'id' | 'createdAt'>;
