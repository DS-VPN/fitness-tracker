import { error, redirect } from '@sveltejs/kit';
import { getMeal, deleteMeal } from '$lib/server/repositories/meals';
import { addMealToList } from '$lib/server/repositories/shoppingList';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, locals }) => {
	const id = Number(params.id);
	if (!Number.isFinite(id)) throw error(404, 'Meal not found');

	const meal = await getMeal(locals.user!.id, id);
	if (!meal) throw error(404, 'Meal not found');

	return { meal };
};

export const actions: Actions = {
	addToList: async ({ params, locals }) => {
		const id = Number(params.id);
		await addMealToList(locals.user!.id, id);
		return { added: true };
	},

	delete: async ({ params, locals }) => {
		const id = Number(params.id);
		await deleteMeal(locals.user!.id, id);
		throw redirect(303, '/meals');
	}
};
