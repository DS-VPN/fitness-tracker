import { error, fail, redirect } from '@sveltejs/kit';
import {
	getMeal,
	getMealForViewer,
	deleteMeal,
	addProductIngredient,
	addSubMealIngredient,
	createProductAndAddIngredient,
	removeIngredient,
	updateIngredientQuantity,
	eligibleSubMeals,
	flatProductIngredients
} from '$lib/server/repositories/meals';
import { listProducts, getProduct } from '$lib/server/repositories/products';
import { listCategories } from '$lib/server/repositories/categories';
import { listMyMealShares, shareMealsWith, revokeMealShare } from '$lib/server/repositories/mealShares';
import { addMealToList, addProductToList, addProductsToList } from '$lib/server/repositories/shoppingList';
import { logMealToDay } from '$lib/server/repositories/nutritionLog';
import { todayIso } from '$lib/utils/todayIso';
import { parseDecimal } from '$lib/utils/parseDecimal';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, locals }) => {
	const id = Number(params.id);
	if (!Number.isFinite(id)) throw error(404, 'Meal not found');

	const userId = locals.user!.id;
	const meal = await getMealForViewer(userId, id);
	if (!meal) throw error(404, 'Meal not found');

	// Recipients can't edit, so the ingredient pickers and share management are owner-only.
	if (!meal.isOwner) {
		return { meal, products: [], subMeals: [], categories: [], shares: [] };
	}

	const [products, subMeals, categories, shares] = await Promise.all([
		listProducts(userId),
		eligibleSubMeals(userId, id),
		listCategories(userId),
		listMyMealShares(userId, { mealId: id })
	]);

	return { meal, products, subMeals, categories, shares };
};

function parseQuantity(form: FormData): number {
	const v = Number(form.get('quantity'));
	return Number.isFinite(v) && v > 0 ? v : 1;
}

/** Reads a raw amount (in a product's own unit, e.g. grams) from `field` and converts it to the multiplier
 *  stored on mealIngredients.quantity — "how many of the product's defined serving amount". */
function parseAmountAsMultiplier(form: FormData, field: string, productAmount: number): number {
	const v = Number(form.get(field));
	const amount = Number.isFinite(v) && v > 0 ? v : productAmount;
	return amount / (productAmount > 0 ? productAmount : 1);
}

export const actions: Actions = {
	logToDay: async ({ request, params, locals }) => {
		const id = Number(params.id);
		const form = await request.formData();
		const portions = parseDecimal(String(form.get('portions') ?? '1'));
		if (portions <= 0) return fail(400, { error: 'Portions must be above 0' });
		try {
			await logMealToDay(locals.user!.id, id, portions, todayIso());
		} catch (e) {
			return fail(400, { error: e instanceof Error ? e.message : 'Could not log meal' });
		}
		return { logged: true };
	},

	addToList: async ({ request, params, locals }) => {
		const id = Number(params.id);
		const form = await request.formData();
		const multiplier = parseDecimal(String(form.get('multiplier') ?? '1')) || 1;
		const count = await addMealToList(locals.user!.id, id, multiplier);
		return { added: true, count };
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
		if (!Number.isFinite(productId)) return fail(400, { error: 'Invalid product' });
		try {
			const product = await getProduct(locals.user!.id, productId);
			if (!product) return fail(400, { error: 'Product not found' });
			const multiplier = parseAmountAsMultiplier(form, 'amount', product.amount);
			await addProductIngredient(locals.user!.id, mealId, productId, multiplier);
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
		const amount = (() => {
			const n = Number(form.get('amount'));
			return Number.isFinite(n) && n > 0 ? n : 100;
		})();
		const unit = (() => {
			const v = String(form.get('unit') ?? '').trim();
			return v === 'g' || v === 'ml' || v === 'pcs' ? v : 'g';
		})();
		const multiplier = parseAmountAsMultiplier(form, 'ingredientAmount', amount);

		try {
			await createProductAndAddIngredient(
				locals.user!.id,
				mealId,
				{
					name,
					brand: str('brand'),
					barcode: str('barcode'),
					amount,
					unit,
					calories: num('calories'),
					protein: num('protein'),
					carbs: num('carbs'),
					fat: num('fat')
				},
				multiplier
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
		if (!Number.isFinite(ingredientId)) return fail(400, { error: 'Invalid ingredient' });

		// `value` means different things depending on the ingredient's type: for a product it's the real
		// amount in the product's unit (converted to a multiplier here); for a sub-meal it's already the
		// portions multiplier (no product-level unit applies to a whole recipe).
		const meal = await getMeal(locals.user!.id, mealId);
		const ingredient = meal?.ingredients.find((i) => i.id === ingredientId);
		if (!ingredient) return fail(400, { error: 'Ingredient not found' });

		const multiplier =
			ingredient.type === 'product' && ingredient.amount
				? parseAmountAsMultiplier(form, 'value', ingredient.amount)
				: (() => {
						const v = Number(form.get('value'));
						return Number.isFinite(v) && v > 0 ? v : 1;
					})();

		await updateIngredientQuantity(locals.user!.id, mealId, ingredientId, multiplier);
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
	},

	shareMeals: async ({ request, params, locals }) => {
		const id = Number(params.id);
		const form = await request.formData();
		const username = String(form.get('username') ?? '');
		try {
			await shareMealsWith(locals.user!.id, username, { mealId: id });
		} catch (e) {
			return fail(400, { error: e instanceof Error ? e.message : 'Could not share meal' });
		}
		return { success: true };
	},

	revokeMealShare: async ({ request, locals }) => {
		const form = await request.formData();
		const shareId = Number(form.get('shareId'));
		if (!Number.isFinite(shareId)) return fail(400, { error: 'Invalid share' });
		await revokeMealShare(locals.user!.id, shareId);
		return { success: true };
	}
};
