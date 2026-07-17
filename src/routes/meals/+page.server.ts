import { error, fail } from '@sveltejs/kit';
import { listMeals } from '$lib/server/repositories/meals';
import { listCategories, createCategory, renameCategory, deleteCategory } from '$lib/server/repositories/categories';
import {
	accessibleMealIds,
	listMealsSharedWithMe,
	listMyMealShares,
	shareMealsWith,
	revokeMealShare,
	leaveSharedMeals
} from '$lib/server/repositories/mealShares';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ url, locals }) => {
	const userId = locals.user!.id;
	const q = url.searchParams.get('q') ?? '';
	const categoryParam = url.searchParams.get('category');
	const categoryId = categoryParam ? Number(categoryParam) : undefined;
	const ownerParam = url.searchParams.get('owner');

	const [myShares, sharedWithMe] = await Promise.all([listMyMealShares(userId), listMealsSharedWithMe(userId)]);

	// Viewing someone else's shared library.
	if (ownerParam !== null) {
		const ownerId = Number(ownerParam);
		const shareEntry = sharedWithMe.find((s) => s.ownerId === ownerId);
		if (!Number.isFinite(ownerId) || !shareEntry) throw error(403, 'Not found');

		const accessible = await accessibleMealIds(userId, ownerId);
		const [allMeals, categories] = await Promise.all([
			listMeals(ownerId, {
				search: q || undefined,
				categoryId: categoryId && Number.isFinite(categoryId) ? categoryId : undefined
			}),
			listCategories(ownerId)
		]);
		const meals = accessible === 'all' ? allMeals : allMeals.filter((m) => accessible.includes(m.id));

		return {
			meals,
			categories,
			q,
			categoryId: categoryId && Number.isFinite(categoryId) ? categoryId : null,
			isOwner: false,
			ownerId,
			ownerUsername: shareEntry.ownerUsername,
			myShares,
			sharedWithMe
		};
	}

	// Own library.
	const [meals, categories] = await Promise.all([
		listMeals(userId, {
			search: q || undefined,
			categoryId: categoryId && Number.isFinite(categoryId) ? categoryId : undefined
		}),
		listCategories(userId)
	]);

	return {
		meals,
		categories,
		q,
		categoryId: categoryId && Number.isFinite(categoryId) ? categoryId : null,
		isOwner: true,
		ownerId: userId,
		ownerUsername: null,
		myShares,
		sharedWithMe
	};
};

export const actions: Actions = {
	createCategory: async ({ request, locals }) => {
		const form = await request.formData();
		const name = String(form.get('name') ?? '');
		try {
			await createCategory(locals.user!.id, name);
		} catch (e) {
			return fail(400, { error: e instanceof Error ? e.message : 'Could not add category' });
		}
		return { success: true };
	},

	renameCategory: async ({ request, locals }) => {
		const form = await request.formData();
		const id = Number(form.get('id'));
		const name = String(form.get('name') ?? '');
		if (!Number.isFinite(id)) return fail(400, { error: 'Invalid category' });
		try {
			await renameCategory(locals.user!.id, id, name);
		} catch (e) {
			return fail(400, { error: e instanceof Error ? e.message : 'Could not rename category' });
		}
		return { success: true };
	},

	deleteCategory: async ({ request, locals }) => {
		const form = await request.formData();
		const id = Number(form.get('id'));
		if (!Number.isFinite(id)) return fail(400, { error: 'Invalid category' });
		await deleteCategory(locals.user!.id, id);
		return { success: true };
	},

	shareMeals: async ({ request, locals }) => {
		const form = await request.formData();
		const username = String(form.get('username') ?? '');
		const mealIdRaw = form.get('mealId');
		const categoryIdRaw = form.get('categoryId');
		const mealId = mealIdRaw && String(mealIdRaw).trim() !== '' ? Number(mealIdRaw) : undefined;
		const categoryId = categoryIdRaw && String(categoryIdRaw).trim() !== '' ? Number(categoryIdRaw) : undefined;
		try {
			await shareMealsWith(locals.user!.id, username, { mealId, categoryId });
		} catch (e) {
			return fail(400, { error: e instanceof Error ? e.message : 'Could not share meals' });
		}
		return { success: true };
	},

	revokeMealShare: async ({ request, locals }) => {
		const form = await request.formData();
		const shareId = Number(form.get('shareId'));
		if (!Number.isFinite(shareId)) return fail(400, { error: 'Invalid share' });
		await revokeMealShare(locals.user!.id, shareId);
		return { success: true };
	},

	leaveMeals: async ({ request, locals }) => {
		const form = await request.formData();
		const ownerId = Number(form.get('ownerId'));
		if (!Number.isFinite(ownerId)) return fail(400, { error: 'Invalid library' });
		await leaveSharedMeals(locals.user!.id, ownerId);
		return { success: true };
	}
};
