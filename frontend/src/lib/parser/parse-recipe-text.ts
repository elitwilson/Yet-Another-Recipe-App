import type { EditableIngredient } from '$lib/types/recipe';
import { parseIngredient, cleanBullet, looksLikeIngredient } from './parse-ingredient';
import {
	QTY_RE,
	INGREDIENT_HEADER,
	STEP_HEADER,
	NOTES_HEADER,
	INLINE_INGREDIENT_HEADER,
	INLINE_STEP_HEADER,
} from './patterns';

export interface ParsedRecipeDraft {
	title: string;
	servings: number | null;
	totalTime: number | null;
	ingredients: EditableIngredient[];
	steps: string[];
	notes: string[];
	warnings: string[];
	confidence: number;
}

function emptyDraft(): ParsedRecipeDraft {
	return {
		title: '',
		servings: null,
		totalTime: null,
		ingredients: [],
		steps: [],
		notes: [],
		warnings: ['No title detected — add one before saving.', 'No steps detected.'],
		confidence: 20,
	};
}

// Extract servings and totalTime from the full text.
// Guards parseInt results so NaN never reaches the draft.
function detectMeta(text: string): { servings: number | null; totalTime: number | null } {
	let servings: number | null = null;
	let totalTime: number | null = null;

	const servMatch = text.match(
		/serves?\s*(\d+)|(\d+)\s*servings?|yields?\s*(\d+)|makes?\s+(?:enough\s+for\s+)?(\d+)/i
	);
	if (servMatch) {
		const raw = parseInt(
			servMatch[1] ?? servMatch[2] ?? servMatch[3] ?? servMatch[4] ?? '',
			10
		);
		servings = Number.isNaN(raw) ? null : raw;
	}

	// Time: handle ranges (take upper bound), hr+min combos, and plain minutes.
	// Explicit range pattern first: "35-40 min"
	const rangeMatch = text.match(/(\d+)\s*-\s*(\d+)\s*(?:minutes?|mins?|min)\b/i);
	if (rangeMatch) {
		const upper = parseInt(rangeMatch[2], 10);
		totalTime = Number.isNaN(upper) ? null : upper;
	} else {
		const timeMatch = text.match(
			/(\d+)\s*(?:hours?|hrs?|hr)\s*(?:(\d+)\s*(?:minutes?|mins?))?|(\d+)\s*(?:minutes?|mins?|min)\b/i
		);
		if (timeMatch) {
			if (timeMatch[1]) {
				const hrs = parseInt(timeMatch[1], 10);
				const mins = timeMatch[2] ? parseInt(timeMatch[2], 10) : 0;
				totalTime =
					Number.isNaN(hrs) ? null : hrs * 60 + (Number.isNaN(mins) ? 0 : mins);
			} else if (timeMatch[3]) {
				const mins = parseInt(timeMatch[3], 10);
				totalTime = Number.isNaN(mins) ? null : mins;
			}
		}
	}

	return { servings, totalTime };
}

// Split an inline comma list ("a, b (x, y), c and d") into items,
// respecting parentheses so commas inside parens don't trigger a split.
function splitInlineList(str: string): string[] {
	const parts: string[] = [];
	let cur = '';
	let depth = 0;
	for (const ch of str) {
		if (ch === '(') depth++;
		else if (ch === ')') depth = Math.max(0, depth - 1);
		if (ch === ',' && depth === 0) {
			parts.push(cur);
			cur = '';
		} else {
			cur += ch;
		}
	}
	if (cur.trim()) parts.push(cur);

	const out: string[] = [];
	parts.forEach((p) =>
		p
			.split(/\s+and\s+(?![^(]*\))/i)
			.forEach((x) => {
				if (x.trim()) out.push(x.trim());
			})
	);
	return out.filter(Boolean);
}

// Push prose split into sentences as separate steps.
function pushSentences(str: string, arr: string[]): void {
	str
		.split(/(?<=[.!?])\s+(?=[A-Za-z0-9])/)
		.map((s) => cleanBullet(s))
		.filter((s) => s && !/^(done|enjoy|that'?s it|finished)\.?$/i.test(s))
		.forEach((p) => arr.push(p));
}

// Main parser. Always returns a fully-formed ParsedRecipeDraft — never null.
// Empty/whitespace input returns the empty draft (confidence 20) rather than null,
// so callers never need to null-check the result.
export function parseRecipeText(text: string): ParsedRecipeDraft {
	const lines = (text ?? '')
		.replace(/\r/g, '')
		.split('\n')
		.map((l) => l.replace(/\s+$/, ''));

	const nonEmpty = lines
		.map((l, i) => ({ l: l.trim(), i }))
		.filter((x) => x.l);

	if (!nonEmpty.length) return emptyDraft();

	// Locate section headers
	let ingStart = -1;
	let stepStart = -1;
	let notesStart = -1;
	lines.forEach((l, i) => {
		if (ingStart === -1 && INGREDIENT_HEADER.test(l)) ingStart = i;
		else if (stepStart === -1 && STEP_HEADER.test(l)) stepStart = i;
		else if (notesStart === -1 && NOTES_HEADER.test(l)) notesStart = i;
	});

	// Title: first non-empty line that isn't a header and doesn't look like an ingredient
	let title = '';
	for (const { l } of nonEmpty) {
		if (INGREDIENT_HEADER.test(l) || STEP_HEADER.test(l)) continue;
		if (QTY_RE.test(cleanBullet(l))) break;
		if (l.length <= 80) {
			title = l.replace(/[:#*]+$/, '').replace(/^#+\s*/, '').trim();
		}
		break;
	}

	const meta = detectMeta(text);
	let ingredients: EditableIngredient[] = [];
	let steps: string[] = [];
	const notes: string[] = [];
	const warnings: string[] = [];

	if (ingStart !== -1) {
		// Header-driven extraction
		const ingEnd =
			[stepStart, notesStart]
				.filter((x) => x > ingStart)
				.sort((a, b) => a - b)[0] ?? lines.length;

		for (let i = ingStart + 1; i < ingEnd; i++) {
			if (lines[i].trim()) ingredients.push(parseIngredient(lines[i]));
		}

		const stepEnd = notesStart > stepStart ? notesStart : lines.length;
		if (stepStart !== -1) {
			for (let i = stepStart + 1; i < stepEnd; i++) {
				const s = cleanBullet(lines[i]);
				if (s) steps.push(s);
			}
		}

		if (notesStart !== -1) {
			for (let i = notesStart + 1; i < lines.length; i++) {
				const s = cleanBullet(lines[i]);
				if (s) notes.push(s);
			}
		}
	} else {
		// Heuristic fallback — no section headers found
		const body = nonEmpty.filter(({ l }) => l !== title);

		for (const { l } of body) {
			const inlineIng = l.match(INLINE_INGREDIENT_HEADER);
			if (inlineIng) {
				splitInlineList(inlineIng[2]).forEach((it) =>
					ingredients.push(parseIngredient(it))
				);
				continue;
			}

			const inlineStep = l.match(INLINE_STEP_HEADER);
			if (inlineStep) {
				pushSentences(inlineStep[2], steps);
				continue;
			}

			const bare = cleanBullet(l);
			const wordCount = bare.split(/\s+/).length;
			const prose = wordCount >= 7 && !QTY_RE.test(bare);

			// Skip a leading chatty greeting before any real content has been found
			if (
				!ingredients.length &&
				!steps.length &&
				prose &&
				/\b(hey|hi|hello|here'?s|so|okay|ok|this is|here is)\b/i.test(l)
			) {
				continue;
			}

			if (looksLikeIngredient(l) && !prose) {
				ingredients.push(parseIngredient(l));
				continue;
			}

			if (prose || /^\d+[.)]/.test(l)) {
				pushSentences(bare, steps);
				continue;
			}

			ingredients.push(parseIngredient(l));
		}

		warnings.push(
			'No "Ingredients"/"Instructions" headings found — split was guessed. Worth a quick check.'
		);
	}

	// If steps came as one big paragraph, split into sentences
	if (steps.length === 1 && steps[0].length > 160) {
		steps = steps[0]
			.split(/(?<=[.!?])\s+(?=[A-Z])/)
			.map((s) => s.trim())
			.filter(Boolean);
	}

	const lowCount = ingredients.filter((x) => x.lowConf).length;
	if (lowCount) {
		warnings.push(
			`${lowCount} ingredient line${lowCount > 1 ? 's' : ''} had no clear quantity.`
		);
	}
	if (!steps.length) warnings.push('No steps detected.');
	if (!title) warnings.push('No title detected — add one before saving.');

	// Confidence: base 50; +25 ingredient header; +10 title; +10 any steps; −4 per lowConf
	let conf = 50;
	if (ingStart !== -1) conf += 25;
	if (title) conf += 10;
	if (steps.length) conf += 10;
	conf -= lowCount * 4;
	conf = Math.max(20, Math.min(98, conf));

	return {
		title: title || '',
		servings: meta.servings,
		totalTime: meta.totalTime,
		ingredients,
		steps,
		notes,
		warnings,
		confidence: conf,
	};
}
