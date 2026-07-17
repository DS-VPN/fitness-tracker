<script lang="ts">
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import PageHeader from '$lib/components/PageHeader.svelte';
	import ProductForm from '$lib/components/shopping/ProductForm.svelte';
	import BarcodeScanner from '$lib/components/BarcodeScanner.svelte';
	import Card from '$lib/components/Card.svelte';
	import Button from '$lib/components/Button.svelte';
	import Icon from '$lib/components/Icon.svelte';
	import MacroBadge from '$lib/components/MacroBadge.svelte';
	import type { ActionData } from './$types';

	let { form }: { form: ActionData } = $props();

	type AddedProduct = { id: number; name: string; brand: string | null; calories: number; protein: number; carbs: number; fat: number };

	let added = $state<AddedProduct[]>([]);
	let scanOpen = $state(false);
	let scanBusy = $state(false);
	let scanMessage = $state('');

	function handleAdded(product: unknown) {
		if (product && typeof product === 'object' && 'id' in product) {
			added = [product as AddedProduct, ...added];
		}
	}

	// Scan/lookup results arrive as querystring params so the form re-seeds via a plain navigation —
	// the same wiring lets the home screen's Log-food modal hand off an unknown barcode to this page.
	const prefill = $derived.by(() => {
		const q = page.url.searchParams;
		if (!q.has('barcode') && !q.has('name')) return undefined;
		const num = (key: string) => {
			const v = Number(q.get(key));
			return Number.isFinite(v) && q.get(key) !== null ? v : 0;
		};
		return {
			barcode: q.get('barcode'),
			name: q.get('name') ?? '',
			brand: q.get('brand'),
			amount: q.has('amount') ? num('amount') : 100,
			unit: q.get('unit') ?? 'g',
			calories: num('calories'),
			protein: num('protein'),
			carbs: num('carbs'),
			fat: num('fat')
		};
	});

	async function handleScan(code: string) {
		scanBusy = true;
		scanMessage = '';
		try {
			const res = await fetch(`/api/barcode/${code}`);
			if (!res.ok) throw new Error('Lookup failed');
			const data = await res.json();
			if (data.source === 'local') {
				scanMessage = `Already saved as "${data.product.name}" — opening it.`;
				await goto(`/shopping-list/products/${data.product.id}/edit`);
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
				scanMessage = 'Found it — check the numbers before saving (community data can be off).';
				await goto(`/shopping-list/products/new?${params}`, { noScroll: true });
			} else if (data.source === 'none') {
				scanMessage = 'Not in the food database — fill it in once and future scans will find it.';
				await goto(`/shopping-list/products/new?barcode=${data.barcode}`, { noScroll: true });
			} else {
				scanMessage = 'Lookup service unreachable — try again, or fill the product in manually.';
			}
		} catch {
			scanMessage = 'Barcode lookup failed — try again, or fill the product in manually.';
		} finally {
			scanBusy = false;
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

	<Button variant="secondary" full class="w-full" onclick={() => (scanOpen = true)} disabled={scanBusy}>
		<Icon name="scan" size={18} />
		{scanBusy ? 'Looking up…' : 'Scan barcode'}
	</Button>
	{#if scanMessage}
		<p class="text-sm text-[var(--color-text-muted)]">{scanMessage}</p>
	{/if}

	{#key page.url.search}
		<ProductForm submitLabel="Add product" formError={form?.error} initial={prefill} resetAfterSubmit onAdded={handleAdded} />
	{/key}

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

<BarcodeScanner bind:open={scanOpen} onscan={handleScan} />
