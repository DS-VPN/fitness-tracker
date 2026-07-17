<script lang="ts">
	import { enhance } from '$app/forms';
	import PageHeader from '$lib/components/PageHeader.svelte';
	import Card from '$lib/components/Card.svelte';
	import Button from '$lib/components/Button.svelte';
	import Icon from '$lib/components/Icon.svelte';
	import Chip from '$lib/components/Chip.svelte';
	import EmptyState from '$lib/components/EmptyState.svelte';
	import IngredientRow from '$lib/components/meals/IngredientRow.svelte';
	import IngredientPicker from '$lib/components/meals/IngredientPicker.svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
	const meal = $derived(data.meal);

	let pickerOpen = $state(false);
	let added = $state(false);
	let addedCount = $state(0);
	let addedTimeout: ReturnType<typeof setTimeout> | undefined;

	function fmt(n: number) {
		return Number.isInteger(n) ? n : Math.round(n * 10) / 10;
	}

	const macroRows = $derived([
		{ label: 'Calories', value: meal.totalMacros.calories, unit: 'kcal' },
		{ label: 'Protein', value: meal.totalMacros.protein, unit: 'g' },
		{ label: 'Carbs', value: meal.totalMacros.carbs, unit: 'g' },
		{ label: 'Fat', value: meal.totalMacros.fat, unit: 'g' }
	]);
</script>

<svelte:head><title>{meal.name} · Fitness Tracker</title></svelte:head>

{#snippet headerActions()}
	<Button href={`/meals/${meal.id}/edit`} variant="ghost" size="icon">
		<Icon name="edit" size={20} />
		<span class="sr-only">Edit meal</span>
	</Button>
{/snippet}

<PageHeader title={meal.name} back="/meals" actions={headerActions} />

<div class="mx-auto max-w-md space-y-4 px-4 pb-6">
	<Card>
		<div class="grid grid-cols-2 gap-3">
			{#each macroRows as row (row.label)}
				<div class="rounded-[var(--radius-md)] bg-[var(--color-surface-alt)] px-3 py-2">
					<p class="text-xs text-[var(--color-text-muted)]">{row.label}</p>
					<p class="text-base font-medium text-[var(--color-text)]">
						{fmt(row.value)}<span class="ml-0.5 text-xs text-[var(--color-text-muted)]">{row.unit}</span>
					</p>
				</div>
			{/each}
		</div>

		{#if meal.categories.length}
			<div class="mt-3 flex flex-wrap gap-1.5 border-t border-[var(--color-border)] pt-3">
				{#each meal.categories as c (c.id)}
					<Chip>{c.name}</Chip>
				{/each}
			</div>
		{/if}
	</Card>

	<div>
		<h2 class="mb-2 px-1 text-sm font-medium text-[var(--color-text-muted)]">Ingredients</h2>
		{#if meal.ingredients.length === 0}
			<EmptyState
				icon="meals"
				title="No ingredients yet"
				description="Add a product or another meal below to build this recipe."
			/>
		{:else}
			<Card>
				<div class="divide-y divide-[var(--color-border)]">
					{#each meal.ingredients as ingredient (ingredient.id)}
						<IngredientRow {ingredient} />
					{/each}
				</div>
			</Card>
		{/if}
		<Button variant="secondary" full size="lg" class="mt-3 w-full" onclick={() => (pickerOpen = true)}>
			<Icon name="plus" size={18} />
			Add ingredient
		</Button>
	</div>

	<div>
		<form
			method="POST"
			action="?/addToList"
			use:enhance={() => {
				return async ({ result, update }) => {
					if (result.type === 'success') {
						addedCount = (result.data?.count as number) ?? 0;
						added = true;
						clearTimeout(addedTimeout);
						addedTimeout = setTimeout(() => (added = false), 2000);
					}
					await update({ reset: false });
				};
			}}
		>
			<Button type="submit" variant="primary" size="lg" full class="w-full">
				<Icon name="cart" size={18} />
				Add ingredients to shopping list
			</Button>
		</form>
		{#if added}
			<p class="mt-2 text-center text-sm text-[var(--color-success)]">
				{#if addedCount > 0}
					Added {addedCount} {addedCount === 1 ? 'item' : 'items'}
				{:else}
					This meal has no ingredients yet
				{/if}
			</p>
		{/if}
	</div>

	<form
		method="POST"
		action="?/delete"
		use:enhance={({ cancel }) => {
			if (!confirm(`Delete "${meal.name}"? This can't be undone.`)) {
				cancel();
			}
		}}
	>
		<Button type="submit" variant="danger" size="md" full class="w-full">
			<Icon name="trash" size={16} />
			Delete meal
		</Button>
	</form>
</div>

<IngredientPicker bind:open={pickerOpen} products={data.products} subMeals={data.subMeals} />
