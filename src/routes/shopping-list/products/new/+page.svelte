<script lang="ts">
	import PageHeader from '$lib/components/PageHeader.svelte';
	import ProductForm from '$lib/components/shopping/ProductForm.svelte';
	import Card from '$lib/components/Card.svelte';
	import Button from '$lib/components/Button.svelte';
	import Icon from '$lib/components/Icon.svelte';
	import MacroBadge from '$lib/components/MacroBadge.svelte';
	import type { ActionData } from './$types';

	let { form }: { form: ActionData } = $props();

	type AddedProduct = { id: number; name: string; brand: string | null; calories: number; protein: number; carbs: number; fat: number };

	let added = $state<AddedProduct[]>([]);

	function handleAdded(product: unknown) {
		if (product && typeof product === 'object' && 'id' in product) {
			added = [product as AddedProduct, ...added];
		}
	}
</script>

<svelte:head><title>New product · Fitness Tracker</title></svelte:head>

{#snippet headerActions()}
	{#if added.length > 0}
		<Button href="/shopping-list/products" variant="ghost" size="md">Done</Button>
	{/if}
{/snippet}

<PageHeader title="New product" back="/shopping-list/products" actions={headerActions} />

<div class="mx-auto max-w-md px-4 pt-2 space-y-5">
	<p class="text-sm text-[var(--color-text-muted)]">
		Add products one after another — the form clears and stays open so you can keep going. Tap "Done" when
		you're finished.
	</p>

	<ProductForm submitLabel="Add product" formError={form?.error} resetAfterSubmit onAdded={handleAdded} />

	{#if added.length > 0}
		<div class="border-t border-[var(--color-border)] pt-4">
			<h2 class="mb-2 px-1 text-sm font-medium text-[var(--color-text-muted)]">
				Added this session ({added.length})
			</h2>
			<div class="space-y-2">
				{#each added as product (product.id)}
					<Card href={`/shopping-list/products/${product.id}/edit`} class="flex items-center gap-2">
						<Icon name="check" size={16} class="text-[var(--color-success)] shrink-0" />
						<div class="min-w-0 flex-1">
							<span class="block truncate font-medium text-[var(--color-text)]">{product.name}</span>
							{#if product.brand}
								<p class="truncate text-xs text-[var(--color-text-muted)]">{product.brand}</p>
							{/if}
							<MacroBadge
								calories={product.calories}
								protein={product.protein}
								carbs={product.carbs}
								fat={product.fat}
								class="mt-0.5"
							/>
						</div>
					</Card>
				{/each}
			</div>
		</div>
	{/if}
</div>
