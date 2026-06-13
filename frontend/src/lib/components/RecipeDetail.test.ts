import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';

const editPageFile = resolve(process.cwd(), 'src/routes/recipes/[id]/edit/+page.svelte');
const detailPageFile = resolve(process.cwd(), 'src/routes/recipes/[id]/+page.svelte');

describe('edit page svelte source', () => {
	it('edit +page.svelte file exists', () => {
		expect(existsSync(editPageFile)).toBe(true);
	});

	it('imports and calls updateRecipe from $lib/api/recipes', () => {
		const src = readFileSync(editPageFile, 'utf-8');
		expect(src).toContain('updateRecipe');
		expect(src).toMatch(/\$lib\/api\/recipes/);
	});

	it('imports goto from $app/navigation', () => {
		const src = readFileSync(editPageFile, 'utf-8');
		expect(src).toMatch(/goto/);
		expect(src).toMatch(/\$app\/navigation/);
	});

	it('renders RecipeForm component', () => {
		const src = readFileSync(editPageFile, 'utf-8');
		expect(src).toMatch(/RecipeForm/);
	});

	it('has a Save button that is disabled when form is invalid or saving', () => {
		const src = readFileSync(editPageFile, 'utf-8');
		expect(src).toMatch(/[Ss]ave/);
		expect(src).toMatch(/disabled/);
		expect(src).toMatch(/formValid|valid/);
		expect(src).toMatch(/saving/);
	});

	it('has a Cancel button/link that navigates to the detail view', () => {
		const src = readFileSync(editPageFile, 'utf-8');
		expect(src).toMatch(/[Cc]ancel/);
		expect(src).toMatch(/goto|href/);
	});

	it('shows an error message when save fails', () => {
		const src = readFileSync(editPageFile, 'utf-8');
		expect(src).toMatch(/error/i);
	});

	it('shows a loading/saving state indicator', () => {
		const src = readFileSync(editPageFile, 'utf-8');
		expect(src).toMatch(/saving/);
	});

	it('deep-copies nested arrays when seeding draft from recipe', () => {
		const src = readFileSync(editPageFile, 'utf-8');
		// Should spread or structuredClone, not just reference the recipe directly
		expect(src).toMatch(/structuredClone|\.\.\./);
	});
});

describe('detail page delete flow source', () => {
	it('imports deleteRecipe from $lib/api/recipes', () => {
		const src = readFileSync(detailPageFile, 'utf-8');
		expect(src).toContain('deleteRecipe');
		expect(src).toMatch(/\$lib\/api\/recipes/);
	});

	it('imports goto from $app/navigation', () => {
		const src = readFileSync(detailPageFile, 'utf-8');
		expect(src).toMatch(/goto/);
		expect(src).toMatch(/\$app\/navigation/);
	});

	it('imports and uses Dialog component', () => {
		const src = readFileSync(detailPageFile, 'utf-8');
		expect(src).toMatch(/Dialog/);
		expect(src).toMatch(/\$lib\/components\/ui\/dialog/);
	});

	it('has a confirmingDelete state controlling the dialog', () => {
		const src = readFileSync(detailPageFile, 'utf-8');
		expect(src).toMatch(/confirmingDelete/);
	});

	it('has a deleting loading state', () => {
		const src = readFileSync(detailPageFile, 'utf-8');
		expect(src).toMatch(/deleting/);
	});

	it('Delete button opens the dialog (not disabled/stub)', () => {
		const src = readFileSync(detailPageFile, 'utf-8');
		expect(src).toMatch(/[Dd]elete/);
		// The delete button should now open confirmingDelete, not be a stub disabled button
		expect(src).toMatch(/confirmingDelete\s*=\s*true/);
	});

	it('Edit link navigates to /recipes/[id]/edit', () => {
		const src = readFileSync(detailPageFile, 'utf-8');
		expect(src).toMatch(/\/edit/);
	});

	it('shows an error when delete fails', () => {
		const src = readFileSync(detailPageFile, 'utf-8');
		expect(src).toMatch(/error/i);
	});

	it('cancel closes dialog without calling deleteRecipe', () => {
		const src = readFileSync(detailPageFile, 'utf-8');
		expect(src).toMatch(/confirmingDelete\s*=\s*false/);
	});

	it('on successful delete redirects to /', () => {
		const src = readFileSync(detailPageFile, 'utf-8');
		// should call goto('/') after deleteRecipe succeeds
		expect(src).toMatch(/goto\s*\(\s*['"]\/['"]\s*\)/);
	});
});
