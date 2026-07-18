<script lang="ts">
	import { goto } from '$app/navigation';
	import { enhance } from '$app/forms';
	import PageHeader from '$lib/components/PageHeader.svelte';
	import Card from '$lib/components/Card.svelte';
	import Button from '$lib/components/Button.svelte';
	import Icon from '$lib/components/Icon.svelte';
	import MacroBadge from '$lib/components/MacroBadge.svelte';
	import EmptyState from '$lib/components/EmptyState.svelte';
	import TextField from '$lib/components/TextField.svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	function fmt(n: number) {
		return Number.isInteger(n) ? n : Math.round(n * 10) / 10;
	}

	let search = $state(data.q);

	let debounceHandle: ReturnType<typeof setTimeout> | undefined;
	let skipNextDebounce = true;
	$effect(() => {
		const value = search;
		if (skipNextDebounce) {
			skipNextDebounce = false;
			return;
		}
		clearTimeout(debounceHandle);
		debounceHandle = setTimeout(() => {
			const params = new URLSearchParams();
			if (value) params.set('q', value);
			const qs = params.toString();
			goto(qs ? `/shopping-list/products?${qs}` : '/shopping-list/products', {
				keepFocus: true,
				replaceState: true,
				noScroll: true
			});
		}, 300);
		return () => clearTimeout(debounceHandle);
	});
</script>

<svelte:head><title>Products · Fitness Tracker</title></svelte:head>

{#snippet headerActions()}
	<Button href="/shopping-list/products/new" variant="primary" size="md">
		<Icon name="plus" size={18} />
		New
	</Button>
{/snippet}

<PageHeader title="Products" back="/shopping-list" actions={headerActions} />

<div class="mx-auto max-w-md px-4 pb-4">
	<TextField name="search" type="search" bind:value={search} placeholder="Search products or brands" class="mb-3" />

	{#if data.products.length > 0}
		<div class="space-y-2">
			{#each data.products as product (product.id)}
				<Card href={`/shopping-list/products/${product.id}/edit`}>
					<span class="block truncate font-medium text-[var(--color-text)]">{product.name}</span>
					{#if product.brand}
						<p class="truncate text-xs text-[var(--color-text-muted)]">{product.brand}</p>
					{/if}
					<MacroBadge
						calories={product.calories}
						protein={product.protein}
						carbs={product.carbs}
						fat={product.fat}
						class="mt-1"
					/>
				</Card>
			{/each}
		</div>
	{:else if !data.q}
		<EmptyState
			icon="cart"
			title="No products yet"
			description="Search to add from the Norwegian catalog, or add your own to build meals from ingredients."
		>
			<Button href="/shopping-list/products/new" variant="primary">Add a product</Button>
		</EmptyState>
	{:else if data.catalogMatches.length === 0}
		<div class="py-10 text-center">
			<p class="mb-3 text-sm text-[var(--color-text-muted)]">No products match your search.</p>
			<Button variant="secondary" onclick={() => (search = '')}>Clear search</Button>
		</div>
	{/if}

	{#if data.catalogMatches.length > 0}
		<section class="mt-6">
			<h2 class="mb-2 px-1 text-xs font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">
				From catalog
			</h2>
			<div class="space-y-2">
				{#each data.catalogMatches as c (c.id)}
					<Card class="flex items-center gap-2">
						<div class="min-w-0 flex-1">
							<span class="block truncate font-medium text-[var(--color-text)]">{c.name}</span>
							{#if c.brand}
								<p class="truncate text-xs text-[var(--color-text-muted)]">{c.brand}</p>
							{/if}
							<p class="mt-1 text-xs text-[var(--color-text-muted)]">
								{fmt(c.calories)} kcal · {fmt(c.protein)}p {fmt(c.carbs)}c {fmt(c.fat)}f
								<span class="text-[var(--color-text-muted)]">/ {fmt(c.amount)}{c.unit}</span>
							</p>
						</div>
						<form method="POST" action="?/addFromCatalog" use:enhance>
							<input type="hidden" name="catalogId" value={c.id} />
							<Button type="submit" variant="secondary" size="md">
								<Icon name="plus" size={16} />
								Add
							</Button>
						</form>
					</Card>
				{/each}
			</div>
			<p class="mt-3 px-1 text-[11px] text-[var(--color-text-muted)]">
				Product data from Open Food Facts (ODbL).
			</p>
		</section>
	{/if}
</div>
