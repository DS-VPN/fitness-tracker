import { error } from '@sveltejs/kit';
import { getExerciseProgress } from '$lib/server/repositories/progress';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, locals }) => {
	const id = Number(params.id);
	const progress = await getExerciseProgress(locals.user!.id, id);
	if (!progress) throw error(404, 'Exercise not found');
	return { progress };
};
