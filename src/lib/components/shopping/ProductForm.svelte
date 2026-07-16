<script lang="ts">
	import { enhance } from '$app/forms';
	import TextField from '$lib/components/TextField.svelte';
	import NumberField from '$lib/components/NumberField.svelte';
	import Button from '$lib/components/Button.svelte';

	type Initial = {
		name?: string;
		brand?: string | null;
		servingSize?: string | null;
		calories?: number;
		protein?: number;
		carbs?: number;
		fat?: number;
		fiber?: number | null;
		sugar?: number | null;
		sodium?: number | null;
	};

	let {
		initial,
		submitLabel = 'Save',
		formError = null,
		action,
		resetAfterSubmit = false,
		onAdded
	}: {
		initial?: Initial;
		submitLabel?: string;
		formError?: string | null;
		action?: string;
		/** Stay on the page and clear the form after a successful submit, instead of the caller navigating away — used for rapid back-to-back entry. Brand is kept as-is between adds since a batch is often all the same brand. */
		resetAfterSubmit?: boolean;
		/** Called with the created product after a successful submit (only meaningful alongside resetAfterSubmit). */
		onAdded?: (product: unknown) => void;
	} = $props();

	let name = $state(initial?.name ?? '');
	let brand = $state(initial?.brand ?? '');
	let servingSize = $state(initial?.servingSize ?? '');
	let calories = $state<number | null>(initial?.calories ?? 0);
	let protein = $state<number | null>(initial?.protein ?? 0);
	let carbs = $state<number | null>(initial?.carbs ?? 0);
	let fat = $state<number | null>(initial?.fat ?? 0);
	let fiber = $state<number | null>(initial?.fiber ?? null);
	let sugar = $state<number | null>(initial?.sugar ?? null);
	let sodium = $state<number | null>(initial?.sodium ?? null);

	let showOptional = $state(initial?.fiber != null || initial?.sugar != null || initial?.sodium != null);
	let submitting = $state(false);

	function focusName() {
		document.getElementById('field-name')?.focus();
	}
</script>

<form
	method="POST"
	{action}
	class="space-y-5 pb-10"
	use:enhance={() => {
		submitting = true;
		return async ({ result, update }) => {
			submitting = false;
			if (result.type === 'success' && resetAfterSubmit) {
				onAdded?.((result.data as { product?: unknown } | undefined)?.product);
				name = '';
				servingSize = '';
				calories = 0;
				protein = 0;
				carbs = 0;
				fat = 0;
				fiber = null;
				sugar = null;
				sodium = null;
				focusName();
			}
			await update({ reset: false });
		};
	}}
>
	<TextField label="Name" name="name" bind:value={name} required placeholder="e.g. Jarlsberg" />
	<TextField label="Brand" name="brand" bind:value={brand} placeholder="Optional" />
	<TextField
		label="Serving size"
		name="servingSize"
		bind:value={servingSize}
		placeholder="e.g. 100 g"
	/>

	<div>
		<p class="mb-1.5 text-sm font-medium text-[var(--color-text)]">Macros</p>
		<div class="grid grid-cols-2 gap-3">
			<NumberField label="Calories" name="calories" bind:value={calories} min={0} suffix="kcal" required />
			<NumberField label="Protein" name="protein" bind:value={protein} min={0} step={0.1} suffix="g" required />
			<NumberField label="Carbs" name="carbs" bind:value={carbs} min={0} step={0.1} suffix="g" required />
			<NumberField label="Fat" name="fat" bind:value={fat} min={0} step={0.1} suffix="g" required />
		</div>
	</div>

	{#if showOptional}
		<div>
			<p class="mb-1.5 text-sm font-medium text-[var(--color-text)]">Optional details</p>
			<div class="grid grid-cols-3 gap-3">
				<NumberField label="Fiber" name="fiber" bind:value={fiber} min={0} step={0.1} suffix="g" />
				<NumberField label="Sugar" name="sugar" bind:value={sugar} min={0} step={0.1} suffix="g" />
				<NumberField label="Sodium" name="sodium" bind:value={sodium} min={0} step={1} suffix="mg" />
			</div>
		</div>
	{:else}
		<button
			type="button"
			onclick={() => (showOptional = true)}
			class="text-sm text-[var(--color-accent)]"
		>
			+ Add fiber, sugar, sodium
		</button>
	{/if}

	{#if formError}
		<p class="text-sm text-[var(--color-danger)]">{formError}</p>
	{/if}

	<Button type="submit" variant="primary" size="lg" full class="w-full" disabled={submitting}>
		{submitLabel}
	</Button>
</form>
