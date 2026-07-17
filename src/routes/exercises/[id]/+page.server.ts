import { error, fail } from '@sveltejs/kit';
import { getExerciseProgress } from '$lib/server/repositories/progress';
import { getGoal, upsertGoal, deleteGoal } from '$lib/server/repositories/exerciseGoals';
import { parseDecimal } from '$lib/utils/parseDecimal';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, locals }) => {
	const id = Number(params.id);
	const [progress, goal] = await Promise.all([
		getExerciseProgress(locals.user!.id, id),
		Number.isFinite(id) ? getGoal(locals.user!.id, id) : Promise.resolve(null)
	]);
	if (!progress) throw error(404, 'Exercise not found');
	return { progress, goal };
};

export const actions: Actions = {
	saveGoal: async ({ request, params, locals }) => {
		const id = Number(params.id);
		const form = await request.formData();
		const targetWeight = parseDecimal(String(form.get('targetWeight') ?? ''));
		const targetReps = Math.round(Number(form.get('targetReps')));
		try {
			await upsertGoal(locals.user!.id, id, targetWeight, targetReps);
		} catch (e) {
			return fail(400, { error: e instanceof Error ? e.message : 'Could not save goal' });
		}
		return { success: true };
	},

	deleteGoal: async ({ params, locals }) => {
		const id = Number(params.id);
		await deleteGoal(locals.user!.id, id);
		return { success: true };
	}
};
