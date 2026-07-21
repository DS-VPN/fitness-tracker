import { fail } from '@sveltejs/kit';
import { deletePhoto, listPhotos, POSES, savePhoto, type Pose } from '$lib/server/repositories/progressPhotos';
import { photoEncryptionAvailable } from '$lib/server/crypto/photoCrypto';
import { todayIso } from '$lib/utils/todayIso';
import type { Actions, PageServerLoad } from './$types';

function parsePose(raw: string | null): Pose | null {
	return raw && (POSES as readonly string[]).includes(raw) ? (raw as Pose) : null;
}

export const load: PageServerLoad = async ({ locals, url }) => {
	const userId = locals.user!.id;
	const pose = parsePose(url.searchParams.get('pose'));
	const photos = await listPhotos(userId, pose ? { pose } : {});
	return { photos, pose, encryptionReady: photoEncryptionAvailable() };
};

export const actions: Actions = {
	upload: async ({ request, locals }) => {
		const userId = locals.user!.id;
		const form = await request.formData();
		const file = form.get('photo');
		if (!(file instanceof File) || file.size === 0) return fail(400, { error: 'Choose a photo first' });

		const date = String(form.get('date') ?? '').trim() || todayIso();
		const pose = parsePose(String(form.get('pose') ?? '') || null);
		const caption = String(form.get('caption') ?? '');

		try {
			await savePhoto(userId, { date, pose, caption }, file);
		} catch (e) {
			return fail(400, { error: e instanceof Error ? e.message : 'Could not save photo' });
		}
		return { success: true };
	},

	delete: async ({ request, locals }) => {
		const id = Number((await request.formData()).get('id'));
		if (!Number.isFinite(id)) return fail(400, { error: 'Invalid photo' });
		await deletePhoto(locals.user!.id, id);
		return { success: true };
	}
};
