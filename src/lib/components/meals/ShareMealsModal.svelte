<script lang="ts">
	import { enhance } from '$app/forms';
	import Modal from '$lib/components/Modal.svelte';
	import TextField from '$lib/components/TextField.svelte';
	import SelectField from '$lib/components/SelectField.svelte';
	import Button from '$lib/components/Button.svelte';
	import Icon from '$lib/components/Icon.svelte';
	import type { MealShareView } from '$lib/server/repositories/mealShares';

	let {
		open = $bindable(false),
		shares,
		categories = [],
		meal
	}: {
		open?: boolean;
		shares: MealShareView[];
		categories?: { id: number; name: string }[];
		/** When set, the modal shares this single meal (fixed scope). Otherwise it offers a scope picker. */
		meal?: { id: number; name: string };
	} = $props();

	let username = $state('');
	let scope = $state('all');
	let shareError = $state('');

	// Scope options: "All meals" plus one per category (value = "cat:<id>").
	const scopeOptions = $derived([
		{ value: 'all', label: 'All meals' },
		...categories.map((c) => ({ value: `cat:${c.id}`, label: c.name }))
	]);

	const selectedCategoryId = $derived(scope.startsWith('cat:') ? scope.slice(4) : '');

	const scopeLabels: Record<MealShareView['scope'], string> = {
		library: 'All meals',
		category: 'Category',
		meal: 'Meal'
	};

	const title = $derived(meal ? 'Share this meal' : 'Share meals');
</script>

<Modal bind:open {title}>
	<div class="space-y-2">
		{#each shares as share (share.id)}
			<div class="flex items-center justify-between gap-2">
				<span class="min-w-0 text-sm text-[var(--color-text)]">
					{share.username}
					<span class="text-[var(--color-text-muted)]">· {scopeLabels[share.scope]}{#if !meal && share.scope !== 'library'}: {share.label}{/if}</span>
				</span>
				<form method="POST" action="?/revokeMealShare" use:enhance>
					<input type="hidden" name="shareId" value={share.id} />
					<Button type="submit" variant="ghost" size="md">Remove</Button>
				</form>
			</div>
		{:else}
			<p class="text-sm text-[var(--color-text-muted)]">
				{#if meal}Nobody has access to this meal yet.{:else}You haven't shared any meals yet.{/if}
			</p>
		{/each}
	</div>

	<form
		method="POST"
		action="?/shareMeals"
		class="mt-4 space-y-3 border-t border-[var(--color-border)] pt-4"
		use:enhance={() => {
			shareError = '';
			return async ({ result, update }) => {
				if (result.type === 'success') {
					username = '';
					scope = 'all';
				} else if (result.type === 'failure') {
					shareError = (result.data as { error?: string } | undefined)?.error ?? 'Could not share meals';
				}
				await update({ reset: false });
			};
		}}
	>
		{#if meal}
			<input type="hidden" name="mealId" value={meal.id} />
			<p class="text-sm text-[var(--color-text-muted)]">
				Sharing <span class="font-medium text-[var(--color-text)]">{meal.name}</span>.
			</p>
		{:else}
			<input type="hidden" name="categoryId" value={selectedCategoryId} />
			<SelectField label="What to share" name="scopeChoice" bind:value={scope} options={scopeOptions} />
		{/if}
		<div class="flex items-end gap-2">
			<TextField label="Share with username" name="username" bind:value={username} placeholder="e.g. anna" class="flex-1" />
			<Button type="submit" variant="primary" size="icon">
				<Icon name="plus" size={20} />
				<span class="sr-only">Share</span>
			</Button>
		</div>
	</form>
	{#if shareError}
		<p class="mt-2 text-sm text-[var(--color-danger)]">{shareError}</p>
	{/if}
</Modal>
