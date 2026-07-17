<script lang="ts">
	import PageHeader from '$lib/components/PageHeader.svelte';
	import Card from '$lib/components/Card.svelte';
	import StatCard from '$lib/components/StatCard.svelte';
	import EmptyState from '$lib/components/EmptyState.svelte';
	import ProgressChart from '$lib/components/workouts/ProgressChart.svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
	const progress = $derived(data.progress);
	const sessionsDesc = $derived([...progress.history].reverse());

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
