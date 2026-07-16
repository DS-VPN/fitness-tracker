import { listPlans } from '$lib/server/repositories/workoutPlans';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	return { plans: await listPlans(locals.user!.id) };
};
