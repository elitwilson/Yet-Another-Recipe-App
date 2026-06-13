import { describe, it, expect } from 'vitest';
import { formatTime } from './time';

describe('formatTime', () => {
	it('formats minutes only (45 → "45m")', () => {
		expect(formatTime(45)).toBe('45m');
	});

	it('formats exact hours (120 → "2h")', () => {
		expect(formatTime(120)).toBe('2h');
	});

	it('formats hours + minutes (90 → "1h 30m")', () => {
		expect(formatTime(90)).toBe('1h 30m');
	});

	it('formats zero minutes (0 → "0m")', () => {
		expect(formatTime(0)).toBe('0m');
	});

	it('formats single minute (1 → "1m")', () => {
		expect(formatTime(1)).toBe('1m');
	});

	it('formats exact 1 hour (60 → "1h")', () => {
		expect(formatTime(60)).toBe('1h');
	});
});
