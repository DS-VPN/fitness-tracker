import { randomBytes } from 'node:crypto';
import { mkdir, unlink, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { env } from '$env/dynamic/private';

// Photos live next to the SQLite file itself (DATABASE_URL) so they land on the same persisted
// Docker volume in production without any extra configuration, and in a sibling ./uploads folder
// during local dev.
const UPLOADS_DIR = path.join(path.dirname(env.DATABASE_URL ?? '.'), 'uploads', 'meal-photos');

const MAX_PHOTO_BYTES = 8 * 1024 * 1024;

/** Identifies the image format from its magic bytes. The client-declared MIME type is untrusted —
 *  another account could upload HTML labeled image/png, which must never end up served from our origin. */
function sniffImageExt(buf: Buffer): 'jpg' | 'png' | 'webp' | null {
	if (buf.length >= 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return 'jpg';
	if (buf.length >= 8 && buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])))
		return 'png';
	if (buf.length >= 12 && buf.subarray(0, 4).toString('latin1') === 'RIFF' && buf.subarray(8, 12).toString('latin1') === 'WEBP')
		return 'webp';
	return null;
}

export function mealPhotoPath(filename: string): string {
	return path.join(UPLOADS_DIR, filename);
}

/** Validates and writes an uploaded photo to disk, returning the filename to store on the meal row. */
export async function saveMealPhoto(mealId: number, file: File): Promise<string> {
	if (file.size > MAX_PHOTO_BYTES) throw new Error('Photo must be under 8 MB');

	const buffer = Buffer.from(await file.arrayBuffer());
	const ext = sniffImageExt(buffer);
	if (!ext) throw new Error('Photo must be a JPEG, PNG, or WebP image');

	await mkdir(UPLOADS_DIR, { recursive: true });
	const filename = `${mealId}-${randomBytes(8).toString('hex')}.${ext}`;
	await writeFile(mealPhotoPath(filename), buffer);
	return filename;
}

export async function deleteMealPhotoFile(filename: string | null | undefined): Promise<void> {
	if (!filename) return;
	try {
		await unlink(mealPhotoPath(filename));
	} catch (e) {
		if ((e as NodeJS.ErrnoException).code !== 'ENOENT') throw e;
	}
}
