<script lang="ts">
	import { goto } from '$app/navigation';
	import PageHeader from '$lib/components/PageHeader.svelte';
	import Card from '$lib/components/Card.svelte';
	import Chip from '$lib/components/Chip.svelte';
	import Button from '$lib/components/Button.svelte';
	import Icon from '$lib/components/Icon.svelte';
	import MacroBadge from '$lib/components/MacroBadge.svelte';
	import EmptyState from '$lib/components/EmptyState.svelte';
	import TextField from '$lib/components/TextField.svelte';
	import HintCard from '$lib/components/HintCard.svelte';
	import CategoryManageModal from '$lib/components/meals/CategoryManageModal.svelte';
	import ShareMealsModal from '$lib/components/meals/ShareMealsModal.svelte';
	import { enhance } from '$app/forms';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	let search = $state(data.q);
	let manageOpen = $state(false);
	let shareOpen = $state(false);

	// Preserve the owner context (whose library you're browsing) across search/filter navigation.
	function ownerSuffix(params: URLSearchParams) {
		if (!data.isOwner) params.set('owner', String(data.ownerId));
	}

	function updateQuery(next: { q?: string; category?: number | null }) {
		const nextQ = next.q !== undefined ? next.q : data.q;
		const nextCategory = next.category !== undefined ? next.category : data.categoryId;

		const params = new URLSearchParams();
		if (nextQ) params.set('q', nextQ);
		if (nextCategory) params.set('category', String(nextCategory));
		ownerSuffix(params);

		const qs = params.toString();
		goto(qs ? `/meals?${qs}` : '/meals', { keepFocus: true, replaceState: true, noScroll: true });
	}

	let debounceHandle: ReturnType<typeof setTimeout> | undefined;
	let skipNextDebounce = true;
	$effect(() => {
		const value = search;
		if (skipNextDebounce) {
			skipNextDebounce = false;
			return;
		}
		clearTimeout(debounceHandle);
		debounceHandle = setTimeout(() => updateQuery({ q: value }), 300);
		return () => clearTimeout(debounceHandle);
	});

	function selectCategory(id: number | null) {
		updateQuery({ category: id });
	}

	function clearFilters() {
		skipNextDebounce = true;
		search = '';
		const params = new URLSearchParams();
		ownerSuffix(params);
		const qs = params.toString();
		goto(qs ? `/meals?${qs}` : '/meals', { keepFocus: true, replaceState: true, noScroll: true });
	}

	const mealHref = $derived((id: number) =>
		data.isOwner ? `/meals/${id}` : `/meals/${id}?owner=${data.ownerId}`
	);

	const grouped = $derived.by(() => {
		const byCategory = new Map<number, typeof data.meals>();
		const uncategorized: typeof data.meals = [];

		for (const meal of data.meals) {
			if (meal.categories.length === 0) {
				uncategorized.push(meal);
				continue;
			}
			for (const c of meal.categories) {
				const list = byCategory.get(c.id) ?? [];
				list.push(meal);
				byCategory.set(c.id, list);
			}
		}

		const groups: { key: string; name: string; meals: typeof data.meals }[] = [];
		for (const c of data.categories) {
			const list = byCategory.get(c.id);
			if (list?.length) groups.push({ key: String(c.id), name: c.name, meals: list });
		}
		if (uncategorized.length) groups.push({ key: 'uncategorized', name: 'Uncategorized', meals: uncategorized });
		return groups;
	});

	const hasFilters = $derived(!!data.q || data.categoryId !== null);
</script>

<svelte:head><title>Meals · Fitness Tracker</title></svelte:head>

{#snippet headerActions()}
	{#if data.isOwner}
		<Button variant="ghost" size="md" onclick={() => (manageOpen = true)}>
			<Icon name="tag" size={17} />
			Categories
		</Button>
		<Button variant="ghost" size="md" onclick={() => (shareOpen = true)}>Share</Button>
		<Button href="/meals/new" variant="primary" size="md">
			<Icon name="plus" size={18} />
			New
		</Button>
	{:else}
		<form method="POST" action="?/leaveMeals" use:enhance={() => async ({ update }) => { await update(); goto('/meals'); }}>
			<input type="hidden" name="ownerId" value={data.ownerId} />
			<Button type="submit" variant="ghost" size="md">Leave</Button>
		</form>
	{/if}
{/snippet}

<PageHeader title={data.isOwner ? 'Meals' : `${data.ownerUsername}'s meals`} actions={headerActions} />

<div class="mx-auto max-w-md px-4 pb-4">
	{#if data.isOwner}
		<HintCard id="meals-intro" icon="meals">
			Meals are your food library. Build one from ingredients, then <strong>log it to Today</strong>
			to fill your targets or <strong>send its ingredients to your shopping list</strong>. Tap
			<strong>Share</strong> to let a friend see your recipes.
		</HintCard>
	{:else}
		<HintCard id="meals-shared-intro" icon="meals">
			You're viewing <strong>{data.ownerUsername}'s</strong> shared meals. You can log them to your
			day and add their ingredients to your shopping list, but only {data.ownerUsername} can edit them.
		</HintCard>
	{/if}

	{#if data.sharedWithMe.length > 0}
		<div class="mt-3 flex gap-2 overflow-x-auto pb-1">
			<Chip selected={data.isOwner} onclick={() => goto('/meals')}>Mine</Chip>
			{#each data.sharedWithMe as shared (shared.ownerId)}
				<Chip
					selected={!data.isOwner && data.ownerId === shared.ownerId}
					onclick={() => goto(`/meals?owner=${shared.ownerId}`)}
				>
					{shared.ownerUsername}'s meals
				</Chip>
			{/each}
		</div>
	{/if}

	<TextField name="search" type="search" bind:value={search} placeholder="Search meals or brands" class="mt-3 mb-3" />

	<div class="mb-4 flex gap-2 overflow-x-auto pb-1">
		<Chip selected={data.categoryId === null} onclick={() => selectCategory(null)}>All</Chip>
		{#each data.categories as c (c.id)}
			<Chip selected={data.categoryId === c.id} onclick={() => selectCategory(c.id)}>{c.name}</Chip>
		{/each}
	</div>

	{#if data.meals.length === 0}
		{#if !hasFilters}
			{#if data.isOwner}
				<EmptyState
					icon="meals"
					title="No meals yet"
					description="Build your first meal from ingredients — then log it to your day or send it to your shopping list."
				>
					<Button href="/meals/new" variant="primary">Add a meal</Button>
				</EmptyState>
			{:else}
				<EmptyState
					icon="meals"
					title="No shared meals"
					description="{data.ownerUsername} hasn't shared any meals here yet."
				/>
			{/if}
		{:else}
			<div class="py-10 text-center">
				<p class="mb-3 text-sm text-[var(--color-text-muted)]">No meals match your search or filter.</p>
				<Button variant="secondary" onclick={clearFilters}>Clear filters</Button>
			</div>
		{/if}
	{:else}
		<div class="space-y-6">
			{#each grouped as group (group.key)}
				<section>
					<h2 class="mb-2 px-1 text-xs font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">
						{group.name}
					</h2>
					<div class="space-y-2">
						{#each group.meals as meal (meal.id)}
							<Card href={mealHref(meal.id)}>
								<span class="block truncate font-medium text-[var(--color-text)]">{meal.name}</span>
								{#if meal.brand}
									<p class="truncate text-xs text-[var(--color-text-muted)]">{meal.brand}</p>
								{/if}
								<MacroBadge
									calories={meal.totalMacros.calories}
									protein={meal.totalMacros.protein}
									carbs={meal.totalMacros.carbs}
									fat={meal.totalMacros.fat}
									class="mt-1"
								/>
							</Card>
						{/each}
					</div>
				</section>
			{/each}
		</div>
	{/if}
</div>

{#if data.isOwner}
	<CategoryManageModal bind:open={manageOpen} categories={data.categories} />
	<ShareMealsModal bind:open={shareOpen} shares={data.myShares} categories={data.categories} />
{/if}
