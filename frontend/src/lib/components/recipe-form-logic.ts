import type { EditableIngredient, EditableRecipe } from '$lib/types/recipe';

export function isRecipeValid(draft: EditableRecipe): boolean {
	return (
		draft.title.trim().length > 0 &&
		draft.ingredients.some((ing) => ing.item.length > 0) &&
		draft.steps.some((step) => step.trim().length > 0)
	);
}

export function reorder<T>(rows: T[], from: number, to: number): T[] {
	if (from < 0 || from >= rows.length || from === to) return rows;
	const next = [...rows];
	const [moved] = next.splice(from, 1);
	next.splice(to, 0, moved);
	return next;
}

export function normalizeTag(raw: string): string {
	return raw.trim().toLowerCase().replace(/^#/, '');
}

export function addTag(tags: string[], raw: string): string[] {
	const clean = normalizeTag(raw);
	if (!clean || tags.includes(clean)) return tags;
	return [...tags, clean];
}

export function removeTag(tags: string[], tag: string): string[] {
	return tags.filter((t) => t !== tag);
}

export function addIngredient(rows: EditableIngredient[]): EditableIngredient[] {
	return [...rows, { qty: '', unit: '', item: '' }];
}

export function addStep(steps: string[]): string[] {
	return [...steps, ''];
}

export function removeAt<T>(arr: T[], index: number): T[] {
	return arr.filter((_, i) => i !== index);
}

export function updateAt<T>(arr: T[], index: number, patch: Partial<T>): T[] {
	return arr.map((item, i) => (i === index ? { ...item, ...patch } : item));
}

// Parses a numeric input field value; returns null when the field is empty/cleared.
export function parseNumericInput(v: string): number | null {
	return v.trim() ? parseInt(v, 10) : null;
}
