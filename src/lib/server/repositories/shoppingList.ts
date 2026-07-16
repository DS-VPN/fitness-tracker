import { db } from '$lib/server/db';
import { shoppingListItems, meals } from '$lib/server/db/schema';
import { and, asc, eq, isNull, sql } from 'drizzle-orm';

export async function listShoppingList() {
	const rows = await db.select().from(shoppingListItems).orderBy(asc(shoppingListItems.createdAt));
	return {
		fromMeals: rows.filter((r) => r.mealId !== null),
		manual: rows.filter((r) => r.mealId === null)
	};
}

/** Adds a meal's product to the list, combining with an existing (unchecked or checked) line for that meal. */
export async function addMealToList(mealId: number) {
	const [meal] = await db.select().from(meals).where(eq(meals.id, mealId));
	if (!meal) throw new Error('Meal not found');

	const [existing] = await db.select().from(shoppingListItems).where(eq(shoppingListItems.mealId, mealId));

	if (existing) {
		await db
			.update(shoppingListItems)
			.set({ quantity: existing.quantity + 1, checked: false })
			.where(eq(shoppingListItems.id, existing.id));
		return;
	}

	await db.insert(shoppingListItems).values({
		mealId: meal.id,
		name: meal.name,
		brand: meal.brand,
		quantity: 1,
		checked: false
	});
}

export async function addManualItem(name: string, brand?: string) {
	const trimmed = name.trim();
	if (!trimmed) throw new Error('Item name is required');

	const [existing] = await db
		.select()
		.from(shoppingListItems)
		.where(and(isNull(shoppingListItems.mealId), sql`lower(${shoppingListItems.name}) = lower(${trimmed})`));

	if (existing) {
		await db
			.update(shoppingListItems)
			.set({ quantity: existing.quantity + 1, checked: false })
			.where(eq(shoppingListItems.id, existing.id));
		return;
	}

	await db.insert(shoppingListItems).values({ name: trimmed, brand: brand?.trim() || null, quantity: 1 });
}

export async function setChecked(id: number, checked: boolean) {
	await db.update(shoppingListItems).set({ checked }).where(eq(shoppingListItems.id, id));
}

export async function setQuantity(id: number, quantity: number) {
	await db
		.update(shoppingListItems)
		.set({ quantity: Math.max(1, Math.round(quantity)) })
		.where(eq(shoppingListItems.id, id));
}

export async function removeItem(id: number) {
	await db.delete(shoppingListItems).where(eq(shoppingListItems.id, id));
}

export async function clearChecked() {
	await db.delete(shoppingListItems).where(eq(shoppingListItems.checked, true));
}
