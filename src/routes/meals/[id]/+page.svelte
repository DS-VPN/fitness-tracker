<script lang="ts">
	import { enhance } from '$app/forms';
	import PageHeader from '$lib/components/PageHeader.svelte';
	import Card from '$lib/components/Card.svelte';
	import Button from '$lib/components/Button.svelte';
	import Icon from '$lib/components/Icon.svelte';
	import Chip from '$lib/components/Chip.svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
	const meal = $derived(data.meal);

	let added = $state(false);
	let addedTimeout: ReturnType<typeof setTimeout> | undefined;

	function fmt(n: number) {
		return Number.isInteger(n) ? n : Math.round(n * 10) / 10;
	}

	const macroRows = $derived([
		{ label: 'Calories', value: meal.calories, unit: 'kcal' },
		{ label: 'Protein', value: meal.protein, unit: 'g' },
		{ label: 'Carbs', value: meal.carbs, unit: 'g' },
		{ label: 'Fat', value: meal.fat, unit: 'g' }
	]);

	const extraRows = $derived(
		(
			[
				meal.fiber != null ? { label: 'Fiber', value: meal.fiber, unit: 'g' } : null,
				meal.sugar != null ? { label: 'Sugar', value: meal.sugar, unit: 'g' } : null,
				meal.sodium != null ? { label: 'Sodium', value: meal.sodium, unit: 'mg' } : null
			] as ({ label: string; value: number; unit: string } | null)[]
		).filter((r): r is { label: string; value: number; unit: string } => r !== null)
	);
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
		{#if meal.brand}
			<p class="text-sm text-[var(--color-text-muted)]">{meal.brand}</p>
		{/if}
		{#if meal.servingSize}
			<p class="mt-0.5 text-xs text-[var(--color-text-muted)]">Per {meal.servingSize}</p>
		{/if}

		<div class="mt-3 grid grid-cols-2 gap-3">
			{#each macroRows as row (row.label)}
				<div class="rounded-[var(--radius-md)] bg-[var(--color-surface-alt)] px-3 py-2">
					<p class="text-xs text-[var(--color-text-muted)]">{row.label}</p>
					<p class="text-base font-medium text-[var(--color-text)]">
						{fmt(row.value)}<span class="ml-0.5 text-xs text-[var(--color-text-muted)]">{row.unit}</span>
					</p>
				</div>
			{/each}
		</div>

		{#if extraRows.length}
			<div class="mt-3 flex flex-wrap gap-x-4 gap-y-1 border-t border-[var(--color-border)] pt-3">
				{#each extraRows as row (row.label)}
					<p class="text-sm text-[var(--color-text-muted)]">
						{row.label}: <span class="font-medium text-[var(--color-text)]">{fmt(row.value)}{row.unit}</span>
					</p>
				{/each}
			</div>
		{/if}

		{#if meal.categories.length}
			<div class="mt-3 flex flex-wrap gap-1.5 border-t border-[var(--color-border)] pt-3">
				{#each meal.categories as c (c.id)}
					<Chip>{c.name}</Chip>
				{/each}
			</div>
		{/if}
	</Card>

	<div>
		<form
			method="POST"
			action="?/addToList"
			use:enhance={() => {
				return async ({ result, update }) => {
					if (result.type === 'success') {
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
				Add to shopping list
			</Button>
		</form>
		{#if added}
			<p class="mt-2 text-center text-sm text-[var(--color-success)]">Added</p>
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
