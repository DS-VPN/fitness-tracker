<script lang="ts">
	import { enhance } from '$app/forms';
	import TextField from '$lib/components/TextField.svelte';
	import Button from '$lib/components/Button.svelte';
	import Icon from '$lib/components/Icon.svelte';

	let { category }: { category: { id: number; name: string; mealCount: number } } = $props();

	let name = $state(category.name);
	let error = $state('');
</script>

<div class="flex items-end gap-2">
	<form
		method="POST"
		action="?/renameCategory"
		class="flex flex-1 items-end gap-2"
		use:enhance={() => {
			error = '';
			return async ({ result, update }) => {
				if (result.type === 'failure') {
					error = (result.data as { error?: string } | undefined)?.error ?? 'Could not rename category';
				}
				await update({ reset: false });
			};
		}}
	>
		<input type="hidden" name="id" value={category.id} />
		<TextField name="name" bind:value={name} class="flex-1" />
		<Button type="submit" variant="secondary" size="icon">
			<Icon name="check" size={18} />
			<span class="sr-only">Save {category.name}</span>
		</Button>
	</form>
	<form
		method="POST"
		action="?/deleteCategory"
		use:enhance={({ cancel }) => {
			if (
				!confirm(
					`Delete "${category.name}"? This does not delete the meals in it — they just lose this category tag.`
				)
			) {
				cancel();
			}
		}}
	>
		<input type="hidden" name="id" value={category.id} />
		<Button type="submit" variant="danger" size="icon">
			<Icon name="trash" size={18} />
			<span class="sr-only">Delete {category.name}</span>
		</Button>
	</form>
</div>
{#if error}
	<p class="mt-1 text-xs text-[var(--color-danger)]">{error}</p>
{/if}
