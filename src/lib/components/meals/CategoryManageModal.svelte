<script lang="ts">
	import { enhance } from '$app/forms';
	import Modal from '$lib/components/Modal.svelte';
	import TextField from '$lib/components/TextField.svelte';
	import Button from '$lib/components/Button.svelte';
	import Icon from '$lib/components/Icon.svelte';
	import CategoryEditRow from './CategoryEditRow.svelte';

	let {
		open = $bindable(false),
		categories
	}: {
		open?: boolean;
		categories: { id: number; name: string; mealCount: number }[];
	} = $props();

	let newName = $state('');
	let addError = $state('');
</script>

<Modal bind:open title="Manage categories">
	<div class="space-y-3">
		{#each categories as cat (cat.id)}
			<CategoryEditRow category={cat} />
		{:else}
			<p class="text-sm text-[var(--color-text-muted)]">No categories yet — add one below.</p>
		{/each}
	</div>

	<form
		method="POST"
		action="?/createCategory"
		class="mt-4 flex items-end gap-2 border-t border-[var(--color-border)] pt-4"
		use:enhance={() => {
			addError = '';
			return async ({ result, update }) => {
				if (result.type === 'success') {
					newName = '';
				} else if (result.type === 'failure') {
					addError = (result.data as { error?: string } | undefined)?.error ?? 'Could not add category';
				}
				await update({ reset: false });
			};
		}}
	>
		<TextField label="Add category" name="name" bind:value={newName} placeholder="e.g. Breakfast" class="flex-1" />
		<Button type="submit" variant="primary" size="icon">
			<Icon name="plus" size={20} />
			<span class="sr-only">Add category</span>
		</Button>
	</form>
	{#if addError}
		<p class="mt-2 text-sm text-[var(--color-danger)]">{addError}</p>
	{/if}
</Modal>
