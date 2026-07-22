// AES-256-GCM at-rest encryption for structured, sensitive fields — the peptide log (compound, dose,
// injection site, schedule, vial contents, notes). The photo suite encrypts whole files; this encrypts
// short JSON payloads into a base64 blob stored in an `enc` text column.
//
// It reuses the same master key as photos (PHOTO_ENCRYPTION_KEY, base64 or hex, 32 bytes) so operators
// manage ONE key, but derives a per-record subkey via HKDF with a DIFFERENT info string
// ('peptide-field-v1'), so a peptide blob and a photo blob are cryptographically domain-separated even
// under the same master. The HKDF salt + GCM additional-authenticated-data are both bound to `aad`
// (always `${userId}:${table}`), so a ciphertext cannot be relocated to another account or another
// table — a moved blob fails the auth-tag check on decrypt.
//
// Fail-closed: with no key configured, encrypt/decrypt throw rather than silently storing plaintext.
// Callers gate the whole feature on fieldEncryptionAvailable() and surface a clear "not configured"
// message instead of writing readable rows.

import { createCipheriv, createDecipheriv, hkdfSync, randomBytes } from 'node:crypto';
import { env } from '$env/dynamic/private';

const KEY_LEN = 32; // AES-256
const IV_LEN = 12; // GCM standard nonce
const TAG_LEN = 16; // GCM auth tag
const INFO = 'peptide-field-v1'; // HKDF domain separation from progress-photo-v1

// undefined = not yet loaded; null = configured-as-absent; Buffer = the key.
let cachedKey: Buffer | null | undefined;

function loadMasterKey(): Buffer | null {
	if (cachedKey !== undefined) return cachedKey;
	const raw = env.PHOTO_ENCRYPTION_KEY?.trim();
	if (!raw) {
		cachedKey = null;
		return null;
	}
	let key = tryDecode(raw, 'base64');
	if (key.length !== KEY_LEN) key = tryDecode(raw, 'hex');
	if (key.length !== KEY_LEN) {
		throw new Error('PHOTO_ENCRYPTION_KEY must decode to exactly 32 bytes (generate with: openssl rand -base64 32)');
	}
	cachedKey = key;
	return key;
}

function tryDecode(raw: string, encoding: 'base64' | 'hex'): Buffer {
	try {
		return Buffer.from(raw, encoding);
	} catch {
		return Buffer.alloc(0);
	}
}

/** Whether at-rest field encryption is configured. Routes use this to gate the peptides feature clearly
 *  up front rather than failing mid-write. */
export function fieldEncryptionAvailable(): boolean {
	return loadMasterKey() !== null;
}

function subkey(master: Buffer, aad: string): Buffer {
	return Buffer.from(hkdfSync('sha256', master, Buffer.from(aad), Buffer.from(INFO), KEY_LEN));
}

function requireKey(): Buffer {
	const master = loadMasterKey();
	if (!master) throw new Error('Field encryption key not configured (set PHOTO_ENCRYPTION_KEY)');
	return master;
}

/** Encrypts a UTF-8 string into a base64 blob: base64([IV(12) | authTag(16) | ciphertext]). */
export function encryptField(plaintext: string, aad: string): string {
	const master = requireKey();
	const iv = randomBytes(IV_LEN);
	const cipher = createCipheriv('aes-256-gcm', subkey(master, aad), iv);
	cipher.setAAD(Buffer.from(aad));
	const ciphertext = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
	return Buffer.concat([iv, cipher.getAuthTag(), ciphertext]).toString('base64');
}

/** Reverses encryptField; throws if the blob is truncated, the key is wrong, or the aad doesn't match. */
export function decryptField(b64: string, aad: string): string {
	const master = requireKey();
	const blob = Buffer.from(b64, 'base64');
	if (blob.length < IV_LEN + TAG_LEN) throw new Error('Encrypted field is truncated');
	const iv = blob.subarray(0, IV_LEN);
	const tag = blob.subarray(IV_LEN, IV_LEN + TAG_LEN);
	const ciphertext = blob.subarray(IV_LEN + TAG_LEN);
	const decipher = createDecipheriv('aes-256-gcm', subkey(master, aad), iv);
	decipher.setAAD(Buffer.from(aad));
	decipher.setAuthTag(tag);
	return Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString('utf8');
}

/** Convenience: encrypt an object as JSON. */
export function encryptJson(value: unknown, aad: string): string {
	return encryptField(JSON.stringify(value), aad);
}

/** Convenience: decrypt back into a typed object. The caller owns the type contract. */
export function decryptJson<T>(b64: string, aad: string): T {
	return JSON.parse(decryptField(b64, aad)) as T;
}
