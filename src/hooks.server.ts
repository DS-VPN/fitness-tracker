import type { Handle } from '@sveltejs/kit';
import { json, redirect } from '@sveltejs/kit';
import { SESSION_COOKIE, getSessionUser, getUserByApiToken } from '$lib/server/auth';
import { seedPresetsForAllUsers, seedCatalog } from '$lib/server/presets';

const PUBLIC_PATHS = new Set(['/login', '/signup', '/manifest.webmanifest', '/service-worker.js']);

// Backfills preset meals/exercises for accounts that existed before this feature. Fire-and-forget
// so it never delays server startup; seedPresetsForUser is idempotent so this is safe on every boot.
seedPresetsForAllUsers().catch((err) => console.error('Failed to seed presets for existing users', err));

// Seeds the shared OFF product catalog once at startup (global, idempotent). Fire-and-forget.
seedCatalog().catch((err) => console.error('Failed to seed product catalog', err));

export const handle: Handle = async ({ event, resolve }) => {
	const { pathname } = event.url;
	const isPublic = PUBLIC_PATHS.has(pathname) || pathname.startsWith('/icons/');
	const isApi = pathname.startsWith('/api/');

	let user = await getSessionUser(event.cookies.get(SESSION_COOKIE));

	// API routes also accept the personal bearer token, so external callers (e.g. the Apple
	// Health weight-sync Shortcut) can authenticate without a browser session.
	if (!user && isApi) {
		const auth = event.request.headers.get('authorization');
		if (auth?.startsWith('Bearer ')) {
			user = await getUserByApiToken(auth.slice('Bearer '.length).trim());
		}
	}
	event.locals.user = user;

	if (!user && !isPublic) {
		// API callers get a plain 401 — a login-page redirect is useless to fetch/Shortcuts.
		if (isApi) return json({ error: 'Unauthorized' }, { status: 401 });
		const redirectTo = pathname === '/' ? undefined : pathname;
		throw redirect(303, redirectTo ? `/login?redirectTo=${encodeURIComponent(redirectTo)}` : '/login');
	}

	if (user && (pathname === '/login' || pathname === '/signup')) {
		throw redirect(303, '/');
	}

	return resolve(event);
};
