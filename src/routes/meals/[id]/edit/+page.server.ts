import { error, fail, redirect } from '@sveltejs/kit';
import { getMeal, updateMealDetails } from '$lib/server/repositories/meals';
import { listCategories } from '$lib/server/repositories/categories';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, locals }) => {
	const id = Number(params.id);
	if (!Number.isFinite(id)) throw error(404, 'Meal not found');

	const userId = locals.user!.id;
	const [meal, categories] = await Promise.all([getMeal(userId, id), listCategories(userId)]);
	if (!meal) throw error(404, 'Meal not found');

	return { meal, categories };
};

export const actions: Actions = {
	default: async ({ request, params, locals }) => {
		const id = Number(params.id);
		const form = await request.formData();
		const name = String(form.get('name') ?? '').trim();
		const categoryIds = form
			.getAll('categoryIds')
			.map((v) => Number(v))
			.filter((n) => Number.isFinite(n));

		if (!name) return fail(400, { error: 'Name is required' });

		await updateMealDetails(locals.user!.id, id, name, categoryIds);
		throw redirect(303, `/meals/${id}`);
	}
};
