import { fail, redirect } from '@sveltejs/kit';
import { dev } from '$app/environment';
import { verifyPassword, setSessionCookie } from '$lib/server/auth';
import type { Actions } from './$types';

export const actions: Actions = {
	default: async ({ request, cookies, url }) => {
		const form = await request.formData();
		const password = String(form.get('password') ?? '');

		if (!password || !verifyPassword(password)) {
			return fail(400, { error: 'Incorrect password' });
		}

		setSessionCookie(cookies, !dev);

		const redirectTo = url.searchParams.get('redirectTo');
		throw redirect(303, redirectTo && redirectTo.startsWith('/') ? redirectTo : '/');
	}
};
