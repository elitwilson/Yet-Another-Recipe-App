import type { ParsedRecipeDraft } from '$lib/parser';
import type { ParsedDraft, RecipeSource } from '$lib/types/recipe';

// Count non-blank lines in the given text.
// Matches the prototype: split('\n').filter(l => l.trim())
export function countLines(text: string): number {
	return text.split('\n').filter((l) => l.trim().length > 0).length;
}

// Returns the source object that identifies paste-flow origin.
export function pasteSource(): RecipeSource {
	return { type: 'paste', method: 'parsed from pasted text' };
}

// Merges a parser result with the paste source to produce a ParsedDraft
// ready for the ReviewPanel.
export function draftFromParse(parsed: ParsedRecipeDraft): ParsedDraft {
	return {
		title: parsed.title,
		servings: parsed.servings,
		totalTime: parsed.totalTime,
		ingredients: parsed.ingredients,
		steps: parsed.steps,
		notes: parsed.notes,
		warnings: parsed.warnings,
		confidence: parsed.confidence,
		tags: [],
		favorite: false,
		source: pasteSource(),
	};
}
