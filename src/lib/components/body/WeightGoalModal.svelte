<script lang="ts">
	import { enhance } from '$app/forms';
	import Modal from '$lib/components/Modal.svelte';
	import NumberField from '$lib/components/NumberField.svelte';
	import Button from '$lib/components/Button.svelte';
	import { kgToDisplay, round1, type WeightUnit } from '$lib/utils/units';

	let {
		open = $bindable(false),
		settings,
		goal = null
	}: {
		open?: boolean;
		settings: { weightUnit: WeightUnit };
		goal?: { targetWeightKg: number; targetDate: string | null } | null;
	} = $props();

	let target = $state<number | null>(null);
	let targetDate = $state('');
	let error = $state('');

	$effect(() => {
		if (!open) return;
		target = goal?.targetWeightKg != null ? round1(kgToDisplay(goal.targetWeightKg, settings.weightUnit)) : null;
		targetDate = goal?.targetDate ?? '';
		error = '';
	});
</script>

<Modal bind:open title="Weight goal">
	<div class="space-y-4">
		<form
			method="POST"
			action="/body?/saveGoal"
			class="space-y-4"
			use:enhance={() => {
				error = '';
				return async ({ result, update }) => {
					if (result.type === 'success') open = false;
					else if (result.type === 'failure') error = (result.data?.error as string) ?? 'Could not save goal';
					await update({ reset: false });
				};
			}}
		>
			<NumberField label="Target weight" name="target" bind:value={target} decimalText suffix={settings.weightUnit} required />
			<div>
				<label for="goal-date" class="block text-sm font-medium text-[var(--color-text)] mb-1.5">Target date (optional)</label>
				<input
					id="goal-date"
					type="date"
					name="targetDate"
					bind:value={targetDate}
					class="w-full h-11 px-3.5 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] focus:border-transparent"
				/>
			</div>
			{#if error}
				<p class="text-sm text-[var(--color-danger)]">{error}</p>
			{/if}
			<Button type="submit" variant="primary" full class="w-full">Save goal</Button>
		</form>

		{#if goal}
			<form
				method="POST"
				action="/body?/deleteGoal"
				use:enhance={() => {
					return async ({ update }) => {
						open = false;
						await update();
					};
				}}
			>
				<Button type="submit" variant="danger" full class="w-full">Remove goal</Button>
			</form>
		{/if}
	</div>
</Modal>
