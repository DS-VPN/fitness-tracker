<script lang="ts">
	import { enhance } from '$app/forms';
	import PageHeader from '$lib/components/PageHeader.svelte';
	import Card from '$lib/components/Card.svelte';
	import Button from '$lib/components/Button.svelte';
	import Icon from '$lib/components/Icon.svelte';
	import EmptyState from '$lib/components/EmptyState.svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	function formatDate(d: string) {
		const date = new Date(`${d}T00:00:00`);
		return date.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
	}
</script>

<svelte:head><title>Workouts · Fitness Tracker</title></svelte:head>

<PageHeader title="Workouts">
	{#snippet actions()}
		<a
			href="/exercises"
			class="h-9 px-3 flex items-center gap-1.5 rounded-full text-sm font-medium text-[var(--color-text-muted)] hover:bg-[var(--color-surface-alt)]"
		>
			<Icon name="list" size={17} />
			Exercises
		</a>
	{/snippet}
</PageHeader>

<div class="px-4 space-y-4">
	<form method="POST" action="?/start" use:enhance>
		<Button type="submit" variant="primary" size="lg" full>
			<Icon name="plus" size={20} />
			Start workout
		</Button>
	</form>

	{#if data.sessions.length === 0}
		<EmptyState icon="dumbbell" title="No workouts yet" description="Start your first workout to begin logging sets." />
	{:else}
		<div class="space-y-3">
			{#each data.sessions as session (session.id)}
				<Card href={`/workouts/${session.id}`}>
					<div class="flex items-center justify-between">
						<p class="font-medium text-[var(--color-text)]">{formatDate(session.date)}</p>
						<Icon name="chevron-right" size={18} class="text-[var(--color-text-muted)]" />
					</div>
					<p class="text-sm text-[var(--color-text-muted)] mt-1">
						{session.exerciseCount} {session.exerciseCount === 1 ? 'exercise' : 'exercises'} &middot; {session.setCount}
						{session.setCount === 1 ? 'set' : 'sets'}
					</p>
					{#if session.notes}
						<p class="text-xs text-[var(--color-text-muted)] mt-1 truncate">{session.notes}</p>
					{/if}
				</Card>
			{/each}
		</div>
	{/if}
</div>
