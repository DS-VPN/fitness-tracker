<script lang="ts">
	import { enhance } from '$app/forms';
	import NumberField from '$lib/components/NumberField.svelte';
	import TextField from '$lib/components/TextField.svelte';
	import Button from '$lib/components/Button.svelte';
	import Icon from '$lib/components/Icon.svelte';

	type SetData = { id: number; reps: number; weight: number; rpe: number | null; notes: string | null };

	let {
		set,
		index,
		meetsGoal = false
	}: { set: SetData; index: number; meetsGoal?: boolean } = $props();

	let editing = $state(false);
	let editReps = $state(set.reps);
	let editWeight = $state(set.weight);
	let editRpe = $state<number | null>(set.rpe);
	let editNotes = $state(set.notes ?? '');
	let editError = $state('');

	function startEdit() {
		editReps = set.reps;
		editWeight = set.weight;
		editRpe = set.rpe;
		editNotes = set.notes ?? '';
		editError = '';
		editing = true;
	}
</script>

{#if editing}
	<form
		method="POST"
		action="?/updateSet"
		class="flex flex-col gap-2 rounded-[var(--radius-md)] bg-[var(--color-surface-alt)] p-3 my-1.5"
		use:enhance={() => {
			editError = '';
			return async ({ result, update }) => {
				if (result.type === 'success') {
					editing = false;
				} else if (result.type === 'failure') {
					editError = (result.data?.error as string) ?? 'Could not save set';
				}
				await update();
			};
		}}
	>
		<input type="hidden" name="id" value={set.id} />
		<div class="flex gap-2">
			<NumberField label="Reps" name="reps" bind:value={editReps} min={0} class="flex-1" />
			<NumberField label="Weight" name="weight" bind:value={editWeight} suffix="kg" decimalText class="flex-1" />
		</div>
		<div class="flex gap-2">
			<NumberField label="RPE" name="rpe" bind:value={editRpe} min={0} step={0.5} class="flex-1" />
			<TextField label="Notes" name="notes" bind:value={editNotes} class="flex-1" />
		</div>
		{#if editError}
			<p class="text-sm text-[var(--color-danger)]">{editError}</p>
		{/if}
		<div class="flex gap-2 justify-end">
			<Button type="button" variant="ghost" onclick={() => (editing = false)}>Cancel</Button>
			<Button type="submit" variant="primary">Save</Button>
		</div>
	</form>
{:else}
	<div class="flex items-center justify-between gap-2 py-1.5">
		<div class="flex items-baseline gap-2 text-sm min-w-0">
			<span class="text-[var(--color-text-muted)] w-4 shrink-0">{index + 1}</span>
			<span class="text-[var(--color-text)] font-medium shrink-0">{set.reps} &times; {set.weight} kg</span>
			{#if meetsGoal}<span class="text-xs text-[var(--color-success)] font-medium shrink-0">✓ goal</span>{/if}
			{#if set.rpe != null}<span class="text-xs text-[var(--color-text-muted)] shrink-0">@RPE {set.rpe}</span>{/if}
			{#if set.notes}<span class="text-xs text-[var(--color-text-muted)] truncate">{set.notes}</span>{/if}
		</div>
		<div class="flex items-center gap-1 shrink-0">
			<button
				type="button"
				aria-label="Edit set"
				onclick={startEdit}
				class="h-8 w-8 flex items-center justify-center rounded-full text-[var(--color-text-muted)] hover:bg-[var(--color-surface-alt)]"
			>
				<Icon name="edit" size={16} />
			</button>
			<form
				method="POST"
				action="?/deleteSet"
				use:enhance={({ cancel }) => {
					if (!confirm('Delete this set?')) {
						cancel();
						return;
					}
					return async ({ update }) => {
						await update();
					};
				}}
			>
				<input type="hidden" name="id" value={set.id} />
				<button
					type="submit"
					aria-label="Delete set"
					class="h-8 w-8 flex items-center justify-center rounded-full text-[var(--color-danger)] hover:bg-[var(--color-danger-soft)]"
				>
					<Icon name="trash" size={16} />
				</button>
			</form>
		</div>
	</div>
{/if}
