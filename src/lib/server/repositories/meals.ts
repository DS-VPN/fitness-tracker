import { db } from '$lib/server/db';
import { meals, categories, mealCategories } from '$lib/server/db/schema';
import { and, eq, inArray, like, or, asc, desc } from 'drizzle-orm';

export type MealInput = {
	name: string;
	brand?: string | null;
	servingSize?: string | null;
	calories: number;
	protein: number;
	carbs: number;
	fat: number;
	fiber?: number | null;
	sugar?: number | null;
	sodium?: number | null;
};

async function attachCategories<T extends { id: number }>(rows: T[]) {
	if (rows.length === 0) return rows.map((r) => ({ ...r, categories: [] as { id: number; name: string }[] }));

	const mealIds = rows.map((r) => r.id);
	const links = await db
		.select({ mealId: mealCategories.mealId, id: categories.id, name: categories.name })
		.from(mealCategories)
		.innerJoin(categories, eq(categories.id, mealCategories.categoryId))
		.where(inArray(mealCategories.mealId, mealIds));

	const byMeal = new Map<number, { id: number; name: string }[]>();
	for (const link of links) {
		const list = byMeal.get(link.mealId) ?? [];
		list.push({ id: link.id, name: link.name });
		byMeal.set(link.mealId, list);
	}

	return rows.map((r) => ({ ...r, categories: byMeal.get(r.id) ?? [] }));
}

/** Filters categoryIds down to only those actually owned by userId (defense in depth against cross-account linking). */
async function ownedCategoryIds(userId: number, categoryIds: number[]): Promise<number[]> {
	if (categoryIds.length === 0) return [];
	const rows = await db
		.select({ id: categories.id })
		.from(categories)
		.where(and(eq(categories.userId, userId), inArray(categories.id, categoryIds)));
	return rows.map((r) => r.id);
}

export async function listMeals(userId: number, opts: { search?: string; categoryId?: number } = {}) {
	const { search, categoryId } = opts;

	let mealIdFilter: number[] | undefined;
	if (categoryId) {
		const rows = await db
			.select({ mealId: mealCategories.mealId })
			.from(mealCategories)
			.innerJoin(categories, eq(categories.id, mealCategories.categoryId))
			.where(and(eq(mealCategories.categoryId, categoryId), eq(categories.userId, userId)));
		mealIdFilter = rows.map((r) => r.mealId);
		if (mealIdFilter.length === 0) return [];
	}

	const conditions = [eq(meals.userId, userId)];
	if (search?.trim()) {
		const term = `%${search.trim()}%`;
		conditions.push(or(like(meals.name, term), like(meals.brand, term))!);
	}
	if (mealIdFilter) conditions.push(inArray(meals.id, mealIdFilter));

	const rows = await db
		.select()
		.from(meals)
		.where(and(...conditions))
		.orderBy(asc(meals.name));

	return attachCategories(rows);
}

export async function recentMeals(userId: number, limit: number) {
	const rows = await db
		.select()
		.from(meals)
		.where(eq(meals.userId, userId))
		.orderBy(desc(meals.createdAt))
		.limit(limit);
	return attachCategories(rows);
}

export async function getMeal(userId: number, id: number) {
	const [meal] = await db
		.select()
		.from(meals)
		.where(and(eq(meals.id, id), eq(meals.userId, userId)));
	if (!meal) return null;
	const [withCategories] = await attachCategories([meal]);
	return withCategories;
}

export async function createMeal(userId: number, data: MealInput, categoryIds: number[]) {
	const now = new Date();
	const [row] = await db
		.insert(meals)
		.values({ ...data, userId, createdAt: now, updatedAt: now })
		.returning();

	const validCategoryIds = await ownedCategoryIds(userId, categoryIds);
	if (validCategoryIds.length) {
		await db.insert(mealCategories).values(validCategoryIds.map((categoryId) => ({ mealId: row.id, categoryId })));
	}

	return row;
}

export async function updateMeal(userId: number, id: number, data: MealInput, categoryIds: number[]) {
	const [owned] = await db
		.select({ id: meals.id })
		.from(meals)
		.where(and(eq(meals.id, id), eq(meals.userId, userId)));
	if (!owned) return;

	await db
		.update(meals)
		.set({ ...data, updatedAt: new Date() })
		.where(eq(meals.id, id));

	await db.delete(mealCategories).where(eq(mealCategories.mealId, id));
	const validCategoryIds = await ownedCategoryIds(userId, categoryIds);
	if (validCategoryIds.length) {
		await db.insert(mealCategories).values(validCategoryIds.map((categoryId) => ({ mealId: id, categoryId })));
	}
}

export async function deleteMeal(userId: number, id: number) {
	await db.delete(meals).where(and(eq(meals.id, id), eq(meals.userId, userId)));
}
