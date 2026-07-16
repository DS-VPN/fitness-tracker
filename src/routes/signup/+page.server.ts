import { fail, redirect } from '@sveltejs/kit';
import { createUser, findUserByUsername, createSession, setSessionCookie } from '$lib/server/auth';
import { validateUsername, validatePassword } from '$lib/server/validation';
import { seedPresetsForUser } from '$lib/server/presets';
import type { Actions } from './$types';

export const actions: Actions = {
	default: async ({ request, cookies, url }) => {
		const form = await request.formData();
		const username = String(form.get('username') ?? '').trim();
		const password = String(form.get('password') ?? '');
		const confirmPassword = String(form.get('confirmPassword') ?? '');

		const usernameError = validateUsername(username);
		if (usernameError) return fail(400, { error: usernameError, username });

		const passwordError = validatePassword(password);
		if (passwordError) return fail(400, { error: passwordError, username });

		if (password !== confirmPassword) {
			return fail(400, { error: 'Passwords do not match', username });
		}

		if (await findUserByUsername(username)) {
			return fail(400, { error: 'That username is already taken', username });
		}

		const user = await createUser(username, password);
		await seedPresetsForUser(user.id);
		const { token, expiresAt } = await createSession(user.id);
		setSessionCookie(cookies, token, expiresAt, url.protocol === 'https:');

		throw redirect(303, '/');
	}
};
