<script lang="ts">
	import { enhance } from '$app/forms';
	import PageHeader from '$lib/components/PageHeader.svelte';
	import Card from '$lib/components/Card.svelte';
	import Button from '$lib/components/Button.svelte';
	import Icon from '$lib/components/Icon.svelte';
	import Modal from '$lib/components/Modal.svelte';
	import TextField from '$lib/components/TextField.svelte';
	import EmptyState from '$lib/components/EmptyState.svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	let addOpen = $state(false);
	let newName = $state('');
	let newBrand = $state('');
	let newMuscleGroup = $state('');
	let addError = $state('');

	let editingId = $state<number | null>(null);
	let editName = $state('');
	let editBrand = $state('');
	let editMuscleGroup = $state('');
	let editError = $state('');

	function startEdit(ex: { id: number; name: string; brand: string | null; muscleGroup: string | null }) {
		editingId = ex.id;
		editName = ex.name;
		editBrand = ex.brand ?? '';
		editMuscleGroup = ex.muscleGroup ?? '';
		editError = '';
	}
</script>

<svelte:head><title>Exercises · Fitness Tracker</title></svelte:head>

<PageHeader title="Exercises" back="/workouts">
	{#snippet actions()}
		<button
			type="button"
			aria-label="Add exercise"
			onclick={() => (addOpen = true)}
			class="h-9 w-9 flex items-center justify-center rounded-full text-[var(--color-accent)] hover:bg-[var(--color-surface-alt)]"
		>
			<Icon name="plus" size={22} />
		</button>
	{/snippet}
</PageHeader>

<div class="mx-auto max-w-md px-4 space-y-3">
	{#if data.exercises.length === 0}
		<EmptyState icon="dumbbell" title="No exercises yet" description="Add your first exercise to start tracking sets.">
			<Button variant="primary" onclick={() => (addOpen = true)}>Add exercise</Button>
		</EmptyState>
	{:else}
		{#each data.exercises as ex (ex.id)}
			<Card>
				{#if editingId === ex.id}
					<form
						method="POST"
						action="?/rename"
						class="space-y-3"
						use:enhance={() => {
							editError = '';
							return async ({ result, update }) => {
								if (result.type === 'success') {
									editingId = null;
								} else if (result.type === 'failure') {
									editError = (result.data?.error as string) ?? 'Could not save';
								}
								await update();
							};
						}}
					>
						<input type="hidden" name="id" value={ex.id} />
						<TextField label="Name" name="name" bind:value={editName} required />
						<TextField
							label="Brand / machine"
							name="brand"
							bind:value={editBrand}
							placeholder="Optional, e.g. Arsenal Strength"
						/>
						<TextField label="Muscle group" name="muscleGroup" bind:value={editMuscleGroup} placeholder="Optional" />
						{#if editError}
							<p class="text-sm text-[var(--color-danger)]">{editError}</p>
						{/if}
						<div class="flex gap-2 justify-end">
							<Button type="button" variant="ghost" onclick={() => (editingId = null)}>Cancel</Button>
							<Button type="submit" variant="primary">Save</Button>
						</div>
					</form>
				{:else}
					<div class="flex items-center gap-1">
						<a href={`/exercises/${ex.id}`} class="flex-1 min-w-0 py-1">
							<p class="font-medium text-[var(--color-text)] truncate">{ex.name}</p>
							{#if ex.brand}
								<p class="text-xs text-[var(--color-text-muted)] truncate">{ex.brand}</p>
							{/if}
							<div class="flex items-center gap-2 mt-1.5">
								{#if ex.muscleGroup}
									<span
										class="inline-flex h-5 items-center px-2 rounded-full text-xs font-medium bg-[var(--color-accent-soft)] text-[var(--color-accent)]"
										>{ex.muscleGroup}</span
									>
								{/if}
								<span class="text-xs text-[var(--color-text-muted)]"
									>{ex.setCount} {ex.setCount === 1 ? 'set' : 'sets'}</span
								>
							</div>
						</a>
						<button
							type="button"
							aria-label={`Rename ${ex.name}`}
							onclick={() => startEdit(ex)}
							class="h-9 w-9 flex items-center justify-center rounded-full text-[var(--color-text-muted)] hover:bg-[var(--color-surface-alt)] shrink-0"
						>
							<Icon name="edit" size={17} />
						</button>
						<form
							method="POST"
							action="?/delete"
							use:enhance={({ cancel }) => {
								if (!confirm(`Delete "${ex.name}"? This also deletes all logged sets for it.`)) {
									cancel();
									return;
								}
								return async ({ update }) => {
									await update();
								};
							}}
						>
							<input type="hidden" name="id" value={ex.id} />
							<button
								type="submit"
								aria-label={`Delete ${ex.name}`}
								class="h-9 w-9 flex items-center justify-center rounded-full text-[var(--color-danger)] hover:bg-[var(--color-danger-soft)] shrink-0"
							>
								<Icon name="trash" size={17} />
							</button>
						</form>
					</div>
				{/if}
			</Card>
		{/each}
	{/if}
</div>

<Modal
	bind:open={addOpen}
	title="Add exercise"
	onclose={() => {
		newName = '';
		newBrand = '';
		newMuscleGroup = '';
		addError = '';
	}}
>
	<form
		method="POST"
		action="?/create"
		class="space-y-4"
		use:enhance={() => {
			addError = '';
			return async ({ result, update }) => {
				if (result.type === 'success') {
					addOpen = false;
					newName = '';
					newBrand = '';
					newMuscleGroup = '';
				} else if (result.type === 'failure') {
					addError = (result.data?.error as string) ?? 'Could not add exercise';
				}
				await update();
			};
		}}
	>
		<TextField label="Name" name="name" bind:value={newName} required placeholder="e.g. Bench press" />
		<TextField
			label="Brand / machine"
			name="brand"
			bind:value={newBrand}
			placeholder="Optional, e.g. Arsenal Strength"
		/>
		<TextField label="Muscle group" name="muscleGroup" bind:value={newMuscleGroup} placeholder="Optional, e.g. Chest" />
		{#if addError}
			<p class="text-sm text-[var(--color-danger)]">{addError}</p>
		{/if}
		<Button type="submit" variant="primary" full>Add exercise</Button>
	</form>
</Modal>
