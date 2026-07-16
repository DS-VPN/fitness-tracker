<script lang="ts">
	import { goto } from '$app/navigation';
	import PageHeader from '$lib/components/PageHeader.svelte';
	import Card from '$lib/components/Card.svelte';
	import Button from '$lib/components/Button.svelte';
	import Icon from '$lib/components/Icon.svelte';
	import MacroBadge from '$lib/components/MacroBadge.svelte';
	import EmptyState from '$lib/components/EmptyState.svelte';
	import TextField from '$lib/components/TextField.svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

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

	{#if data.products.length === 0}
		{#if !data.q}
			<EmptyState
				icon="cart"
				title="No products yet"
				description="Add your first product to start building meals from ingredients."
			>
				<Button href="/shopping-list/products/new" variant="primary">Add a product</Button>
			</EmptyState>
		{:else}
			<div class="py-10 text-center">
				<p class="mb-3 text-sm text-[var(--color-text-muted)]">No products match your search.</p>
				<Button variant="secondary" onclick={() => (search = '')}>Clear search</Button>
			</div>
		{/if}
	{:else}
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
	{/if}
</div>
