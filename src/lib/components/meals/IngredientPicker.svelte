<script lang="ts">
	import { enhance } from '$app/forms';
	import Modal from '$lib/components/Modal.svelte';
	import TextField from '$lib/components/TextField.svelte';
	import NumberField from '$lib/components/NumberField.svelte';
	import Button from '$lib/components/Button.svelte';
	import Icon from '$lib/components/Icon.svelte';

	type ProductOption = { id: number; name: string; brand: string | null };
	type MealOption = { id: number; name: string };
	type ResultItem = { type: 'product' | 'meal'; id: number; name: string; subtitle: string | null };

	let {
		open = $bindable(false),
		products,
		subMeals
	}: {
		open?: boolean;
		products: ProductOption[];
		subMeals: MealOption[];
	} = $props();

	let query = $state('');
	let selected = $state<{ type: 'product' | 'meal'; id: number; name: string } | null>(null);
	let quantity = $state(1);
	let creatingProduct = $state(false);
	let error = $state('');

	// New-product mini-form fields
	let newName = $state('');
	let newBrand = $state('');
	let newServingSize = $state('');
	let newCalories = $state<number | null>(0);
	let newProtein = $state<number | null>(0);
	let newCarbs = $state<number | null>(0);
	let newFat = $state<number | null>(0);

	const results = $derived.by<ResultItem[]>(() => {
		const term = query.trim().toLowerCase();
		const productResults: ResultItem[] = products
			.filter((p) => !term || p.name.toLowerCase().includes(term))
			.map((p) => ({ type: 'product' as const, id: p.id, name: p.name, subtitle: p.brand }));
		const mealResults: ResultItem[] = subMeals
			.filter((m) => !term || m.name.toLowerCase().includes(term))
			.map((m) => ({ type: 'meal' as const, id: m.id, name: m.name, subtitle: 'Meal' }));
		return [...productResults, ...mealResults];
	});

	function pick(item: ResultItem) {
		selected = { type: item.type, id: item.id, name: item.name };
		quantity = 1;
		error = '';
	}

	function startCreatingProduct() {
		newName = query.trim();
		newBrand = '';
		newServingSize = '';
		newCalories = 0;
		newProtein = 0;
		newCarbs = 0;
		newFat = 0;
		quantity = 1;
		error = '';
		creatingProduct = true;
	}

	function reset() {
		open = false;
		query = '';
		selected = null;
		quantity = 1;
		creatingProduct = false;
		error = '';
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
						reset();
					} else if (result.type === 'failure') {
						error = (result.data?.error as string) ?? 'Could not add ingredient';
					}
					await update({ reset: false });
				};
			}}
		>
			<input type="hidden" name={selected.type === 'product' ? 'productId' : 'subMealId'} value={selected.id} />
			<NumberField label="Quantity" name="quantity" bind:value={quantity} min={0.01} step={0.01} class="mb-3" />
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
						reset();
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
				<TextField label="Serving size" name="servingSize" bind:value={newServingSize} placeholder="e.g. 100 g" />
				<div class="grid grid-cols-2 gap-3">
					<NumberField label="Calories" name="calories" bind:value={newCalories} min={0} suffix="kcal" required />
					<NumberField label="Protein" name="protein" bind:value={newProtein} min={0} step={0.1} suffix="g" required />
					<NumberField label="Carbs" name="carbs" bind:value={newCarbs} min={0} step={0.1} suffix="g" required />
					<NumberField label="Fat" name="fat" bind:value={newFat} min={0} step={0.1} suffix="g" required />
				</div>
				<NumberField label="Quantity to add" name="quantity" bind:value={quantity} min={0.01} step={0.01} />
			</div>
			<div class="mt-4 flex gap-2">
				<Button type="button" variant="ghost" onclick={() => (creatingProduct = false)}>Back</Button>
				<Button type="submit" variant="primary" full class="flex-1">Create &amp; add</Button>
			</div>
		</form>
	{:else}
		<TextField name="query" placeholder="Search products or meals…" bind:value={query} class="mb-3" />

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
			{#if results.length === 0}
				<p class="text-sm text-[var(--color-text-muted)] px-3 py-2">
					{query.trim() ? 'No matches — create a new product below.' : 'Type to search, or create a new product below.'}
				</p>
			{/if}
		</div>

		<div class="mt-3 pt-3 border-t border-[var(--color-border)]">
			<Button type="button" variant="secondary" full onclick={startCreatingProduct}>
				<Icon name="plus" size={18} />
				Create new product
			</Button>
		</div>
	{/if}

	{#if error}
		<p class="mt-2 text-sm text-[var(--color-danger)]">{error}</p>
	{/if}
</Modal>
