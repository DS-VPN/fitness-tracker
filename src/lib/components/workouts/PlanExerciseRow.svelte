<script lang="ts">
	import { enhance } from '$app/forms';
	import NumberField from '$lib/components/NumberField.svelte';
	import Button from '$lib/components/Button.svelte';
	import Icon from '$lib/components/Icon.svelte';

	type PlanExercise = {
		id: number;
		exerciseId: number;
		exerciseName: string;
		exerciseBrand: string | null;
		muscleGroup: string | null;
		targetSets: number | null;
	};

	let { exercise }: { exercise: PlanExercise } = $props();

	let editing = $state(false);
	let editTargetSets = $state<number | null>(exercise.targetSets);
	let editError = $state('');

	function startEdit() {
		editTargetSets = exercise.targetSets;
		editError = '';
		editing = true;
	}

	const subtitle = $derived(
		[exercise.exerciseBrand, exercise.muscleGroup, exercise.targetSets ? `Target: ${exercise.targetSets} sets` : null]
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
		</div>
		<div class="flex items-center gap-1 shrink-0">
			<button
				type="button"
				aria-label="Edit target sets"
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
			action="?/updateTargetSets"
			class="mt-2 flex items-end gap-2"
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
			<NumberField
				label="Target sets (optional)"
				name="targetSets"
				bind:value={editTargetSets}
				min={0}
				step={1}
				class="flex-1"
			/>
			<Button type="button" variant="ghost" onclick={() => (editing = false)}>Cancel</Button>
			<Button type="submit" variant="primary">Save</Button>
		</form>
		{#if editError}
			<p class="mt-1 text-sm text-[var(--color-danger)]">{editError}</p>
		{/if}
	{/if}
</div>
