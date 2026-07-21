import { listPhotos } from '$lib/server/repositories/progressPhotos';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	// listPhotos returns newest-first and never exposes the on-disk filename — only ids the owner can
	// resolve through the ownership-checked serve route.
	const photos = await listPhotos(locals.user!.id);
	return { photos };
};
