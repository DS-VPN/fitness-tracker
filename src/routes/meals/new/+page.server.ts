import { fail, redirect } from '@sveltejs/kit';
import { createMeal, addProductIngredient } from '$lib/server/repositories/meals';
import { listCategories } from '$lib/server/repositories/categories';
import { listProducts, getProduct } from '$lib/server/repositories/products';
import { searchCatalog, addCatalogProductToUser } from '$lib/server/repositories/catalog';
import { fetchRecipe, parseIngredientLine, candidateTerms, type ParsedLine } from '$lib/server/recipeImport';
import { parseDecimal } from '$lib/utils/parseDecimal';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	return { categories: await listCategories(locals.user!.id) };
};

type LineMatch = {
	kind: 'product' | 'catalog';
	id: number;
	name: string;
	brand: string | null;
	/** Amount to add, in the matched product's own unit (e.g. grams). */
	amount: number;
	unit: string;
};

/** Lower score = better candidate. Prefers exact names, then prefixes, then the shortest
 *  containing name — "melk" should pick "Melk", not "Melkesjokolade". */
function score(name: string, term: string): number {
	const n = name.toLowerCase();
	if (n === term) return 0;
	if (n.startsWith(term)) return 1 + n.length / 100;
	return 2 + n.length / 100;
}

/** Converts a parsed recipe amount into the matched product's unit. Unknowable conversions
 *  (grams of a per-piece product) fall back to one serving — visible in the review step. */
function ingredientAmount(line: ParsedLine, product: { amount: number; unit: string }): number {
	const serving = product.amount > 0 ? product.amount : 100;
	if (line.qty == null || line.qty <= 0) return serving;
	if (line.unit === 'g' || line.unit === 'ml') {
		// g and ml are close enough (density ≈ 1) for a draft the user reviews anyway.
		if (product.unit === 'g' || product.unit === 'ml') return Math.round(line.qty * 100) / 100;
		return serving;
	}
	// A bare count ("2 egg", "1 stk løk"): pieces if the product is per-piece, else N servings.
	if (product.unit === 'pcs') return line.qty;
	return Math.round(line.qty * serving * 100) / 100;
}

async function matchLine(userId: number, line: ParsedLine): Promise<LineMatch | null> {
	for (const term of candidateTerms(line.text)) {
		const own = await listProducts(userId, term);
		if (own.length > 0) {
			const best = [...own].sort((a, b) => score(a.name, term) - score(b.name, term))[0];
			return {
				kind: 'product',
				id: best.id,
				name: best.name,
				brand: best.brand,
				amount: ingredientAmount(line, best),
				unit: best.unit
			};
		}
		const catalog = await searchCatalog(term, 10);
		if (catalog.length > 0) {
			const best = [...catalog].sort((a, b) => score(a.name, term) - score(b.name, term))[0];
			return {
				kind: 'catalog',
				id: best.id,
				name: best.name,
				brand: best.brand,
				amount: ingredientAmount(line, best),
				unit: best.unit
			};
		}
	}
	return null;
}

export const actions: Actions = {
	create: async ({ request, locals }) => {
		const form = await request.formData();
		const name = String(form.get('name') ?? '').trim();
		const portions = parseDecimal(String(form.get('portions') ?? '1'));
		const categoryIds = form
			.getAll('categoryIds')
			.map((v) => Number(v))
			.filter((n) => Number.isFinite(n));

		if (!name) return fail(400, { error: 'Name is required' });

		const meal = await createMeal(locals.user!.id, name, categoryIds, portions);
		throw redirect(303, `/meals/${meal.id}`);
	},

	/** Fetches + parses a recipe URL and returns a reviewable draft — creates nothing yet. */
	importRecipe: async ({ request, locals }) => {
		const url = String((await request.formData()).get('url') ?? '').trim();
		if (!url) return fail(400, { importError: 'Paste a link first' });

		let recipe;
		try {
			recipe = await fetchRecipe(url);
		} catch (e) {
			return fail(400, { importError: e instanceof Error ? e.message : 'Could not import that link' });
		}

		const userId = locals.user!.id;
		const lines = [];
		for (const raw of recipe.ingredients.slice(0, 40)) {
			const parsed = parseIngredientLine(raw);
			lines.push({ raw: parsed.raw, match: await matchLine(userId, parsed) });
		}

		return {
			imported: {
				sourceUrl: recipe.sourceUrl,
				name: recipe.name,
				portions: recipe.portions,
				lines
			}
		};
	},

	/** Creates the meal from a reviewed import: `payload` is the accepted matches as JSON. */
	createImported: async ({ request, locals }) => {
		const userId = locals.user!.id;
		const form = await request.formData();
		const name = String(form.get('name') ?? '').trim();
		const portions = parseDecimal(String(form.get('portions') ?? '1'));
		if (!name) return fail(400, { importError: 'Name is required' });

		let picks: { kind?: unknown; id?: unknown; amount?: unknown }[];
		try {
			const parsed = JSON.parse(String(form.get('payload') ?? '[]'));
			if (!Array.isArray(parsed) || parsed.length > 60) throw new Error('bad payload');
			picks = parsed;
		} catch {
			return fail(400, { importError: 'Could not read the selection — try the import again' });
		}

		const meal = await createMeal(userId, name, [], portions);
		for (const pick of picks) {
			const id = Number(pick?.id);
			const amount = Number(pick?.amount);
			if (!Number.isFinite(id) || !Number.isFinite(amount) || amount <= 0) continue;
			try {
				const product =
					pick?.kind === 'catalog' ? await addCatalogProductToUser(userId, id) : await getProduct(userId, id);
				if (!product) continue;
				const serving = product.amount > 0 ? product.amount : 100;
				await addProductIngredient(userId, meal.id, product.id, amount / serving);
			} catch {
				// A single bad line shouldn't sink the import — the meal stays editable.
			}
		}
		throw redirect(303, `/meals/${meal.id}`);
	}
};
