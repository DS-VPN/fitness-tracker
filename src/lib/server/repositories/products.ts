import { db } from '$lib/server/db';
import { products } from '$lib/server/db/schema';
import { and, asc, eq, like, or } from 'drizzle-orm';

export type ProductInput = {
	name: string;
	brand?: string | null;
	barcode?: string | null;
	/** Macros below are per `amount` `unit`s of this product (e.g. 100/'g'). */
	amount: number;
	unit: string;
	calories: number;
	protein: number;
	carbs: number;
	fat: number;
	fiber?: number | null;
	sugar?: number | null;
	sodium?: number | null;
};

export async function listProducts(userId: number, search?: string) {
	const conditions = [eq(products.userId, userId)];
	if (search?.trim()) {
		const term = `%${search.trim()}%`;
		conditions.push(or(like(products.name, term), like(products.brand, term))!);
	}
	return db
		.select()
		.from(products)
		.where(and(...conditions))
		.orderBy(asc(products.name));
}

export async function getProduct(userId: number, id: number) {
	const [row] = await db
		.select()
		.from(products)
		.where(and(eq(products.id, id), eq(products.userId, userId)));
	return row ?? null;
}

export async function createProduct(userId: number, data: ProductInput) {
	const now = new Date();
	const [row] = await db
		.insert(products)
		.values({ ...data, userId, createdAt: now, updatedAt: now })
		.returning();
	return row;
}

export async function updateProduct(userId: number, id: number, data: ProductInput) {
	await db
		.update(products)
		.set({ ...data, updatedAt: new Date() })
		.where(and(eq(products.id, id), eq(products.userId, userId)));
}

export async function deleteProduct(userId: number, id: number) {
	await db.delete(products).where(and(eq(products.id, id), eq(products.userId, userId)));
}

/** Local barcode match — a previously saved scan of this product means no API lookup is ever needed again. */
export async function findProductByBarcode(userId: number, barcode: string) {
	const [row] = await db
		.select()
		.from(products)
		.where(and(eq(products.userId, userId), eq(products.barcode, barcode)));
	return row ?? null;
}
