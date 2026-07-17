<script lang="ts">
	import PageHeader from '$lib/components/PageHeader.svelte';
	import Card from '$lib/components/Card.svelte';
	import Button from '$lib/components/Button.svelte';
	import Icon from '$lib/components/Icon.svelte';
	import EmptyState from '$lib/components/EmptyState.svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
</script>

<svelte:head><title>Plans · Fitness Tracker</title></svelte:head>

{#snippet headerActions()}
	<Button href="/workouts/plans/new" variant="primary" size="md">
		<Icon name="plus" size={18} />
		New
	</Button>
{/snippet}

<PageHeader title="Plans" back="/workouts" actions={headerActions} />

<div class="mx-auto max-w-md px-4 space-y-3">
	{#if data.plans.length === 0}
		<EmptyState
			icon="dumbbell"
			title="No plans yet"
			description="Create a plan to group exercises together, then start a workout from it whenever you want to follow it."
		>
			<Button href="/workouts/plans/new" variant="primary">Create a plan</Button>
		</EmptyState>
	{:else}
		{#each data.plans as plan (plan.id)}
			<Card href={`/workouts/plans/${plan.id}`}>
				<div class="flex items-center justify-between">
					<p class="font-medium text-[var(--color-text)]">{plan.name}</p>
					<Icon name="chevron-right" size={18} class="text-[var(--color-text-muted)]" />
				</div>
				<p class="text-sm text-[var(--color-text-muted)] mt-1">
					{plan.exerciseCount} {plan.exerciseCount === 1 ? 'exercise' : 'exercises'}
				</p>
			</Card>
		{/each}
	{/if}
</div>
