import { db } from '$lib/server/db';
import { peptideDoses } from '$lib/server/db/schema';
import { and, asc, desc, eq, gte, lte, sql } from 'drizzle-orm';
import { decryptJson, encryptJson } from '$lib/server/crypto/fieldCrypto';
import { isValidIsoDate } from '$lib/utils/isoDate';
import { isInjectionRoute, isInjectionSite, type InjectionRoute, type InjectionSite } from '$lib/utils/peptides';

// The dose log (the "actuals"). Dose/site/route/notes are encrypted in `enc`; date + FK ids are
// cleartext, which is what lets the calendar and per-peptide adherence run without bulk-decrypting.

const aad = (userId: number) => `${userId}:peptide_doses`;

type DoseEnc = {
	doseMcg: number;
	site: InjectionSite | null;
	route: InjectionRoute | null;
	time: string | null;
	/** Syringe units shown to the user at log time, snapshotted for the history. */
	unitsShown: number | null;
	notes: string | null;
};

export type Dose = {
	id: number;
	peptideId: number;
	protocolId: number | null;
	vialId: number | null;
	date: string;
	createdAt: Date;
} & DoseEnc;

export type DoseInput = {
	peptideId: number;
	protocolId?: number | null;
	vialId?: number | null;
	date: string;
	doseMcg: number;
	site?: InjectionSite | null;
	route?: InjectionRoute | null;
	time?: string | null;
	unitsShown?: number | null;
	notes?: string | null;
};

function decode(row: typeof peptideDoses.$inferSelect): Dose {
	const enc = decryptJson<DoseEnc>(row.enc, aad(row.userId));
	return {
		id: row.id,
		peptideId: row.peptideId,
		protocolId: row.protocolId,
		vialId: row.vialId,
		date: row.date,
		createdAt: row.createdAt,
		...enc
	};
}

export async function logDose(userId: number, input: DoseInput): Promise<Dose> {
	if (!isValidIsoDate(input.date)) throw new Error('Invalid date');
	if (!Number.isFinite(input.doseMcg) || input.doseMcg <= 0 || input.doseMcg > 100_000) {
		throw new Error('Dose (mcg) is out of range');
	}
	const enc: DoseEnc = {
		doseMcg: Math.round(input.doseMcg * 1000) / 1000,
		site: isInjectionSite(input.site) ? input.site : null,
		route: isInjectionRoute(input.route) ? input.route : null,
		time: input.time?.trim() || null,
		unitsShown: input.unitsShown != null && Number.isFinite(input.unitsShown) ? input.unitsShown : null,
		notes: input.notes?.trim() || null
	};
	const [row] = await db
		.insert(peptideDoses)
		.values({
			userId,
			peptideId: input.peptideId,
			protocolId: input.protocolId ?? null,
			vialId: input.vialId ?? null,
			date: input.date,
			enc: encryptJson(enc, aad(userId)),
			createdAt: new Date()
		})
		.returning();
	return decode(row);
}

export async function deleteDose(userId: number, id: number): Promise<void> {
	await db.delete(peptideDoses).where(and(eq(peptideDoses.id, id), eq(peptideDoses.userId, userId)));
}

export async function listDoses(
	userId: number,
	opts: { peptideId?: number; from?: string; to?: string; limit?: number } = {}
): Promise<Dose[]> {
	const conds = [eq(peptideDoses.userId, userId)];
	if (opts.peptideId) conds.push(eq(peptideDoses.peptideId, opts.peptideId));
	if (opts.from) conds.push(gte(peptideDoses.date, opts.from));
	if (opts.to) conds.push(lte(peptideDoses.date, opts.to));
	let q = db
		.select()
		.from(peptideDoses)
		.where(and(...conds))
		.orderBy(desc(peptideDoses.date), desc(peptideDoses.createdAt))
		.$dynamic();
	if (opts.limit) q = q.limit(opts.limit);
	return (await q).map(decode);
}

/** Doses logged on a single date (decrypted) — used to reconcile against what's due today. */
export async function dosesOnDate(userId: number, date: string): Promise<Dose[]> {
	const rows = await db
		.select()
		.from(peptideDoses)
		.where(and(eq(peptideDoses.userId, userId), eq(peptideDoses.date, date)))
		.orderBy(asc(peptideDoses.createdAt));
	return rows.map(decode);
}

/** date → number of doses logged, for the adherence calendar. Cleartext only, no decrypt. */
export async function dateCounts(userId: number, from: string, to: string): Promise<Map<string, number>> {
	const rows = await db
		.select({ date: peptideDoses.date, n: sql<number>`count(*)`.mapWith(Number) })
		.from(peptideDoses)
		.where(and(eq(peptideDoses.userId, userId), gte(peptideDoses.date, from), lte(peptideDoses.date, to)))
		.groupBy(peptideDoses.date);
	return new Map(rows.map((r) => [r.date, r.n]));
}

/** Distinct dates a given peptide was dosed within a range — the numerator for that peptide's adherence.
 *  Cleartext (peptideId + date), no decrypt. */
export async function loggedDatesForPeptide(
	userId: number,
	peptideId: number,
	from: string,
	to: string
): Promise<Set<string>> {
	const rows = await db
		.selectDistinct({ date: peptideDoses.date })
		.from(peptideDoses)
		.where(
			and(
				eq(peptideDoses.userId, userId),
				eq(peptideDoses.peptideId, peptideId),
				gte(peptideDoses.date, from),
				lte(peptideDoses.date, to)
			)
		);
	return new Set(rows.map((r) => r.date));
}

/** The most recent injection sites (most-recent-first) to feed rotation suggestions. */
export async function recentSites(userId: number, limit = 12): Promise<(InjectionSite | null)[]> {
	const rows = await db
		.select({ enc: peptideDoses.enc, userId: peptideDoses.userId })
		.from(peptideDoses)
		.where(eq(peptideDoses.userId, userId))
		.orderBy(desc(peptideDoses.date), desc(peptideDoses.createdAt))
		.limit(limit);
	return rows.map((r) => decryptJson<DoseEnc>(r.enc, aad(r.userId)).site ?? null);
}
