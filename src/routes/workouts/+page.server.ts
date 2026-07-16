import { redirect } from '@sveltejs/kit';
import { listSessions, createSession } from '$lib/server/repositories/workouts';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	const sessions = await listSessions(locals.user!.id);
	return { sessions };
};

function todayIso(): string {
	const now = new Date();
	const y = now.getFullYear();
	const m = String(now.getMonth() + 1).padStart(2, '0');
	const d = String(now.getDate()).padStart(2, '0');
	return `${y}-${m}-${d}`;
}

export const actions: Actions = {
	start: async ({ locals }) => {
		const session = await createSession(locals.user!.id, todayIso());
		throw redirect(303, `/workouts/${session.id}`);
	}
};
