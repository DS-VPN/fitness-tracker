import { db } from '$lib/server/db';
import { progressPhotos } from '$lib/server/db/schema';
import { and, desc, eq } from 'drizzle-orm';
import { isValidIsoDate } from '$lib/utils/isoDate';
import { deleteProgressPhotoFile, saveProgressPhoto } from '$lib/server/storage/progressPhotos';

export const POSES = ['front', 'side', 'back'] as const;
export type Pose = (typeof POSES)[number];

export type ProgressPhotoRow = {
	id: number;
	date: string;
	pose: Pose | null;
	mime: string;
	caption: string | null;
	createdAt: Date;
};

const listColumns = {
	id: progressPhotos.id,
	date: progressPhotos.date,
	pose: progressPhotos.pose,
	mime: progressPhotos.mime,
	caption: progressPhotos.caption,
	createdAt: progressPhotos.createdAt
};

/** All of the user's photos, newest first. `filename` is deliberately never selected here — it only
 *  leaves the DB inside the ownership-checked serve path (getPhotoForOwner). */
export async function listPhotos(userId: number, opts: { pose?: Pose } = {}): Promise<ProgressPhotoRow[]> {
	const conds = [eq(progressPhotos.userId, userId)];
	if (opts.pose) conds.push(eq(progressPhotos.pose, opts.pose));
	const rows = await db
		.select(listColumns)
		.from(progressPhotos)
		.where(and(...conds))
		.orderBy(desc(progressPhotos.date), desc(progressPhotos.id));
	return rows as ProgressPhotoRow[];
}

/** The 404-gate for the serve route: returns the on-disk filename + mime ONLY if this user owns the row. */
export async function getPhotoForOwner(userId: number, id: number): Promise<{ filename: string; mime: string } | null> {
	const [row] = await db
		.select({ filename: progressPhotos.filename, mime: progressPhotos.mime })
		.from(progressPhotos)
		.where(and(eq(progressPhotos.id, id), eq(progressPhotos.userId, userId)));
	return row ?? null;
}

export async function savePhoto(
	userId: number,
	meta: { date: string; pose: Pose | null; caption: string | null },
	file: File
): Promise<void> {
	if (!isValidIsoDate(meta.date)) throw new Error('Invalid date');
	if (meta.pose !== null && !POSES.includes(meta.pose)) throw new Error('Invalid pose');
	const caption = meta.caption ? meta.caption.trim().slice(0, 280) || null : null;

	const saved = await saveProgressPhoto(userId, file); // validates + strips metadata + encrypts
	try {
		await db.insert(progressPhotos).values({
			userId,
			date: meta.date,
			pose: meta.pose,
			filename: saved.filename,
			mime: saved.mime,
			byteSize: saved.byteSize,
			caption,
			createdAt: new Date()
		});
	} catch (e) {
		// Don't leak an orphaned ciphertext if the row insert fails.
		await deleteProgressPhotoFile(saved.filename);
		throw e;
	}
}

export async function deletePhoto(userId: number, id: number): Promise<void> {
	const [row] = await db
		.select({ filename: progressPhotos.filename })
		.from(progressPhotos)
		.where(and(eq(progressPhotos.id, id), eq(progressPhotos.userId, userId)));
	if (!row) return;
	await db.delete(progressPhotos).where(and(eq(progressPhotos.id, id), eq(progressPhotos.userId, userId)));
	await deleteProgressPhotoFile(row.filename);
}
