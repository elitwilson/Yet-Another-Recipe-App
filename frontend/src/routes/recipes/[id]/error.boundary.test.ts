import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';

const routeDir = resolve(__dirname, '.');
const errorFile = resolve(routeDir, '+error.svelte');

describe('+error.svelte boundary', () => {
	it('file exists', () => {
		expect(existsSync(errorFile)).toBe(true);
	});

	it('imports page store to read status', () => {
		const src = readFileSync(errorFile, 'utf-8');
		expect(src).toMatch(/\$app\/state|\$app\/stores/);
	});

	it('renders a not-found message for 404 status', () => {
		const src = readFileSync(errorFile, 'utf-8');
		expect(src).toMatch(/404/);
		expect(src).toMatch(/not found|Recipe not found/i);
	});

	it('renders a generic error message for non-404 status', () => {
		const src = readFileSync(errorFile, 'utf-8');
		expect(src).toMatch(/error|something went wrong/i);
	});

	it('includes a back link to /', () => {
		const src = readFileSync(errorFile, 'utf-8');
		expect(src).toMatch(/href=["']\/["']/);
	});
});
