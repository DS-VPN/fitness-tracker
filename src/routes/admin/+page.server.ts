import { error, fail } from '@sveltejs/kit';
import {
	clearBarcodeCache,
	createUserAsAdmin,
	deleteUser,
	getInstanceStats,
	listUsers,
	reseedCatalog,
	reseedPresets,
	setAdmin,
	setPassword
} from '$lib/server/repositories/admin';
import type { Actions, PageServerLoad } from './$types';

// Every action re-checks admin — never trust that `load` (or hooks) ran. This is where the un-scoped
// queries actually execute, so the check lives right next to them.
function assertAdmin(locals: App.Locals) {
	if (!locals.user?.isAdmin) throw error(403, 'Forbidden');
}

export const load: PageServerLoad = async ({ locals }) => {
	assertAdmin(locals);
	const [users, stats] = await Promise.all([listUsers(), getInstanceStats()]);
	return { users, stats, meId: locals.user!.id };
};

export const actions: Actions = {
	createUser: async ({ request, locals }) => {
		assertAdmin(locals);
		const form = await request.formData();
		try {
			await createUserAsAdmin(String(form.get('username') ?? ''), String(form.get('password') ?? ''));
		} catch (e) {
			return fail(400, { error: e instanceof Error ? e.message : 'Could not create user' });
		}
		return { success: true, message: 'User created' };
	},

	setPassword: async ({ request, locals }) => {
		assertAdmin(locals);
		const form = await request.formData();
		const userId = Number(form.get('userId'));
		if (!Number.isFinite(userId)) return fail(400, { error: 'Invalid user' });
		try {
			await setPassword(userId, String(form.get('password') ?? ''));
		} catch (e) {
			return fail(400, { error: e instanceof Error ? e.message : 'Could not reset password' });
		}
		return { success: true, message: 'Password reset — their sessions were signed out' };
	},

	toggleAdmin: async ({ request, locals }) => {
		assertAdmin(locals);
		const form = await request.formData();
		const userId = Number(form.get('userId'));
		const value = String(form.get('value')) === 'true';
		if (!Number.isFinite(userId)) return fail(400, { error: 'Invalid user' });
		try {
			await setAdmin(userId, value);
		} catch (e) {
			return fail(400, { error: e instanceof Error ? e.message : 'Could not update role' });
		}
		return { success: true, message: value ? 'Promoted to admin' : 'Admin removed' };
	},

	deleteUser: async ({ request, locals }) => {
		assertAdmin(locals);
		const userId = Number((await request.formData()).get('userId'));
		if (!Number.isFinite(userId)) return fail(400, { error: 'Invalid user' });
		try {
			await deleteUser(locals.user!.id, userId);
		} catch (e) {
			return fail(400, { error: e instanceof Error ? e.message : 'Could not delete user' });
		}
		return { success: true, message: 'User deleted' };
	},

	reseedCatalog: async ({ locals }) => {
		assertAdmin(locals);
		try {
			await reseedCatalog();
		} catch (e) {
			return fail(400, { error: e instanceof Error ? e.message : 'Failed to re-seed catalog' });
		}
		return { success: true, message: 'Product catalog re-seeded' };
	},

	reseedPresets: async ({ locals }) => {
		assertAdmin(locals);
		try {
			await reseedPresets();
		} catch (e) {
			return fail(400, { error: e instanceof Error ? e.message : 'Failed to re-seed presets' });
		}
		return { success: true, message: 'Presets re-seeded for all users' };
	},

	clearBarcodeCache: async ({ locals }) => {
		assertAdmin(locals);
		const n = await clearBarcodeCache();
		return { success: true, message: `Cleared ${n} cached barcode lookup${n === 1 ? '' : 's'}` };
	}
};
