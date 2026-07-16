import { redirect } from '@sveltejs/kit';
import { clearSessionCookie } from '$lib/server/auth';
import type { Actions } from './$types';

export const actions: Actions = {
	default: async ({ cookies }) => {
		clearSessionCookie(cookies);
		throw redirect(303, '/login');
	}
};
