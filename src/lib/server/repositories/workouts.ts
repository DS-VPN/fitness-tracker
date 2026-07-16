import { db } from '$lib/server/db';
import { workoutSessions, workoutSets, exercises } from '$lib/server/db/schema';
import { and, asc, desc, eq, sql } from 'drizzle-orm';

export async function listSessions() {
	return db
		.select({
			id: workoutSessions.id,
			date: workoutSessions.date,
			notes: workoutSessions.notes,
			createdAt: workoutSessions.createdAt,
			setCount: sql<number>`count(${workoutSets.id})`.mapWith(Number),
			exerciseCount: sql<number>`count(distinct ${workoutSets.exerciseId})`.mapWith(Number)
		})
		.from(workoutSessions)
		.leftJoin(workoutSets, eq(workoutSets.sessionId, workoutSessions.id))
		.groupBy(workoutSessions.id)
		.orderBy(desc(workoutSessions.date), desc(workoutSessions.createdAt));
}

export async function createSession(date: string, notes?: string | null) {
	const [row] = await db
		.insert(workoutSessions)
		.values({ date, notes: notes?.trim() || null, createdAt: new Date() })
		.returning();
	return row;
}

export async function updateSession(id: number, date: string, notes?: string | null) {
	await db
		.update(workoutSessions)
		.set({ date, notes: notes?.trim() || null })
		.where(eq(workoutSessions.id, id));
}

export async function deleteSession(id: number) {
	await db.delete(workoutSessions).where(eq(workoutSessions.id, id));
}

export async function getSessionWithSets(id: number) {
	const [session] = await db.select().from(workoutSessions).where(eq(workoutSessions.id, id));
	if (!session) return null;

	const rows = await db
		.select({
			id: workoutSets.id,
			exerciseId: workoutSets.exerciseId,
			exerciseName: exercises.name,
			order: workoutSets.order,
			reps: workoutSets.reps,
			weight: workoutSets.weight,
			rpe: workoutSets.rpe,
			notes: workoutSets.notes
		})
		.from(workoutSets)
		.innerJoin(exercises, eq(exercises.id, workoutSets.exerciseId))
		.where(eq(workoutSets.sessionId, id))
		.orderBy(asc(workoutSets.order));

	const groups = new Map<number, { exerciseId: number; exerciseName: string; sets: typeof rows }>();
	for (const row of rows) {
		if (!groups.has(row.exerciseId)) {
			groups.set(row.exerciseId, { exerciseId: row.exerciseId, exerciseName: row.exerciseName, sets: [] });
		}
		groups.get(row.exerciseId)!.sets.push(row);
	}

	return { session, exerciseGroups: Array.from(groups.values()) };
}

export async function addSet(
	sessionId: number,
	exerciseId: number,
	data: { reps: number; weight: number; rpe?: number | null; notes?: string | null }
) {
	const [{ maxOrder }] = await db
		.select({ maxOrder: sql<number>`coalesce(max(${workoutSets.order}), -1)`.mapWith(Number) })
		.from(workoutSets)
		.where(eq(workoutSets.sessionId, sessionId));

	const [row] = await db
		.insert(workoutSets)
		.values({
			sessionId,
			exerciseId,
			order: maxOrder + 1,
			reps: data.reps,
			weight: data.weight,
			rpe: data.rpe ?? null,
			notes: data.notes?.trim() || null,
			createdAt: new Date()
		})
		.returning();
	return row;
}

export async function updateSet(
	id: number,
	data: { reps: number; weight: number; rpe?: number | null; notes?: string | null }
) {
	await db
		.update(workoutSets)
		.set({ reps: data.reps, weight: data.weight, rpe: data.rpe ?? null, notes: data.notes?.trim() || null })
		.where(eq(workoutSets.id, id));
}

export async function deleteSet(id: number) {
	await db.delete(workoutSets).where(eq(workoutSets.id, id));
}

/** Sets for a given exercise across all sessions, most recent first — used for repeating last session's numbers. */
export async function lastSetsForExercise(exerciseId: number, excludeSessionId?: number) {
	const conditions = [eq(workoutSets.exerciseId, exerciseId)];
	if (excludeSessionId) conditions.push(sql`${workoutSets.sessionId} != ${excludeSessionId}`);

	return db
		.select({
			sessionId: workoutSets.sessionId,
			date: workoutSessions.date,
			reps: workoutSets.reps,
			weight: workoutSets.weight,
			order: workoutSets.order
		})
		.from(workoutSets)
		.innerJoin(workoutSessions, eq(workoutSessions.id, workoutSets.sessionId))
		.where(and(...conditions))
		.orderBy(desc(workoutSessions.date), desc(workoutSets.order))
		.limit(10);
}
