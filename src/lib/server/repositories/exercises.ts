import { db } from '$lib/server/db';
import { exercises, workoutSets } from '$lib/server/db/schema';
import { asc, eq, sql } from 'drizzle-orm';

export async function listExercises() {
	return db
		.select({
			id: exercises.id,
			name: exercises.name,
			muscleGroup: exercises.muscleGroup,
			setCount: sql<number>`count(${workoutSets.id})`.mapWith(Number)
		})
		.from(exercises)
		.leftJoin(workoutSets, eq(workoutSets.exerciseId, exercises.id))
		.groupBy(exercises.id)
		.orderBy(asc(exercises.name));
}

export async function getExercise(id: number) {
	const [row] = await db.select().from(exercises).where(eq(exercises.id, id));
	return row ?? null;
}

export async function createExercise(name: string, muscleGroup?: string | null) {
	const trimmed = name.trim();
	if (!trimmed) throw new Error('Exercise name is required');
	const [row] = await db
		.insert(exercises)
		.values({ name: trimmed, muscleGroup: muscleGroup?.trim() || null, createdAt: new Date() })
		.returning();
	return row;
}

export async function updateExercise(id: number, name: string, muscleGroup?: string | null) {
	await db
		.update(exercises)
		.set({ name: name.trim(), muscleGroup: muscleGroup?.trim() || null })
		.where(eq(exercises.id, id));
}

export async function deleteExercise(id: number) {
	await db.delete(exercises).where(eq(exercises.id, id));
}
