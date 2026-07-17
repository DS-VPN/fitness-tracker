<script lang="ts">
	import { enhance } from '$app/forms';
	import PageHeader from '$lib/components/PageHeader.svelte';
	import Card from '$lib/components/Card.svelte';
	import Button from '$lib/components/Button.svelte';
	import Icon from '$lib/components/Icon.svelte';
	import EmptyState from '$lib/components/EmptyState.svelte';
	import ProgressRing from '$lib/components/nutrition/ProgressRing.svelte';
	import MacroBar from '$lib/components/nutrition/MacroBar.svelte';
	import LogFoodModal from '$lib/components/nutrition/LogFoodModal.svelte';
	import { shiftIsoDate } from '$lib/utils/isoDate';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	let logOpen = $state(false);

	const isToday = $derived(data.date === data.today);
	const prevDate = $derived(shiftIsoDate(data.date, -1));
	const nextDate = $derived(shiftIsoDate(data.date, 1));
	// Don't navigate into the future — the diary is for today and the past.
	const canGoNext = $derived(data.date < data.today);

	const kcalRemaining = $derived(
		data.targets ? Math.round(data.targets.calories - data.summary.calories) : 0
	);

	function dayLabel(date: string) {
		if (date === data.today) return 'Today';
		if (date === shiftIsoDate(data.today, -1)) return 'Yesterday';
		const [y, m, d] = date.split('-').map(Number);
		const dt = new Date(y, m - 1, d);
		return dt.toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' });
	}

	function fmtPortions(n: number) {
		return Number.isInteger(n) ? n : n;
	}
</script>

<svelte:head><title>{dayLabel(data.date)} · Food diary</title></svelte:head>

<PageHeader title="Food diary" back="/diary" />

<div class="mx-auto max-w-md px-4 pb-4 space-y-5">
	<!-- Day navigator -->
	<div class="flex items-center justify-between gap-2">
		<a
			href={`/diary/${prevDate}`}
			aria-label="Previous day"
			class="h-10 w-10 flex items-center justify-center rounded-full text-[var(--color-text-muted)] hover:bg-[var(--color-surface-alt)]"
		>
			<Icon name="chevron-left" size={22} />
		</a>
		<div class="text-center">
			<p class="font-medium text-[var(--color-text)]">{dayLabel(data.date)}</p>
			{#if !isToday}<p class="text-xs text-[var(--color-text-muted)]">{data.date}</p>{/if}
		</div>
		{#if canGoNext}
			<a
				href={`/diary/${nextDate}`}
				aria-label="Next day"
				class="h-10 w-10 flex items-center justify-center rounded-full text-[var(--color-text-muted)] hover:bg-[var(--color-surface-alt)]"
			>
				<Icon name="chevron-right" size={22} />
			</a>
		{:else}
			<span class="h-10 w-10" aria-hidden="true"></span>
		{/if}
	</div>

	<!-- Nutrition totals for the day -->
	<Card>
		<h2 class="mb-3 text-sm font-medium text-[var(--color-text-muted)]">Nutrition</h2>
		{#if data.targets}
			<div class="flex items-center gap-4">
				<div class="flex flex-col items-center gap-1">
					<ProgressRing value={data.summary.calories} target={data.targets.calories} />
					<p
						class={`text-xs ${kcalRemaining < 0 ? 'text-[var(--color-danger)]' : 'text-[var(--color-text-muted)]'}`}
					>
						{#if kcalRemaining >= 0}{kcalRemaining} kcal left{:else}{-kcalRemaining} kcal over{/if}
					</p>
				</div>
				<div class="flex-1 space-y-3 min-w-0">
					<MacroBar label="Protein" value={data.summary.protein} target={data.targets.protein} />
					<MacroBar label="Carbs" value={data.summary.carbs} target={data.targets.carbs} />
					<MacroBar label="Fat" value={data.summary.fat} target={data.targets.fat} />
				</div>
			</div>
		{:else}
			<p class="text-sm text-[var(--color-text)]">
				{Math.round(data.summary.calories)} kcal · {Math.round(data.summary.protein)}p
				{Math.round(data.summary.carbs)}c {Math.round(data.summary.fat)}f
			</p>
			<p class="mt-1 text-xs text-[var(--color-text-muted)]">Set daily targets on the home screen to see progress.</p>
		{/if}
	</Card>

	<Button variant="primary" size="lg" full class="w-full" onclick={() => (logOpen = true)}>
		<Icon name="plus" size={20} />
		{isToday ? 'Log food' : 'Add to this day'}
	</Button>

	<div>
		<h2 class="mb-2 px-1 text-sm font-medium text-[var(--color-text-muted)]">Entries</h2>
		{#if data.entries.length === 0}
			<EmptyState
				icon="meals"
				title="Nothing logged this day"
				description={isToday
					? 'Log a meal or product to start tracking today.'
					: 'Forgot to log something? Add it above — it counts toward this day.'}
			/>
		{:else}
			<Card padded={false} class="divide-y divide-[var(--color-border)]">
				{#each data.entries as entry (entry.id)}
					<div class="flex items-center gap-2 px-4 py-2.5">
						{#snippet entryBody()}
							<p class="truncate text-sm text-[var(--color-text)]">
								{entry.name}{#if entry.brand}<span class="text-[var(--color-text-muted)]"> · {entry.brand}</span>{/if}
							</p>
							<p class="text-xs text-[var(--color-text-muted)]">
								×{fmtPortions(entry.portions)} · {Math.round(entry.calories)} kcal · {Math.round(entry.protein)}p
								{Math.round(entry.carbs)}c {Math.round(entry.fat)}f
							</p>
						{/snippet}
						{#if entry.mealId}
							<a href={`/meals/${entry.mealId}`} class="flex-1 min-w-0">{@render entryBody()}</a>
						{:else}
							<div class="flex-1 min-w-0">{@render entryBody()}</div>
						{/if}
						<form method="POST" action="?/deleteLog" use:enhance>
							<input type="hidden" name="id" value={entry.id} />
							<button
								type="submit"
								aria-label={`Remove ${entry.name}`}
								class="h-8 w-8 flex items-center justify-center rounded-full text-[var(--color-text-muted)] hover:bg-[var(--color-danger-soft)] hover:text-[var(--color-danger)]"
							>
								<Icon name="x" size={16} />
							</button>
						</form>
					</div>
				{/each}
			</Card>
		{/if}
	</div>
</div>

<LogFoodModal bind:open={logOpen} meals={data.logMeals} products={data.logProducts} />
