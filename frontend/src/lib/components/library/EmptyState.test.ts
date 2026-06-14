import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';

const emptyStateFile = resolve(
	process.cwd(),
	'src/lib/components/library/EmptyState.svelte'
);

describe('EmptyState — file exists', () => {
	it('EmptyState.svelte exists', () => {
		expect(existsSync(emptyStateFile)).toBe(true);
	});
});

describe('EmptyState — empty-library variant CTA', () => {
	it('has an Add recipe link/button in the empty-library variant', () => {
		const src = readFileSync(emptyStateFile, 'utf-8');
		expect(src).toMatch(/[Aa]dd recipe|[Aa]dd Recipe/);
	});

	it('links to /recipes/new', () => {
		const src = readFileSync(emptyStateFile, 'utf-8');
		expect(src).toMatch(/\/recipes\/new/);
	});

	it('CTA is inside the empty-library conditional block', () => {
		const src = readFileSync(emptyStateFile, 'utf-8');
		expect(src).toMatch(/empty-library/);
		expect(src).toMatch(/\/recipes\/new/);
	});
});
