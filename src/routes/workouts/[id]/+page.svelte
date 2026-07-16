<script lang="ts">
	import { enhance } from '$app/forms';
	import PageHeader from '$lib/components/PageHeader.svelte';
	import Card from '$lib/components/Card.svelte';
	import Button from '$lib/components/Button.svelte';
	import Icon from '$lib/components/Icon.svelte';
	import TextField from '$lib/components/TextField.svelte';
	import TextareaField from '$lib/components/TextareaField.svelte';
	import EmptyState from '$lib/components/EmptyState.svelte';
	import SetRow from '$lib/components/workouts/SetRow.svelte';
	import QuickEntryRow from '$lib/components/workouts/QuickEntryRow.svelte';
	import ExercisePicker from '$lib/components/workouts/ExercisePicker.svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	type ExerciseOption = { id: number; name: string; brand: string | null; muscleGroup: string | null };
	type SetEntry = { id: number; exerciseId: number; reps: number; weight: number; rpe: number | null; notes: string | null };
	type Group = {
		exerciseId: number;
		exerciseName: string;
		exerciseBrand?: string | null;
		sets: SetEntry[];
		targetSets?: number | null;
	};

	let dateValue = $state(data.session.date);
	let notesValue = $state(data.session.notes ?? '');
	let sessionError = $state('');

	let pickerOpen = $state(false);
	// Exercises picked/created in this session before any set has been logged for them yet —
	// once a set is added, the exercise arrives via `data.exerciseGroups` and is de-duped out of here.
	let manuallyAdded = $state<ExerciseOption[]>([]);

	// Merge order: already-logged exercises, then this session's plan exercises not yet logged
	// (shown as ready-to-go placeholders with their target set count), then anything picked ad-hoc.
	const sessionExerciseList = $derived<Group[]>([
		...data.exerciseGroups,
		...data.planExercises
			.filter((p) => !data.exerciseGroups.some((g) => g.exerciseId === p.exerciseId))
			.map((p) => ({
				exerciseId: p.exerciseId,
				exerciseName: p.exerciseName,
				exerciseBrand: p.exerciseBrand,
				sets: [] as SetEntry[],
				targetSets: p.targetSets
			})),
		...manuallyAdded
			.filter((m) => !data.exerciseGroups.some((g) => g.exerciseId === m.id))
			.filter((m) => !data.planExercises.some((p) => p.exerciseId === m.id))
			.map((m) => ({ exerciseId: m.id, exerciseName: m.name, exerciseBrand: m.brand, sets: [] as SetEntry[] }))
	]);

	function handleExercisePicked(ex: ExerciseOption) {
		if (!manuallyAdded.some((m) => m.id === ex.id)) {
			manuallyAdded = [...manuallyAdded, ex];
		}
		pickerOpen = false;
	}

	function quickEntryDefaults(group: Group) {
		const lastInSession = group.sets[group.sets.length - 1];
		if (lastInSession) return { reps: lastInSession.reps, weight: lastInSession.weight };
		const lastHistoric = data.lastSetsByExercise[group.exerciseId]?.[0];
		if (lastHistoric) return { reps: lastHistoric.reps, weight: lastHistoric.weight };
		return { reps: 0, weight: 0 };
	}

	function formatDate(d: string) {
		const date = new Date(`${d}T00:00:00`);
		return date.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
	}
</script>

<svelte:head><title>{formatDate(data.session.date)} · Workout</title></svelte:head>

<PageHeader title={formatDate(data.session.date)} back="/workouts">
	{#snippet actions()}
		<form
			method="POST"
			action="?/deleteSession"
			use:enhance={({ cancel }) => {
				if (!confirm('Delete this workout session? This also deletes all logged sets in it.')) {
					cancel();
					return;
				}
			}}
		>
			<button
				type="submit"
				aria-label="Delete session"
				class="h-9 w-9 flex items-center justify-center rounded-full text-[var(--color-danger)] hover:bg-[var(--color-danger-soft)]"
			>
				<Icon name="trash" size={18} />
			</button>
		</form>
	{/snippet}
</PageHeader>

<div class="px-4 space-y-4">
	<Card>
		<form
			method="POST"
			action="?/updateSession"
			class="space-y-3"
			use:enhance={() => {
				sessionError = '';
				return async ({ result, update }) => {
					if (result.type === 'failure') {
						sessionError = (result.data?.error as string) ?? 'Could not save';
					}
					await update({ reset: false });
				};
			}}
		>
			<TextField label="Date" name="date" type="date" bind:value={dateValue} required />
			<TextareaField label="Notes" name="notes" placeholder="Optional notes…" bind:value={notesValue} rows={2} />
			{#if sessionError}
				<p class="text-sm text-[var(--color-danger)]">{sessionError}</p>
			{/if}
			<Button type="submit" variant="secondary">Save</Button>
		</form>
	</Card>

	{#if sessionExerciseList.length === 0}
		<EmptyState icon="dumbbell" title="No exercises yet" description="Add an exercise below to start logging sets." />
	{:else}
		<div class="space-y-4">
			{#each sessionExerciseList as group (group.exerciseId)}
				{@const defaults = quickEntryDefaults(group)}
				<Card>
					<div class="flex items-center justify-between mb-1">
						<div class="flex items-baseline gap-2 min-w-0">
							<h2 class="text-base font-medium text-[var(--color-text)] truncate">
								{group.exerciseName}{#if group.exerciseBrand}<span class="text-[var(--color-text-muted)]"> — {group.exerciseBrand}</span>{/if}
							</h2>
							{#if group.targetSets}
								<span class="text-xs text-[var(--color-text-muted)] shrink-0">Target: {group.targetSets} sets</span>
							{/if}
						</div>
						<a href={`/exercises/${group.exerciseId}`} class="text-xs text-[var(--color-accent)] shrink-0">Progress</a>
					</div>
					{#if group.sets.length > 0}
						<div class="divide-y divide-[var(--color-border)] mb-2">
							{#each group.sets as set, i (set.id)}
								<SetRow {set} index={i} />
							{/each}
						</div>
					{/if}
					<QuickEntryRow exerciseId={group.exerciseId} initialReps={defaults.reps} initialWeight={defaults.weight} />
				</Card>
			{/each}
		</div>
	{/if}

	<Button variant="secondary" full size="lg" onclick={() => (pickerOpen = true)}>
		<Icon name="plus" size={18} />
		Add exercise
	</Button>
</div>

<ExercisePicker bind:open={pickerOpen} exercises={data.allExercises} onselect={handleExercisePicked} />
