import { error, fail, redirect } from '@sveltejs/kit';
import {
	getMeal,
	deleteMeal,
	addProductIngredient,
	addSubMealIngredient,
	createProductAndAddIngredient,
	removeIngredient,
	updateIngredientQuantity,
	eligibleSubMeals,
	flatProductIngredients
} from '$lib/server/repositories/meals';
import { listProducts } from '$lib/server/repositories/products';
import { addMealToList, addProductToList, addProductsToList } from '$lib/server/repositories/shoppingList';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, locals }) => {
	const id = Number(params.id);
	if (!Number.isFinite(id)) throw error(404, 'Meal not found');

	const userId = locals.user!.id;
	const [meal, products, subMeals] = await Promise.all([
		getMeal(userId, id),
		listProducts(userId),
		eligibleSubMeals(userId, id)
	]);
	if (!meal) throw error(404, 'Meal not found');

	return { meal, products, subMeals };
};

function parseQuantity(form: FormData): number {
	const v = Number(form.get('quantity'));
	return Number.isFinite(v) && v > 0 ? v : 1;
}

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
	},

	addProductIngredient: async ({ request, params, locals }) => {
		const mealId = Number(params.id);
		const form = await request.formData();
		const productId = Number(form.get('productId'));
		const quantity = parseQuantity(form);
		if (!Number.isFinite(productId)) return fail(400, { error: 'Invalid product' });
		try {
			await addProductIngredient(locals.user!.id, mealId, productId, quantity);
		} catch (e) {
			return fail(400, { error: e instanceof Error ? e.message : 'Could not add ingredient' });
		}
		return { success: true };
	},

	addSubMealIngredient: async ({ request, params, locals }) => {
		const mealId = Number(params.id);
		const form = await request.formData();
		const subMealId = Number(form.get('subMealId'));
		const quantity = parseQuantity(form);
		if (!Number.isFinite(subMealId)) return fail(400, { error: 'Invalid meal' });
		try {
			await addSubMealIngredient(locals.user!.id, mealId, subMealId, quantity);
		} catch (e) {
			return fail(400, { error: e instanceof Error ? e.message : 'Could not add ingredient' });
		}
		return { success: true };
	},

	createProductIngredient: async ({ request, params, locals }) => {
		const mealId = Number(params.id);
		const form = await request.formData();
		const name = String(form.get('name') ?? '').trim();
		if (!name) return fail(400, { error: 'Name is required' });

		const num = (key: string) => {
			const v = form.get(key);
			if (v === null || String(v).trim() === '') return 0;
			const n = Number(v);
			return Number.isFinite(n) ? n : 0;
		};
		const str = (key: string) => {
			const v = form.get(key);
			const s = v === null ? '' : String(v).trim();
			return s === '' ? null : s;
		};
		const quantity = parseQuantity(form);

		try {
			await createProductAndAddIngredient(
				locals.user!.id,
				mealId,
				{
					name,
					brand: str('brand'),
					servingSize: str('servingSize'),
					calories: num('calories'),
					protein: num('protein'),
					carbs: num('carbs'),
					fat: num('fat')
				},
				quantity
			);
		} catch (e) {
			return fail(400, { error: e instanceof Error ? e.message : 'Could not create product' });
		}
		return { success: true };
	},

	removeIngredient: async ({ request, params, locals }) => {
		const mealId = Number(params.id);
		const form = await request.formData();
		const ingredientId = Number(form.get('ingredientId'));
		if (!Number.isFinite(ingredientId)) return fail(400, { error: 'Invalid ingredient' });
		await removeIngredient(locals.user!.id, mealId, ingredientId);
		return { success: true };
	},

	updateIngredientQuantity: async ({ request, params, locals }) => {
		const mealId = Number(params.id);
		const form = await request.formData();
		const ingredientId = Number(form.get('ingredientId'));
		const quantity = parseQuantity(form);
		if (!Number.isFinite(ingredientId)) return fail(400, { error: 'Invalid ingredient' });
		await updateIngredientQuantity(locals.user!.id, mealId, ingredientId, quantity);
		return { success: true };
	},

	quickAddProduct: async ({ request, locals }) => {
		const form = await request.formData();
		const productId = Number(form.get('productId'));
		const quantity = parseQuantity(form);
		if (!Number.isFinite(productId)) return fail(400, { error: 'Invalid product' });
		await addProductToList(locals.user!.id, productId, quantity);
		return { added: true };
	},

	quickAddSubMeal: async ({ request, locals }) => {
		const form = await request.formData();
		const subMealId = Number(form.get('subMealId'));
		const outerQuantity = parseQuantity(form);
		if (!Number.isFinite(subMealId)) return fail(400, { error: 'Invalid meal' });
		const flat = await flatProductIngredients(subMealId);
		await addProductsToList(
			locals.user!.id,
			flat.map((f) => ({ productId: f.productId, quantity: f.quantity * outerQuantity }))
		);
		return { added: true };
	}
};
