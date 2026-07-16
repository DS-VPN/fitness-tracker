import { db } from '$lib/server/db';
import { workoutSets, workoutSessions, exercises } from '$lib/server/db/schema';
import { asc, eq } from 'drizzle-orm';
import { estimatedOneRepMax } from '$lib/utils/oneRepMax';

export async function getExerciseProgress(exerciseId: number) {
	const exercise = await db.select().from(exercises).where(eq(exercises.id, exerciseId)).then((r) => r[0] ?? null);
	if (!exercise) return null;

	const rows = await db
		.select({
			sessionId: workoutSets.sessionId,
			date: workoutSessions.date,
			reps: workoutSets.reps,
			weight: workoutSets.weight,
			order: workoutSets.order
		})
		.from(workoutSets)
		.innerJoin(workoutSessions, eq(workoutSessions.id, workoutSets.sessionId))
		.where(eq(workoutSets.exerciseId, exerciseId))
		.orderBy(asc(workoutSessions.date), asc(workoutSets.order));

	const bySession = new Map<
		number,
		{ sessionId: number; date: string; sets: { reps: number; weight: number }[] }
	>();
	for (const row of rows) {
		if (!bySession.has(row.sessionId)) {
			bySession.set(row.sessionId, { sessionId: row.sessionId, date: row.date, sets: [] });
		}
		bySession.get(row.sessionId)!.sets.push({ reps: row.reps, weight: row.weight });
	}

	const history = Array.from(bySession.values())
		.map((session) => {
			const topWeight = Math.max(...session.sets.map((s) => s.weight));
			const bestOneRm = Math.max(...session.sets.map((s) => estimatedOneRepMax(s.weight, s.reps)));
			return { ...session, topWeight, bestOneRm };
		})
		.sort((a, b) => a.date.localeCompare(b.date));

	let heaviestWeight = 0;
	let mostReps = 0;
	let estimatedOneRm = 0;
	for (const row of rows) {
		if (row.weight > heaviestWeight) heaviestWeight = row.weight;
		if (row.reps > mostReps) mostReps = row.reps;
		const oneRm = estimatedOneRepMax(row.weight, row.reps);
		if (oneRm > estimatedOneRm) estimatedOneRm = oneRm;
	}

	return {
		exercise,
		history,
		prs: { heaviestWeight, mostReps, estimatedOneRm },
		hasData: rows.length > 0
	};
}
