import { json, error } from '@sveltejs/kit';
import { searchCatalog } from '$lib/server/repositories/catalog';
import type { RequestHandler } from './$types';

/** Catalog search for the Log-food modal and meal ingredient picker (both client-side filtered). */
export const GET: RequestHandler = async ({ url, locals }) => {
	if (!locals.user) throw error(401, 'Not signed in');
	const q = url.searchParams.get('q') ?? '';
	const matches = await searchCatalog(q, 15);
	return json({ matches });
};
