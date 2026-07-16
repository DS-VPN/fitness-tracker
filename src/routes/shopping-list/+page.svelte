<script lang="ts">
	import { enhance } from '$app/forms';
	import PageHeader from '$lib/components/PageHeader.svelte';
	import EmptyState from '$lib/components/EmptyState.svelte';
	import Card from '$lib/components/Card.svelte';
	import Button from '$lib/components/Button.svelte';
	import TextField from '$lib/components/TextField.svelte';
	import ShoppingItemRow from '$lib/components/shopping/ShoppingItemRow.svelte';
	import type { PageData, ActionData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	let newName = $state('');
	let newBrand = $state('');

	const isEmpty = $derived(data.fromMeals.length === 0 && data.manual.length === 0);
	const hasChecked = $derived(
		data.fromMeals.some((item) => item.checked) || data.manual.some((item) => item.checked)
	);

	function confirmSubmit(message: string) {
		return ({ cancel }: { cancel: () => void }) => {
			if (!confirm(message)) cancel();
		};
	}
</script>

<svelte:head><title>Shopping List · Fitness Tracker</title></svelte:head>

<PageHeader title="Shopping List">
	{#snippet actions()}
		{#if hasChecked}
			<form method="POST" action="?/clearChecked" use:enhance={confirmSubmit('Clear all checked items?')}>
				<Button type="submit" variant="ghost" size="md">Clear checked</Button>
			</form>
		{/if}
	{/snippet}
</PageHeader>

<div class="px-4 space-y-6">
	{#if isEmpty}
		<EmptyState
			icon="cart"
			title="Your list is empty"
			description="Add items from a meal, or add one below."
		/>
	{:else}
		{#if data.fromMeals.length > 0}
			<section>
				<h2 class="text-sm font-medium text-[var(--color-text-muted)] mb-2 px-1">From your meals</h2>
				<div class="space-y-2">
					{#each data.fromMeals as item (item.id)}
						<ShoppingItemRow {item} />
					{/each}
				</div>
			</section>
		{/if}

		{#if data.manual.length > 0}
			<section>
				<h2 class="text-sm font-medium text-[var(--color-text-muted)] mb-2 px-1">Other items</h2>
				<div class="space-y-2">
					{#each data.manual as item (item.id)}
						<ShoppingItemRow {item} />
					{/each}
				</div>
			</section>
		{/if}
	{/if}

	<Card>
		<form
			method="POST"
			action="?/addManualItem"
			class="space-y-3"
			use:enhance={() => {
				return async ({ result, update }) => {
					if (result.type === 'success') {
						newName = '';
						newBrand = '';
					}
					await update();
				};
			}}
		>
			<h2 class="text-sm font-medium text-[var(--color-text)]">Add item</h2>
			<TextField label="Name" name="name" placeholder="e.g. Oat milk" bind:value={newName} required />
			<TextField label="Brand (optional)" name="brand" placeholder="e.g. Oatly" bind:value={newBrand} />
			{#if form?.error}
				<p class="text-sm text-[var(--color-danger)]">{form.error}</p>
			{/if}
			<Button type="submit" variant="primary" size="md" full class="w-full">Add to list</Button>
		</form>
	</Card>
</div>
