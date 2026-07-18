// Streams the Open Food Facts full JSONL export and extracts every NORWEGIAN product that has
// complete, self-consistent nutrition — the whole set, not a curated sample. Low memory: reads
// line-by-line from stdin, never stores the 12 GB dump on disk.
//
// Run:  curl -sL https://static.openfoodfacts.org/data/openfoodfacts-products.jsonl.gz \
//         | gunzip | node scripts/import-off-dump.mjs
//
// Accepted rows are appended to a temp JSONL immediately (so an interrupted run keeps progress);
// on clean end it writes src/lib/server/catalogData.ts. OFF data is ODbL — attribution in output.

import { createInterface } from 'node:readline';
import { createWriteStream } from 'node:fs';
import { writeFile, readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
// Emitted as .json (loaded via ?raw + JSON.parse in presets.ts) so the ~11k rows ship as one
// bundled string, keeping the build and type-checker fast. ODbL attribution lives in the UI.
const OUT = join(__dirname, '..', 'src', 'lib', 'server', 'catalogData.json');
const TMP = join(__dirname, '..', 'catalog-dump.jsonl'); // gitignored working file

function num(v) {
	const n = Number(v);
	return Number.isFinite(n) ? Math.round(n * 10) / 10 : null;
}

function accept(p) {
	const countries = p.countries_tags;
	if (!Array.isArray(countries) || !countries.includes('en:norway')) return null;

	const name = (p.product_name || p.product_name_nb || p.product_name_en || '').trim();
	const brand = (p.brands || '').split(',')[0]?.trim() || '';
	if (!name || !brand || name.length > 90) return null;

	const n = p.nutriments || {};
	const calories = num(n['energy-kcal_100g']);
	const protein = num(n['proteins_100g']);
	const carbs = num(n['carbohydrates_100g']);
	const fat = num(n['fat_100g']);
	if (calories == null || protein == null || carbs == null || fat == null) return null;
	if (calories <= 0 || calories > 950) return null;
	if (protein < 0 || carbs < 0 || fat < 0) return null;
	const est = 4 * protein + 4 * carbs + 9 * fat;
	if (est > 0 && Math.abs(calories - est) / Math.max(calories, est) > 0.25) return null;

	const cats = p.categories_tags;
	const beverage = Array.isArray(cats) && cats.some((t) => typeof t === 'string' && t.includes('beverages'));
	return {
		offCode: String(p.code ?? '').trim(),
		name,
		brand,
		barcode: String(p.code ?? '').trim() || null,
		amount: 100,
		unit: beverage ? 'ml' : 'g',
		calories, protein, carbs, fat,
		fiber: num(n['fiber_100g']),
		sugar: num(n['sugars_100g']),
		sodium: num(n['sodium_100g'])
	};
}

const tmpStream = createWriteStream(TMP, { flags: 'w' });
let lines = 0;
let kept = 0;
const seen = new Set();

const rl = createInterface({ input: process.stdin });
rl.on('line', (line) => {
	lines++;
	if (lines % 200000 === 0) process.stderr.write(`  scanned ${lines} lines, kept ${kept}\n`);
	if (!line || line[0] !== '{') return;
	let p;
	try { p = JSON.parse(line); } catch { return; }
	const row = accept(p);
	if (!row || !row.offCode || seen.has(row.offCode)) return;
	seen.add(row.offCode);
	kept++;
	tmpStream.write(JSON.stringify(row) + '\n');
});

rl.on('close', async () => {
	tmpStream.end();
	await new Promise((r) => tmpStream.on('finish', r));
	process.stderr.write(`Scan done: ${lines} lines, ${kept} Norwegian products kept.\n`);
	await writeCatalog();
});

async function writeCatalog() {
	const text = await readFile(TMP, 'utf8');
	const byKey = new Map();
	for (const line of text.split('\n')) {
		if (!line) continue;
		const r = JSON.parse(line);
		byKey.set(`${r.name.toLowerCase()}|${r.brand.toLowerCase()}`, r); // dedupe by name+brand too
	}
	const rows = [...byKey.values()].sort((a, b) => a.name.localeCompare(b.name));
	// Minified JSON — every Norwegian OFF product with complete, sanity-checked nutrition (per
	// 100 g, or 100 ml for beverages). Product data © Open Food Facts contributors, ODbL.
	await writeFile(OUT, JSON.stringify(rows), 'utf8');
	process.stderr.write(`Wrote ${rows.length} products to ${OUT}\n`);
}
