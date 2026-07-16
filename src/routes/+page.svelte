<script lang="ts">
	import { enhance } from '$app/forms';
	import Card from '$lib/components/Card.svelte';
	import Button from '$lib/components/Button.svelte';
	import Icon from '$lib/components/Icon.svelte';
	import MacroBadge from '$lib/components/MacroBadge.svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	let justAdded = $state<Set<number>>(new Set());
	const timeouts = new Map<number, ReturnType<typeof setTimeout>>();

	function flash(mealId: number) {
		justAdded = new Set(justAdded).add(mealId);
		clearTimeout(timeouts.get(mealId));
		timeouts.set(
			mealId,
			setTimeout(() => {
				const next = new Set(justAdded);
				next.delete(mealId);
				justAdded = next;
			}, 1500)
		);
	}

	function formatDate(d: string) {
		const date = new Date(`${d}T00:00:00`);
		return date.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
	}
</script>

<svelte:head><title>Fitness Tracker</title></svelte:head>

<div class="mx-auto max-w-md px-4 pt-[calc(1.25rem+env(safe-area-inset-top))] pb-4 space-y-5">
	<div class="flex items-center justify-between">
		<div>
			<p class="text-sm text-[var(--color-text-muted)]">Welcome back</p>
			<h1 class="text-2xl text-[var(--color-text)]">Fitness Tracker</h1>
		</div>
		<form method="POST" action="/logout">
			<button
				type="submit"
				aria-label="Sign out"
				class="h-10 w-10 flex items-center justify-center rounded-full text-[var(--color-text-muted)] hover:bg-[var(--color-surface-alt)]"
			>
				<Icon name="logout" size={20} />
			</button>
		</form>
	</div>

	<form method="POST" action="/workouts?/start" use:enhance>
		<Button type="submit" variant="primary" size="lg" full class="w-full">
			<Icon name="dumbbell" size={20} />
			Start workout
		</Button>
	</form>

	<div class="grid grid-cols-2 gap-3">
		<Card href="/shopping-list" class="flex flex-col gap-1">
			<Icon name="cart" size={20} class="text-[var(--color-accent)]" />
			<span class="text-lg font-medium text-[var(--color-text)]">{data.shoppingCount}</span>
			<span class="text-xs text-[var(--color-text-muted)]"
				>{data.shoppingCount === 1 ? 'item to buy' : 'items to buy'}</span
			>
		</Card>
		{#if data.lastSession}
			<Card href={`/workouts/${data.lastSession.id}`} class="flex flex-col gap-1">
				<Icon name="chart" size={20} class="text-[var(--color-accent)]" />
				<span class="text-sm font-medium text-[var(--color-text)]">{formatDate(data.lastSession.date)}</span>
				<span class="text-xs text-[var(--color-text-muted)]">Last workout</span>
			</Card>
		{:else}
			<Card href="/workouts" class="flex flex-col gap-1 justify-center">
				<span class="text-sm text-[var(--color-text-muted)]">No workouts logged yet</span>
			</Card>
		{/if}
	</div>

	<div>
		<div class="flex items-center justify-between mb-2 px-1">
			<h2 class="text-sm font-medium text-[var(--color-text-muted)]">Quick add to shopping list</h2>
			<a href="/meals" class="text-xs text-[var(--color-accent)]">View all</a>
		</div>

		{#if data.recentMeals.length === 0}
			<Card class="text-center py-6">
				<p class="text-sm text-[var(--color-text-muted)] mb-3">No meals yet.</p>
				<Button href="/meals/new" variant="secondary">Add your first meal</Button>
			</Card>
		{:else}
			<div class="space-y-2">
				{#each data.recentMeals as meal (meal.id)}
					<Card class="flex items-center gap-3">
						<a href={`/meals/${meal.id}`} class="flex-1 min-w-0">
							<p class="font-medium text-[var(--color-text)] truncate">{meal.name}</p>
							<MacroBadge calories={meal.calories} protein={meal.protein} carbs={meal.carbs} fat={meal.fat} />
						</a>
						<form
							method="POST"
							action="?/quickAdd"
							use:enhance={() => {
								return async ({ result, update }) => {
									if (result.type === 'success') flash(meal.id);
									await update({ reset: false });
								};
							}}
						>
							<input type="hidden" name="mealId" value={meal.id} />
							<button
								type="submit"
								aria-label={`Add ${meal.name} to shopping list`}
								class={`h-10 w-10 shrink-0 flex items-center justify-center rounded-full transition-colors ${
									justAdded.has(meal.id)
										? 'bg-[var(--color-success)] text-white'
										: 'bg-[var(--color-accent-soft)] text-[var(--color-accent)] hover:brightness-95'
								}`}
							>
								<Icon name={justAdded.has(meal.id) ? 'check' : 'plus'} size={18} />
							</button>
						</form>
					</Card>
				{/each}
			</div>
		{/if}
	</div>
</div>
