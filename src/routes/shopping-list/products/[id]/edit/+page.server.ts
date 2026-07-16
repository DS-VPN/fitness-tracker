import { error, fail, redirect } from '@sveltejs/kit';
import { getProduct, updateProduct, deleteProduct, type ProductInput } from '$lib/server/repositories/products';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, locals }) => {
	const id = Number(params.id);
	if (!Number.isFinite(id)) throw error(404, 'Product not found');

	const product = await getProduct(locals.user!.id, id);
	if (!product) throw error(404, 'Product not found');

	return { product };
};

function parseProductForm(form: FormData): { data: ProductInput } | { error: string } {
	const name = String(form.get('name') ?? '').trim();
	if (!name) return { error: 'Name is required' };

	const num = (key: string) => {
		const v = form.get(key);
		if (v === null || String(v).trim() === '') return 0;
		const n = Number(v);
		return Number.isFinite(n) ? n : 0;
	};
	const optNum = (key: string) => {
		const v = form.get(key);
		if (v === null || String(v).trim() === '') return null;
		const n = Number(v);
		return Number.isFinite(n) ? n : null;
	};
	const str = (key: string) => {
		const v = form.get(key);
		const s = v === null ? '' : String(v).trim();
		return s === '' ? null : s;
	};

	return {
		data: {
			name,
			brand: str('brand'),
			servingSize: str('servingSize'),
			calories: num('calories'),
			protein: num('protein'),
			carbs: num('carbs'),
			fat: num('fat'),
			fiber: optNum('fiber'),
			sugar: optNum('sugar'),
			sodium: optNum('sodium')
		}
	};
}

export const actions: Actions = {
	update: async ({ request, params, locals }) => {
		const id = Number(params.id);
		const form = await request.formData();
		const parsed = parseProductForm(form);
		if ('error' in parsed) return fail(400, { error: parsed.error });

		await updateProduct(locals.user!.id, id, parsed.data);
		throw redirect(303, '/shopping-list/products');
	},

	delete: async ({ params, locals }) => {
		const id = Number(params.id);
		await deleteProduct(locals.user!.id, id);
		throw redirect(303, '/shopping-list/products');
	}
};
