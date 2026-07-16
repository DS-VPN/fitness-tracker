import type { Handle } from '@sveltejs/kit';
import { redirect } from '@sveltejs/kit';
import { SESSION_COOKIE, getSessionUser } from '$lib/server/auth';

const PUBLIC_PATHS = new Set(['/login', '/signup', '/manifest.webmanifest', '/service-worker.js']);

export const handle: Handle = async ({ event, resolve }) => {
	const { pathname } = event.url;
	const isPublic = PUBLIC_PATHS.has(pathname) || pathname.startsWith('/icons/');

	const user = await getSessionUser(event.cookies.get(SESSION_COOKIE));
	event.locals.user = user;

	if (!user && !isPublic) {
		const redirectTo = pathname === '/' ? undefined : pathname;
		throw redirect(303, redirectTo ? `/login?redirectTo=${encodeURIComponent(redirectTo)}` : '/login');
	}

	if (user && (pathname === '/login' || pathname === '/signup')) {
		throw redirect(303, '/');
	}

	return resolve(event);
};
