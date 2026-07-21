<script lang="ts">
	import { enhance } from '$app/forms';
	import PageHeader from '$lib/components/PageHeader.svelte';
	import Card from '$lib/components/Card.svelte';
	import Button from '$lib/components/Button.svelte';
	import Icon from '$lib/components/Icon.svelte';
	import Modal from '$lib/components/Modal.svelte';
	import TextField from '$lib/components/TextField.svelte';
	import SelectField from '$lib/components/SelectField.svelte';
	import Chip from '$lib/components/Chip.svelte';
	import EmptyState from '$lib/components/EmptyState.svelte';
	import { MUSCLE_GROUPS, muscleGroupOrder } from '$lib/muscleGroups';
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

	// Canonical list for the picker, plus a "none" option and — for an exercise that already holds a
	// custom (non-canonical) value — that value appended, so editing it never silently drops it.
	function muscleOptionsFor(current: string) {
		const opts = [{ value: '', label: '— None —' }, ...MUSCLE_GROUPS.map((g) => ({ value: g, label: g }))];
		if (current && !(MUSCLE_GROUPS as readonly string[]).includes(current)) {
			opts.push({ value: current, label: current });
		}
		return opts;
	}

	// null = show everything; '__unassigned__' = only exercises with no muscle group.
	let filter = $state<string | null>(null);

	const presentGroups = $derived.by(() => {
		const set = new Set<string>();
		for (const ex of data.exercises) if (ex.muscleGroup) set.add(ex.muscleGroup);
		return [...set].sort((a, b) => muscleGroupOrder(a) - muscleGroupOrder(b));
	});
	const hasUnassigned = $derived(data.exercises.some((ex) => !ex.muscleGroup));

	const grouped = $derived.by(() => {
		const filtered =
			filter === null
				? data.exercises
				: filter === '__unassigned__'
					? data.exercises.filter((ex) => !ex.muscleGroup)
					: data.exercises.filter((ex) => ex.muscleGroup === filter);
		const map = new Map<string, typeof data.exercises>();
		for (const ex of filtered) {
			const key = ex.muscleGroup ?? '';
			const arr = map.get(key);
			if (arr) arr.push(ex);
			else map.set(key, [ex]);
		}
		return [...map.entries()]
			.sort((a, b) => muscleGroupOrder(a[0] || null) - muscleGroupOrder(b[0] || null))
			.map(([key, items]) => ({ key, label: key || 'Unassigned', items }));
	});
	// Hide section headers in the "nothing tagged yet" case (a single Unassigned group) so the list
	// reads like the old flat list until muscle groups actually start getting assigned.
	const showHeaders = $derived(grouped.length > 1 || (grouped[0]?.key ?? '') !== '');
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
	{#if presentGroups.length > 0}
		<div class="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4">
			<Chip selected={filter === null} onclick={() => (filter = null)}>All</Chip>
			{#each presentGroups as g (g)}
				<Chip selected={filter === g} onclick={() => (filter = g)}>{g}</Chip>
			{/each}
			{#if hasUnassigned}
				<Chip selected={filter === '__unassigned__'} onclick={() => (filter = '__unassigned__')}>Unassigned</Chip>
			{/if}
		</div>
	{/if}

	{#if data.exercises.length === 0}
		<EmptyState icon="dumbbell" title="No exercises yet" description="Add your first exercise to start tracking sets.">
			<Button variant="primary" onclick={() => (addOpen = true)}>Add exercise</Button>
		</EmptyState>
	{:else}
		{#each grouped as section (section.key)}
			{#if showHeaders}
				<h2 class="section-label px-1 pt-1">{section.label}</h2>
			{/if}
			{#each section.items as ex (ex.id)}
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
							<SelectField
								label="Muscle group"
								name="muscleGroup"
								bind:value={editMuscleGroup}
								options={muscleOptionsFor(editMuscleGroup)}
							/>
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
		<SelectField
			label="Muscle group"
			name="muscleGroup"
			bind:value={newMuscleGroup}
			options={muscleOptionsFor(newMuscleGroup)}
		/>
		{#if addError}
			<p class="text-sm text-[var(--color-danger)]">{addError}</p>
		{/if}
		<Button type="submit" variant="primary" full>Add exercise</Button>
	</form>
</Modal>
