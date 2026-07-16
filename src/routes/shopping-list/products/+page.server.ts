import { listProducts } from '$lib/server/repositories/products';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ url, locals }) => {
	const q = url.searchParams.get('q') ?? '';
	const products = await listProducts(locals.user!.id, q || undefined);
	return { products, q };
};
