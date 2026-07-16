<script lang="ts">
	import { enhance } from '$app/forms';
	import TextField from '$lib/components/TextField.svelte';
	import Chip from '$lib/components/Chip.svelte';
	import Button from '$lib/components/Button.svelte';

	type Initial = {
		name?: string;
		categoryIds?: number[];
	};

	let {
		categories,
		initial,
		submitLabel = 'Save',
		formError = null
	}: {
		categories: { id: number; name: string }[];
		initial?: Initial;
		submitLabel?: string;
		formError?: string | null;
	} = $props();

	let name = $state(initial?.name ?? '');
	let selectedCategoryIds = $state<number[]>(initial?.categoryIds ?? []);

	let submitting = $state(false);

	function toggleCategory(id: number) {
		selectedCategoryIds = selectedCategoryIds.includes(id)
			? selectedCategoryIds.filter((c) => c !== id)
			: [...selectedCategoryIds, id];
	}
</script>

<form
	method="POST"
	class="space-y-5 pb-10"
	use:enhance={() => {
		submitting = true;
		return async ({ update }) => {
			await update();
			submitting = false;
		};
	}}
>
	<TextField label="Name" name="name" bind:value={name} required placeholder="e.g. Taco Night" />

	{#if categories.length}
		<div>
			<p class="mb-1.5 text-sm font-medium text-[var(--color-text)]">Categories</p>
			<div class="flex flex-wrap gap-2">
				{#each categories as c (c.id)}
					<Chip selected={selectedCategoryIds.includes(c.id)} onclick={() => toggleCategory(c.id)}>
						{c.name}
					</Chip>
				{/each}
			</div>
			{#each selectedCategoryIds as id (id)}
				<input type="hidden" name="categoryIds" value={id} />
			{/each}
		</div>
	{/if}

	{#if formError}
		<p class="text-sm text-[var(--color-danger)]">{formError}</p>
	{/if}

	<Button type="submit" variant="primary" size="lg" full class="w-full" disabled={submitting}>
		{submitLabel}
	</Button>
</form>
