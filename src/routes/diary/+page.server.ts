import { getTargets, recentDaySummaries } from '$lib/server/repositories/nutritionLog';
import { todayIso } from '$lib/utils/todayIso';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	const userId = locals.user!.id;
	const [days, targets] = await Promise.all([recentDaySummaries(userId), getTargets(userId)]);
	return { days, targets, today: todayIso() };
};
