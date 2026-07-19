<script lang="ts">
	import { enhance } from '$app/forms';
	import Modal from '$lib/components/Modal.svelte';
	import NumberField from '$lib/components/NumberField.svelte';
	import Button from '$lib/components/Button.svelte';

	type Targets = { calories: number; protein: number; carbs: number; fat: number } | null;

	let { open = $bindable(false), targets }: { open?: boolean; targets: Targets } = $props();

	let calories = $state<number | null>(targets?.calories ?? null);
	let protein = $state<number | null>(targets?.protein ?? null);
	let carbs = $state<number | null>(targets?.carbs ?? null);
	let fat = $state<number | null>(targets?.fat ?? null);
	let error = $state('');

	// Re-seed the fields each time the modal opens, so an earlier cancelled edit doesn't linger.
	$effect(() => {
		if (open) {
			calories = targets?.calories ?? null;
			protein = targets?.protein ?? null;
			carbs = targets?.carbs ?? null;
			fat = targets?.fat ?? null;
			error = '';
		}
	});
</script>

<Modal bind:open title="Daily targets">
	<form
		method="POST"
		action="?/saveTargets"
		class="space-y-4"
		use:enhance={() => {
			error = '';
			return async ({ result, update }) => {
				if (result.type === 'success') {
					open = false;
				} else if (result.type === 'failure') {
					error = (result.data?.error as string) ?? 'Could not save targets';
				}
				await update({ reset: false });
			};
		}}
	>
		<NumberField label="Calories" name="calories" bind:value={calories} decimalText suffix="kcal" required />
		<div class="grid grid-cols-3 gap-3">
			<NumberField label="Protein" name="protein" bind:value={protein} decimalText suffix="g" required />
			<NumberField label="Carbs" name="carbs" bind:value={carbs} decimalText suffix="g" required />
			<NumberField label="Fat" name="fat" bind:value={fat} decimalText suffix="g" required />
		</div>
		{#if error}
			<p class="text-sm text-[var(--color-danger)]">{error}</p>
		{/if}
		<Button type="submit" variant="primary" full class="w-full">Save targets</Button>
	</form>
</Modal>
