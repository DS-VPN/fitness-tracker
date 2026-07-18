<script lang="ts">
	import { enhance } from '$app/forms';
	import Modal from '$lib/components/Modal.svelte';
	import TextField from '$lib/components/TextField.svelte';
	import NumberField from '$lib/components/NumberField.svelte';
	import SelectField from '$lib/components/SelectField.svelte';
	import Button from '$lib/components/Button.svelte';
	import Icon from '$lib/components/Icon.svelte';
	import BarcodeScanner from '$lib/components/BarcodeScanner.svelte';

	type ProductOption = { id: number; name: string; brand: string | null; amount: number; unit: string };
	type MealOption = { id: number; name: string };
	type ResultItem = { type: 'product' | 'meal'; id: number; name: string; subtitle: string | null; amount?: number; unit?: string };

	const UNIT_OPTIONS = [
		{ value: 'g', label: 'grams (g)' },
		{ value: 'ml', label: 'milliliters (ml)' },
		{ value: 'pcs', label: 'pieces' }
	];

	let {
		open = $bindable(false),
		products,
		subMeals
	}: {
		open?: boolean;
		products: ProductOption[];
		subMeals: MealOption[];
	} = $props();

	type CatalogMatch = { id: number; name: string; brand: string | null; amount: number; unit: string; calories: number; protein: number; carbs: number; fat: number };

	let query = $state('');
	let selected = $state<{ type: 'product' | 'meal'; id: number; name: string; amount?: number; unit?: string } | null>(null);
	let quantity = $state(1);
	let creatingProduct = $state(false);
	let error = $state('');
	let scanOpen = $state(false);
	let scanBusy = $state(false);
	let catalogResults = $state<CatalogMatch[]>([]);
	let addingCatalog = $state(false);

	// New-product mini-form fields
	let newName = $state('');
	let newBrand = $state('');
	let newBarcode = $state('');
	let newAmount = $state<number | null>(100);
	let newUnit = $state('g');
	let newCalories = $state<number | null>(0);
	let newProtein = $state<number | null>(0);
	let newCarbs = $state<number | null>(0);
	let newFat = $state<number | null>(0);
	/** How much of the new product to add to this meal right now — defaults to "one serving" (newAmount). */
	let ingredientAmount = $state(100);

	const results = $derived.by<ResultItem[]>(() => {
		const term = query.trim().toLowerCase();
		const productResults: ResultItem[] = products
			.filter((p) => !term || p.name.toLowerCase().includes(term))
			.map((p) => ({ type: 'product' as const, id: p.id, name: p.name, subtitle: p.brand, amount: p.amount, unit: p.unit }));
		const mealResults: ResultItem[] = subMeals
			.filter((m) => !term || m.name.toLowerCase().includes(term))
			.map((m) => ({ type: 'meal' as const, id: m.id, name: m.name, subtitle: 'Meal' }));
		return [...productResults, ...mealResults];
	});

	function pick(item: ResultItem) {
		selected = { type: item.type, id: item.id, name: item.name, amount: item.amount, unit: item.unit };
		quantity = item.type === 'product' && item.amount ? item.amount : 1;
		error = '';
	}

	// Debounced catalog search — only while browsing (not on a selected/create step). Hides items
	// the user already owns (same name+brand).
	let catalogHandle: ReturnType<typeof setTimeout> | undefined;
	$effect(() => {
		const q = query.trim();
		clearTimeout(catalogHandle);
		if (q.length < 2 || selected || creatingProduct) {
			catalogResults = [];
			return;
		}
		catalogHandle = setTimeout(async () => {
			try {
				const res = await fetch(`/api/catalog/search?q=${encodeURIComponent(q)}`);
				if (!res.ok) return;
				const data = (await res.json()) as { matches: CatalogMatch[] };
				const owned = new Set(products.map((p) => `${p.name.toLowerCase()}|${(p.brand ?? '').toLowerCase()}`));
				catalogResults = data.matches.filter((m) => !owned.has(`${m.name.toLowerCase()}|${(m.brand ?? '').toLowerCase()}`));
			} catch {
				catalogResults = [];
			}
		}, 300);
		return () => clearTimeout(catalogHandle);
	});

	/** Add a catalog product to the user's own products, then select it as a product ingredient. */
	async function pickCatalog(c: CatalogMatch) {
		if (addingCatalog) return;
		addingCatalog = true;
		error = '';
		try {
			const res = await fetch('/api/catalog/add', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ catalogId: c.id })
			});
			if (!res.ok) throw new Error();
			const { product } = await res.json();
			selected = { type: 'product', id: product.id, name: product.name, amount: product.amount, unit: product.unit };
			quantity = product.amount;
			catalogResults = [];
		} catch {
			error = 'Could not add that product — try again.';
		} finally {
			addingCatalog = false;
		}
	}

	function startCreatingProduct(prefill?: {
		name?: string;
		brand?: string;
		barcode?: string;
		amount?: number;
		unit?: string;
		calories?: number;
		protein?: number;
		carbs?: number;
		fat?: number;
	}) {
		newName = prefill?.name ?? query.trim();
		newBrand = prefill?.brand ?? '';
		newBarcode = prefill?.barcode ?? '';
		newAmount = prefill?.amount ?? 100;
		newUnit = prefill?.unit ?? 'g';
		newCalories = prefill?.calories ?? 0;
		newProtein = prefill?.protein ?? 0;
		newCarbs = prefill?.carbs ?? 0;
		newFat = prefill?.fat ?? 0;
		ingredientAmount = newAmount ?? 100;
		error = '';
		creatingProduct = true;
	}

	/** Clears the current step and returns to search/scan without closing the modal — used after a
	 *  successful add so scanning several items back-to-back only takes one tap each. */
	function backToSearch() {
		query = '';
		selected = null;
		quantity = 1;
		creatingProduct = false;
		error = '';
		catalogResults = [];
	}

	function reset() {
		open = false;
		backToSearch();
	}

	async function handleScan(code: string) {
		scanBusy = true;
		error = '';
		try {
			const res = await fetch(`/api/barcode/${code}`);
			if (!res.ok) throw new Error();
			const data = await res.json();
			if (data.source === 'local') {
				const p = data.product;
				selected = { type: 'product', id: p.id, name: p.name, amount: p.amount, unit: p.unit };
				quantity = p.amount;
			} else if (data.source === 'off' || data.source === 'off-cache') {
				const p = data.prefill;
				startCreatingProduct({
					name: p.name,
					brand: p.brand ?? undefined,
					barcode: data.barcode,
					amount: p.amount,
					unit: p.unit,
					calories: p.calories,
					protein: p.protein,
					carbs: p.carbs,
					fat: p.fat
				});
			} else if (data.source === 'none') {
				startCreatingProduct({ barcode: data.barcode });
			} else {
				error = 'Lookup service unreachable — try again in a moment.';
			}
		} catch {
			error = 'Barcode lookup failed — try again.';
		} finally {
			scanBusy = false;
		}
	}
</script>

<Modal bind:open title="Add ingredient" onclose={reset}>
	{#if selected}
		<p class="mb-3 text-sm text-[var(--color-text)]">
			Adding <span class="font-medium">{selected.name}</span>
		</p>
		<form
			method="POST"
			action={selected.type === 'product' ? '?/addProductIngredient' : '?/addSubMealIngredient'}
			use:enhance={() => {
				error = '';
				return async ({ result, update }) => {
					if (result.type === 'success') {
						backToSearch();
					} else if (result.type === 'failure') {
						error = (result.data?.error as string) ?? 'Could not add ingredient';
					}
					await update({ reset: false });
				};
			}}
		>
			<input type="hidden" name={selected.type === 'product' ? 'productId' : 'subMealId'} value={selected.id} />
			<NumberField
				label={selected.type === 'product' ? `Amount (${selected.unit})` : 'Portions'}
				name={selected.type === 'product' ? 'amount' : 'quantity'}
				bind:value={quantity}
				min={0.01}
				step={0.01}
				class="mb-3"
			/>
			<div class="flex gap-2">
				<Button type="button" variant="ghost" onclick={() => (selected = null)}>Back</Button>
				<Button type="submit" variant="primary" full class="flex-1">Add</Button>
			</div>
		</form>
	{:else if creatingProduct}
		<form
			method="POST"
			action="?/createProductIngredient"
			use:enhance={() => {
				error = '';
				return async ({ result, update }) => {
					if (result.type === 'success') {
						backToSearch();
					} else if (result.type === 'failure') {
						error = (result.data?.error as string) ?? 'Could not create product';
					}
					await update({ reset: false });
				};
			}}
		>
			<div class="space-y-3">
				<TextField label="Name" name="name" bind:value={newName} required placeholder="e.g. Tortillas" />
				<TextField label="Brand" name="brand" bind:value={newBrand} placeholder="Optional" />
				<input type="hidden" name="barcode" value={newBarcode} />
				{#if newBarcode}
					<p class="text-xs text-[var(--color-text-muted)] -mt-2">
						Barcode {newBarcode} — future scans of it will find this product instantly.
					</p>
				{/if}
				<div class="grid grid-cols-2 gap-3">
					<NumberField label="Amount" name="amount" bind:value={newAmount} min={0.01} step={0.01} required />
					<SelectField label="Unit" name="unit" bind:value={newUnit} options={UNIT_OPTIONS} />
				</div>
				<div class="grid grid-cols-2 gap-3">
					<NumberField label="Calories" name="calories" bind:value={newCalories} min={0} suffix="kcal" required />
					<NumberField label="Protein" name="protein" bind:value={newProtein} min={0} step={0.1} suffix="g" required />
					<NumberField label="Carbs" name="carbs" bind:value={newCarbs} min={0} step={0.1} suffix="g" required />
					<NumberField label="Fat" name="fat" bind:value={newFat} min={0} step={0.1} suffix="g" required />
				</div>
				<NumberField
					label={`Amount to add (${newUnit})`}
					name="ingredientAmount"
					bind:value={ingredientAmount}
					min={0.01}
					step={0.01}
				/>
			</div>
			<div class="mt-4 flex gap-2">
				<Button type="button" variant="ghost" onclick={() => (creatingProduct = false)}>Back</Button>
				<Button type="submit" variant="primary" full class="flex-1">Create &amp; add</Button>
			</div>
		</form>
	{:else}
		<div class="mb-3 flex items-end gap-2">
			<TextField name="query" placeholder="Search products or meals…" bind:value={query} class="flex-1" />
			<Button type="button" variant="secondary" size="icon" onclick={() => (scanOpen = true)} disabled={scanBusy}>
				<Icon name="scan" size={20} />
				<span class="sr-only">Scan barcode</span>
			</Button>
		</div>

		<div class="max-h-64 overflow-y-auto -mx-1">
			{#each results as item (`${item.type}-${item.id}`)}
				<button
					type="button"
					onclick={() => pick(item)}
					class="w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-[var(--radius-md)] hover:bg-[var(--color-surface-alt)] text-left"
				>
					<span class="text-[var(--color-text)]">{item.name}</span>
					{#if item.subtitle}
						<span class="text-xs text-[var(--color-text-muted)] shrink-0">{item.subtitle}</span>
					{/if}
				</button>
			{/each}
			{#if catalogResults.length > 0}
				<p class="px-3 pt-2 pb-1 text-xs font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">
					From catalog
				</p>
				{#each catalogResults as c (c.id)}
					<button
						type="button"
						onclick={() => pickCatalog(c)}
						disabled={addingCatalog}
						class="w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-[var(--radius-md)] hover:bg-[var(--color-surface-alt)] text-left disabled:opacity-50"
					>
						<span class="min-w-0">
							<span class="block truncate text-[var(--color-text)]">
								{c.name}{#if c.brand}<span class="text-[var(--color-text-muted)]"> · {c.brand}</span>{/if}
							</span>
							<span class="text-xs text-[var(--color-text-muted)]">{Math.round(c.calories)} kcal / {c.amount}{c.unit}</span>
						</span>
						<Icon name="plus" size={16} class="shrink-0 text-[var(--color-text-muted)]" />
					</button>
				{/each}
			{/if}

			{#if results.length === 0 && catalogResults.length === 0}
				<p class="text-sm text-[var(--color-text-muted)] px-3 py-2">
					{query.trim() ? 'No matches — create a new product below.' : 'Type to search your products, meals, and the Norwegian catalog.'}
				</p>
			{/if}
		</div>

		<div class="mt-3 pt-3 border-t border-[var(--color-border)]">
			<Button type="button" variant="secondary" full onclick={() => startCreatingProduct()}>
				<Icon name="plus" size={18} />
				Create new product
			</Button>
		</div>
	{/if}

	{#if error}
		<p class="mt-2 text-sm text-[var(--color-danger)]">{error}</p>
	{/if}
</Modal>

<BarcodeScanner bind:open={scanOpen} onscan={handleScan} />
