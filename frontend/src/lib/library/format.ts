export function formatTotalTime(minutes: number | null | undefined): string {
	if (!minutes) return '';
	const hrs = Math.floor(minutes / 60);
	const mins = minutes % 60;
	if (hrs === 0) return `${mins} min`;
	if (mins === 0) return `${hrs} hr`;
	return `${hrs} hr ${mins} min`;
}
