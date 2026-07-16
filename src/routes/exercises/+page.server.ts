import { fail } from '@sveltejs/kit';
import { listExercises, createExercise, updateExercise, deleteExercise } from '$lib/server/repositories/exercises';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	const exercises = await listExercises();
	return { exercises };
};

function friendlyError(e: unknown, fallback: string): string {
	if (e instanceof Error) {
		return e.message.includes('UNIQUE') ? 'An exercise with that name already exists' : e.message;
	}
	return fallback;
}

export const actions: Actions = {
	create: async ({ request }) => {
		const form = await request.formData();
		const name = String(form.get('name') ?? '').trim();
		const muscleGroup = String(form.get('muscleGroup') ?? '').trim();
		if (!name) return fail(400, { error: 'Name is required' });
		try {
			await createExercise(name, muscleGroup || null);
		} catch (e) {
			return fail(400, { error: friendlyError(e, 'Could not create exercise') });
		}
	},

	rename: async ({ request }) => {
		const form = await request.formData();
		const id = Number(form.get('id'));
		const name = String(form.get('name') ?? '').trim();
		const muscleGroup = String(form.get('muscleGroup') ?? '').trim();
		if (!id || !name) return fail(400, { error: 'Name is required' });
		try {
			await updateExercise(id, name, muscleGroup || null);
		} catch (e) {
			return fail(400, { error: friendlyError(e, 'Could not update exercise') });
		}
	},

	delete: async ({ request }) => {
		const form = await request.formData();
		const id = Number(form.get('id'));
		if (!id) return fail(400, { error: 'Missing id' });
		await deleteExercise(id);
	}
};
