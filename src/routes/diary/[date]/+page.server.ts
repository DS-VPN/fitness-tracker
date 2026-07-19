import { error, fail } from '@sveltejs/kit';
import { listMeals } from '$lib/server/repositories/meals';
import { listProducts } from '$lib/server/repositories/products';
import {
	getTargets,
	daySummary,
	listDay,
	logMealToDay,
	logProductToDay,
	logQuickAdd,
	deleteEntry
} from '$lib/server/repositories/nutritionLog';
import { todayIso } from '$lib/utils/todayIso';
import { isValidIsoDate } from '$lib/utils/isoDate';
import { parseDecimal } from '$lib/utils/parseDecimal';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, locals }) => {
	const date = params.date;
	if (!isValidIsoDate(date)) throw error(404, 'Not a valid date');

	const userId = locals.user!.id;
	const [targets, summary, entries, meals, products] = await Promise.all([
		getTargets(userId),
		daySummary(userId, date),
		listDay(userId, date),
		listMeals(userId),
		listProducts(userId)
	]);

	return {
		date,
		today: todayIso(),
		targets,
		summary,
		entries,
		logMeals: meals.map((m) => ({ id: m.id, name: m.name, portions: m.portions, totalMacros: m.totalMacros })),
		logProducts: products.map((p) => ({
			id: p.id,
			name: p.name,
			brand: p.brand,
			calories: p.calories,
			amount: p.amount,
			unit: p.unit
		}))
	};
};

export const actions: Actions = {
	logFood: async ({ request, params, locals }) => {
		const date = params.date;
		if (!isValidIsoDate(date)) return fail(400, { error: 'Invalid date' });
		const form = await request.formData();
		const kind = String(form.get('kind') ?? '');
		const refId = Number(form.get('refId'));
		const portions = parseDecimal(String(form.get('portions') ?? ''));
		if (!Number.isFinite(refId)) return fail(400, { error: 'Invalid selection' });
		if (portions <= 0) return fail(400, { error: 'Portions must be above 0' });
		try {
			if (kind === 'meal') {
				await logMealToDay(locals.user!.id, refId, portions, date);
			} else if (kind === 'product') {
				await logProductToDay(locals.user!.id, refId, portions, date);
			} else {
				return fail(400, { error: 'Invalid selection' });
			}
		} catch (e) {
			return fail(400, { error: e instanceof Error ? e.message : 'Could not log' });
		}
		return { success: true };
	},

	deleteLog: async ({ request, locals }) => {
		const id = Number((await request.formData()).get('id'));
		if (!Number.isFinite(id)) return fail(400, { error: 'Invalid entry' });
		await deleteEntry(locals.user!.id, id);
		return { success: true };
	},

	quickAdd: async ({ request, params, locals }) => {
		const date = params.date;
		if (!isValidIsoDate(date)) return fail(400, { error: 'Invalid date' });
		const form = await request.formData();
		const num = (key: string) => {
			const raw = String(form.get(key) ?? '').trim();
			return raw === '' ? 0 : Number(raw.replace(',', '.'));
		};
		const calories = num('calories');
		if (!Number.isFinite(calories) || calories <= 0) return fail(400, { error: 'Calories are required' });
		try {
			await logQuickAdd(locals.user!.id, date, {
				name: String(form.get('name') ?? ''),
				calories,
				protein: num('protein'),
				carbs: num('carbs'),
				fat: num('fat')
			});
		} catch (e) {
			return fail(400, { error: e instanceof Error ? e.message : 'Could not log' });
		}
		return { success: true };
	}
};
