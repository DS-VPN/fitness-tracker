import { db } from '$lib/server/db';
import { peptideVials, peptideDoses } from '$lib/server/db/schema';
import { and, asc, eq, sql } from 'drizzle-orm';
import { decryptJson, encryptJson } from '$lib/server/crypto/fieldCrypto';
import { isValidIsoDate } from '$lib/utils/isoDate';

// Inventory: reconstituted vials. Contents (mg, water, dates, notes) are encrypted in `enc`; only the
// depleted flag is cleartext so the active list filters without decrypting.

const aad = (userId: number) => `${userId}:peptide_vials`;

type VialEnc = {
	vialMg: number;
	bacWaterMl: number | null;
	reconstitutedAt: string | null;
	expiresAt: string | null;
	notes: string | null;
};

export type Vial = {
	id: number;
	peptideId: number;
	depleted: boolean;
	createdAt: Date;
} & VialEnc;

export type VialWithUsage = Vial & { dosesLogged: number };

export type VialInput = {
	peptideId: number;
	vialMg: number;
	bacWaterMl?: number | null;
	reconstitutedAt?: string | null;
	expiresAt?: string | null;
	notes?: string | null;
};

function decode(row: typeof peptideVials.$inferSelect): Vial {
	const enc = decryptJson<VialEnc>(row.enc, aad(row.userId));
	return {
		id: row.id,
		peptideId: row.peptideId,
		depleted: row.depleted,
		createdAt: row.createdAt,
		...enc
	};
}

function sanitize(input: VialInput): VialEnc {
	if (!Number.isFinite(input.vialMg) || input.vialMg <= 0 || input.vialMg > 1000) {
		throw new Error('Vial size (mg) is out of range');
	}
	let bacWaterMl: number | null = null;
	if (input.bacWaterMl != null) {
		if (!Number.isFinite(input.bacWaterMl) || input.bacWaterMl <= 0 || input.bacWaterMl > 100) {
			throw new Error('Water volume (mL) is out of range');
		}
		bacWaterMl = Math.round(input.bacWaterMl * 100) / 100;
	}
	if (input.reconstitutedAt && !isValidIsoDate(input.reconstitutedAt)) throw new Error('Invalid reconstitution date');
	if (input.expiresAt && !isValidIsoDate(input.expiresAt)) throw new Error('Invalid expiry date');
	return {
		vialMg: Math.round(input.vialMg * 1000) / 1000,
		bacWaterMl,
		reconstitutedAt: input.reconstitutedAt || null,
		expiresAt: input.expiresAt || null,
		notes: input.notes?.trim() || null
	};
}

export async function listVials(
	userId: number,
	opts: { includeDepleted?: boolean; peptideId?: number } = {}
): Promise<VialWithUsage[]> {
	const conds = [eq(peptideVials.userId, userId)];
	if (opts.peptideId) conds.push(eq(peptideVials.peptideId, opts.peptideId));
	const [rows, usage] = await Promise.all([
		db
			.select()
			.from(peptideVials)
			.where(and(...conds))
			.orderBy(asc(peptideVials.depleted), asc(peptideVials.id)),
		db
			.select({ vialId: peptideDoses.vialId, n: sql<number>`count(*)`.mapWith(Number) })
			.from(peptideDoses)
			.where(eq(peptideDoses.userId, userId))
			.groupBy(peptideDoses.vialId)
	]);
	const usageMap = new Map(usage.map((u) => [u.vialId, u.n]));
	return rows
		.map((r) => ({ ...decode(r), dosesLogged: usageMap.get(r.id) ?? 0 }))
		.filter((v) => opts.includeDepleted || !v.depleted);
}

export async function getVial(userId: number, id: number): Promise<Vial | null> {
	const [row] = await db.select().from(peptideVials).where(and(eq(peptideVials.id, id), eq(peptideVials.userId, userId)));
	return row ? decode(row) : null;
}

export async function createVial(userId: number, input: VialInput): Promise<Vial> {
	const data = sanitize(input);
	const [row] = await db
		.insert(peptideVials)
		.values({ userId, peptideId: input.peptideId, enc: encryptJson(data, aad(userId)), createdAt: new Date() })
		.returning();
	return decode(row);
}

export async function setVialDepleted(userId: number, id: number, depleted: boolean): Promise<void> {
	await db.update(peptideVials).set({ depleted }).where(and(eq(peptideVials.id, id), eq(peptideVials.userId, userId)));
}

export async function deleteVial(userId: number, id: number): Promise<void> {
	await db.delete(peptideVials).where(and(eq(peptideVials.id, id), eq(peptideVials.userId, userId)));
}
