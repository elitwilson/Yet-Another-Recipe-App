import type { RecipeSource } from '$lib/types/recipe';

export interface SourceMeta {
	icon: 'globe' | 'clipboard' | 'wand';
	label: string;
	sub: string;
}

export function sourceMeta(source: RecipeSource): SourceMeta {
	switch (source.type) {
		case 'url':
			return {
				icon: 'globe',
				label: source.host ?? 'imported URL',
				sub: source.method ?? 'imported from URL'
			};
		case 'manual':
			return {
				icon: 'wand',
				label: 'Freeform entry',
				sub: source.method ?? 'parsed as you type'
			};
		case 'paste':
		default:
			return {
				icon: 'clipboard',
				label: 'Pasted text',
				sub: source.method ?? 'parsed from text'
			};
	}
}
