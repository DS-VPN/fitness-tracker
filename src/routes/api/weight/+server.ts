import { error, json } from '@sveltejs/kit';
import { logWeight } from '$lib/server/repositories/bodyWeight';
import { todayIso } from '$lib/utils/todayIso';
import { isValidIsoDate } from '$lib/utils/isoDate';
import type { RequestHandler } from './$types';

/** Logs a body-weight entry. Authenticated by session cookie (the app) or `Authorization:
 *  Bearer <api token>` (external callers like the Apple Health Shortcut — see hooks.server.ts).
 *  Body: { "weight": 82.4, "date": "2026-07-18" } — weight in kg; date optional (defaults to today). */
export const POST: RequestHandler = async ({ request, locals }) => {
	const user = locals.user!;

	let body: unknown;
	try {
		body = await request.json();
	} catch {
		throw error(400, 'Expected a JSON body like {"weight": 82.4}');
	}

	const { weight, date } = (body ?? {}) as { weight?: unknown; date?: unknown };
	// Shortcuts commonly sends numbers as strings, sometimes with a "," decimal separator.
	const weightKg = typeof weight === 'string' ? Number(weight.replace(',', '.')) : Number(weight);
	if (!Number.isFinite(weightKg)) throw error(400, '"weight" (kg) is required');

	const dateIso = date == null || date === '' ? todayIso() : String(date);
	if (!isValidIsoDate(dateIso)) throw error(400, '"date" must be YYYY-MM-DD');

	try {
		const row = await logWeight(user.id, dateIso, weightKg);
		return json({ ok: true, date: row.date, weightKg: row.weightKg });
	} catch (e) {
		throw error(400, e instanceof Error ? e.message : 'Could not log weight');
	}
};
