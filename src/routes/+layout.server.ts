import type { LayoutServerLoad } from './$types';

// Exposes the current user's identity + admin flag to every page via `page.data.user`, so shared UI
// (e.g. the Admin link in SettingsModal) can react to it without each page's load re-fetching it.
export const load: LayoutServerLoad = ({ locals }) => {
	return {
		user: locals.user ? { username: locals.user.username, isAdmin: locals.user.isAdmin } : null
	};
};
