import { db } from '$lib/server/db';
import { exerciseGoals, exercises, workoutSets, workoutSessions } from '$lib/server/db/schema';
import { and, desc, eq, gte } from 'drizzle-orm';

async function assertExerciseOwned(userId: number, exerciseId: number) {
	const [row] = await db
		.select({ id: exercises.id })
		.from(exercises)
		.where(and(eq(exercises.id, exerciseId), eq(exercises.userId, userId)));
	if (!row) throw new Error('Exercise not found');
}

export async function getGoal(userId: number, exerciseId: number) {
	const [row] = await db
		.select({
			id: exerciseGoals.id,
			exerciseId: exerciseGoals.exerciseId,
			targetWeight: exerciseGoals.targetWeight,
			targetReps: exerciseGoals.targetReps
		})
		.from(exerciseGoals)
		.innerJoin(exercises, eq(exercises.id, exerciseGoals.exerciseId))
		.where(and(eq(exerciseGoals.exerciseId, exerciseId), eq(exercises.userId, userId)));
	return row ?? null;
}

export async function upsertGoal(userId: number, exerciseId: number, targetWeight: number, targetReps: number) {
	await assertExerciseOwned(userId, exerciseId);
	if (!Number.isFinite(targetWeight) || targetWeight <= 0) throw new Error('Target weight must be greater than 0');
	if (!Number.isFinite(targetReps) || targetReps < 1) throw new Error('Target reps must be at least 1');

	await db
		.insert(exerciseGoals)
		.values({ exerciseId, targetWeight, targetReps: Math.round(targetReps), createdAt: new Date(), updatedAt: new Date() })
		.onConflictDoUpdate({
			target: exerciseGoals.exerciseId,
			set: { targetWeight, targetReps: Math.round(targetReps), updatedAt: new Date() }
		});
}

export async function deleteGoal(userId: number, exerciseId: number) {
	await assertExerciseOwned(userId, exerciseId);
	await db.delete(exerciseGoals).where(eq(exerciseGoals.exerciseId, exerciseId));
}

/** Best logged set for a goal: highest weight among sets meeting the rep target ("qualifying"), plus the
 *  heaviest set overall as a fallback reference when nothing qualifies yet. */
async function bestSetsForGoal(userId: number, exerciseId: number, targetReps: number) {
	const base = [eq(workoutSets.exerciseId, exerciseId), eq(workoutSessions.userId, userId)];
	const [qualifying] = await db
		.select({ weight: workoutSets.weight, reps: workoutSets.reps })
		.from(workoutSets)
		.innerJoin(workoutSessions, eq(workoutSessions.id, workoutSets.sessionId))
		.where(and(...base, gte(workoutSets.reps, targetReps)))
		.orderBy(desc(workoutSets.weight), desc(workoutSets.reps))
		.limit(1);
	const [overall] = await db
		.select({ weight: workoutSets.weight, reps: workoutSets.reps })
		.from(workoutSets)
		.innerJoin(workoutSessions, eq(workoutSessions.id, workoutSets.sessionId))
		.where(and(...base))
		.orderBy(desc(workoutSets.weight), desc(workoutSets.reps))
		.limit(1);
	return { qualifying: qualifying ?? null, overall: overall ?? null };
}

export type GoalProgress = {
	exerciseId: number;
	exerciseName: string;
	exerciseBrand: string | null;
	targetWeight: number;
	targetReps: number;
	/** Highest-weight set that met the rep target, if any. */
	bestQualifying: { weight: number; reps: number } | null;
	/** Heaviest set regardless of reps — shown as context when nothing qualifies yet. */
	bestOverall: { weight: number; reps: number } | null;
	/** bestQualifying.weight / targetWeight, capped at 1. 0 until a set meets the rep target. */
	progress: number;
	achieved: boolean;
};

/** Every goal of the user's with live progress from logged sets, ranked closest-to-goal first. */
export async function goalsWithProgress(userId: number): Promise<GoalProgress[]> {
	const goals = await db
		.select({
			exerciseId: exerciseGoals.exerciseId,
			targetWeight: exerciseGoals.targetWeight,
			targetReps: exerciseGoals.targetReps,
			exerciseName: exercises.name,
			exerciseBrand: exercises.brand
		})
		.from(exerciseGoals)
		.innerJoin(exercises, eq(exercises.id, exerciseGoals.exerciseId))
		.where(eq(exercises.userId, userId));

	const results: GoalProgress[] = [];
	for (const goal of goals) {
		const { qualifying, overall } = await bestSetsForGoal(userId, goal.exerciseId, goal.targetReps);
		const progress = qualifying ? Math.min(qualifying.weight / goal.targetWeight, 1) : 0;
		results.push({
			...goal,
			bestQualifying: qualifying,
			bestOverall: overall,
			progress,
			achieved: !!qualifying && qualifying.weight >= goal.targetWeight
		});
	}
	return results.sort((a, b) => b.progress - a.progress);
}

/** Goals keyed by exerciseId — for showing goal chips inline in workout mode. */
export async function goalsByExercise(userId: number): Promise<Record<number, { targetWeight: number; targetReps: number }>> {
	const rows = await db
		.select({
			exerciseId: exerciseGoals.exerciseId,
			targetWeight: exerciseGoals.targetWeight,
			targetReps: exerciseGoals.targetReps
		})
		.from(exerciseGoals)
		.innerJoin(exercises, eq(exercises.id, exerciseGoals.exerciseId))
		.where(eq(exercises.userId, userId));
	const map: Record<number, { targetWeight: number; targetReps: number }> = {};
	for (const row of rows) map[row.exerciseId] = { targetWeight: row.targetWeight, targetReps: row.targetReps };
	return map;
}
