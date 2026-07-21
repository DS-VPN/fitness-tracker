<script lang="ts">
	import { enhance } from '$app/forms';
	import Modal from '$lib/components/Modal.svelte';
	import NumberField from '$lib/components/NumberField.svelte';
	import Button from '$lib/components/Button.svelte';
	import { cmToDisplay, round1, type LengthUnit, type WeightUnit } from '$lib/utils/units';

	let {
		open = $bindable(false),
		settings
	}: {
		open?: boolean;
		settings: { weightUnit: WeightUnit; lengthUnit: LengthUnit; heightCm: number | null };
	} = $props();

	let weightUnit = $state<WeightUnit>('kg');
	let lengthUnit = $state<LengthUnit>('cm');
	let height = $state<number | null>(null);
	let error = $state('');

	$effect(() => {
		if (!open) return;
		weightUnit = settings.weightUnit;
		lengthUnit = settings.lengthUnit;
		height = settings.heightCm != null ? round1(cmToDisplay(settings.heightCm, settings.lengthUnit)) : null;
		error = '';
	});

	// Height is entered in whichever length unit is currently selected.
	const heightSuffix = $derived(lengthUnit);
</script>

<Modal bind:open title="Units & profile">
	<form
		method="POST"
		action="/body?/saveProfile"
		class="space-y-4"
		use:enhance={() => {
			error = '';
			return async ({ result, update }) => {
				if (result.type === 'success') open = false;
				else if (result.type === 'failure') error = (result.data?.error as string) ?? 'Could not save';
				await update({ reset: false });
			};
		}}
	>
		<div>
			<p class="block text-sm font-medium text-[var(--color-text)] mb-1.5">Weight unit</p>
			<div class="flex gap-1 rounded-[var(--radius-md)] bg-[var(--color-surface-alt)] p-1">
				{#each ['kg', 'lb'] as const as u (u)}
					<button
						type="button"
						onclick={() => (weightUnit = u)}
						aria-pressed={weightUnit === u}
						class={`flex-1 rounded-[calc(var(--radius-md)-2px)] py-1.5 text-sm font-medium transition-colors ${weightUnit === u ? 'bg-[var(--color-surface)] text-[var(--color-text)] shadow-[var(--shadow-soft)]' : 'text-[var(--color-text-muted)]'}`}
					>
						{u}
					</button>
				{/each}
			</div>
			<input type="hidden" name="weightUnit" value={weightUnit} />
		</div>

		<div>
			<p class="block text-sm font-medium text-[var(--color-text)] mb-1.5">Length unit</p>
			<div class="flex gap-1 rounded-[var(--radius-md)] bg-[var(--color-surface-alt)] p-1">
				{#each ['cm', 'in'] as const as u (u)}
					<button
						type="button"
						onclick={() => (lengthUnit = u)}
						aria-pressed={lengthUnit === u}
						class={`flex-1 rounded-[calc(var(--radius-md)-2px)] py-1.5 text-sm font-medium transition-colors ${lengthUnit === u ? 'bg-[var(--color-surface)] text-[var(--color-text)] shadow-[var(--shadow-soft)]' : 'text-[var(--color-text-muted)]'}`}
					>
						{u}
					</button>
				{/each}
			</div>
			<input type="hidden" name="lengthUnit" value={lengthUnit} />
		</div>

		<NumberField label="Height" name="height" bind:value={height} decimalText suffix={heightSuffix} />
		<p class="text-xs text-[var(--color-text-muted)]">Height is used to compute your BMI. Optional.</p>

		{#if error}
			<p class="text-sm text-[var(--color-danger)]">{error}</p>
		{/if}
		<Button type="submit" variant="primary" full class="w-full">Save</Button>
	</form>
</Modal>
