import { db } from '$lib/server/db';
import { mealShares, meals, categories, mealCategories, users } from '$lib/server/db/schema';
import { and, asc, eq, inArray, isNull, sql } from 'drizzle-orm';

/** Distinct owners who have shared at least one meal/category/library with `userId`.
 *  Drives the "Mine / Anna's meals" switcher on the meals page. */
export async function listMealsSharedWithMe(userId: number) {
	const rows = await db
		.select({ ownerId: users.id, ownerUsername: users.username })
		.from(mealShares)
		.innerJoin(users, eq(users.id, mealShares.ownerId))
		.where(eq(mealShares.sharedWithUserId, userId))
		.orderBy(asc(users.username));

	// De-dup owners (a pair can hold many grants) while preserving username order.
	const seen = new Set<number>();
	const result: { ownerId: number; ownerUsername: string }[] = [];
	for (const r of rows) {
		if (seen.has(r.ownerId)) continue;
		seen.add(r.ownerId);
		result.push(r);
	}
	return result;
}

export type MealShareView = {
	id: number;
	sharedWithUserId: number;
	username: string;
	scope: 'library' | 'category' | 'meal';
	label: string;
};

/** Owner-facing list of outgoing grants, each with the recipient's name and a scope label.
 *  Optionally filtered to a single meal (used by the meal-detail share modal). */
export async function listMyMealShares(ownerId: number, opts: { mealId?: number } = {}): Promise<MealShareView[]> {
	const conditions = [eq(mealShares.ownerId, ownerId)];
	if (opts.mealId !== undefined) conditions.push(eq(mealShares.mealId, opts.mealId));

	const rows = await db
		.select({
			id: mealShares.id,
			sharedWithUserId: mealShares.sharedWithUserId,
			username: users.username,
			mealId: mealShares.mealId,
			categoryId: mealShares.categoryId,
			mealName: meals.name,
			categoryName: categories.name
		})
		.from(mealShares)
		.innerJoin(users, eq(users.id, mealShares.sharedWithUserId))
		.leftJoin(meals, eq(meals.id, mealShares.mealId))
		.leftJoin(categories, eq(categories.id, mealShares.categoryId))
		.where(and(...conditions))
		.orderBy(asc(users.username));

	return rows.map((r) => {
		if (r.mealId != null) {
			return { id: r.id, sharedWithUserId: r.sharedWithUserId, username: r.username, scope: 'meal' as const, label: r.mealName ?? 'Meal' };
		}
		if (r.categoryId != null) {
			return { id: r.id, sharedWithUserId: r.sharedWithUserId, username: r.username, scope: 'category' as const, label: r.categoryName ?? 'Category' };
		}
		return { id: r.id, sharedWithUserId: r.sharedWithUserId, username: r.username, scope: 'library' as const, label: 'All meals' };
	});
}

/** Grant `targetUsername` access to the owner's meals at the given scope: pass a mealId for a
 *  single meal, a categoryId for a whole category, or neither for the entire library. Verifies
 *  the target/meal/category and skips exact duplicates. */
export async function shareMealsWith(
	ownerId: number,
	targetUsername: string,
	scope: { mealId?: number; categoryId?: number } = {}
) {
	const trimmed = targetUsername.trim();
	if (!trimmed) throw new Error('Username is required');
	if (scope.mealId != null && scope.categoryId != null) {
		throw new Error('Choose either a meal or a category, not both');
	}

	const [target] = await db
		.select({ id: users.id })
		.from(users)
		.where(sql`lower(${users.username}) = lower(${trimmed})`);
	if (!target) throw new Error('No user with that username');
	if (target.id === ownerId) throw new Error('You already have access to your own meals');

	if (scope.mealId != null) {
		const [meal] = await db
			.select({ id: meals.id })
			.from(meals)
			.where(and(eq(meals.id, scope.mealId), eq(meals.userId, ownerId)));
		if (!meal) throw new Error('Meal not found');
	}
	if (scope.categoryId != null) {
		const [category] = await db
			.select({ id: categories.id })
			.from(categories)
			.where(and(eq(categories.id, scope.categoryId), eq(categories.userId, ownerId)));
		if (!category) throw new Error('Category not found');
	}

	// De-dup the exact same grant. NULLs are distinct in a UNIQUE index, so the library case
	// (both null) can't be covered by a constraint — check it here (mirrors upsertSource).
	const mealCond = scope.mealId != null ? eq(mealShares.mealId, scope.mealId) : isNull(mealShares.mealId);
	const categoryCond = scope.categoryId != null ? eq(mealShares.categoryId, scope.categoryId) : isNull(mealShares.categoryId);
	const [existing] = await db
		.select({ id: mealShares.id })
		.from(mealShares)
		.where(and(eq(mealShares.ownerId, ownerId), eq(mealShares.sharedWithUserId, target.id), mealCond, categoryCond));
	if (existing) throw new Error('That is already shared with this user');

	await db.insert(mealShares).values({
		ownerId,
		sharedWithUserId: target.id,
		mealId: scope.mealId ?? null,
		categoryId: scope.categoryId ?? null
	});
}

/** Owner revokes one specific grant (by id). */
export async function revokeMealShare(ownerId: number, shareId: number) {
	await db.delete(mealShares).where(and(eq(mealShares.id, shareId), eq(mealShares.ownerId, ownerId)));
}

/** Recipient removes all of `ownerId`'s grants to themselves. */
export async function leaveSharedMeals(userId: number, ownerId: number) {
	await db
		.delete(mealShares)
		.where(and(eq(mealShares.ownerId, ownerId), eq(mealShares.sharedWithUserId, userId)));
}

/** True if `actingUserId` may view `mealId`: they own it, or a grant from the meal's owner
 *  covers it (whole library, a category the meal belongs to, or that single meal). */
export async function canViewMeal(actingUserId: number, mealId: number): Promise<boolean> {
	const [meal] = await db.select({ id: meals.id, userId: meals.userId }).from(meals).where(eq(meals.id, mealId));
	if (!meal) return false;
	if (meal.userId === actingUserId) return true;

	// Any grant from this owner to the acting user that covers this meal.
	const grants = await db
		.select({ mealId: mealShares.mealId, categoryId: mealShares.categoryId })
		.from(mealShares)
		.where(and(eq(mealShares.ownerId, meal.userId), eq(mealShares.sharedWithUserId, actingUserId)));
	if (grants.length === 0) return false;

	if (grants.some((g) => g.mealId == null && g.categoryId == null)) return true; // library grant
	if (grants.some((g) => g.mealId === mealId)) return true; // this exact meal

	const categoryIds = grants.filter((g) => g.categoryId != null).map((g) => g.categoryId!);
	if (categoryIds.length) {
		const [inCategory] = await db
			.select({ mealId: mealCategories.mealId })
			.from(mealCategories)
			.where(and(eq(mealCategories.mealId, mealId), inArray(mealCategories.categoryId, categoryIds)));
		if (inCategory) return true;
	}
	return false;
}

/** The set of `ownerId`'s meals that `actingUserId` may view. Returns 'all' when a library
 *  grant exists, otherwise the union of (meals in shared categories) ∪ (single shared meals). */
export async function accessibleMealIds(actingUserId: number, ownerId: number): Promise<'all' | number[]> {
	const grants = await db
		.select({ mealId: mealShares.mealId, categoryId: mealShares.categoryId })
		.from(mealShares)
		.where(and(eq(mealShares.ownerId, ownerId), eq(mealShares.sharedWithUserId, actingUserId)));
	if (grants.length === 0) return [];

	if (grants.some((g) => g.mealId == null && g.categoryId == null)) return 'all';

	const ids = new Set<number>();
	for (const g of grants) if (g.mealId != null) ids.add(g.mealId);

	const categoryIds = grants.filter((g) => g.categoryId != null).map((g) => g.categoryId!);
	if (categoryIds.length) {
		const rows = await db
			.select({ mealId: mealCategories.mealId })
			.from(mealCategories)
			.where(inArray(mealCategories.categoryId, categoryIds));
		for (const r of rows) ids.add(r.mealId);
	}
	return [...ids];
}
