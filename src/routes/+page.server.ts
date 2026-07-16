import { fail } from '@sveltejs/kit';
import { recentMeals } from '$lib/server/repositories/meals';
import { listShoppingList, addMealToList } from '$lib/server/repositories/shoppingList';
import { listSessions } from '$lib/server/repositories/workouts';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	const [meals, shoppingList, sessions] = await Promise.all([
		recentMeals(6),
		listShoppingList(),
		listSessions()
	]);

	const shoppingCount = [...shoppingList.fromMeals, ...shoppingList.manual].filter((i) => !i.checked).length;

	return {
		recentMeals: meals,
		shoppingCount,
		lastSession: sessions[0] ?? null
	};
};

export const actions: Actions = {
	quickAdd: async ({ request }) => {
		const form = await request.formData();
		const mealId = Number(form.get('mealId'));
		if (!mealId) return fail(400, { error: 'Missing meal' });
		await addMealToList(mealId);
	}
};
