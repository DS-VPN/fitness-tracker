import { db } from '$lib/server/db';
import { shoppingListItems, meals, users, shoppingListShares, products } from '$lib/server/db/schema';
import { and, asc, eq, isNull, sql } from 'drizzle-orm';
import { resolveMealProducts } from '$lib/server/repositories/meals';

export async function hasListAccess(actingUserId: number, ownerId: number): Promise<boolean> {
	if (actingUserId === ownerId) return true;
	const [row] = await db
		.select({ id: shoppingListShares.id })
		.from(shoppingListShares)
		.where(and(eq(shoppingListShares.ownerId, ownerId), eq(shoppingListShares.sharedWithUserId, actingUserId)));
	return !!row;
}

async function assertAccess(actingUserId: number, ownerId: number) {
	if (!(await hasListAccess(actingUserId, ownerId))) {
		throw new Error('You do not have access to this shopping list');
	}
}

export async function listShoppingList(ownerId: number) {
	const rows = await db
		.select()
		.from(shoppingListItems)
		.where(eq(shoppingListItems.userId, ownerId))
		.orderBy(asc(shoppingListItems.createdAt));
	return {
		fromMeals: rows.filter((r) => r.mealId !== null),
		manual: rows.filter((r) => r.mealId === null)
	};
}

/** Adds every product that makes up a meal (recursing through one level of sub-meals, using the recipe's own
 *  quantities) to the user's own list — never adds the meal's own name as a line item, since you can't buy
 *  "1x Taco Night" at a store, only tortillas/ground beef/cheese/etc. Returns how many product lines were added. */
export async function addMealToList(userId: number, mealId: number): Promise<number> {
	const [meal] = await db.select({ id: meals.id }).from(meals).where(and(eq(meals.id, mealId), eq(meals.userId, userId)));
	if (!meal) throw new Error('Meal not found');

	const resolved = await resolveMealProducts(mealId);
	await addProductsToList(userId, resolved);
	return resolved.length;
}

/** Quick-add a product straight to the user's own list — merges into an existing manual item with the same name, like addManualItem does. */
export async function addProductToList(userId: number, productId: number, quantity: number = 1) {
	const [product] = await db
		.select()
		.from(products)
		.where(and(eq(products.id, productId), eq(products.userId, userId)));
	if (!product) throw new Error('Product not found');

	const [existing] = await db
		.select()
		.from(shoppingListItems)
		.where(
			and(
				eq(shoppingListItems.userId, userId),
				isNull(shoppingListItems.mealId),
				sql`lower(${shoppingListItems.name}) = lower(${product.name})`
			)
		);

	if (existing) {
		await db
			.update(shoppingListItems)
			.set({ quantity: existing.quantity + quantity, checked: false })
			.where(eq(shoppingListItems.id, existing.id));
		return;
	}

	await db.insert(shoppingListItems).values({ userId, name: product.name, brand: product.brand, quantity, checked: false });
}

/** Bulk quick-add — used for "add all of this sub-meal's products at once". */
export async function addProductsToList(userId: number, items: { productId: number; quantity: number }[]) {
	for (const item of items) {
		await addProductToList(userId, item.productId, item.quantity);
	}
}

export async function addManualItem(actingUserId: number, ownerId: number, name: string, brand?: string) {
	await assertAccess(actingUserId, ownerId);
	const trimmed = name.trim();
	if (!trimmed) throw new Error('Item name is required');

	const [existing] = await db
		.select()
		.from(shoppingListItems)
		.where(
			and(
				eq(shoppingListItems.userId, ownerId),
				isNull(shoppingListItems.mealId),
				sql`lower(${shoppingListItems.name}) = lower(${trimmed})`
			)
		);

	if (existing) {
		await db
			.update(shoppingListItems)
			.set({ quantity: existing.quantity + 1, checked: false })
			.where(eq(shoppingListItems.id, existing.id));
		return;
	}

	await db.insert(shoppingListItems).values({ userId: ownerId, name: trimmed, brand: brand?.trim() || null, quantity: 1 });
}

export async function setChecked(actingUserId: number, ownerId: number, id: number, checked: boolean) {
	await assertAccess(actingUserId, ownerId);
	await db
		.update(shoppingListItems)
		.set({ checked })
		.where(and(eq(shoppingListItems.id, id), eq(shoppingListItems.userId, ownerId)));
}

export async function setQuantity(actingUserId: number, ownerId: number, id: number, quantity: number) {
	await assertAccess(actingUserId, ownerId);
	await db
		.update(shoppingListItems)
		.set({ quantity: Math.max(1, Math.round(quantity)) })
		.where(and(eq(shoppingListItems.id, id), eq(shoppingListItems.userId, ownerId)));
}

export async function removeItem(actingUserId: number, ownerId: number, id: number) {
	await assertAccess(actingUserId, ownerId);
	await db.delete(shoppingListItems).where(and(eq(shoppingListItems.id, id), eq(shoppingListItems.userId, ownerId)));
}

export async function clearChecked(actingUserId: number, ownerId: number) {
	await assertAccess(actingUserId, ownerId);
	await db
		.delete(shoppingListItems)
		.where(and(eq(shoppingListItems.userId, ownerId), eq(shoppingListItems.checked, true)));
}

// --- Sharing management ---

/** People you've granted access to your own list. */
export async function listMyShares(ownerId: number) {
	return db
		.select({ userId: users.id, username: users.username })
		.from(shoppingListShares)
		.innerJoin(users, eq(users.id, shoppingListShares.sharedWithUserId))
		.where(eq(shoppingListShares.ownerId, ownerId))
		.orderBy(asc(users.username));
}

/** Other people's lists you've been granted access to. */
export async function listSharedWithMe(userId: number) {
	return db
		.select({ ownerId: users.id, ownerUsername: users.username })
		.from(shoppingListShares)
		.innerJoin(users, eq(users.id, shoppingListShares.ownerId))
		.where(eq(shoppingListShares.sharedWithUserId, userId))
		.orderBy(asc(users.username));
}

export async function shareListWith(ownerId: number, targetUsername: string) {
	const trimmed = targetUsername.trim();
	if (!trimmed) throw new Error('Username is required');

	const [target] = await db
		.select({ id: users.id })
		.from(users)
		.where(sql`lower(${users.username}) = lower(${trimmed})`);
	if (!target) throw new Error('No user with that username');
	if (target.id === ownerId) throw new Error('You already have access to your own list');

	const [existing] = await db
		.select({ id: shoppingListShares.id })
		.from(shoppingListShares)
		.where(and(eq(shoppingListShares.ownerId, ownerId), eq(shoppingListShares.sharedWithUserId, target.id)));
	if (existing) throw new Error('Already shared with that user');

	await db.insert(shoppingListShares).values({ ownerId, sharedWithUserId: target.id });
}

/** Called by the list owner to revoke someone else's access. */
export async function revokeShare(ownerId: number, sharedWithUserId: number) {
	await db
		.delete(shoppingListShares)
		.where(and(eq(shoppingListShares.ownerId, ownerId), eq(shoppingListShares.sharedWithUserId, sharedWithUserId)));
}

/** Called by the recipient to remove their own access to someone else's list. */
export async function leaveSharedList(userId: number, ownerId: number) {
	await db
		.delete(shoppingListShares)
		.where(and(eq(shoppingListShares.ownerId, ownerId), eq(shoppingListShares.sharedWithUserId, userId)));
}
