import { fail } from '@sveltejs/kit';
import { listProducts } from '$lib/server/repositories/products';
import { searchCatalog, addCatalogProductToUser } from '$lib/server/repositories/catalog';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ url, locals }) => {
	const q = url.searchParams.get('q') ?? '';
	const userId = locals.user!.id;
	const [products, catalog] = await Promise.all([
		listProducts(userId, q || undefined),
		q.trim() ? searchCatalog(q, 12) : Promise.resolve([])
	]);

	// Hide catalog rows the user already owns (same name+brand) so "From catalog" only offers new ones.
	const owned = new Set(products.map((p) => `${p.name.toLowerCase()}|${(p.brand ?? '').toLowerCase()}`));
	const catalogMatches = catalog.filter(
		(c) => !owned.has(`${c.name.toLowerCase()}|${(c.brand ?? '').toLowerCase()}`)
	);

	return { products, catalogMatches, q };
};

export const actions: Actions = {
	addFromCatalog: async ({ request, locals }) => {
		const form = await request.formData();
		const catalogId = Number(form.get('catalogId'));
		if (!Number.isFinite(catalogId)) return fail(400, { error: 'Invalid product' });
		try {
			await addCatalogProductToUser(locals.user!.id, catalogId);
		} catch (e) {
			return fail(400, { error: e instanceof Error ? e.message : 'Could not add product' });
		}
		return { success: true };
	}
};
