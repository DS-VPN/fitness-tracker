<script lang="ts">
	import { enhance } from '$app/forms';
	import { goto } from '$app/navigation';
	import PageHeader from '$lib/components/PageHeader.svelte';
	import EmptyState from '$lib/components/EmptyState.svelte';
	import Card from '$lib/components/Card.svelte';
	import Button from '$lib/components/Button.svelte';
	import Icon from '$lib/components/Icon.svelte';
	import Chip from '$lib/components/Chip.svelte';
	import TextField from '$lib/components/TextField.svelte';
	import HintCard from '$lib/components/HintCard.svelte';
	import ShoppingItemRow from '$lib/components/shopping/ShoppingItemRow.svelte';
	import ShareListModal from '$lib/components/shopping/ShareListModal.svelte';
	import type { PageData, ActionData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	let newName = $state('');
	let newBrand = $state('');
	let shareOpen = $state(false);

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

<svelte:head><title>Shopping list · Fitness Tracker</title></svelte:head>

<PageHeader title={data.isOwner ? 'Shopping list' : `${data.ownerUsername}'s list`}>
	{#snippet actions()}
		{#if data.isOwner}
			<Button href="/shopping-list/products" variant="ghost" size="icon">
				<Icon name="list" size={20} />
				<span class="sr-only">Manage products</span>
			</Button>
			<Button variant="ghost" size="md" onclick={() => (shareOpen = true)}>Share</Button>
		{:else}
			<form method="POST" action="?/leaveList" use:enhance={confirmSubmit('Leave this shared list?')}>
				<input type="hidden" name="ownerId" value={data.ownerId} />
				<Button type="submit" variant="ghost" size="md">Leave list</Button>
			</form>
		{/if}
		{#if hasChecked}
			<form method="POST" action="?/clearChecked" use:enhance={confirmSubmit('Clear all checked items?')}>
				<input type="hidden" name="ownerId" value={data.ownerId} />
				<Button type="submit" variant="ghost" size="md">Clear checked</Button>
			</form>
		{/if}
	{/snippet}
</PageHeader>

<div class="mx-auto max-w-md px-4 space-y-6">
	{#if data.isOwner}
		<HintCard id="shopping-intro" icon="cart">
			Ingredients you send from a meal stay grouped under <strong>From your meals</strong>.
			Add anything else below — or share the list and shop it together.
		</HintCard>
	{/if}

	{#if data.sharedWithMe.length > 0}
		<div class="flex gap-2 overflow-x-auto pb-1">
			<Chip selected={data.isOwner} onclick={() => goto('/shopping-list')}>Mine</Chip>
			{#each data.sharedWithMe as shared (shared.ownerId)}
				<Chip
					selected={data.ownerId === shared.ownerId}
					onclick={() => goto(`/shopping-list?owner=${shared.ownerId}`)}
				>
					{shared.ownerUsername}'s list
				</Chip>
			{/each}
		</div>
	{/if}

	{#if isEmpty}
		<EmptyState
			icon="cart"
			title="Your list is empty"
			description="Open any meal and tap “Add ingredients” — or jot something down below."
		>
			{#if data.isOwner}
				<Button href="/meals" variant="secondary">Browse meals</Button>
			{/if}
		</EmptyState>
	{:else}
		{#if data.fromMeals.length > 0}
			<section>
				<h2 class="section-label mb-2 px-1">From your meals</h2>
				<div class="space-y-2">
					{#each data.fromMeals as item (item.id)}
						<ShoppingItemRow {item} ownerId={data.ownerId} />
					{/each}
				</div>
			</section>
		{/if}

		{#if data.manual.length > 0}
			<section>
				<h2 class="section-label mb-2 px-1">Other items</h2>
				<div class="space-y-2">
					{#each data.manual as item (item.id)}
						<ShoppingItemRow {item} ownerId={data.ownerId} />
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
			<h2 class="section-label">Add an item</h2>
			<input type="hidden" name="ownerId" value={data.ownerId} />
			<TextField label="Name" name="name" placeholder="e.g. Oat milk" bind:value={newName} required />
			<TextField label="Brand (optional)" name="brand" placeholder="e.g. Oatly" bind:value={newBrand} />
			{#if form?.error}
				<p class="text-sm text-[var(--color-danger)]">{form.error}</p>
			{/if}
			<Button type="submit" variant="primary" size="md" full class="w-full">Add to list</Button>
		</form>
	</Card>
</div>

{#if data.isOwner}
	<ShareListModal bind:open={shareOpen} shares={data.myShares} />
{/if}
