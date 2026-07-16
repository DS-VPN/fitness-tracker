/** Epley formula — standard, simple estimated 1-rep-max. */
export function estimatedOneRepMax(weight: number, reps: number): number {
	if (reps <= 1) return weight;
	return Math.round(weight * (1 + reps / 30) * 10) / 10;
}
