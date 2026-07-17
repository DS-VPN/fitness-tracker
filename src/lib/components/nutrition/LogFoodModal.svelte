<script lang="ts">
	import { enhance } from '$app/forms';
	import { goto } from '$app/navigation';
	import Modal from '$lib/components/Modal.svelte';
	import TextField from '$lib/components/TextField.svelte';
	import NumberStepper from '$lib/components/NumberStepper.svelte';
	import Button from '$lib/components/Button.svelte';
	import Icon from '$lib/components/Icon.svelte';
	import BarcodeScanner from '$lib/components/BarcodeScanner.svelte';

	type MealOption = { id: number; name: string; portions: number; totalMacros: { calories: number } };
	type ProductOption = { id: number; name: string; brand: string | null; calories: number; amount: number; unit: string };
	type Selected = { kind: 'meal' | 'product'; id: number; name: string; kcalPerPortion: number; unitLabel: string };

	let {
		open = $bindable(false),
		meals,
		products
	}: {
		open?: boolean;
		meals: MealOption[];
		products: ProductOption[];
	} = $props();

	let query = $state('');
	let selected = $state<Selected | null>(null);
	let portions = $state(1);
	let error = $state('');
	let scanOpen = $state(false);
	let scanBusy = $state(false);

	const term = $derived(query.trim().toLowerCase());
	const mealResults = $derived(meals.filter((m) => !term || m.name.toLowerCase().includes(term)));
	const productResults = $derived(
		products.filter((p) => !term || p.name.toLowerCase().includes(term) || p.brand?.toLowerCase().includes(term))
	);

	function mealKcalPerPortion(meal: MealOption) {
		const recipePortions = meal.portions > 0 ? meal.portions : 1;
		return meal.totalMacros.calories / recipePortions;
	}

	function pickMeal(meal: MealOption) {
		selected = {
			kind: 'meal',
			id: meal.id,
			name: meal.name,
			kcalPerPortion: mealKcalPerPortion(meal),
			unitLabel: 'Portions'
		};
		portions = 1;
		error = '';
	}

	function pickProduct(product: ProductOption) {
		selected = {
			kind: 'product',
			id: product.id,
			name: product.brand ? `${product.name} (${product.brand})` : product.name,
			kcalPerPortion: product.calories,
			unitLabel: 'Servings'
		};
		portions = 1;
		error = '';
	}

	function reset() {
		open = false;
		query = '';
		selected = null;
		portions = 1;
		error = '';
	}

	/** Scan from the log flow: a locally saved product is selected for logging on the spot; anything
	 *  else hands off to the product-creation page with the lookup's prefill in the querystring. */
	async function handleScan(code: string) {
		scanBusy = true;
		error = '';
		try {
			const res = await fetch(`/api/barcode/${code}`);
			if (!res.ok) throw new Error();
			const data = await res.json();
			if (data.source === 'local') {
				pickProduct(data.product);
			} else if (data.source === 'off' || data.source === 'off-cache') {
				const p = data.prefill;
				const params = new URLSearchParams({
					barcode: data.barcode,
					name: p.name,
					amount: String(p.amount),
					unit: p.unit,
					calories: String(p.calories),
					protein: String(p.protein),
					carbs: String(p.carbs),
					fat: String(p.fat)
				});
				if (p.brand) params.set('brand', p.brand);
				reset();
				await goto(`/shopping-list/products/new?${params}`);
			} else if (data.source === 'none') {
				reset();
				await goto(`/shopping-list/products/new?barcode=${data.barcode}`);
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

<Modal bind:open title="Log food" onclose={reset}>
	{#if selected}
		<p class="mb-1 text-sm text-[var(--color-text)]">
			Logging <span class="font-medium">{selected.name}</span>
		</p>
		<p class="mb-3 text-xs text-[var(--color-text-muted)]">
			≈ {Math.round(selected.kcalPerPortion * portions)} kcal for {portions}
			{selected.unitLabel.toLowerCase()}
		</p>
		<form
			method="POST"
			action="?/logFood"
			use:enhance={() => {
				error = '';
				return async ({ result, update }) => {
					if (result.type === 'success') {
						reset();
					} else if (result.type === 'failure') {
						error = (result.data?.error as string) ?? 'Could not log';
					}
					await update({ reset: false });
				};
			}}
		>
			<input type="hidden" name="kind" value={selected.kind} />
			<input type="hidden" name="refId" value={selected.id} />
			<input type="hidden" name="portions" value={portions} />
			<NumberStepper label={selected.unitLabel} bind:value={portions} step={0.5} min={0} class="mb-3" />
			<div class="flex gap-2">
				<Button type="button" variant="ghost" onclick={() => (selected = null)}>Back</Button>
				<Button type="submit" variant="primary" full class="flex-1">Log</Button>
			</div>
		</form>
	{:else}
		<div class="mb-3 flex items-end gap-2">
			<TextField name="query" type="search" placeholder="Search meals and products…" bind:value={query} class="flex-1" />
			<Button type="button" variant="secondary" size="icon" onclick={() => (scanOpen = true)} disabled={scanBusy}>
				<Icon name="scan" size={20} />
				<span class="sr-only">Scan barcode</span>
			</Button>
		</div>

		<div class="max-h-72 overflow-y-auto -mx-1">
			{#each mealResults as meal (meal.id)}
				<button
					type="button"
					onclick={() => pickMeal(meal)}
					class="w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-[var(--radius-md)] hover:bg-[var(--color-surface-alt)] text-left"
				>
					<span class="min-w-0">
						<span class="block truncate text-[var(--color-text)]">{meal.name}</span>
						<span class="text-xs text-[var(--color-text-muted)]"
							>{Math.round(mealKcalPerPortion(meal))} kcal / portion</span
						>
					</span>
					<span
						class="shrink-0 rounded-full bg-[var(--color-surface-alt)] px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-[var(--color-text-muted)]"
						>Meal</span
					>
				</button>
			{/each}
			{#each productResults as product (product.id)}
				<button
					type="button"
					onclick={() => pickProduct(product)}
					class="w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-[var(--radius-md)] hover:bg-[var(--color-surface-alt)] text-left"
				>
					<span class="min-w-0">
						<span class="block truncate text-[var(--color-text)]">
							{product.name}{#if product.brand}<span class="text-[var(--color-text-muted)]"> · {product.brand}</span>{/if}
						</span>
						<span class="text-xs text-[var(--color-text-muted)]">
							{Math.round(product.calories)} kcal / {product.amount}{product.unit}
						</span>
					</span>
					<span
						class="shrink-0 rounded-full bg-[var(--color-surface-alt)] px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-[var(--color-text-muted)]"
						>Product</span
					>
				</button>
			{/each}
			{#if mealResults.length === 0 && productResults.length === 0}
				<p class="text-sm text-[var(--color-text-muted)] px-3 py-2">
					No matches. Build meals under Meals, or add products under Shopping → Products.
				</p>
			{/if}
		</div>
	{/if}

	{#if error}
		<p class="mt-2 text-sm text-[var(--color-danger)]">{error}</p>
	{/if}
</Modal>

<BarcodeScanner bind:open={scanOpen} onscan={handleScan} />
