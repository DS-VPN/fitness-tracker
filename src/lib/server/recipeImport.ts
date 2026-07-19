/** Fetches a recipe page and extracts its schema.org Recipe (JSON-LD), plus a pragmatic parser
 *  for Norwegian/English ingredient lines ("400 g kyllingfilet", "2 dl fløte", "1 stk løk").
 *  Everything here is best-effort: the import flow shows the user what matched before creating
 *  anything, so a wrong parse costs an unchecked row, never bad data. */

export type ParsedRecipe = {
	name: string;
	portions: number | null;
	ingredients: string[];
	sourceUrl: string;
};

export type ParsedLine = {
	raw: string;
	/** Amount converted to canonical units: grams for g-family, ml for volume, count for pcs. */
	qty: number | null;
	unit: 'g' | 'ml' | 'pcs' | null;
	/** The line with quantity/unit stripped — what we search products by. */
	text: string;
};

import { lookup } from 'node:dns/promises';
import { isIP } from 'node:net';

const FETCH_TIMEOUT_MS = 10_000;
const MAX_BYTES = 3_000_000;
const MAX_REDIRECTS = 4;

/* ---------- SSRF guard ----------
 * Recipe import fetches a user-supplied URL from the server, so it must never be usable to reach
 * the host's own loopback, the LAN, or the cloud-metadata endpoint (169.254.169.254). We classify
 * addresses numerically (obfuscated literals like 0x7f000001 or ::ffff:127.0.0.1 can't slip past a
 * string match), and — crucially — resolve the hostname and check the *resolved* IPs before
 * connecting, since a public name can point straight at an internal address. Every redirect hop is
 * re-validated too. Residual gap: DNS rebinding between our lookup and fetch's own lookup (TOCTOU);
 * closing it fully needs connection-level IP pinning, which is out of scope for a trusted-network,
 * single-tenant deployment. */

function isBlockedIpv4(ip: string): boolean {
	const p = ip.split('.').map(Number);
	if (p.length !== 4 || p.some((n) => !Number.isInteger(n) || n < 0 || n > 255)) return true;
	const [a, b] = p;
	if (a === 0) return true; //                 0.0.0.0/8   (incl. 0.0.0.0)
	if (a === 10) return true; //                10.0.0.0/8  private
	if (a === 127) return true; //               127.0.0.0/8 loopback
	if (a === 169 && b === 254) return true; //  169.254.0.0/16 link-local (cloud metadata)
	if (a === 172 && b >= 16 && b <= 31) return true; // 172.16.0.0/12 private
	if (a === 192 && b === 168) return true; //  192.168.0.0/16 private
	return false;
}

function isBlockedIpv6(ip: string): boolean {
	const v = ip.toLowerCase();
	// Everything in ::/x (leading "::") is reserved — loopback (::1), unspecified (::), and the
	// IPv4-mapped/compat forms the URL parser may compress into hex. Block the range outright, but
	// when an IPv4 tail is visible (::ffff:127.0.0.1), judge it by that so mapped *public* IPs pass.
	if (v.startsWith('::')) {
		const tail = v.match(/(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})$/);
		return tail ? isBlockedIpv4(tail[1]) : true;
	}
	const head = parseInt(v.split(':')[0] || '0', 16);
	if ((head & 0xffc0) === 0xfe80) return true; // fe80::/10 link-local
	if ((head & 0xfe00) === 0xfc00) return true; // fc00::/7  unique-local
	return false;
}

/** True for any address the server must refuse to connect to on a user's behalf. */
function isBlockedIp(ip: string): boolean {
	const family = isIP(ip);
	if (family === 4) return isBlockedIpv4(ip);
	if (family === 6) return isBlockedIpv6(ip);
	return true; // unrecognisable — refuse rather than guess
}

function parseUrl(raw: string): URL {
	let url: URL;
	try {
		url = new URL(raw.trim());
	} catch {
		throw new Error("That doesn't look like a link");
	}
	if (url.protocol !== 'http:' && url.protocol !== 'https:') {
		throw new Error('Only http(s) links can be imported');
	}
	return url;
}

/** Resolves the URL's host and throws unless it maps only to public addresses. */
async function assertPublicHost(url: URL): Promise<void> {
	const host = url.hostname.replace(/^\[|\]$/g, '').toLowerCase(); // strip IPv6 brackets

	if (isIP(host)) {
		if (isBlockedIp(host)) throw new Error("That address can't be fetched");
		return;
	}
	if (host === 'localhost' || host.endsWith('.localhost') || host.endsWith('.local')) {
		throw new Error("That address can't be fetched");
	}
	let addrs;
	try {
		addrs = await lookup(host, { all: true });
	} catch {
		throw new Error('Could not resolve that link');
	}
	if (addrs.length === 0 || addrs.some((a) => isBlockedIp(a.address))) {
		throw new Error("That address can't be fetched");
	}
}

async function readCapped(res: Response, maxBytes: number): Promise<string> {
	if (!res.body) return '';
	const reader = res.body.getReader();
	const decoder = new TextDecoder();
	let html = '';
	let received = 0;
	for (;;) {
		const { done, value } = await reader.read();
		if (done) break;
		received += value.byteLength;
		html += decoder.decode(value, { stream: true });
		if (received >= maxBytes) {
			void reader.cancel();
			break;
		}
	}
	return html;
}

export async function fetchRecipe(rawUrl: string): Promise<ParsedRecipe> {
	let url = parseUrl(rawUrl);
	const controller = new AbortController();
	const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
	let html: string;
	try {
		// Follow redirects by hand so every hop is re-validated — otherwise a public page could 302
		// the server into loopback/LAN/metadata, which `redirect: 'follow'` would chase blindly.
		let res: Response;
		for (let hop = 0; ; hop++) {
			await assertPublicHost(url);
			res = await fetch(url, {
				signal: controller.signal,
				redirect: 'manual',
				headers: {
					accept: 'text/html,application/xhtml+xml',
					'user-agent': 'Mozilla/5.0 (compatible; fitness-tracker-recipe-import)'
				}
			});
			const location = res.status >= 300 && res.status < 400 ? res.headers.get('location') : null;
			if (!location) break;
			if (hop >= MAX_REDIRECTS) throw new Error('That link redirects too many times');
			void res.body?.cancel();
			url = parseUrl(new URL(location, url).href);
		}
		if (!res.ok) throw new Error(`The site answered with ${res.status}`);
		html = await readCapped(res, MAX_BYTES);
	} catch (e) {
		if (e instanceof Error && e.name === 'AbortError') throw new Error('The site took too long to answer');
		throw e instanceof Error ? e : new Error('Could not fetch that link');
	} finally {
		clearTimeout(timer);
	}

	const recipe = extractRecipe(html);
	if (!recipe) {
		throw new Error('No recipe found on that page — it has no schema.org Recipe data');
	}
	return { ...recipe, sourceUrl: url.href };
}

/* ---------- JSON-LD extraction ---------- */

function decodeEntities(s: string): string {
	return s
		.replace(/&amp;/g, '&')
		.replace(/&quot;/g, '"')
		.replace(/&#0?39;/g, "'")
		.replace(/&apos;/g, "'")
		.replace(/&nbsp;/g, ' ')
		.replace(/&lt;/g, '<')
		.replace(/&gt;/g, '>');
}

function asString(v: unknown): string {
	return typeof v === 'string' ? decodeEntities(v).trim() : '';
}

function toStringArray(v: unknown): string[] {
	if (Array.isArray(v)) return v.map(asString).filter(Boolean);
	const single = asString(v);
	return single ? [single] : [];
}

/** recipeYield comes as "4", 4, "4 porsjoner", ["4 servings"] — take the first number found. */
function parseYield(v: unknown): number | null {
	const first = Array.isArray(v) ? v[0] : v;
	if (typeof first === 'number' && Number.isFinite(first) && first > 0) return first;
	const m = asString(first).match(/\d+(?:[.,]\d+)?/);
	if (!m) return null;
	const n = Number(m[0].replace(',', '.'));
	return Number.isFinite(n) && n > 0 ? n : null;
}

type RecipeNode = { name: string; portions: number | null; ingredients: string[] };

function findRecipeNode(node: unknown, depth = 0): RecipeNode | null {
	if (depth > 6 || node == null || typeof node !== 'object') return null;
	if (Array.isArray(node)) {
		for (const item of node) {
			const found = findRecipeNode(item, depth + 1);
			if (found) return found;
		}
		return null;
	}
	const obj = node as Record<string, unknown>;
	const types = Array.isArray(obj['@type']) ? obj['@type'] : [obj['@type']];
	if (types.some((t) => typeof t === 'string' && t.toLowerCase() === 'recipe')) {
		const ingredients = toStringArray(obj.recipeIngredient ?? obj.ingredients);
		if (ingredients.length > 0) {
			return {
				name: asString(obj.name) || 'Imported recipe',
				portions: parseYield(obj.recipeYield),
				ingredients
			};
		}
	}
	for (const value of Object.values(obj)) {
		if (value && typeof value === 'object') {
			const found = findRecipeNode(value, depth + 1);
			if (found) return found;
		}
	}
	return null;
}

function extractRecipe(html: string): RecipeNode | null {
	const blocks = html.matchAll(
		/<script[^>]*type\s*=\s*["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi
	);
	for (const match of blocks) {
		let parsed: unknown;
		const rawJson = match[1].trim();
		try {
			parsed = JSON.parse(rawJson);
		} catch {
			// Some sites leave raw control characters in their JSON — one cleanup retry, then move on.
			try {
				parsed = JSON.parse(rawJson.replace(/[\u0000-\u001f]/g, ' '));
			} catch {
				continue;
			}
		}
		const recipe = findRecipeNode(parsed);
		if (recipe) return recipe;
	}
	return null;
}

/* ---------- ingredient-line parsing ---------- */

/** Unit token → canonical unit + factor into that unit (dl → 100 ml, kg → 1000 g, ss → 15 ml…). */
const UNIT_MAP: Record<string, { unit: 'g' | 'ml' | 'pcs'; factor: number }> = {
	g: { unit: 'g', factor: 1 },
	gr: { unit: 'g', factor: 1 },
	gram: { unit: 'g', factor: 1 },
	grams: { unit: 'g', factor: 1 },
	kg: { unit: 'g', factor: 1000 },
	hg: { unit: 'g', factor: 100 },
	ml: { unit: 'ml', factor: 1 },
	cl: { unit: 'ml', factor: 10 },
	dl: { unit: 'ml', factor: 100 },
	l: { unit: 'ml', factor: 1000 },
	liter: { unit: 'ml', factor: 1000 },
	ss: { unit: 'ml', factor: 15 },
	spiseskje: { unit: 'ml', factor: 15 },
	spiseskjeer: { unit: 'ml', factor: 15 },
	tbsp: { unit: 'ml', factor: 15 },
	ts: { unit: 'ml', factor: 5 },
	teskje: { unit: 'ml', factor: 5 },
	teskjeer: { unit: 'ml', factor: 5 },
	tsp: { unit: 'ml', factor: 5 },
	stk: { unit: 'pcs', factor: 1 },
	pcs: { unit: 'pcs', factor: 1 },
	pc: { unit: 'pcs', factor: 1 },
	piece: { unit: 'pcs', factor: 1 },
	pieces: { unit: 'pcs', factor: 1 }
};

const UNICODE_FRACTIONS: Record<string, number> = {
	'½': 0.5,
	'⅓': 1 / 3,
	'⅔': 2 / 3,
	'¼': 0.25,
	'¾': 0.75
};

/** Reads a leading quantity: "400", "1,5", "1 1/2", "½", "2-3" (first of a range). */
function parseLeadingQty(s: string): { qty: number | null; rest: string } {
	let rest = s.trim();

	const unicode = UNICODE_FRACTIONS[rest[0] ?? ''];
	if (unicode != null) {
		return { qty: unicode, rest: rest.slice(1).trim() };
	}

	const m = rest.match(/^(\d+(?:[.,]\d+)?)/);
	if (!m) return { qty: null, rest };
	let qty = Number(m[1].replace(',', '.'));
	rest = rest.slice(m[1].length).trim();

	// "1 1/2" or "1 ½"
	const frac = rest.match(/^(\d)\/(\d)/);
	if (frac) {
		qty += Number(frac[1]) / Number(frac[2]);
		rest = rest.slice(frac[0].length).trim();
	} else if (UNICODE_FRACTIONS[rest[0] ?? ''] != null) {
		qty += UNICODE_FRACTIONS[rest[0]];
		rest = rest.slice(1).trim();
	} else {
		// Range like "2-3": keep the first number.
		const range = rest.match(/^[-–]\s*\d+(?:[.,]\d+)?/);
		if (range) rest = rest.slice(range[0].length).trim();
	}

	return { qty, rest };
}

export function parseIngredientLine(raw: string): ParsedLine {
	const cleaned = raw.replace(/\s+/g, ' ').trim();
	const { qty, rest } = parseLeadingQty(cleaned);

	let unit: ParsedLine['unit'] = null;
	let scaledQty = qty;
	let text = rest;

	if (qty != null) {
		const unitToken = rest.match(/^([a-zA-ZæøåÆØÅ.]+)\s+/)?.[1] ?? '';
		const mapped = UNIT_MAP[unitToken.toLowerCase().replace(/\.$/, '')];
		if (mapped) {
			unit = mapped.unit;
			scaledQty = qty * mapped.factor;
			text = rest.slice(unitToken.length).trim();
		}
	}

	// Strip parenthesised asides and trailing prep notes after a comma ("løk, finhakket").
	text = text.replace(/\([^)]*\)/g, ' ').split(',')[0].replace(/\s+/g, ' ').trim();

	return { raw: cleaned, qty: scaledQty, unit, text: text || cleaned };
}

/** Search terms to try for a line, most to least specific. */
export function candidateTerms(text: string): string[] {
	const words = text
		.toLowerCase()
		.replace(/[^\p{L}\p{N} ]/gu, ' ')
		.split(/\s+/)
		.filter((w) => w.length >= 3);
	const terms: string[] = [];
	if (words.length > 1) terms.push(words.join(' '));
	if (words.length > 0) terms.push(words[0]);
	if (words.length > 1) terms.push(words[words.length - 1]);
	return [...new Set(terms)];
}
