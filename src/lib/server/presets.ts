import { db } from '$lib/server/db';
import { meals, exercises, users } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { presetMeals, presetExercises } from '$lib/server/presetData';

/** Inserts any preset meals/exercises userId doesn't already have (matched by name). Safe to call repeatedly. */
export async function seedPresetsForUser(userId: number) {
	const existingMealNames = new Set(
		(await db.select({ name: meals.name }).from(meals).where(eq(meals.userId, userId))).map((m) => m.name)
	);
	const mealsToInsert = presetMeals
		.filter((m) => !existingMealNames.has(m.name))
		.map((m) => ({ ...m, userId, createdAt: new Date(), updatedAt: new Date() }));
	if (mealsToInsert.length) await db.insert(meals).values(mealsToInsert);

	const existingExerciseNames = new Set(
		(await db.select({ name: exercises.name }).from(exercises).where(eq(exercises.userId, userId))).map(
			(e) => e.name
		)
	);
	const exercisesToInsert = presetExercises
		.filter((e) => !existingExerciseNames.has(e.name))
		.map((e) => ({ ...e, userId, createdAt: new Date() }));
	if (exercisesToInsert.length) await db.insert(exercises).values(exercisesToInsert);
}

/** Backfills presets for every existing account. Run once at server startup. */
export async function seedPresetsForAllUsers() {
	const allUsers = await db.select({ id: users.id }).from(users);
	for (const user of allUsers) {
		await seedPresetsForUser(user.id);
	}
}
