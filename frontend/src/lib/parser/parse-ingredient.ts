import type { EditableIngredient } from '$lib/types/recipe';
import { UNIT_RE } from './units';
import { QTY_RE } from './patterns';

// Strips leading bullet characters and step/numbered list prefixes.
// The numbered-list pattern requires at least one space after the
// punctuation so that "2.5 cups" is not treated as item "2." + "5 cups".
export function cleanBullet(s: string): string {
	return s
		.replace(/^\s*[-*•·–—▢▪◦]\s*/, '')
		.replace(/^\s*\d+[.)]\s+/, '')
		.replace(/^\s*step\s*\d+\s*[:.)-]?\s*/i, '')
		.trim();
}

// Heuristic: does a line look like an ingredient (has a quantity or is a known staple)?
export function looksLikeIngredient(line: string): boolean {
	const l = cleanBullet(line);
	if (!l) return false;
	if (QTY_RE.test(l)) return true;
	const words = l.split(/\s+/);
	if (
		words.length <= 6 &&
		/^(salt|pepper|olive oil|butter|garlic|water|flour|sugar|eggs?|milk)/i.test(l)
	)
		return true;
	return false;
}

// Parse one ingredient line into { qty, unit, item, lowConf }.
// Does not include a `raw` field — `item` falls back to the cleaned line.
export function parseIngredient(rawIn: string): EditableIngredient {
	const raw = cleanBullet(rawIn);
	if (!raw) {
		return { qty: '', unit: '', item: '', lowConf: true };
	}

	let rest = raw;
	let qty = '';
	let unit = '';

	const qm = raw.match(QTY_RE);
	if (qm) {
		qty = qm[0].replace(/\s+/g, ' ').trim();
		rest = raw.slice(qm[0].length).trim();
		const words = rest.split(/\s+/);
		if (words.length && UNIT_RE.test(words[0])) {
			unit = words[0].replace(/\.$/, '');
			rest = words.slice(1).join(' ');
		}
	}

	const item = rest.replace(/^of\s+/i, '').trim();
	const lowConf =
		!qty && !/salt|pepper|oil|to taste|garnish|water/i.test(item);

	return { qty, unit, item: item || raw, lowConf };
}
