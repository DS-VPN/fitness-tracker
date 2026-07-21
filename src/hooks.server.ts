import type { Handle } from '@sveltejs/kit';
import { redirect } from '@sveltejs/kit';
import { SESSION_COOKIE, getSessionUser } from '$lib/server/auth';
import { seedPresetsForAllUsers, seedCatalog } from '$lib/server/presets';
import { ensureAdminExists } from '$lib/server/repositories/admin';

const PUBLIC_PATHS = new Set(['/login', '/signup', '/manifest.webmanifest', '/service-worker.js']);

// Backfills preset meals/exercises for accounts that existed before this feature. Fire-and-forget
// so it never delays server startup; seedPresetsForUser is idempotent so this is safe on every boot.
seedPresetsForAllUsers().catch((err) => console.error('Failed to seed presets for existing users', err));

// Seeds the shared OFF product catalog once at startup (global, idempotent). Fire-and-forget.
seedCatalog().catch((err) => console.error('Failed to seed product catalog', err));

// Ensures at least one admin exists (promotes the earliest account if none). Idempotent once an admin
// exists, so it's a no-op on every subsequent boot. Fire-and-forget.
ensureAdminExists().catch((err) => console.error('Failed to ensure an admin exists', err));

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

	// Admin area: authenticated non-admins are bounced home. Defense-in-depth only — the /admin
	// layout and every admin action re-check, since that's where the un-scoped queries actually run.
	if (pathname === '/admin' || pathname.startsWith('/admin/')) {
		if (!user?.isAdmin) throw redirect(303, '/');
	}

	return resolve(event);
};
