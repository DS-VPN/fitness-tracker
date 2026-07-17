<script lang="ts">
	import { enhance } from '$app/forms';
	import PageHeader from '$lib/components/PageHeader.svelte';
	import Card from '$lib/components/Card.svelte';
	import StatCard from '$lib/components/StatCard.svelte';
	import EmptyState from '$lib/components/EmptyState.svelte';
	import Button from '$lib/components/Button.svelte';
	import Icon from '$lib/components/Icon.svelte';
	import NumberField from '$lib/components/NumberField.svelte';
	import ProgressChart from '$lib/components/workouts/ProgressChart.svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
	const progress = $derived(data.progress);
	const sessionsDesc = $derived([...progress.history].reverse());

	let editingGoal = $state(false);
	let goalWeight = $state<number | null>(data.goal?.targetWeight ?? null);
	let goalReps = $state<number | null>(data.goal?.targetReps ?? null);
	let goalError = $state('');

	function startGoalEdit() {
		goalWeight = data.goal?.targetWeight ?? null;
		goalReps = data.goal?.targetReps ?? null;
		goalError = '';
		editingGoal = true;
	}

	// Best qualifying set (heaviest at or above the rep target), computed from the already-loaded history.
	const bestQualifying = $derived.by(() => {
		if (!data.goal) return null;
		let best: { weight: number; reps: number } | null = null;
		for (const session of progress.history) {
			for (const set of session.sets) {
				if (set.reps >= data.goal.targetReps && (!best || set.weight > best.weight)) {
					best = { weight: set.weight, reps: set.reps };
				}
			}
		}
		return best;
	});
	const goalPct = $derived(
		data.goal && bestQualifying ? Math.min(bestQualifying.weight / data.goal.targetWeight, 1) : 0
	);
	const goalAchieved = $derived(!!data.goal && !!bestQualifying && bestQualifying.weight >= data.goal.targetWeight);

	function formatDate(d: string) {
		const date = new Date(`${d}T00:00:00`);
		return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
	}

	// No rounding — weights are stored and shown at whatever precision the user actually entered.
	function fmtNum(n: number) {
		return String(n);
	}
</script>

<svelte:head><title>{progress.exercise.name} · Exercises</title></svelte:head>

<PageHeader
	title={progress.exercise.brand ? `${progress.exercise.name} — ${progress.exercise.brand}` : progress.exercise.name}
	back="/exercises"
/>

<div class="px-4 space-y-4">
	<Card>
		<div class="flex items-center justify-between mb-1">
			<h2 class="text-sm font-medium text-[var(--color-text)] flex items-center gap-1.5">
				<Icon name="target" size={16} class="text-[var(--color-accent)]" />
				Goal
			</h2>
			{#if data.goal && !editingGoal}
				<div class="flex items-center gap-1">
					<button
						type="button"
						aria-label="Edit goal"
						onclick={startGoalEdit}
						class="h-8 w-8 flex items-center justify-center rounded-full text-[var(--color-text-muted)] hover:bg-[var(--color-surface-alt)]"
					>
						<Icon name="edit" size={15} />
					</button>
					<form
						method="POST"
						action="?/deleteGoal"
						use:enhance={({ cancel }) => {
							if (!confirm('Remove this goal?')) cancel();
						}}
					>
						<button
							type="submit"
							aria-label="Remove goal"
							class="h-8 w-8 flex items-center justify-center rounded-full text-[var(--color-danger)] hover:bg-[var(--color-danger-soft)]"
						>
							<Icon name="trash" size={15} />
						</button>
					</form>
				</div>
			{/if}
		</div>

		{#if editingGoal || !data.goal}
			<form
				method="POST"
				action="?/saveGoal"
				class="space-y-3"
				use:enhance={() => {
					goalError = '';
					return async ({ result, update }) => {
						if (result.type === 'success') {
							editingGoal = false;
						} else if (result.type === 'failure') {
							goalError = (result.data?.error as string) ?? 'Could not save goal';
						}
						await update({ reset: false });
					};
				}}
			>
				<div class="grid grid-cols-2 gap-3">
					<NumberField label="Target weight" name="targetWeight" bind:value={goalWeight} suffix="kg" decimalText required />
					<NumberField label="Target reps" name="targetReps" bind:value={goalReps} min={1} step={1} required />
				</div>
				{#if goalError}
					<p class="text-sm text-[var(--color-danger)]">{goalError}</p>
				{/if}
				<div class="flex gap-2 justify-end">
					{#if data.goal}
						<Button type="button" variant="ghost" onclick={() => (editingGoal = false)}>Cancel</Button>
					{/if}
					<Button type="submit" variant="primary">{data.goal ? 'Save goal' : 'Set goal'}</Button>
				</div>
			</form>
		{:else}
			<p class="text-base font-medium text-[var(--color-text)] mb-1">
				{fmtNum(data.goal.targetWeight)} kg &times; {data.goal.targetReps}
				{#if goalAchieved}
					<span class="ml-1 text-sm text-[var(--color-success)]">✓ achieved</span>
				{/if}
			</p>
			<p class="text-xs text-[var(--color-text-muted)] mb-2">
				{#if bestQualifying}
					Best at ≥{data.goal.targetReps} reps: {fmtNum(bestQualifying.weight)} kg × {bestQualifying.reps}
					({Math.round(goalPct * 100)}%)
				{:else}
					No set at ≥{data.goal.targetReps} reps yet
				{/if}
			</p>
			<div class="h-1.5 rounded-full bg-[var(--color-surface-alt)] overflow-hidden">
				<div
					class={`h-full rounded-full ${goalAchieved ? 'bg-[var(--color-success)]' : 'bg-[var(--color-accent)]'}`}
					style={`width:${goalPct * 100}%`}
				></div>
			</div>
		{/if}
	</Card>

	{#if !progress.hasData}
		<EmptyState
			icon="dumbbell"
			title="No sets logged yet"
			description="Log sets for this exercise in a workout to see your progress here."
		/>
	{:else}
		<div class="grid grid-cols-3 gap-3">
			<StatCard label="Heaviest" value={fmtNum(progress.prs.heaviestWeight)} unit="kg" />
			<StatCard label="Most reps" value={progress.prs.mostReps} />
			<StatCard label="Est. 1RM" value={fmtNum(progress.prs.estimatedOneRm)} unit="kg" />
		</div>

		<Card>
			<h2 class="text-sm font-medium text-[var(--color-text-muted)] mb-3">Top weight over time</h2>
			<ProgressChart history={progress.history} />
		</Card>

		<div class="space-y-3">
			<h2 class="text-sm font-medium text-[var(--color-text-muted)] px-1">History</h2>
			{#each sessionsDesc as session (session.sessionId)}
				<Card>
					<div class="flex items-center justify-between mb-2">
						<a
							href={`/workouts/${session.sessionId}`}
							class="text-sm font-medium text-[var(--color-text)] hover:text-[var(--color-accent)]"
						>
							{formatDate(session.date)}
						</a>
						<span class="text-xs text-[var(--color-text-muted)]">Top {fmtNum(session.topWeight)} kg</span>
					</div>
					<div class="flex flex-wrap gap-1.5">
						{#each session.sets as set, i (i)}
							<span
								class="inline-flex items-center px-2 py-1 rounded-[var(--radius-sm)] bg-[var(--color-surface-alt)] text-xs text-[var(--color-text)]"
							>
								{set.reps} &times; {fmtNum(set.weight)} kg
							</span>
						{/each}
					</div>
				</Card>
			{/each}
		</div>
	{/if}
</div>
