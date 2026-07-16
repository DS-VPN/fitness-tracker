import { fail } from '@sveltejs/kit';
import { recentMeals } from '$lib/server/repositories/meals';
import { listShoppingList, addMealToList } from '$lib/server/repositories/shoppingList';
import { listSessions } from '$lib/server/repositories/workouts';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	const userId = locals.user!.id;
	const [meals, shoppingList, sessions] = await Promise.all([
		recentMeals(userId, 6),
		listShoppingList(userId),
		listSessions(userId)
	]);

	const shoppingCount = [...shoppingList.fromMeals, ...shoppingList.manual].filter((i) => !i.checked).length;

	return {
		username: locals.user!.username,
		recentMeals: meals,
		shoppingCount,
		lastSession: sessions[0] ?? null
	};
};

export const actions: Actions = {
	quickAdd: async ({ request, locals }) => {
		const form = await request.formData();
		const mealId = Number(form.get('mealId'));
		if (!mealId) return fail(400, { error: 'Missing meal' });
		await addMealToList(locals.user!.id, mealId);
	}
};
