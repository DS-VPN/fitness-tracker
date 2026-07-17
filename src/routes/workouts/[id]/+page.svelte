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
	import RestTimer from '$lib/components/workouts/RestTimer.svelte';
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
		restSeconds?: number | null;
		notes?: string | null;
	};

	let dateValue = $state(data.session.date);
	let notesValue = $state(data.session.notes ?? '');
	let sessionError = $state('');

	let pickerOpen = $state(false);
	// Exercises picked/created in this session before any set has been logged for them yet —
	// once a set is added, the exercise arrives via `data.exerciseGroups` and is de-duped out of here.
	let manuallyAdded = $state<ExerciseOption[]>([]);

	// Extra blank set rows requested beyond an exercise's target (or beyond the default single row),
	// client-only — once submitted they become real logged sets like anything else.
	let extraSlots = $state<Record<number, number>>({});

	// A session started from a plan never carries over last time's numbers — starts genuinely blank.
	const noPrefill = $derived(!!data.session.planId);

	// Plan-based sessions render in the plan's own order (a stable "where am I" sequence) rather than
	// reshuffling completed exercises to the front; non-plan sessions keep the original ordering.
	const sessionExerciseList = $derived<Group[]>(
		data.session.planId
			? [
					...data.planExercises.map((p) => {
						const logged = data.exerciseGroups.find((g) => g.exerciseId === p.exerciseId);
						return {
							exerciseId: p.exerciseId,
							exerciseName: p.exerciseName,
							exerciseBrand: p.exerciseBrand,
							sets: logged?.sets ?? [],
							targetSets: p.targetSets,
							restSeconds: p.restSeconds,
							notes: p.notes
						};
					}),
					...data.exerciseGroups.filter((g) => !data.planExercises.some((p) => p.exerciseId === g.exerciseId)),
					...manuallyAdded
						.filter((m) => !data.planExercises.some((p) => p.exerciseId === m.id))
						.filter((m) => !data.exerciseGroups.some((g) => g.exerciseId === m.id))
						.map((m) => ({ exerciseId: m.id, exerciseName: m.name, exerciseBrand: m.brand, sets: [] as SetEntry[] }))
				]
			: [
					...data.exerciseGroups,
					...manuallyAdded
						.filter((m) => !data.exerciseGroups.some((g) => g.exerciseId === m.id))
						.map((m) => ({ exerciseId: m.id, exerciseName: m.name, exerciseBrand: m.brand, sets: [] as SetEntry[] }))
				]
	);

	const totalTarget = $derived(sessionExerciseList.reduce((sum, g) => sum + (g.targetSets ?? 0), 0));
	const totalDone = $derived(
		sessionExerciseList.reduce((sum, g) => sum + Math.min(g.sets.length, g.targetSets ?? g.sets.length), 0)
	);
	const totalLogged = $derived(sessionExerciseList.reduce((sum, g) => sum + g.sets.length, 0));

	let restTarget = $state(90);
	let restKey = $state(0);
	let restStarted = $state(false);

	function startRest(seconds: number) {
		restTarget = seconds;
		restKey += 1;
		restStarted = true;
	}

	function handleExercisePicked(ex: ExerciseOption) {
		if (!manuallyAdded.some((m) => m.id === ex.id)) {
			manuallyAdded = [...manuallyAdded, ex];
		}
		pickerOpen = false;
	}

	function remainingSlotCount(group: Group) {
		const base = Math.max(0, (group.targetSets ?? 1) - group.sets.length);
		return base + (extraSlots[group.exerciseId] ?? 0);
	}

	function addExtraSlot(exerciseId: number) {
		extraSlots = { ...extraSlots, [exerciseId]: (extraSlots[exerciseId] ?? 0) + 1 };
	}

	function slotDefaults(group: Group, slotIndex: number) {
		if (noPrefill || slotIndex > 0) return { reps: 0, weight: 0 };
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

<div class="mx-auto max-w-md px-4 space-y-4">
	{#if restStarted}
		{#key restKey}
			<RestTimer targetSeconds={restTarget} />
		{/key}
	{/if}

	{#if sessionExerciseList.length > 0}
		<p class="px-1 text-sm text-[var(--color-text-muted)]">
			{#if totalTarget > 0}
				{totalDone} of {totalTarget} sets
			{:else}
				{totalLogged} {totalLogged === 1 ? 'set' : 'sets'} logged
			{/if}
		</p>
	{/if}

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
				{@const complete = !!group.targetSets && group.sets.length >= group.targetSets}
				{@const goal = data.goalsByExercise[group.exerciseId]}
				<Card>
					<div class="flex items-center justify-between mb-1">
						<div class="flex items-baseline gap-2 min-w-0">
							<h2 class="text-base font-medium text-[var(--color-text)] truncate">
								{group.exerciseName}{#if group.exerciseBrand}<span class="text-[var(--color-text-muted)]"> — {group.exerciseBrand}</span>{/if}
							</h2>
						</div>
						<a href={`/exercises/${group.exerciseId}`} class="text-xs text-[var(--color-accent)] shrink-0">Progress</a>
					</div>

					{#if group.targetSets || goal}
						<p class="text-xs mb-1.5 flex flex-wrap gap-x-3 gap-y-0.5">
							{#if group.targetSets}
								<span class={complete ? 'text-[var(--color-success)] font-medium' : 'text-[var(--color-text-muted)]'}>
									{#if complete}&check;&nbsp;{/if}{group.sets.length}/{group.targetSets} sets
								</span>
							{/if}
							{#if goal}
								<span class="inline-flex items-center gap-1 text-[var(--color-accent)]">
									<Icon name="target" size={12} />
									Goal: {goal.targetWeight} kg &times; {goal.targetReps}
								</span>
							{/if}
						</p>
					{/if}
					{#if group.notes}
						<p class="text-xs text-[var(--color-text-muted)] italic mb-2">"{group.notes}"</p>
					{/if}

					{#if group.sets.length > 0}
						<div class="divide-y divide-[var(--color-border)] mb-2">
							{#each group.sets as set, i (set.id)}
								<SetRow
									{set}
									index={i}
									meetsGoal={!!goal && set.weight >= goal.targetWeight && set.reps >= goal.targetReps}
								/>
							{/each}
						</div>
					{/if}

					<div class="space-y-2">
						{#each Array.from({ length: remainingSlotCount(group) }) as _, i (i)}
							{@const defaults = slotDefaults(group, i)}
							<QuickEntryRow
								exerciseId={group.exerciseId}
								label={`Set ${group.sets.length + i + 1}`}
								initialReps={defaults.reps}
								initialWeight={defaults.weight}
								onLogged={() => startRest(group.restSeconds ?? 90)}
							/>
						{/each}
					</div>

					<button
						type="button"
						onclick={() => addExtraSlot(group.exerciseId)}
						class="mt-2 text-xs text-[var(--color-accent)]"
					>
						+ Add another set
					</button>
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
