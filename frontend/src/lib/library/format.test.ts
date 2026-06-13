import { describe, it, expect } from 'vitest';
import { formatTotalTime } from './format';

describe('formatTotalTime', () => {
	it('returns empty string for null/undefined (no total time)', () => {
		expect(formatTotalTime(null)).toBe('');
		expect(formatTotalTime(undefined)).toBe('');
	});

	it('returns empty string for 0 minutes', () => {
		expect(formatTotalTime(0)).toBe('');
	});

	it('formats minutes under 60', () => {
		expect(formatTotalTime(30)).toBe('30 min');
		expect(formatTotalTime(1)).toBe('1 min');
		expect(formatTotalTime(59)).toBe('59 min');
	});

	it('formats exactly 60 minutes as 1 hr', () => {
		expect(formatTotalTime(60)).toBe('1 hr');
	});

	it('formats whole hours (no remainder minutes)', () => {
		expect(formatTotalTime(120)).toBe('2 hr');
		expect(formatTotalTime(180)).toBe('3 hr');
	});

	it('formats hours and minutes', () => {
		expect(formatTotalTime(90)).toBe('1 hr 30 min');
		expect(formatTotalTime(75)).toBe('1 hr 15 min');
		expect(formatTotalTime(125)).toBe('2 hr 5 min');
	});
});
