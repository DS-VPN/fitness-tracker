import { error, fail, redirect } from '@sveltejs/kit';
import { getMeal, updateMeal, type MealInput } from '$lib/server/repositories/meals';
import { listCategories } from '$lib/server/repositories/categories';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params }) => {
	const id = Number(params.id);
	if (!Number.isFinite(id)) throw error(404, 'Meal not found');

	const [meal, categories] = await Promise.all([getMeal(id), listCategories()]);
	if (!meal) throw error(404, 'Meal not found');

	return { meal, categories };
};

function parseMealForm(form: FormData): { data: MealInput; categoryIds: number[] } | { error: string } {
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

	const data: MealInput = {
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
	};

	const categoryIds = form
		.getAll('categoryIds')
		.map((v) => Number(v))
		.filter((n) => Number.isFinite(n));

	return { data, categoryIds };
}

export const actions: Actions = {
	default: async ({ request, params }) => {
		const id = Number(params.id);
		const form = await request.formData();
		const parsed = parseMealForm(form);
		if ('error' in parsed) return fail(400, { error: parsed.error });

		await updateMeal(id, parsed.data, parsed.categoryIds);
		throw redirect(303, `/meals/${id}`);
	}
};
