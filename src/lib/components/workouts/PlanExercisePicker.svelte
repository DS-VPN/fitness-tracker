<script lang="ts">
	import { enhance } from '$app/forms';
	import Modal from '$lib/components/Modal.svelte';
	import TextField from '$lib/components/TextField.svelte';
	import NumberField from '$lib/components/NumberField.svelte';
	import Button from '$lib/components/Button.svelte';
	import Icon from '$lib/components/Icon.svelte';

	type ExerciseOption = { id: number; name: string; muscleGroup: string | null };

	let {
		open = $bindable(false),
		exercises
	}: {
		open?: boolean;
		exercises: ExerciseOption[];
	} = $props();

	let query = $state('');
	let selected = $state<ExerciseOption | null>(null);
	let targetSets = $state<number | null>(null);
	let creating = $state(false);
	let error = $state('');

	const filtered = $derived(
		query.trim() ? exercises.filter((e) => e.name.toLowerCase().includes(query.trim().toLowerCase())) : exercises
	);
	const exactMatch = $derived(exercises.some((e) => e.name.toLowerCase() === query.trim().toLowerCase()));

	function pick(exercise: ExerciseOption) {
		selected = exercise;
		targetSets = null;
		error = '';
	}

	function reset() {
		open = false;
		query = '';
		selected = null;
		targetSets = null;
		error = '';
	}
</script>

<Modal bind:open title="Add exercise" onclose={reset}>
	{#if selected}
		<p class="mb-3 text-sm text-[var(--color-text)]">
			Adding <span class="font-medium">{selected.name}</span>
		</p>
		<form
			method="POST"
			action="?/addExercise"
			use:enhance={() => {
				error = '';
				return async ({ result, update }) => {
					if (result.type === 'success') {
						reset();
					} else if (result.type === 'failure') {
						error = (result.data?.error as string) ?? 'Could not add exercise';
					}
					await update({ reset: false });
				};
			}}
		>
			<input type="hidden" name="exerciseId" value={selected.id} />
			<NumberField
				label="Target sets (optional)"
				name="targetSets"
				bind:value={targetSets}
				min={1}
				step={1}
				class="mb-3"
			/>
			<div class="flex gap-2">
				<Button type="button" variant="ghost" onclick={() => (selected = null)}>Back</Button>
				<Button type="submit" variant="primary" full class="flex-1">Add</Button>
			</div>
		</form>
	{:else}
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
					{query.trim() ? 'No matches — add it below as a new exercise.' : 'Type a name above to add your first exercise.'}
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
					error = '';
					return async ({ result, update }) => {
						creating = false;
						if (result.type === 'success' && result.data?.exercise) {
							pick(result.data.exercise as ExerciseOption);
						} else if (result.type === 'failure') {
							error = (result.data?.error as string) ?? 'Could not add exercise';
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
	{/if}

	{#if error}
		<p class="mt-2 text-sm text-[var(--color-danger)]">{error}</p>
	{/if}
</Modal>
