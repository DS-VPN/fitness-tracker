import type { Handle } from '@sveltejs/kit';
import { redirect } from '@sveltejs/kit';
import { SESSION_COOKIE, isValidSessionToken } from '$lib/server/auth';

const PUBLIC_PATHS = new Set(['/login', '/manifest.webmanifest', '/service-worker.js']);

export const handle: Handle = async ({ event, resolve }) => {
	const { pathname } = event.url;
	const isPublic = PUBLIC_PATHS.has(pathname) || pathname.startsWith('/icons/');

	const authed = isValidSessionToken(event.cookies.get(SESSION_COOKIE));
	event.locals.authed = authed;

	if (!authed && !isPublic) {
		const redirectTo = pathname === '/' ? undefined : pathname;
		throw redirect(303, redirectTo ? `/login?redirectTo=${encodeURIComponent(redirectTo)}` : '/login');
	}

	if (authed && pathname === '/login') {
		throw redirect(303, '/');
	}

	return resolve(event);
};
