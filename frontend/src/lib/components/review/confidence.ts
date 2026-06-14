export type ConfidenceTone = 'High' | 'Medium' | 'Low';

export function confidenceTone(value: number): ConfidenceTone {
	if (value >= 85) return 'High';
	if (value >= 60) return 'Medium';
	return 'Low';
}

// Returns a CSS color value. High maps to the primary theme token (green-adjacent),
// Medium maps to an amber utility (no direct amber token in the theme),
// Low maps to the destructive token.
export function confidenceColor(value: number): string {
	const tone = confidenceTone(value);
	switch (tone) {
		case 'High':
			return 'var(--primary)';
		case 'Medium':
			return 'rgb(245 158 11)'; // amber-500 — nearest to prototype's oklch(0.72 0.15 75)
		case 'Low':
			return 'var(--destructive)';
	}
}
