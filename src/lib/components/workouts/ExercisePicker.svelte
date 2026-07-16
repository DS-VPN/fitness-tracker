<script lang="ts">
	import { enhance } from '$app/forms';
	import Modal from '$lib/components/Modal.svelte';
	import TextField from '$lib/components/TextField.svelte';
	import Button from '$lib/components/Button.svelte';
	import Icon from '$lib/components/Icon.svelte';

	type ExerciseOption = { id: number; name: string; muscleGroup: string | null };

	let {
		open = $bindable(false),
		exercises,
		onselect
	}: {
		open?: boolean;
		exercises: ExerciseOption[];
		onselect: (exercise: ExerciseOption) => void;
	} = $props();

	let query = $state('');
	let creating = $state(false);
	let createError = $state('');

	const filtered = $derived(
		query.trim()
			? exercises.filter((e) => e.name.toLowerCase().includes(query.trim().toLowerCase()))
			: exercises
	);

	const exactMatch = $derived(exercises.some((e) => e.name.toLowerCase() === query.trim().toLowerCase()));

	function pick(exercise: ExerciseOption) {
		onselect(exercise);
		reset();
	}

	function reset() {
		open = false;
		query = '';
		createError = '';
	}
</script>

<Modal bind:open title="Add exercise" onclose={reset}>
	<TextField name="query" placeholder="Search or add new exercise…" bind:value={query} class="mb-3" />

	<div class="max-h-64 overflow-y-auto -mx-1">
		{#each filtered as ex (ex.id)}
			<button
				type="button"
				onclick={() => pick(ex)}
				class="w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-[var(--radius-md)] hover:bg-[var(--color-surface-alt)] text-left"
			>
				<span class="text-[var(--color-text)]">{ex.name}</span>
				{#if ex.muscleGroup}
					<span class="text-xs text-[var(--color-text-muted)] shrink-0">{ex.muscleGroup}</span>
				{/if}
			</button>
		{/each}
		{#if filtered.length === 0}
			<p class="text-sm text-[var(--color-text-muted)] px-3 py-2">
				{query.trim() ? 'No matches — add it above as a new exercise.' : 'Type a name above to add your first exercise.'}
			</p>
		{/if}
	</div>

	{#if query.trim() && !exactMatch}
		<form
			method="POST"
			action="?/createExercise"
			class="mt-3 pt-3 border-t border-[var(--color-border)]"
			use:enhance={() => {
				creating = true;
				createError = '';
				return async ({ result, update }) => {
					creating = false;
					if (result.type === 'success' && result.data?.exercise) {
						pick(result.data.exercise as ExerciseOption);
					} else if (result.type === 'failure') {
						createError = (result.data?.error as string) ?? 'Could not add exercise';
					}
					await update({ reset: false });
				};
			}}
		>
			<input type="hidden" name="name" value={query.trim()} />
			<Button type="submit" variant="secondary" full disabled={creating}>
				<Icon name="plus" size={18} />
				Add "{query.trim()}"
			</Button>
		</form>
	{/if}

	{#if createError}
		<p class="mt-2 text-sm text-[var(--color-danger)]">{createError}</p>
	{/if}
</Modal>
