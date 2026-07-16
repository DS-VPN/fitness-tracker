import { fail } from '@sveltejs/kit';
import {
	listShoppingList,
	addManualItem,
	setChecked,
	setQuantity,
	removeItem,
	clearChecked
} from '$lib/server/repositories/shoppingList';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	const { fromMeals, manual } = await listShoppingList();
	return { fromMeals, manual };
};

function readId(form: FormData): number | null {
	const id = Number(form.get('id'));
	return Number.isFinite(id) ? id : null;
}

export const actions: Actions = {
	toggleChecked: async ({ request }) => {
		const form = await request.formData();
		const id = readId(form);
		if (id === null) return fail(400, { error: 'Invalid item' });
		await setChecked(id, form.get('checked') === 'true');
	},

	setQuantity: async ({ request }) => {
		const form = await request.formData();
		const id = readId(form);
		const quantity = Number(form.get('quantity'));
		if (id === null || !Number.isFinite(quantity)) return fail(400, { error: 'Invalid quantity' });
		await setQuantity(id, quantity);
	},

	removeItem: async ({ request }) => {
		const form = await request.formData();
		const id = readId(form);
		if (id === null) return fail(400, { error: 'Invalid item' });
		await removeItem(id);
	},

	addManualItem: async ({ request }) => {
		const form = await request.formData();
		const name = String(form.get('name') ?? '').trim();
		const brand = String(form.get('brand') ?? '').trim();
		if (!name) return fail(400, { error: 'Item name is required' });
		await addManualItem(name, brand || undefined);
	},

	clearChecked: async () => {
		await clearChecked();
	}
};
