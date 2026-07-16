<script lang="ts">
	import { enhance } from '$app/forms';
	import NumberField from '$lib/components/NumberField.svelte';
	import TextareaField from '$lib/components/TextareaField.svelte';
	import Button from '$lib/components/Button.svelte';
	import Icon from '$lib/components/Icon.svelte';

	type PlanExercise = {
		id: number;
		exerciseId: number;
		exerciseName: string;
		exerciseBrand: string | null;
		muscleGroup: string | null;
		targetSets: number | null;
		restSeconds: number | null;
		notes: string | null;
	};

	let { exercise }: { exercise: PlanExercise } = $props();

	let editing = $state(false);
	let editTargetSets = $state<number | null>(exercise.targetSets);
	let editRestSeconds = $state<number | null>(exercise.restSeconds);
	let editNotes = $state(exercise.notes ?? '');
	let editError = $state('');

	function startEdit() {
		editTargetSets = exercise.targetSets;
		editRestSeconds = exercise.restSeconds;
		editNotes = exercise.notes ?? '';
		editError = '';
		editing = true;
	}

	const subtitle = $derived(
		[
			exercise.exerciseBrand,
			exercise.muscleGroup,
			exercise.targetSets ? `Target: ${exercise.targetSets} sets` : null,
			exercise.restSeconds ? `Rest: ${exercise.restSeconds}s` : null
		]
			.filter(Boolean)
			.join(' · ')
	);
</script>

<div class="py-2.5">
	<div class="flex items-center justify-between gap-2">
		<div class="min-w-0">
			<span class="block truncate font-medium text-[var(--color-text)]">{exercise.exerciseName}</span>
			{#if subtitle}
				<p class="text-xs text-[var(--color-text-muted)]">{subtitle}</p>
			{/if}
			{#if exercise.notes}
				<p class="text-xs text-[var(--color-text-muted)] italic mt-0.5">"{exercise.notes}"</p>
			{/if}
		</div>
		<div class="flex items-center gap-1 shrink-0">
			<button
				type="button"
				aria-label="Edit exercise details"
				onclick={startEdit}
				class="h-8 w-8 flex items-center justify-center rounded-full text-[var(--color-text-muted)] hover:bg-[var(--color-surface-alt)]"
			>
				<Icon name="edit" size={16} />
			</button>
			<form
				method="POST"
				action="?/removeExercise"
				use:enhance={({ cancel }) => {
					if (!confirm(`Remove "${exercise.exerciseName}"?`)) cancel();
				}}
			>
				<input type="hidden" name="planExerciseId" value={exercise.id} />
				<button
					type="submit"
					aria-label="Remove exercise"
					class="h-8 w-8 flex items-center justify-center rounded-full text-[var(--color-danger)] hover:bg-[var(--color-danger-soft)]"
				>
					<Icon name="trash" size={16} />
				</button>
			</form>
		</div>
	</div>

	{#if editing}
		<form
			method="POST"
			action="?/updateDetails"
			class="mt-2 space-y-2"
			use:enhance={() => {
				editError = '';
				return async ({ result, update }) => {
					if (result.type === 'success') {
						editing = false;
					} else if (result.type === 'failure') {
						editError = (result.data?.error as string) ?? 'Could not update';
					}
					await update();
				};
			}}
		>
			<input type="hidden" name="planExerciseId" value={exercise.id} />
			<div class="grid grid-cols-2 gap-2">
				<NumberField label="Target sets" name="targetSets" bind:value={editTargetSets} min={0} step={1} />
				<NumberField label="Rest, seconds" name="restSeconds" bind:value={editRestSeconds} min={0} step={15} />
			</div>
			<TextareaField label="Note" name="notes" bind:value={editNotes} rows={2} placeholder="Optional" />
			<div class="flex gap-2 justify-end">
				<Button type="button" variant="ghost" onclick={() => (editing = false)}>Cancel</Button>
				<Button type="submit" variant="primary">Save</Button>
			</div>
		</form>
		{#if editError}
			<p class="mt-1 text-sm text-[var(--color-danger)]">{editError}</p>
		{/if}
	{/if}
</div>
