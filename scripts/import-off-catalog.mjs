// One-off importer: builds src/lib/server/catalogData.ts from Open Food Facts (Norway).
// Run manually: `node scripts/import-off-catalog.mjs`. The GENERATED file is committed and is
// what production seeds from — production never calls OFF for the catalog (barcode scanning still
// does, separately). OFF data is licensed ODbL; attribution is written into the generated file.
//
// The v2 search endpoint is frequently overloaded (returns an HTML "temporarily unavailable"
// page), so we retry with backoff and fall back to the older v1 cgi/search.pl endpoint.

import { writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = join(__dirname, '..', 'src', 'lib', 'server', 'catalogData.ts');

const USER_AGENT = 'FitnessTracker/1.0 (self-hosted; +https://github.com/DS-VPN/fitness-tracker)';
const TARGET = 400; // how many curated items we want to keep
const PAGE_SIZE = 100;
const MAX_PAGES = 30; // popularity-sorted, so the good stuff is early; cap the crawl

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function num(v) {
	const n = Number(v);
	return Number.isFinite(n) ? Math.round(n * 10) / 10 : null;
}

/** Fetch one page of Norwegian products. Tries v2, falls back to v1, retries with backoff. */
async function fetchPage(page) {
	const fields = 'code,product_name,brands,nutriments,categories_tags';
	const v2 = `https://world.openfoodfacts.org/api/v2/search?countries_tags_en=Norway&fields=${fields}&sort_by=popularity_key&page_size=${PAGE_SIZE}&page=${page}`;
	const v1 = `https://no.openfoodfacts.org/cgi/search.pl?action=process&tagtype_0=countries&tag_contains_0=contains&tag_0=Norway&sort_by=unique_scans_n&page_size=${PAGE_SIZE}&page=${page}&json=1&fields=${fields}`;

	for (const url of [v2, v1]) {
		for (let attempt = 0; attempt < 4; attempt++) {
			try {
				const res = await fetch(url, { headers: { 'User-Agent': USER_AGENT } });
				const text = await res.text();
				if (!res.ok || text.trimStart().startsWith('<')) {
					// overloaded / HTML error page — back off and retry
					await sleep(1500 * (attempt + 1));
					continue;
				}
				const body = JSON.parse(text);
				const products = body.products ?? [];
				if (products.length) return products;
				return []; // genuine empty page (end of results)
			} catch {
				await sleep(1500 * (attempt + 1));
			}
		}
		// this endpoint failed all attempts — try the next one
	}
	return null; // both endpoints failed for this page
}

function isBeverage(tags) {
	return Array.isArray(tags) && tags.some((t) => typeof t === 'string' && t.includes('beverages'));
}

/** Keep only products with a real name+brand and complete, self-consistent nutrition. */
function normalize(p) {
	const name = (p.product_name ?? '').trim();
	const brand = (p.brands ?? '').split(',')[0]?.trim() ?? '';
	if (!name || !brand || name.length > 80) return null;

	const n = p.nutriments ?? {};
	const calories = num(n['energy-kcal_100g']);
	const protein = num(n['proteins_100g']);
	const carbs = num(n['carbohydrates_100g']);
	const fat = num(n['fat_100g']);
	if (calories == null || protein == null || carbs == null || fat == null) return null;
	if (calories <= 0 || calories > 950) return null; // 900 kcal/100g ≈ pure fat/oil ceiling
	if (protein < 0 || carbs < 0 || fat < 0) return null;

	// Sanity: stated kcal must roughly match the Atwater estimate (rejects crowd-sourced errors).
	const estimate = 4 * protein + 4 * carbs + 9 * fat;
	if (estimate > 0 && Math.abs(calories - estimate) / Math.max(calories, estimate) > 0.25) return null;

	return {
		offCode: String(p.code ?? '').trim(),
		name,
		brand,
		barcode: String(p.code ?? '').trim() || null,
		amount: 100,
		unit: isBeverage(p.categories_tags) ? 'ml' : 'g',
		calories,
		protein,
		carbs,
		fat,
		fiber: num(n['fiber_100g']),
		sugar: num(n['sugars_100g']),
		sodium: num(n['sodium_100g'])
	};
}

async function main() {
	const kept = new Map(); // dedupe key: lower(name)|lower(brand)
	const seenCodes = new Set();

	for (let page = 1; page <= MAX_PAGES && kept.size < TARGET; page++) {
		const products = await fetchPage(page);
		if (products === null) {
			console.error(`Page ${page}: both endpoints failed, stopping crawl.`);
			break;
		}
		if (products.length === 0) {
			console.error(`Page ${page}: no more results.`);
			break;
		}
		let added = 0;
		for (const p of products) {
			const row = normalize(p);
			if (!row || !row.offCode || seenCodes.has(row.offCode)) continue;
			const key = `${row.name.toLowerCase()}|${row.brand.toLowerCase()}`;
			if (kept.has(key)) continue;
			seenCodes.add(row.offCode);
			kept.set(key, row);
			added++;
			if (kept.size >= TARGET) break;
		}
		console.error(`Page ${page}: +${added} (total ${kept.size})`);
		await sleep(700); // be polite to OFF
	}

	const rows = [...kept.values()].sort((a, b) => a.name.localeCompare(b.name));
	if (rows.length === 0) {
		console.error('No rows collected — OFF was likely unreachable. Not overwriting catalogData.ts.');
		process.exit(1);
	}

	const header = `// AUTO-GENERATED by scripts/import-off-catalog.mjs — do not edit by hand.
// Curated Norwegian food products for the shared, add-on-demand catalog (see repositories/catalog.ts).
// Nutrition values are per 100 g (or 100 ml for beverages).
//
// Product data © Open Food Facts contributors, licensed under the Open Database License (ODbL).
// https://openfoodfacts.org — https://opendatacommons.org/licenses/odbl/1-0/

export type CatalogProduct = {
	offCode: string;
	name: string;
	brand: string;
	barcode: string | null;
	amount: number;
	unit: 'g' | 'ml';
	calories: number;
	protein: number;
	carbs: number;
	fat: number;
	fiber: number | null;
	sugar: number | null;
	sodium: number | null;
};

export const catalogProducts: CatalogProduct[] = ${JSON.stringify(rows, null, '\t')};
`;

	await writeFile(OUT, header, 'utf8');
	console.error(`Wrote ${rows.length} products to ${OUT}`);
}

main();
