import { fail, redirect } from '@sveltejs/kit';
import { dev } from '$app/environment';
import { findUserByUsername, verifyPassword, createSession, setSessionCookie } from '$lib/server/auth';
import type { Actions } from './$types';

export const actions: Actions = {
	default: async ({ request, cookies, url }) => {
		const form = await request.formData();
		const username = String(form.get('username') ?? '').trim();
		const password = String(form.get('password') ?? '');

		if (!username || !password) {
			return fail(400, { error: 'Username and password are required', username });
		}

		const user = await findUserByUsername(username);
		if (!user || !(await verifyPassword(password, user.passwordHash))) {
			return fail(400, { error: 'Incorrect username or password', username });
		}

		const { token, expiresAt } = await createSession(user.id);
		setSessionCookie(cookies, token, expiresAt, !dev);

		const redirectTo = url.searchParams.get('redirectTo');
		throw redirect(303, redirectTo && redirectTo.startsWith('/') ? redirectTo : '/');
	}
};
