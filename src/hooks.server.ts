import type { Handle } from '@sveltejs/kit';
import { redirect } from '@sveltejs/kit';
import { SESSION_COOKIE, getSessionUser } from '$lib/server/auth';
import { seedPresetsForAllUsers } from '$lib/server/presets';

const PUBLIC_PATHS = new Set(['/login', '/signup', '/manifest.webmanifest', '/service-worker.js']);

// Backfills preset meals/exercises for accounts that existed before this feature. Fire-and-forget
// so it never delays server startup; seedPresetsForUser is idempotent so this is safe on every boot.
seedPresetsForAllUsers().catch((err) => console.error('Failed to seed presets for existing users', err));

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
