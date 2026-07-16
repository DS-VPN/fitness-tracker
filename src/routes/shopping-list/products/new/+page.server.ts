import { fail } from '@sveltejs/kit';
import { createProduct, type ProductInput } from '$lib/server/repositories/products';
import type { Actions } from './$types';

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
	default: async ({ request, locals }) => {
		const form = await request.formData();
		const parsed = parseProductForm(form);
		if ('error' in parsed) return fail(400, { error: parsed.error });

		const product = await createProduct(locals.user!.id, parsed.data);
		return { success: true, product };
	}
};
