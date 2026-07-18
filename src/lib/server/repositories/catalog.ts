import { db } from '$lib/server/db';
import { catalogProducts, products } from '$lib/server/db/schema';
import { and, asc, eq, like, or, sql } from 'drizzle-orm';
import { createProduct } from '$lib/server/repositories/products';

export type CatalogMatch = {
	id: number;
	name: string;
	brand: string | null;
	amount: number;
	unit: string;
	calories: number;
	protein: number;
	carbs: number;
	fat: number;
};

/** Searches the shared Norwegian catalog by name/brand. Empty query returns nothing (the catalog
 *  is a search target, not a full list to dump). */
export async function searchCatalog(term: string, limit = 20): Promise<CatalogMatch[]> {
	const trimmed = term.trim();
	if (!trimmed) return [];
	const like_ = `%${trimmed}%`;
	return db
		.select({
			id: catalogProducts.id,
			name: catalogProducts.name,
			brand: catalogProducts.brand,
			amount: catalogProducts.amount,
			unit: catalogProducts.unit,
			calories: catalogProducts.calories,
			protein: catalogProducts.protein,
			carbs: catalogProducts.carbs,
			fat: catalogProducts.fat
		})
		.from(catalogProducts)
		.where(or(like(catalogProducts.name, like_), like(catalogProducts.brand, like_)))
		.orderBy(asc(catalogProducts.name))
		.limit(limit);
}

/** Copies a catalog product into the user's own products. De-dupes first: if the user already has a
 *  product with the same barcode, or the same name+brand, that existing product is returned instead
 *  of creating a duplicate. Returns the user's product row. */
export async function addCatalogProductToUser(userId: number, catalogId: number) {
	const [c] = await db.select().from(catalogProducts).where(eq(catalogProducts.id, catalogId));
	if (!c) throw new Error('Catalog product not found');

	// Prefer a barcode match, then fall back to a case-insensitive name+brand match.
	if (c.barcode) {
		const [byBarcode] = await db
			.select()
			.from(products)
			.where(and(eq(products.userId, userId), eq(products.barcode, c.barcode)));
		if (byBarcode) return byBarcode;
	}
	const [byName] = await db
		.select()
		.from(products)
		.where(
			and(
				eq(products.userId, userId),
				sql`lower(${products.name}) = lower(${c.name})`,
				c.brand ? sql`lower(coalesce(${products.brand}, '')) = lower(${c.brand})` : sql`1=1`
			)
		);
	if (byName) return byName;

	return createProduct(userId, {
		name: c.name,
		brand: c.brand,
		barcode: c.barcode,
		amount: c.amount,
		unit: c.unit,
		calories: c.calories,
		protein: c.protein,
		carbs: c.carbs,
		fat: c.fat,
		fiber: c.fiber,
		sugar: c.sugar,
		sodium: c.sodium
	});
}
