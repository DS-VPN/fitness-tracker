import { db } from '$lib/server/db';
import { products, exercises, users } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { presetProducts, presetExercises } from '$lib/server/presetData';

/** Inserts any preset products/exercises userId doesn't already have (matched by name). Safe to call repeatedly. */
export async function seedPresetsForUser(userId: number) {
	const existingProductNames = new Set(
		(await db.select({ name: products.name }).from(products).where(eq(products.userId, userId))).map((p) => p.name)
	);
	const productsToInsert = presetProducts
		.filter((p) => !existingProductNames.has(p.name))
		.map((p) => ({ ...p, userId, createdAt: new Date(), updatedAt: new Date() }));
	if (productsToInsert.length) await db.insert(products).values(productsToInsert);

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
