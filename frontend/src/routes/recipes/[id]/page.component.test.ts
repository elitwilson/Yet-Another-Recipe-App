import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';

const pageFile = resolve(__dirname, '+page.svelte');

describe('+page.svelte detail view', () => {
	it('file exists', () => {
		expect(existsSync(pageFile)).toBe(true);
	});

	it('uses $props() to receive data', () => {
		const src = readFileSync(pageFile, 'utf-8');
		expect(src).toContain('$props()');
	});

	it('renders recipe title', () => {
		const src = readFileSync(pageFile, 'utf-8');
		expect(src).toMatch(/recipe\.title/);
	});

	it('renders formatted total time via formatTime', () => {
		const src = readFileSync(pageFile, 'utf-8');
		expect(src).toMatch(/formatTime/);
		expect(src).toMatch(/recipe\.totalTime/);
	});

	it('renders ingredient list with qty+unit and item', () => {
		const src = readFileSync(pageFile, 'utf-8');
		expect(src).toMatch(/recipe\.ingredients/);
		expect(src).toMatch(/\.qty|\.unit|\.item/);
	});

	it('renders numbered steps', () => {
		const src = readFileSync(pageFile, 'utf-8');
		expect(src).toMatch(/recipe\.steps/);
	});

	it('renders notes section conditionally', () => {
		const src = readFileSync(pageFile, 'utf-8');
		expect(src).toMatch(/recipe\.notes/);
		// notes section must be conditional
		expect(src).toMatch(/#if.*notes|notes.*#if/s);
	});

	it('renders tags conditionally', () => {
		const src = readFileSync(pageFile, 'utf-8');
		expect(src).toMatch(/recipe\.tags/);
		expect(src).toMatch(/#if.*tags|tags.*#if/s);
	});

	it('renders servings conditionally', () => {
		const src = readFileSync(pageFile, 'utf-8');
		expect(src).toMatch(/recipe\.servings/);
		expect(src).toMatch(/#if.*servings|servings.*#if/s);
	});

	it('includes a back link to /', () => {
		const src = readFileSync(pageFile, 'utf-8');
		expect(src).toMatch(/href=["']\/["']/);
	});

	it('includes Edit and Delete buttons', () => {
		const src = readFileSync(pageFile, 'utf-8');
		expect(src).toMatch(/[Ee]dit/);
		expect(src).toMatch(/[Dd]elete/);
		expect(src).toMatch(/Button/);
	});

	it('shows a loading indicator using navigating from $app/state', () => {
		const src = readFileSync(pageFile, 'utf-8');
		expect(src).toMatch(/navigating|\$app\/state/);
	});
});
