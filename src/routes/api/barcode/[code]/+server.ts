import { json, error } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { barcodeCache } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { findProductByBarcode } from '$lib/server/repositories/products';
import type { RequestHandler } from './$types';

/** What a lookup resolves to, cached verbatim in barcode_cache so repeat scans never re-hit the API. */
type CachedLookup =
	| { found: true; prefill: { name: string; brand: string | null; calories: number; protein: number; carbs: number; fat: number; servingSize: string } }
	| { found: false };

// Open Food Facts asks API consumers to identify themselves; browsers can't set User-Agent, which is
// one of the reasons this lookup lives server-side (the other: a shared cross-user cache).
const USER_AGENT = 'FitnessTracker/1.0 (self-hosted; +https://github.com/DS-VPN/fitness-tracker)';

function num(v: unknown): number {
	const n = Number(v);
	return Number.isFinite(n) ? Math.round(n * 10) / 10 : 0;
}

async function lookupOpenFoodFacts(code: string): Promise<CachedLookup> {
	const res = await fetch(`https://world.openfoodfacts.org/api/v2/product/${code}.json`, {
		headers: { 'User-Agent': USER_AGENT }
	});
	// Unknown barcodes come back as HTTP 404 (with a status:0 body) — that's a definitive
	// "not in the database", not a service failure, so it must be cached like any other answer.
	if (res.status === 404) return { found: false };
	if (!res.ok) throw new Error(`Open Food Facts returned ${res.status}`);
	const body = (await res.json()) as {
		status: number;
		product?: { product_name?: string; brands?: string; nutriments?: Record<string, unknown> };
	};
	if (body.status !== 1 || !body.product) return { found: false };

	const p = body.product;
	const n = p.nutriments ?? {};
	return {
		found: true,
		prefill: {
			name: p.product_name?.trim() || 'Unknown product',
			brand: p.brands?.split(',')[0]?.trim() || null,
			calories: num(n['energy-kcal_100g']),
			protein: num(n['proteins_100g']),
			carbs: num(n['carbohydrates_100g']),
			fat: num(n['fat_100g']),
			servingSize: '100 g'
		}
	};
}

export const GET: RequestHandler = async ({ params, locals }) => {
	if (!locals.user) throw error(401, 'Not signed in');
	const code = params.code.replace(/\D/g, '');
	if (code.length < 6 || code.length > 18) throw error(400, 'Invalid barcode');

	// 1. The user already saved a product with this barcode — strongest match, zero network.
	const local = await findProductByBarcode(locals.user.id, code);
	if (local) return json({ source: 'local', barcode: code, product: local });

	// 2. A previous lookup (by anyone) cached the answer — including "not found" answers.
	const [cached] = await db.select().from(barcodeCache).where(eq(barcodeCache.barcode, code));
	if (cached) {
		const payload = JSON.parse(cached.payload) as CachedLookup;
		return json(
			payload.found
				? { source: 'off-cache', barcode: code, prefill: payload.prefill }
				: { source: 'none', barcode: code }
		);
	}

	// 3. Live Open Food Facts lookup, cached either way.
	let result: CachedLookup;
	try {
		result = await lookupOpenFoodFacts(code);
	} catch {
		// Upstream unreachable — don't cache, let a later scan retry.
		return json({ source: 'error', barcode: code });
	}
	await db
		.insert(barcodeCache)
		.values({ barcode: code, payload: JSON.stringify(result), fetchedAt: new Date() })
		.onConflictDoNothing();

	return json(
		result.found ? { source: 'off', barcode: code, prefill: result.prefill } : { source: 'none', barcode: code }
	);
};
