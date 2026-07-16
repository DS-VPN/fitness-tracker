import { redirect } from '@sveltejs/kit';
import { SESSION_COOKIE, deleteSession, clearSessionCookie } from '$lib/server/auth';
import type { Actions } from './$types';

export const actions: Actions = {
	default: async ({ cookies }) => {
		const token = cookies.get(SESSION_COOKIE);
		if (token) await deleteSession(token);
		clearSessionCookie(cookies);
		throw redirect(303, '/login');
	}
};
