import { createHmac, timingSafeEqual } from 'node:crypto';
import { env } from '$env/dynamic/private';

const SESSION_COOKIE = 'session';
const SESSION_MAX_AGE = 60 * 60 * 24 * 365; // 1 year

function requireEnv(name: 'AUTH_PASSWORD' | 'SESSION_SECRET'): string {
	const value = env[name];
	if (!value) throw new Error(`${name} is not set. Set it in your .env file.`);
	return value;
}

function safeEqual(a: string, b: string): boolean {
	const bufA = Buffer.from(a);
	const bufB = Buffer.from(b);
	if (bufA.length !== bufB.length) return false;
	return timingSafeEqual(bufA, bufB);
}

export function verifyPassword(input: string): boolean {
	return safeEqual(input, requireEnv('AUTH_PASSWORD'));
}

export function sessionToken(): string {
	return createHmac('sha256', requireEnv('SESSION_SECRET'))
		.update(requireEnv('AUTH_PASSWORD'))
		.digest('hex');
}

export function isValidSessionToken(token: string | undefined): boolean {
	if (!token) return false;
	return safeEqual(token, sessionToken());
}

export function setSessionCookie(cookies: { set: (name: string, value: string, opts: any) => void }, secure: boolean) {
	cookies.set(SESSION_COOKIE, sessionToken(), {
		path: '/',
		httpOnly: true,
		sameSite: 'lax',
		secure,
		maxAge: SESSION_MAX_AGE
	});
}

export function clearSessionCookie(cookies: { delete: (name: string, opts: any) => void }) {
	cookies.delete(SESSION_COOKIE, { path: '/' });
}

export { SESSION_COOKIE };
