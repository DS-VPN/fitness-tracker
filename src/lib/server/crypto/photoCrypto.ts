// AES-256-GCM at-rest encryption for progress photos — the sensitive body-transformation images.
//
// A single master key is read once from PHOTO_ENCRYPTION_KEY (base64 or hex, 32 bytes). Each photo is
// encrypted under a per-file subkey derived via HKDF from (master, aad), where aad is bound to
// `${userId}:${filename}`. That binding is also passed as GCM additional-authenticated-data, so a
// ciphertext cannot be moved to another user or swapped onto a different photo row — decryption of a
// relocated blob fails the auth-tag check.
//
// Fail-closed: with no key configured, encrypt/decrypt throw rather than silently storing plaintext.

import { createCipheriv, createDecipheriv, hkdfSync, randomBytes } from 'node:crypto';
import { env } from '$env/dynamic/private';

const KEY_LEN = 32; // AES-256
const IV_LEN = 12; // GCM standard nonce
const TAG_LEN = 16; // GCM auth tag

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

/** Whether at-rest photo encryption is configured. Callers use this to fail uploads clearly up front. */
export function photoEncryptionAvailable(): boolean {
	return loadMasterKey() !== null;
}

function subkey(master: Buffer, aad: string): Buffer {
	// Domain-separate the on-disk key from the master, and bind it to this specific photo.
	return Buffer.from(hkdfSync('sha256', master, Buffer.from(aad), Buffer.from('progress-photo-v1'), KEY_LEN));
}

/** Encrypts plaintext into a self-contained blob: [IV(12) | authTag(16) | ciphertext]. */
export function encryptPhoto(plaintext: Buffer, aad: string): Buffer {
	const master = requireKey();
	const iv = randomBytes(IV_LEN);
	const cipher = createCipheriv('aes-256-gcm', subkey(master, aad), iv);
	cipher.setAAD(Buffer.from(aad));
	const ciphertext = Buffer.concat([cipher.update(plaintext), cipher.final()]);
	return Buffer.concat([iv, cipher.getAuthTag(), ciphertext]);
}

/** Reverses encryptPhoto; throws if the blob is truncated, the key is wrong, or the aad doesn't match. */
export function decryptPhoto(blob: Buffer, aad: string): Buffer {
	const master = requireKey();
	if (blob.length < IV_LEN + TAG_LEN) throw new Error('Encrypted photo is truncated');
	const iv = blob.subarray(0, IV_LEN);
	const tag = blob.subarray(IV_LEN, IV_LEN + TAG_LEN);
	const ciphertext = blob.subarray(IV_LEN + TAG_LEN);
	const decipher = createDecipheriv('aes-256-gcm', subkey(master, aad), iv);
	decipher.setAAD(Buffer.from(aad));
	decipher.setAuthTag(tag);
	return Buffer.concat([decipher.update(ciphertext), decipher.final()]);
}

function requireKey(): Buffer {
	const master = loadMasterKey();
	if (!master) throw new Error('Photo encryption key not configured (set PHOTO_ENCRYPTION_KEY)');
	return master;
}
