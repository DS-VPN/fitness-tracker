<script lang="ts">
	import { enhance } from '$app/forms';
	import PageHeader from '$lib/components/PageHeader.svelte';
	import Card from '$lib/components/Card.svelte';
	import Button from '$lib/components/Button.svelte';
	import Icon from '$lib/components/Icon.svelte';
	import TextField from '$lib/components/TextField.svelte';
	import EmptyState from '$lib/components/EmptyState.svelte';
	import PlanExerciseRow from '$lib/components/workouts/PlanExerciseRow.svelte';
	import PlanExercisePicker from '$lib/components/workouts/PlanExercisePicker.svelte';
	import type { ActionData, PageData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	let nameValue = $state(data.plan.name);
	let nameError = $state('');
	let pickerOpen = $state(false);
</script>

<svelte:head><title>{data.plan.name} · Fitness Tracker</title></svelte:head>

{#snippet headerActions()}
	<form
		method="POST"
		action="?/delete"
		use:enhance={({ cancel }) => {
			if (!confirm(`Delete "${data.plan.name}"? This can't be undone.`)) cancel();
		}}
	>
		<button
			type="submit"
			aria-label="Delete plan"
			class="h-9 w-9 flex items-center justify-center rounded-full text-[var(--color-danger)] hover:bg-[var(--color-danger-soft)]"
		>
			<Icon name="trash" size={18} />
		</button>
	</form>
{/snippet}

<PageHeader title={data.plan.name} back="/workouts/plans" actions={headerActions} />

<div class="px-4 space-y-4">
	<Card>
		<form
			method="POST"
			action="?/rename"
			class="flex items-end gap-2"
			use:enhance={() => {
				nameError = '';
				return async ({ result, update }) => {
					if (result.type === 'failure') {
						nameError = (result.data?.error as string) ?? 'Could not save';
					}
					await update({ reset: false });
				};
			}}
		>
			<TextField label="Name" name="name" bind:value={nameValue} required class="flex-1" />
			<Button type="submit" variant="secondary">Save</Button>
		</form>
		{#if nameError}
			<p class="mt-2 text-sm text-[var(--color-danger)]">{nameError}</p>
		{/if}
	</Card>

	<div>
		<h2 class="mb-2 px-1 text-sm font-medium text-[var(--color-text-muted)]">Exercises</h2>
		{#if data.exercises.length === 0}
			<EmptyState icon="dumbbell" title="No exercises yet" description="Add exercises to build this plan." />
		{:else}
			<Card>
				<div class="divide-y divide-[var(--color-border)]">
					{#each data.exercises as exercise (exercise.id)}
						<PlanExerciseRow {exercise} />
					{/each}
				</div>
			</Card>
		{/if}
		<Button variant="secondary" full size="lg" class="mt-3 w-full" onclick={() => (pickerOpen = true)}>
			<Icon name="plus" size={18} />
			Add exercise
		</Button>
	</div>

	{#if data.exercises.length > 0}
		<form method="POST" action="?/startWorkout" use:enhance>
			<Button type="submit" variant="primary" size="lg" full class="w-full">
				<Icon name="dumbbell" size={20} />
				Start workout from this plan
			</Button>
		</form>
	{/if}

	{#if form?.error}
		<p class="text-sm text-[var(--color-danger)]">{form.error}</p>
	{/if}
</div>

<PlanExercisePicker bind:open={pickerOpen} exercises={data.allExercises} />
