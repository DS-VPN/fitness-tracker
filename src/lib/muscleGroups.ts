/** Canonical muscle groups offered by the exercise form and used to order volume breakdowns.
 *  A superset of the app's built-in preset vocabulary ('Legs', 'Traps', 'Full Body') and a finer
 *  leg split (Quads/Hamstrings/Glutes/Calves), so both preset and user-tagged exercises are
 *  first-class rather than sorting into the custom bucket. 'Legs' and its split intentionally
 *  coexist — pick whichever granularity you program at.
 *
 *  This list only standardizes the UI. `exercises.muscleGroup` stays free-text in the DB, so any
 *  custom or pre-existing value keeps working — it just sorts after the canonical groups. */
export const MUSCLE_GROUPS = [
	'Chest',
	'Back',
	'Shoulders',
	'Biceps',
	'Triceps',
	'Forearms',
	'Legs',
	'Quads',
	'Hamstrings',
	'Glutes',
	'Calves',
	'Core',
	'Traps',
	'Cardio',
	'Full Body'
] as const;

export type MuscleGroup = (typeof MUSCLE_GROUPS)[number];

/** Sort key: canonical groups in list order first, then custom values, then unassigned (null) last. */
export function muscleGroupOrder(value: string | null | undefined): number {
	if (!value) return MUSCLE_GROUPS.length + 1;
	const idx = (MUSCLE_GROUPS as readonly string[]).indexOf(value);
	return idx === -1 ? MUSCLE_GROUPS.length : idx;
}
