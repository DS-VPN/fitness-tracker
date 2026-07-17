import { db } from '$lib/server/db';
import { nutritionTargets, mealLogs, meals, products } from '$lib/server/db/schema';
import { and, desc, eq, sql } from 'drizzle-orm';
import { computeMealMacros } from '$lib/server/repositories/meals';
import { canViewMeal } from '$lib/server/repositories/mealShares';

export type TargetsInput = { calories: number; protein: number; carbs: number; fat: number };

function normalizePortions(portions: number): number {
	if (!Number.isFinite(portions) || portions <= 0) return 1;
	return Math.round(portions * 100) / 100;
}

/** The user's daily targets (v1 always uses the 'default' label — other labels are reserved for day types later). */
export async function getTargets(userId: number) {
	const [row] = await db
		.select()
		.from(nutritionTargets)
		.where(and(eq(nutritionTargets.userId, userId), eq(nutritionTargets.label, 'default')));
	return row ?? null;
}

export async function saveTargets(userId: number, input: TargetsInput) {
	for (const [key, value] of Object.entries(input)) {
		if (!Number.isFinite(value) || value < 0) throw new Error(`Invalid ${key} target`);
	}
	await db
		.insert(nutritionTargets)
		.values({ userId, label: 'default', ...input, updatedAt: new Date() })
		.onConflictDoUpdate({
			target: [nutritionTargets.userId, nutritionTargets.label],
			set: { ...input, updatedAt: new Date() }
		});
}

/** Logs `portions` of a meal to the diary for `date`. Consumed macros = (recipe total / recipe portions) × eaten,
 *  snapshotted onto the entry so later recipe edits/deletions never rewrite this day. */
export async function logMealToDay(userId: number, mealId: number, portions: number, date: string) {
	// The meal may be the user's own or one shared with them — canViewMeal covers both. The log
	// row is still written under `userId`, so a recipient logs a shared meal into their own diary.
	if (!(await canViewMeal(userId, mealId))) throw new Error('Meal not found');
	const [meal] = await db
		.select({ id: meals.id, name: meals.name, portions: meals.portions })
		.from(meals)
		.where(eq(meals.id, mealId));
	if (!meal) throw new Error('Meal not found');

	const eaten = normalizePortions(portions);
	const total = await computeMealMacros(meal.id);
	const recipePortions = meal.portions > 0 ? meal.portions : 1;
	const factor = eaten / recipePortions;

	const [row] = await db
		.insert(mealLogs)
		.values({
			userId,
			date,
			name: meal.name,
			portions: eaten,
			calories: total.calories * factor,
			protein: total.protein * factor,
			carbs: total.carbs * factor,
			fat: total.fat * factor,
			mealId: meal.id,
			createdAt: new Date()
		})
		.returning();
	return row;
}

/** Logs `portions` servings of a product (its macros are per its defined amount/unit, e.g. 100 g) to the diary for `date`. */
export async function logProductToDay(userId: number, productId: number, portions: number, date: string) {
	const [product] = await db
		.select()
		.from(products)
		.where(and(eq(products.id, productId), eq(products.userId, userId)));
	if (!product) throw new Error('Product not found');

	const eaten = normalizePortions(portions);

	const [row] = await db
		.insert(mealLogs)
		.values({
			userId,
			date,
			name: product.name,
			brand: product.brand,
			portions: eaten,
			calories: product.calories * eaten,
			protein: product.protein * eaten,
			carbs: product.carbs * eaten,
			fat: product.fat * eaten,
			productId: product.id,
			createdAt: new Date()
		})
		.returning();
	return row;
}

export async function listDay(userId: number, date: string) {
	return db
		.select()
		.from(mealLogs)
		.where(and(eq(mealLogs.userId, userId), eq(mealLogs.date, date)))
		.orderBy(desc(mealLogs.createdAt), desc(mealLogs.id));
}

export async function daySummary(userId: number, date: string) {
	const [row] = await db
		.select({
			calories: sql<number>`coalesce(sum(${mealLogs.calories}), 0)`.mapWith(Number),
			protein: sql<number>`coalesce(sum(${mealLogs.protein}), 0)`.mapWith(Number),
			carbs: sql<number>`coalesce(sum(${mealLogs.carbs}), 0)`.mapWith(Number),
			fat: sql<number>`coalesce(sum(${mealLogs.fat}), 0)`.mapWith(Number)
		})
		.from(mealLogs)
		.where(and(eq(mealLogs.userId, userId), eq(mealLogs.date, date)));
	return row;
}

export async function deleteEntry(userId: number, id: number) {
	await db.delete(mealLogs).where(and(eq(mealLogs.id, id), eq(mealLogs.userId, userId)));
}

export type DaySummary = {
	date: string;
	calories: number;
	protein: number;
	carbs: number;
	fat: number;
	entryCount: number;
};

/** Recent days that have at least one logged entry, most recent first, with that day's totals.
 *  Powers the food-diary history list. */
export async function recentDaySummaries(userId: number, limit = 60): Promise<DaySummary[]> {
	return db
		.select({
			date: mealLogs.date,
			calories: sql<number>`coalesce(sum(${mealLogs.calories}), 0)`.mapWith(Number),
			protein: sql<number>`coalesce(sum(${mealLogs.protein}), 0)`.mapWith(Number),
			carbs: sql<number>`coalesce(sum(${mealLogs.carbs}), 0)`.mapWith(Number),
			fat: sql<number>`coalesce(sum(${mealLogs.fat}), 0)`.mapWith(Number),
			entryCount: sql<number>`count(*)`.mapWith(Number)
		})
		.from(mealLogs)
		.where(eq(mealLogs.userId, userId))
		.groupBy(mealLogs.date)
		.orderBy(desc(mealLogs.date))
		.limit(limit);
}
