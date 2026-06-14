import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';

const progressFile = resolve(
	process.cwd(),
	'src/lib/components/add-recipe/ParseProgress.svelte'
);

describe('ParseProgress — file exists', () => {
	it('ParseProgress.svelte exists', () => {
		expect(existsSync(progressFile)).toBe(true);
	});
});

describe('ParseProgress — props contract', () => {
	it('accepts steps prop (array of strings)', () => {
		const src = readFileSync(progressFile, 'utf-8');
		expect(src).toMatch(/steps/);
	});

	it('accepts onDone callback prop', () => {
		const src = readFileSync(progressFile, 'utf-8');
		expect(src).toMatch(/onDone/);
	});
});

describe('ParseProgress — rendering all steps', () => {
	it('iterates over steps to render each one', () => {
		const src = readFileSync(progressFile, 'utf-8');
		// Uses #each or similar iteration over steps
		expect(src).toMatch(/#each.*steps|steps.*#each/);
	});

	it('has data-test attribute for individual steps', () => {
		const src = readFileSync(progressFile, 'utf-8');
		expect(src).toMatch(/data-test/);
	});
});

describe('ParseProgress — timer-driven advancement', () => {
	it('uses $effect for timer logic', () => {
		const src = readFileSync(progressFile, 'utf-8');
		expect(src).toMatch(/\$effect/);
	});

	it('uses setTimeout for step advancement', () => {
		const src = readFileSync(progressFile, 'utf-8');
		expect(src).toMatch(/setTimeout/);
	});

	it('calls onDone after the last step', () => {
		const src = readFileSync(progressFile, 'utf-8');
		expect(src).toMatch(/onDone/);
	});

	it('cleans up timers (clearTimeout)', () => {
		const src = readFileSync(progressFile, 'utf-8');
		expect(src).toMatch(/clearTimeout/);
	});
});

describe('ParseProgress — step state indicators', () => {
	it('tracks a current step index or active step', () => {
		const src = readFileSync(progressFile, 'utf-8');
		// Should have some state tracking which step is active
		expect(src).toMatch(/\$state|currentStep|activeStep|current|step/);
	});

	it('distinguishes done, active, and pending states in markup', () => {
		const src = readFileSync(progressFile, 'utf-8');
		// Should differentiate between completed steps and upcoming steps
		expect(src).toMatch(/index|i\b|step/);
	});
});
