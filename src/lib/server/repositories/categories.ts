import { db } from '$lib/server/db';
import { categories, mealCategories } from '$lib/server/db/schema';
import { eq, asc, sql } from 'drizzle-orm';

export async function listCategories() {
	return db
		.select({
			id: categories.id,
			name: categories.name,
			sortOrder: categories.sortOrder,
			mealCount: sql<number>`count(${mealCategories.mealId})`.mapWith(Number)
		})
		.from(categories)
		.leftJoin(mealCategories, eq(mealCategories.categoryId, categories.id))
		.groupBy(categories.id)
		.orderBy(asc(categories.sortOrder), asc(categories.name));
}

export async function createCategory(name: string) {
	const trimmed = name.trim();
	if (!trimmed) throw new Error('Category name is required');
	const [row] = await db.insert(categories).values({ name: trimmed }).returning();
	return row;
}

export async function renameCategory(id: number, name: string) {
	const trimmed = name.trim();
	if (!trimmed) throw new Error('Category name is required');
	await db.update(categories).set({ name: trimmed }).where(eq(categories.id, id));
}

export async function deleteCategory(id: number) {
	await db.delete(categories).where(eq(categories.id, id));
}
