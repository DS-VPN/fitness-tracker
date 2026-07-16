import { error, fail, redirect } from '@sveltejs/kit';
import {
	getPlan,
	renamePlan,
	deletePlan,
	addPlanExercise,
	updatePlanExerciseTargetSets,
	removePlanExercise
} from '$lib/server/repositories/workoutPlans';
import { listExercises, createExercise } from '$lib/server/repositories/exercises';
import { createSession } from '$lib/server/repositories/workouts';
import type { Actions, PageServerLoad } from './$types';

function todayIso(): string {
	const now = new Date();
	const y = now.getFullYear();
	const m = String(now.getMonth() + 1).padStart(2, '0');
	const d = String(now.getDate()).padStart(2, '0');
	return `${y}-${m}-${d}`;
}

export const load: PageServerLoad = async ({ params, locals }) => {
	const id = Number(params.id);
	if (!Number.isFinite(id)) throw error(404, 'Plan not found');

	const userId = locals.user!.id;
	const [result, allExercises] = await Promise.all([getPlan(userId, id), listExercises(userId)]);
	if (!result) throw error(404, 'Plan not found');

	return { plan: result.plan, exercises: result.exercises, allExercises };
};

function friendlyError(e: unknown, fallback: string): string {
	if (e instanceof Error) {
		return e.message.includes('UNIQUE') ? 'An exercise with that name already exists' : e.message;
	}
	return fallback;
}

function parseTargetSets(form: FormData): number | null {
	const raw = form.get('targetSets');
	if (raw === null || String(raw).trim() === '') return null;
	const n = Math.round(Number(raw));
	return Number.isFinite(n) && n > 0 ? n : null;
}

export const actions: Actions = {
	rename: async ({ request, params, locals }) => {
		const id = Number(params.id);
		const form = await request.formData();
		const name = String(form.get('name') ?? '');
		try {
			await renamePlan(locals.user!.id, id, name);
		} catch (e) {
			return fail(400, { error: e instanceof Error ? e.message : 'Could not rename plan' });
		}
		return { success: true };
	},

	delete: async ({ params, locals }) => {
		await deletePlan(locals.user!.id, Number(params.id));
		throw redirect(303, '/workouts/plans');
	},

	createExercise: async ({ request, locals }) => {
		const form = await request.formData();
		const name = String(form.get('name') ?? '').trim();
		if (!name) return fail(400, { error: 'Name is required' });
		try {
			const exercise = await createExercise(locals.user!.id, name);
			return { exercise };
		} catch (e) {
			return fail(400, { error: friendlyError(e, 'Could not add exercise') });
		}
	},

	addExercise: async ({ request, params, locals }) => {
		const planId = Number(params.id);
		const form = await request.formData();
		const exerciseId = Number(form.get('exerciseId'));
		if (!Number.isFinite(exerciseId)) return fail(400, { error: 'Invalid exercise' });
		try {
			await addPlanExercise(locals.user!.id, planId, exerciseId, parseTargetSets(form));
		} catch (e) {
			return fail(400, { error: e instanceof Error ? e.message : 'Could not add exercise' });
		}
		return { success: true };
	},

	updateTargetSets: async ({ request, params, locals }) => {
		const planId = Number(params.id);
		const form = await request.formData();
		const planExerciseId = Number(form.get('planExerciseId'));
		if (!Number.isFinite(planExerciseId)) return fail(400, { error: 'Invalid exercise' });
		try {
			await updatePlanExerciseTargetSets(locals.user!.id, planId, planExerciseId, parseTargetSets(form));
		} catch (e) {
			return fail(400, { error: e instanceof Error ? e.message : 'Could not update' });
		}
		return { success: true };
	},

	removeExercise: async ({ request, params, locals }) => {
		const planId = Number(params.id);
		const form = await request.formData();
		const planExerciseId = Number(form.get('planExerciseId'));
		if (!Number.isFinite(planExerciseId)) return fail(400, { error: 'Invalid exercise' });
		await removePlanExercise(locals.user!.id, planId, planExerciseId);
		return { success: true };
	},

	startWorkout: async ({ params, locals }) => {
		const planId = Number(params.id);
		const plan = await getPlan(locals.user!.id, planId);
		if (!plan) throw error(404, 'Plan not found');

		const session = await createSession(locals.user!.id, todayIso(), null, planId);
		throw redirect(303, `/workouts/${session.id}`);
	}
};
