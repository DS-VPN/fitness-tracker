import { db } from '$lib/server/db';
import { categories, mealCategories } from '$lib/server/db/schema';
import { and, eq, asc, sql } from 'drizzle-orm';

export async function listCategories(userId: number) {
	return db
		.select({
			id: categories.id,
			name: categories.name,
			sortOrder: categories.sortOrder,
			mealCount: sql<number>`count(${mealCategories.mealId})`.mapWith(Number)
		})
		.from(categories)
		.leftJoin(mealCategories, eq(mealCategories.categoryId, categories.id))
		.where(eq(categories.userId, userId))
		.groupBy(categories.id)
		.orderBy(asc(categories.sortOrder), asc(categories.name));
}

export async function createCategory(userId: number, name: string) {
	const trimmed = name.trim();
	if (!trimmed) throw new Error('Category name is required');
	const [row] = await db.insert(categories).values({ userId, name: trimmed }).returning();
	return row;
}

export async function renameCategory(userId: number, id: number, name: string) {
	const trimmed = name.trim();
	if (!trimmed) throw new Error('Category name is required');
	await db
		.update(categories)
		.set({ name: trimmed })
		.where(and(eq(categories.id, id), eq(categories.userId, userId)));
}

export async function deleteCategory(userId: number, id: number) {
	await db.delete(categories).where(and(eq(categories.id, id), eq(categories.userId, userId)));
}
