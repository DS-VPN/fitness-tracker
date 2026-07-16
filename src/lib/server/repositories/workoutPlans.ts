import { db } from '$lib/server/db';
import { workoutPlans, planExercises, exercises } from '$lib/server/db/schema';
import { and, asc, eq, sql } from 'drizzle-orm';

export async function listPlans(userId: number) {
	return db
		.select({
			id: workoutPlans.id,
			name: workoutPlans.name,
			createdAt: workoutPlans.createdAt,
			exerciseCount: sql<number>`count(${planExercises.id})`.mapWith(Number)
		})
		.from(workoutPlans)
		.leftJoin(planExercises, eq(planExercises.planId, workoutPlans.id))
		.where(eq(workoutPlans.userId, userId))
		.groupBy(workoutPlans.id)
		.orderBy(asc(workoutPlans.name));
}

export async function createPlan(userId: number, name: string) {
	const trimmed = name.trim();
	if (!trimmed) throw new Error('Name is required');
	const [row] = await db.insert(workoutPlans).values({ userId, name: trimmed, createdAt: new Date() }).returning();
	return row;
}

export async function renamePlan(userId: number, id: number, name: string) {
	const trimmed = name.trim();
	if (!trimmed) throw new Error('Name is required');
	await db
		.update(workoutPlans)
		.set({ name: trimmed })
		.where(and(eq(workoutPlans.id, id), eq(workoutPlans.userId, userId)));
}

export async function deletePlan(userId: number, id: number) {
	await db.delete(workoutPlans).where(and(eq(workoutPlans.id, id), eq(workoutPlans.userId, userId)));
}

async function assertPlanOwned(userId: number, planId: number) {
	const [row] = await db
		.select({ id: workoutPlans.id })
		.from(workoutPlans)
		.where(and(eq(workoutPlans.id, planId), eq(workoutPlans.userId, userId)));
	if (!row) throw new Error('Plan not found');
}

export async function getPlan(userId: number, id: number) {
	const [plan] = await db
		.select()
		.from(workoutPlans)
		.where(and(eq(workoutPlans.id, id), eq(workoutPlans.userId, userId)));
	if (!plan) return null;

	const rows = await db
		.select({
			id: planExercises.id,
			exerciseId: planExercises.exerciseId,
			exerciseName: exercises.name,
			muscleGroup: exercises.muscleGroup,
			targetSets: planExercises.targetSets
		})
		.from(planExercises)
		.innerJoin(exercises, eq(exercises.id, planExercises.exerciseId))
		.where(eq(planExercises.planId, id))
		.orderBy(asc(planExercises.sortOrder), asc(planExercises.id));

	return { plan, exercises: rows };
}

export async function addPlanExercise(userId: number, planId: number, exerciseId: number, targetSets?: number | null) {
	await assertPlanOwned(userId, planId);
	const [exercise] = await db
		.select({ id: exercises.id })
		.from(exercises)
		.where(and(eq(exercises.id, exerciseId), eq(exercises.userId, userId)));
	if (!exercise) throw new Error('Exercise not found');

	const [{ maxOrder }] = await db
		.select({ maxOrder: sql<number>`coalesce(max(${planExercises.sortOrder}), -1)`.mapWith(Number) })
		.from(planExercises)
		.where(eq(planExercises.planId, planId));

	const [row] = await db
		.insert(planExercises)
		.values({ planId, exerciseId, targetSets: targetSets ?? null, sortOrder: maxOrder + 1, createdAt: new Date() })
		.returning();
	return row;
}

export async function updatePlanExerciseTargetSets(
	userId: number,
	planId: number,
	planExerciseId: number,
	targetSets: number | null
) {
	await assertPlanOwned(userId, planId);
	await db
		.update(planExercises)
		.set({ targetSets })
		.where(and(eq(planExercises.id, planExerciseId), eq(planExercises.planId, planId)));
}

export async function removePlanExercise(userId: number, planId: number, planExerciseId: number) {
	await assertPlanOwned(userId, planId);
	await db
		.delete(planExercises)
		.where(and(eq(planExercises.id, planExerciseId), eq(planExercises.planId, planId)));
}
