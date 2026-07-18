import { db } from '$lib/server/db';
import { exercises, users, catalogProducts } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { presetExercises } from '$lib/server/presetData';
import { catalogProducts as catalogData } from '$lib/server/catalogData';

/** Inserts any preset exercises userId doesn't already have (matched by name). Safe to call repeatedly. */
export async function seedPresetsForUser(userId: number) {
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

/** Seeds the shared Open Food Facts product catalog (global, not per-user). Idempotent: keyed on
 *  off_code with onConflictDoNothing, so re-runs on every boot are cheap and never duplicate. */
export async function seedCatalog() {
	if (catalogData.length === 0) return;
	const now = new Date();
	// Insert in chunks to stay well under SQLite's variable limit.
	const CHUNK = 200;
	for (let i = 0; i < catalogData.length; i += CHUNK) {
		const rows = catalogData.slice(i, i + CHUNK).map((c) => ({ ...c, createdAt: now }));
		await db.insert(catalogProducts).values(rows).onConflictDoNothing({ target: catalogProducts.offCode });
	}
}
