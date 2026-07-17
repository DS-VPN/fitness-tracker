import { fail } from '@sveltejs/kit';
import { listMeals } from '$lib/server/repositories/meals';
import { listProducts } from '$lib/server/repositories/products';
import { listSessions } from '$lib/server/repositories/workouts';
import { getPlan } from '$lib/server/repositories/workoutPlans';
import { recentExerciseProgress } from '$lib/server/repositories/progress';
import { goalsWithProgress } from '$lib/server/repositories/exerciseGoals';
import {
	getTargets,
	saveTargets,
	logMealToDay,
	logProductToDay,
	listDay,
	daySummary,
	deleteEntry
} from '$lib/server/repositories/nutritionLog';
import { todayIso } from '$lib/utils/todayIso';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	const userId = locals.user!.id;
	const today = todayIso();

	const [targets, summary, entries, sessions, goals, exerciseProgress, meals, products] = await Promise.all([
		getTargets(userId),
		daySummary(userId, today),
		listDay(userId, today),
		listSessions(userId),
		goalsWithProgress(userId),
		recentExerciseProgress(userId, 3),
		listMeals(userId),
		listProducts(userId)
	]);

	// Today's workout status: the most recent session dated today, enriched with its plan's totals when
	// it was started from a plan ("Push Day · 2/4 exercises · 6/10 sets").
	const todaySession = sessions.find((s) => s.date === today) ?? null;
	let todayWorkout: {
		id: number;
		planName: string | null;
		exercisesDone: number;
		exercisesTotal: number | null;
		setsDone: number;
		setsTarget: number | null;
	} | null = null;
	if (todaySession) {
		let planName: string | null = null;
		let exercisesTotal: number | null = null;
		let setsTarget: number | null = null;
		if (todaySession.planId) {
			const plan = await getPlan(userId, todaySession.planId);
			if (plan) {
				planName = plan.plan.name;
				exercisesTotal = plan.exercises.length;
				const totalTargets = plan.exercises.reduce((sum, e) => sum + (e.targetSets ?? 0), 0);
				setsTarget = totalTargets > 0 ? totalTargets : null;
			}
		}
		todayWorkout = {
			id: todaySession.id,
			planName,
			exercisesDone: todaySession.exerciseCount,
			exercisesTotal,
			setsDone: todaySession.setCount,
			setsTarget
		};
	}

	return {
		username: locals.user!.username,
		targets,
		summary,
		entries,
		todayWorkout,
		goals: goals.slice(0, 3),
		exerciseProgress,
		logMeals: meals.map((m) => ({ id: m.id, name: m.name, portions: m.portions, totalMacros: m.totalMacros })),
		logProducts: products.map((p) => ({
			id: p.id,
			name: p.name,
			brand: p.brand,
			calories: p.calories,
			servingSize: p.servingSize
		}))
	};
};

export const actions: Actions = {
	saveTargets: async ({ request, locals }) => {
		const form = await request.formData();
		const num = (key: string) => Number(form.get(key));
		try {
			await saveTargets(locals.user!.id, {
				calories: num('calories'),
				protein: num('protein'),
				carbs: num('carbs'),
				fat: num('fat')
			});
		} catch (e) {
			return fail(400, { error: e instanceof Error ? e.message : 'Could not save targets' });
		}
		return { success: true };
	},

	logFood: async ({ request, locals }) => {
		const form = await request.formData();
		const kind = String(form.get('kind') ?? '');
		const refId = Number(form.get('refId'));
		const portions = Number(form.get('portions'));
		if (!Number.isFinite(refId)) return fail(400, { error: 'Invalid selection' });
		try {
			if (kind === 'meal') {
				await logMealToDay(locals.user!.id, refId, portions, todayIso());
			} else if (kind === 'product') {
				await logProductToDay(locals.user!.id, refId, portions, todayIso());
			} else {
				return fail(400, { error: 'Invalid selection' });
			}
		} catch (e) {
			return fail(400, { error: e instanceof Error ? e.message : 'Could not log' });
		}
		return { success: true };
	},

	deleteLog: async ({ request, locals }) => {
		const id = Number((await request.formData()).get('id'));
		if (!Number.isFinite(id)) return fail(400, { error: 'Invalid entry' });
		await deleteEntry(locals.user!.id, id);
		return { success: true };
	}
};
