import { fail, redirect } from '@sveltejs/kit';
import { createMeal } from '$lib/server/repositories/meals';
import { listCategories } from '$lib/server/repositories/categories';
import { parseDecimal } from '$lib/utils/parseDecimal';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	return { categories: await listCategories(locals.user!.id) };
};

export const actions: Actions = {
	default: async ({ request, locals }) => {
		const form = await request.formData();
		const name = String(form.get('name') ?? '').trim();
		const portions = parseDecimal(String(form.get('portions') ?? '1'));
		const categoryIds = form
			.getAll('categoryIds')
			.map((v) => Number(v))
			.filter((n) => Number.isFinite(n));

		if (!name) return fail(400, { error: 'Name is required' });

		const meal = await createMeal(locals.user!.id, name, categoryIds, portions);
		throw redirect(303, `/meals/${meal.id}`);
	}
};
