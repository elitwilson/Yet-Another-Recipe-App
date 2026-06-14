import { describe, it, expect } from 'vitest';
import { confidenceTone, confidenceColor } from './confidence';

describe('confidenceTone — thresholds', () => {
	it('returns High for value >= 85', () => {
		expect(confidenceTone(85)).toBe('High');
		expect(confidenceTone(100)).toBe('High');
		expect(confidenceTone(90)).toBe('High');
	});

	it('returns Medium for value >= 60 and < 85', () => {
		expect(confidenceTone(60)).toBe('Medium');
		expect(confidenceTone(84)).toBe('Medium');
		expect(confidenceTone(72)).toBe('Medium');
	});

	it('returns Low for value < 60', () => {
		expect(confidenceTone(59)).toBe('Low');
		expect(confidenceTone(0)).toBe('Low');
		expect(confidenceTone(1)).toBe('Low');
	});

	it('boundary: 84 is Medium, 85 is High', () => {
		expect(confidenceTone(84)).toBe('Medium');
		expect(confidenceTone(85)).toBe('High');
	});

	it('boundary: 59 is Low, 60 is Medium', () => {
		expect(confidenceTone(59)).toBe('Low');
		expect(confidenceTone(60)).toBe('Medium');
	});
});

describe('confidenceColor — distinct colors per tone', () => {
	it('returns a non-empty string for High', () => {
		const color = confidenceColor(85);
		expect(typeof color).toBe('string');
		expect(color.length).toBeGreaterThan(0);
	});

	it('returns a non-empty string for Medium', () => {
		const color = confidenceColor(60);
		expect(typeof color).toBe('string');
		expect(color.length).toBeGreaterThan(0);
	});

	it('returns a non-empty string for Low', () => {
		const color = confidenceColor(59);
		expect(typeof color).toBe('string');
		expect(color.length).toBeGreaterThan(0);
	});

	it('High, Medium, and Low each have distinct colors', () => {
		const high = confidenceColor(85);
		const medium = confidenceColor(60);
		const low = confidenceColor(59);
		expect(high).not.toBe(medium);
		expect(medium).not.toBe(low);
		expect(high).not.toBe(low);
	});

	it('boundary: 84 and 85 return different colors', () => {
		expect(confidenceColor(84)).not.toBe(confidenceColor(85));
	});

	it('boundary: 59 and 60 return different colors', () => {
		expect(confidenceColor(59)).not.toBe(confidenceColor(60));
	});
});
