import { error } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';

// Gate for the whole /admin subtree. hooks.server.ts already redirects non-admins away from /admin*;
// this is defense-in-depth (and returns 404 rather than confirm the area exists).
export const load: LayoutServerLoad = ({ locals }) => {
	if (!locals.user?.isAdmin) throw error(404, 'Not found');
	return {};
};
