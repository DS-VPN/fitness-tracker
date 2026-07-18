import { json } from '@sveltejs/kit';
import { ensureApiToken } from '$lib/server/auth';
import type { RequestHandler } from './$types';

/** Returns the caller's personal API token, minting it on first use. Used by the Apple Health
 *  setup instructions in Settings. POST (not GET) because the first call creates the token. */
export const POST: RequestHandler = async ({ locals }) => {
	const token = await ensureApiToken(locals.user!.id);
	return json({ token });
};
