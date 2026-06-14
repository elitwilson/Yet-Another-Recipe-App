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
	servings: number | null;
	totalTime: number | null;
	tags: string[];
	favorite: boolean;
	ingredients: Ingredient[];
	steps: string[];
	notes: string[];
	source: RecipeSource;
	createdAt: string;
}

export type RecipeInput = Omit<Recipe, 'id' | 'createdAt'>;

export interface EditableIngredient extends Ingredient {
	lowConf?: boolean;
}

export type EditableRecipe = Omit<RecipeInput, 'ingredients'> & {
	ingredients: EditableIngredient[];
};

export type ParsedDraft = EditableRecipe & {
	confidence: number | null;
	warnings: string[];
	source: RecipeSource;
};
