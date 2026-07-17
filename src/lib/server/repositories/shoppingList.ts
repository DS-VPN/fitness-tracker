import { db } from '$lib/server/db';
import { shoppingListItems, shoppingListItemSources, meals, users, shoppingListShares, products } from '$lib/server/db/schema';
import { and, asc, eq, inArray, isNull, sql } from 'drizzle-orm';
import { resolveMealProducts } from '$lib/server/repositories/meals';
import { canViewMeal } from '$lib/server/repositories/mealShares';

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

function normalizeMultiplier(multiplier: number): number {
	if (!Number.isFinite(multiplier) || multiplier <= 0) return 1;
	return Math.round(multiplier * 100) / 100;
}

function round(n: number): number {
	return Math.round(n * 100) / 100;
}

export type ShoppingListSource = { mealId: number | null; label: string; amount: number };
export type ShoppingListProductItem = {
	id: number;
	kind: 'product';
	productId: number;
	name: string;
	brand: string | null;
	unit: string;
	totalAmount: number;
	sources: ShoppingListSource[];
	checked: boolean;
};
export type ShoppingListManualItem = {
	id: number;
	kind: 'manual';
	name: string;
	brand: string | null;
	quantity: number;
	checked: boolean;
};

/** Finds or creates the (userId, productId)-keyed shopping list line for a product. */
async function upsertItemForProduct(userId: number, productId: number): Promise<number> {
	const [existing] = await db
		.select({ id: shoppingListItems.id })
		.from(shoppingListItems)
		.where(and(eq(shoppingListItems.userId, userId), eq(shoppingListItems.productId, productId)));
	if (existing) return existing.id;

	const [row] = await db.insert(shoppingListItems).values({ userId, productId, checked: false }).returning();
	return row.id;
}

/** Finds or creates the source row for (itemId, mealId) — mealId null means "added directly, not via a meal".
 *  Increments multiplier on repeat adds rather than duplicating the row (a DB-level unique constraint can't
 *  cover the null-mealId case, since SQLite treats every NULL as distinct in a UNIQUE index). */
async function upsertSource(itemId: number, mealId: number | null, mealName: string | null, multiplier: number) {
	const condition =
		mealId == null
			? and(eq(shoppingListItemSources.itemId, itemId), isNull(shoppingListItemSources.mealId))
			: and(eq(shoppingListItemSources.itemId, itemId), eq(shoppingListItemSources.mealId, mealId));

	const [existing] = await db.select().from(shoppingListItemSources).where(condition);
	if (existing) {
		await db
			.update(shoppingListItemSources)
			.set({ multiplier: existing.multiplier + multiplier, updatedAt: new Date() })
			.where(eq(shoppingListItemSources.id, existing.id));
		return;
	}

	await db
		.insert(shoppingListItemSources)
		.values({ itemId, mealId, mealName, multiplier, createdAt: new Date(), updatedAt: new Date() });
}

/** Adds a meal's resolved ingredients (recursing through one level of sub-meals via resolveMealProducts) to the
 *  user's own list, scaled by `multiplier` (e.g. 2 for "add this meal twice"). Repeat adds of the same meal
 *  increment that meal's contribution rather than duplicating lines. Returns the count of distinct products
 *  touched. Grams are never stored here — they're computed live in listShoppingList from the meal's CURRENT
 *  ingredient quantities, so editing a recipe after adding it updates the shopping list automatically. */
export async function addMealToList(userId: number, mealId: number, multiplier: number = 1): Promise<number> {
	// The meal may be the user's own or one shared with them. Items land on the acting user's own
	// list; the sourced products belong to the meal's owner and are resolved by id at read time,
	// so a recipient shopping a shared recipe sees its real ingredient names/amounts.
	if (!(await canViewMeal(userId, mealId))) throw new Error('Meal not found');
	const [meal] = await db
		.select({ id: meals.id, name: meals.name })
		.from(meals)
		.where(eq(meals.id, mealId));
	if (!meal) throw new Error('Meal not found');

	const normalized = normalizeMultiplier(multiplier);
	const resolved = await resolveMealProducts(mealId);
	const productIds = [...new Set(resolved.map((r) => r.productId))];

	for (const productId of productIds) {
		const itemId = await upsertItemForProduct(userId, productId);
		await upsertSource(itemId, mealId, meal.name, normalized);
	}
	return productIds.length;
}

/** Quick-add a single product straight to the user's own list, outside of any meal (mealId null source).
 *  `multiplier` means the same thing it does inside a recipe — how many of the product's defined amount. */
export async function addProductToList(userId: number, productId: number, multiplier: number = 1) {
	const [product] = await db
		.select({ id: products.id })
		.from(products)
		.where(and(eq(products.id, productId), eq(products.userId, userId)));
	if (!product) throw new Error('Product not found');

	const itemId = await upsertItemForProduct(userId, productId);
	await upsertSource(itemId, null, null, normalizeMultiplier(multiplier));
}

/** Bulk quick-add — used for "add all of this sub-meal's products at once". */
export async function addProductsToList(userId: number, items: { productId: number; quantity: number }[]) {
	for (const item of items) {
		await addProductToList(userId, item.productId, item.quantity);
	}
}

/** Removes one meal's (or a direct add's, when mealId is null) contribution to a shopping list item. Deletes
 *  the item entirely once it has no sources left. */
export async function removeMealSource(actingUserId: number, ownerId: number, itemId: number, mealId: number | null) {
	await assertAccess(actingUserId, ownerId);
	const [item] = await db
		.select({ id: shoppingListItems.id })
		.from(shoppingListItems)
		.where(and(eq(shoppingListItems.id, itemId), eq(shoppingListItems.userId, ownerId)));
	if (!item) throw new Error('Item not found');

	const condition =
		mealId == null
			? and(eq(shoppingListItemSources.itemId, itemId), isNull(shoppingListItemSources.mealId))
			: and(eq(shoppingListItemSources.itemId, itemId), eq(shoppingListItemSources.mealId, mealId));
	await db.delete(shoppingListItemSources).where(condition);

	const [{ count }] = await db
		.select({ count: sql<number>`count(*)`.mapWith(Number) })
		.from(shoppingListItemSources)
		.where(eq(shoppingListItemSources.itemId, itemId));
	if (count === 0) {
		await db.delete(shoppingListItems).where(eq(shoppingListItems.id, itemId));
	}
}

export async function listShoppingList(
	ownerId: number
): Promise<{ fromMeals: ShoppingListProductItem[]; manual: ShoppingListManualItem[] }> {
	const rows = await db
		.select()
		.from(shoppingListItems)
		.where(eq(shoppingListItems.userId, ownerId))
		.orderBy(asc(shoppingListItems.createdAt));

	const manual: ShoppingListManualItem[] = rows
		.filter((r) => r.productId == null)
		.map((r) => ({ id: r.id, kind: 'manual', name: r.name!, brand: r.brand, quantity: r.quantity, checked: r.checked }));

	const productRows = rows.filter((r) => r.productId != null);
	if (productRows.length === 0) return { fromMeals: [], manual };

	const productIds = productRows.map((r) => r.productId!);
	const productList = await db.select().from(products).where(inArray(products.id, productIds));
	const productById = new Map(productList.map((p) => [p.id, p]));

	const itemIds = productRows.map((r) => r.id);
	const sources = await db.select().from(shoppingListItemSources).where(inArray(shoppingListItemSources.itemId, itemIds));
	const sourcesByItem = new Map<number, typeof sources>();
	for (const s of sources) {
		const list = sourcesByItem.get(s.itemId) ?? [];
		list.push(s);
		sourcesByItem.set(s.itemId, list);
	}

	// Resolve each distinct referenced meal's CURRENT ingredient quantities exactly once, so a recipe edited
	// after being added to the list is reflected without any extra bookkeeping.
	const mealIds = [...new Set(sources.filter((s) => s.mealId != null).map((s) => s.mealId!))];
	const resolvedByMeal = new Map<number, Map<number, number>>();
	for (const mealId of mealIds) {
		const resolved = await resolveMealProducts(mealId);
		const perProduct = new Map<number, number>();
		for (const r of resolved) {
			perProduct.set(r.productId, (perProduct.get(r.productId) ?? 0) + r.quantity);
		}
		resolvedByMeal.set(mealId, perProduct);
	}
	const mealRows = mealIds.length
		? await db.select({ id: meals.id, name: meals.name }).from(meals).where(inArray(meals.id, mealIds))
		: [];
	const mealNameById = new Map(mealRows.map((m) => [m.id, m.name]));

	const fromMeals: ShoppingListProductItem[] = [];
	for (const row of productRows) {
		const product = productById.get(row.productId!);
		if (!product) continue; // defensive: FK set-null would have cleared productId already

		let totalAmount = 0;
		const sourceViews: ShoppingListSource[] = [];
		for (const s of sourcesByItem.get(row.id) ?? []) {
			let quantity: number;
			let label: string;
			if (s.mealId != null) {
				quantity = resolvedByMeal.get(s.mealId)?.get(product.id) ?? 0;
				label = mealNameById.get(s.mealId) ?? s.mealName ?? 'Deleted meal';
			} else {
				quantity = 1;
				label = 'Added directly';
			}
			const amount = quantity * s.multiplier * product.amount;
			totalAmount += amount;
			sourceViews.push({ mealId: s.mealId, label, amount: round(amount) });
		}

		fromMeals.push({
			id: row.id,
			kind: 'product',
			productId: product.id,
			name: product.name,
			brand: product.brand,
			unit: product.unit,
			totalAmount: round(totalAmount),
			sources: sourceViews,
			checked: row.checked
		});
	}

	return { fromMeals, manual };
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
				isNull(shoppingListItems.productId),
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
