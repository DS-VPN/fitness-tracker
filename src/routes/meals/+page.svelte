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
	import CategoryManageModal from '$lib/components/meals/CategoryManageModal.svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	let search = $state(data.q);
	let manageOpen = $state(false);

	function updateQuery(next: { q?: string; category?: number | null }) {
		const nextQ = next.q !== undefined ? next.q : data.q;
		const nextCategory = next.category !== undefined ? next.category : data.categoryId;

		const params = new URLSearchParams();
		if (nextQ) params.set('q', nextQ);
		if (nextCategory) params.set('category', String(nextCategory));

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
		goto('/meals', { keepFocus: true, replaceState: true, noScroll: true });
	}

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
	<Button variant="ghost" size="icon" onclick={() => (manageOpen = true)}>
		<Icon name="tag" size={20} />
		<span class="sr-only">Manage categories</span>
	</Button>
	<Button href="/meals/new" variant="primary" size="md">
		<Icon name="plus" size={18} />
		New
	</Button>
{/snippet}

<PageHeader title="Meals" actions={headerActions} />

<div class="mx-auto max-w-md px-4 pb-4">
	<TextField name="search" type="search" bind:value={search} placeholder="Search meals or brands" class="mb-3" />

	<div class="mb-4 flex gap-2 overflow-x-auto pb-1">
		<Chip selected={data.categoryId === null} onclick={() => selectCategory(null)}>All</Chip>
		{#each data.categories as c (c.id)}
			<Chip selected={data.categoryId === c.id} onclick={() => selectCategory(c.id)}>{c.name}</Chip>
		{/each}
	</div>

	{#if data.meals.length === 0}
		{#if !hasFilters}
			<EmptyState
				icon="meals"
				title="No meals yet"
				description="Add your first meal to start building your library."
			>
				<Button href="/meals/new" variant="primary">Add a meal</Button>
			</EmptyState>
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
							<Card href={`/meals/${meal.id}`}>
								<span class="block truncate font-medium text-[var(--color-text)]">{meal.name}</span>
								{#if meal.brand}
									<p class="truncate text-xs text-[var(--color-text-muted)]">{meal.brand}</p>
								{/if}
								<MacroBadge
									calories={meal.calories}
									protein={meal.protein}
									carbs={meal.carbs}
									fat={meal.fat}
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

<CategoryManageModal bind:open={manageOpen} categories={data.categories} />
