import { fail } from '@sveltejs/kit';
import { listMeals } from '$lib/server/repositories/meals';
import { listCategories, createCategory, renameCategory, deleteCategory } from '$lib/server/repositories/categories';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ url }) => {
	const q = url.searchParams.get('q') ?? '';
	const categoryParam = url.searchParams.get('category');
	const categoryId = categoryParam ? Number(categoryParam) : undefined;

	const [meals, categories] = await Promise.all([
		listMeals({ search: q || undefined, categoryId: categoryId && Number.isFinite(categoryId) ? categoryId : undefined }),
		listCategories()
	]);

	return {
		meals,
		categories,
		q,
		categoryId: categoryId && Number.isFinite(categoryId) ? categoryId : null
	};
};

export const actions: Actions = {
	createCategory: async ({ request }) => {
		const form = await request.formData();
		const name = String(form.get('name') ?? '');
		try {
			await createCategory(name);
		} catch (e) {
			return fail(400, { error: e instanceof Error ? e.message : 'Could not add category' });
		}
		return { success: true };
	},

	renameCategory: async ({ request }) => {
		const form = await request.formData();
		const id = Number(form.get('id'));
		const name = String(form.get('name') ?? '');
		if (!Number.isFinite(id)) return fail(400, { error: 'Invalid category' });
		try {
			await renameCategory(id, name);
		} catch (e) {
			return fail(400, { error: e instanceof Error ? e.message : 'Could not rename category' });
		}
		return { success: true };
	},

	deleteCategory: async ({ request }) => {
		const form = await request.formData();
		const id = Number(form.get('id'));
		if (!Number.isFinite(id)) return fail(400, { error: 'Invalid category' });
		await deleteCategory(id);
		return { success: true };
	}
};
