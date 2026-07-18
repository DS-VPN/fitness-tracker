import { json, error } from '@sveltejs/kit';
import { addCatalogProductToUser } from '$lib/server/repositories/catalog';
import type { RequestHandler } from './$types';

/** Copies a catalog product into the caller's own products (de-duped) and returns the product, so
 *  the Log-food modal and ingredient picker can immediately select it. */
export const POST: RequestHandler = async ({ request, locals }) => {
	if (!locals.user) throw error(401, 'Not signed in');
	const body = (await request.json().catch(() => ({}))) as { catalogId?: number };
	const catalogId = Number(body.catalogId);
	if (!Number.isFinite(catalogId)) throw error(400, 'Invalid catalog id');
	try {
		const product = await addCatalogProductToUser(locals.user.id, catalogId);
		return json({ product });
	} catch (e) {
		throw error(400, e instanceof Error ? e.message : 'Could not add product');
	}
};
