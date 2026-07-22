import { fail } from '@sveltejs/kit';
import { fieldEncryptionAvailable } from '$lib/server/crypto/fieldCrypto';
import { listPeptides, peptideNameMap } from '$lib/server/repositories/peptides';
import { listProtocols, getProtocol, toSchedule } from '$lib/server/repositories/peptideProtocols';
import { listVials } from '$lib/server/repositories/peptideVials';
import {
	dateCounts,
	deleteDose,
	dosesOnDate,
	listDoses,
	loggedDatesForPeptide,
	logDose,
	recentSites
} from '$lib/server/repositories/peptideDoses';
import { seedPeptidesForUser } from '$lib/server/peptidePresets';
import { todayIso } from '$lib/utils/todayIso';
import { shiftIsoDate } from '$lib/utils/isoDate';
import { parseDecimal } from '$lib/utils/parseDecimal';
import { daysBetween, isDueOn } from '$lib/utils/peptideSchedule';
import { dosesPerVial, syringeUnits } from '$lib/utils/reconstitution';
import { isInjectionRoute, isInjectionSite, suggestNextSite } from '$lib/utils/peptides';
import type { Actions, PageServerLoad } from './$types';

const ADHERENCE_DAYS = 30;
const CALENDAR_DAYS = 70;
const EXPIRY_SOON_DAYS = 7;

export const load: PageServerLoad = async ({ locals }) => {
	const userId = locals.user!.id;
	if (!fieldEncryptionAvailable()) return { encryptionReady: false as const };

	// Lazily seed the starter catalog on the very first visit (empty catalog), then load everything.
	if ((await listPeptides(userId, { includeInactive: true })).length === 0) {
		await seedPeptidesForUser(userId);
	}

	const today = todayIso();
	const [peptides, protocols, vials, todaysDoses, recent, names, sites] = await Promise.all([
		listPeptides(userId),
		listProtocols(userId, { activeOnly: true }),
		listVials(userId),
		dosesOnDate(userId, today),
		listDoses(userId, { limit: 8 }),
		peptideNameMap(userId),
		recentSites(userId, 12)
	]);

	const nameOf = (id: number) => names.get(id)?.name ?? 'Unknown';

	// --- Due today (active protocols scheduled for today, reconciled against what's logged) ---
	const loggedToday = new Set(todaysDoses.map((d) => d.peptideId));
	const due = protocols
		.filter((p) => isDueOn(toSchedule(p), today))
		.map((p) => ({
			protocolId: p.id,
			peptideId: p.peptideId,
			peptideName: nameOf(p.peptideId),
			doseMcg: p.doseMcg,
			route: p.route,
			timeOfDay: p.timeOfDay,
			logged: loggedToday.has(p.peptideId)
		}));

	// --- 30-day adherence (logged ÷ scheduled across all active protocols) ---
	const windowStart = shiftIsoDate(today, -(ADHERENCE_DAYS - 1));
	let dueTotal = 0;
	let dueTaken = 0;
	for (const p of protocols) {
		const s = toSchedule(p);
		const start = p.startDate > windowStart ? p.startDate : windowStart;
		if (start > today) continue;
		const logged = await loggedDatesForPeptide(userId, p.peptideId, start, today);
		const span = daysBetween(start, today);
		for (let i = 0; i <= span; i++) {
			const d = shiftIsoDate(start, i);
			if (isDueOn(s, d)) {
				dueTotal++;
				if (logged.has(d)) dueTaken++;
			}
		}
	}
	const adherence = dueTotal > 0 ? { pct: Math.round((dueTaken / dueTotal) * 100), taken: dueTaken, total: dueTotal } : null;

	// --- Calendar (last 10 weeks: logged count + whether anything was due) ---
	const calFrom = shiftIsoDate(today, -(CALENDAR_DAYS - 1));
	const counts = await dateCounts(userId, calFrom, today);
	const calendar: { date: string; count: number; due: boolean }[] = [];
	for (let i = 0; i <= daysBetween(calFrom, today); i++) {
		const d = shiftIsoDate(calFrom, i);
		calendar.push({ date: d, count: counts.get(d) ?? 0, due: protocols.some((p) => isDueOn(toSchedule(p), d)) });
	}

	// --- Vial alerts: expiry + best-effort "doses left" from any active protocol for that peptide ---
	const vialAlerts = vials.map((v) => {
		const proto = protocols.find((p) => p.peptideId === v.peptideId);
		const dosesLeft = proto ? Math.max(0, dosesPerVial(v.vialMg, proto.doseMcg) - v.dosesLogged) : null;
		let expiry: 'expired' | 'soon' | null = null;
		if (v.expiresAt) {
			if (v.expiresAt < today) expiry = 'expired';
			else if (daysBetween(today, v.expiresAt) <= EXPIRY_SOON_DAYS) expiry = 'soon';
		}
		return {
			id: v.id,
			peptideName: nameOf(v.peptideId),
			vialMg: v.vialMg,
			bacWaterMl: v.bacWaterMl,
			expiresAt: v.expiresAt,
			expiry,
			dosesLeft,
			low: dosesLeft != null && dosesLeft <= 3
		};
	});

	return {
		encryptionReady: true as const,
		today,
		peptides,
		due,
		adherence,
		calendar,
		vialAlerts,
		suggestedSite: suggestNextSite(sites),
		recent: recent.map((d) => ({ ...d, peptideName: nameOf(d.peptideId) })),
		// For the log-dose modal: active vials (with concentration for the reconstitution prefill).
		activeVials: vials.map((v) => ({ id: v.id, peptideId: v.peptideId, vialMg: v.vialMg, bacWaterMl: v.bacWaterMl }))
	};
};

function num(form: FormData, key: string): number | null {
	const raw = String(form.get(key) ?? '').trim();
	if (raw === '') return null;
	const n = parseDecimal(raw);
	return Number.isFinite(n) ? n : null;
}

export const actions: Actions = {
	logDose: async ({ request, locals }) => {
		const userId = locals.user!.id;
		const form = await request.formData();
		const peptideId = Number(form.get('peptideId'));
		if (!Number.isFinite(peptideId)) return fail(400, { error: 'Pick a peptide' });
		const doseMcg = num(form, 'doseMcg');
		if (doseMcg == null) return fail(400, { error: 'Enter a dose in mcg' });
		const siteRaw = String(form.get('site') ?? '');
		const routeRaw = String(form.get('route') ?? '');
		const vialId = Number(form.get('vialId'));
		const protocolId = Number(form.get('protocolId'));
		const unitsShown = num(form, 'unitsShown');
		try {
			await logDose(userId, {
				peptideId,
				date: String(form.get('date') ?? '').trim() || todayIso(),
				doseMcg,
				site: isInjectionSite(siteRaw) ? siteRaw : null,
				route: isInjectionRoute(routeRaw) ? routeRaw : null,
				time: String(form.get('time') ?? '').trim() || null,
				vialId: Number.isFinite(vialId) && vialId > 0 ? vialId : null,
				protocolId: Number.isFinite(protocolId) && protocolId > 0 ? protocolId : null,
				unitsShown,
				notes: String(form.get('notes') ?? '').trim() || null
			});
		} catch (e) {
			return fail(400, { error: e instanceof Error ? e.message : 'Could not log dose' });
		}
		return { success: true };
	},

	// One-tap logging of a due protocol at today's date, rotating to the suggested site.
	quickLog: async ({ request, locals }) => {
		const userId = locals.user!.id;
		const form = await request.formData();
		const protocolId = Number(form.get('protocolId'));
		const proto = await getProtocol(userId, protocolId);
		if (!proto) return fail(400, { error: 'Protocol not found' });
		const site = proto.rotateSites ? suggestNextSite(await recentSites(userId, 12)) : null;
		const vials = await listVials(userId, { peptideId: proto.peptideId });
		const vial = vials[0] ?? null;
		const units =
			vial && vial.bacWaterMl ? syringeUnits({ vialMg: vial.vialMg, bacWaterMl: vial.bacWaterMl, doseMcg: proto.doseMcg }) : null;
		try {
			await logDose(userId, {
				peptideId: proto.peptideId,
				protocolId: proto.id,
				vialId: vial?.id ?? null,
				date: todayIso(),
				doseMcg: proto.doseMcg,
				site,
				route: proto.route,
				time: proto.timeOfDay,
				unitsShown: units
			});
		} catch (e) {
			return fail(400, { error: e instanceof Error ? e.message : 'Could not log dose' });
		}
		return { success: true };
	},

	deleteDose: async ({ request, locals }) => {
		const id = Number((await request.formData()).get('id'));
		if (!Number.isFinite(id)) return fail(400, { error: 'Invalid dose' });
		await deleteDose(locals.user!.id, id);
		return { success: true };
	}
};
