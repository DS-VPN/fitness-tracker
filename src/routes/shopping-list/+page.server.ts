import { error, fail, redirect } from '@sveltejs/kit';
import {
	listShoppingList,
	addManualItem,
	setChecked,
	setQuantity,
	removeItem,
	clearChecked,
	hasListAccess,
	listMyShares,
	listSharedWithMe,
	shareListWith,
	revokeShare,
	leaveSharedList
} from '$lib/server/repositories/shoppingList';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ url, locals }) => {
	const userId = locals.user!.id;
	const ownerParam = url.searchParams.get('owner');

	let ownerId = userId;
	if (ownerParam !== null) {
		const parsed = Number(ownerParam);
		if (!Number.isFinite(parsed) || !(await hasListAccess(userId, parsed))) {
			throw error(403, 'Not found');
		}
		ownerId = parsed;
	}

	const [{ fromMeals, manual }, myShares, sharedWithMe] = await Promise.all([
		listShoppingList(ownerId),
		listMyShares(userId),
		listSharedWithMe(userId)
	]);

	const isOwner = ownerId === userId;
	const ownerUsername = isOwner ? null : (sharedWithMe.find((s) => s.ownerId === ownerId)?.ownerUsername ?? null);

	return { fromMeals, manual, ownerId, isOwner, ownerUsername, myShares, sharedWithMe };
};

function readId(form: FormData, field = 'id'): number | null {
	const id = Number(form.get(field));
	return Number.isFinite(id) ? id : null;
}

function friendlyError(e: unknown, fallback: string): string {
	return e instanceof Error ? e.message : fallback;
}

export const actions: Actions = {
	toggleChecked: async ({ request, locals }) => {
		const form = await request.formData();
		const id = readId(form);
		const ownerId = readId(form, 'ownerId');
		if (id === null || ownerId === null) return fail(400, { error: 'Invalid item' });
		try {
			await setChecked(locals.user!.id, ownerId, id, form.get('checked') === 'true');
		} catch (e) {
			return fail(403, { error: friendlyError(e, 'You do not have access to this shopping list') });
		}
	},

	setQuantity: async ({ request, locals }) => {
		const form = await request.formData();
		const id = readId(form);
		const ownerId = readId(form, 'ownerId');
		const quantity = Number(form.get('quantity'));
		if (id === null || ownerId === null || !Number.isFinite(quantity)) {
			return fail(400, { error: 'Invalid quantity' });
		}
		try {
			await setQuantity(locals.user!.id, ownerId, id, quantity);
		} catch (e) {
			return fail(403, { error: friendlyError(e, 'You do not have access to this shopping list') });
		}
	},

	removeItem: async ({ request, locals }) => {
		const form = await request.formData();
		const id = readId(form);
		const ownerId = readId(form, 'ownerId');
		if (id === null || ownerId === null) return fail(400, { error: 'Invalid item' });
		try {
			await removeItem(locals.user!.id, ownerId, id);
		} catch (e) {
			return fail(403, { error: friendlyError(e, 'You do not have access to this shopping list') });
		}
	},

	addManualItem: async ({ request, locals }) => {
		const form = await request.formData();
		const ownerId = readId(form, 'ownerId');
		const name = String(form.get('name') ?? '').trim();
		const brand = String(form.get('brand') ?? '').trim();
		if (ownerId === null) return fail(400, { error: 'Invalid list' });
		if (!name) return fail(400, { error: 'Item name is required' });
		try {
			await addManualItem(locals.user!.id, ownerId, name, brand || undefined);
		} catch (e) {
			return fail(403, { error: friendlyError(e, 'You do not have access to this shopping list') });
		}
	},

	clearChecked: async ({ request, locals }) => {
		const form = await request.formData();
		const ownerId = readId(form, 'ownerId');
		if (ownerId === null) return fail(400, { error: 'Invalid list' });
		try {
			await clearChecked(locals.user!.id, ownerId);
		} catch (e) {
			return fail(403, { error: friendlyError(e, 'You do not have access to this shopping list') });
		}
	},

	share: async ({ request, locals }) => {
		const form = await request.formData();
		const username = String(form.get('username') ?? '');
		try {
			await shareListWith(locals.user!.id, username);
		} catch (e) {
			return fail(400, { error: friendlyError(e, 'Could not share list') });
		}
	},

	revokeShare: async ({ request, locals }) => {
		const form = await request.formData();
		const sharedWithUserId = readId(form, 'userId');
		if (sharedWithUserId === null) return fail(400, { error: 'Invalid user' });
		await revokeShare(locals.user!.id, sharedWithUserId);
	},

	leaveList: async ({ request, locals }) => {
		const form = await request.formData();
		const ownerId = readId(form, 'ownerId');
		if (ownerId === null) return fail(400, { error: 'Invalid list' });
		await leaveSharedList(locals.user!.id, ownerId);
		throw redirect(303, '/shopping-list');
	}
};
