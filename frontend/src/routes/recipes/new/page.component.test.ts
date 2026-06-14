import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';

const pageFile = resolve(__dirname, '+page.svelte');

describe('/recipes/new +page.svelte — file exists', () => {
	it('+page.svelte exists at recipes/new/', () => {
		expect(existsSync(pageFile)).toBe(true);
	});
});

describe('/recipes/new +page.svelte — AddRecipe wiring', () => {
	it('imports AddRecipe component', () => {
		const src = readFileSync(pageFile, 'utf-8');
		expect(src).toMatch(/AddRecipe/);
	});

	it('renders AddRecipe in the template', () => {
		const src = readFileSync(pageFile, 'utf-8');
		expect(src).toMatch(/<AddRecipe/);
	});

	it('passes an onSave handler to AddRecipe', () => {
		const src = readFileSync(pageFile, 'utf-8');
		expect(src).toMatch(/onSave/);
	});
});

describe('/recipes/new +page.svelte — post-save navigation', () => {
	it('imports goto from $app/navigation', () => {
		const src = readFileSync(pageFile, 'utf-8');
		expect(src).toMatch(/goto/);
		expect(src).toMatch(/\$app\/navigation/);
	});

	it('navigates away after a successful save', () => {
		const src = readFileSync(pageFile, 'utf-8');
		expect(src).toMatch(/goto\(/);
	});
});

describe('/recipes/new +page.svelte — createRecipe call', () => {
	it('imports createRecipe from the api module', () => {
		const src = readFileSync(pageFile, 'utf-8');
		expect(src).toMatch(/createRecipe/);
	});
});
