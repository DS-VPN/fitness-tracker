<script lang="ts">
	import { enhance } from '$app/forms';
	import TextField from '$lib/components/TextField.svelte';
	import NumberField from '$lib/components/NumberField.svelte';
	import Chip from '$lib/components/Chip.svelte';
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
	let brand = $state(initial?.brand ?? '');
	let servingSize = $state(initial?.servingSize ?? '');
	let calories = $state<number | null>(initial?.calories ?? 0);
	let protein = $state<number | null>(initial?.protein ?? 0);
	let carbs = $state<number | null>(initial?.carbs ?? 0);
	let fat = $state<number | null>(initial?.fat ?? 0);
	let fiber = $state<number | null>(initial?.fiber ?? null);
	let sugar = $state<number | null>(initial?.sugar ?? null);
	let sodium = $state<number | null>(initial?.sodium ?? null);
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
	<TextField label="Name" name="name" bind:value={name} required placeholder="e.g. Greek yogurt" />
	<TextField label="Brand" name="brand" bind:value={brand} placeholder="Optional" />
	<TextField
		label="Serving size"
		name="servingSize"
		bind:value={servingSize}
		placeholder="e.g. 1 cup (240g)"
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

	<div>
		<p class="mb-1.5 text-sm font-medium text-[var(--color-text)]">Optional details</p>
		<div class="grid grid-cols-3 gap-3">
			<NumberField label="Fiber" name="fiber" bind:value={fiber} min={0} step={0.1} suffix="g" />
			<NumberField label="Sugar" name="sugar" bind:value={sugar} min={0} step={0.1} suffix="g" />
			<NumberField label="Sodium" name="sodium" bind:value={sodium} min={0} step={1} suffix="mg" />
		</div>
	</div>

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
