<script lang="ts">
	import { enhance } from '$app/forms';
	import NumberField from '$lib/components/NumberField.svelte';
	import Button from '$lib/components/Button.svelte';
	import Icon from '$lib/components/Icon.svelte';
	import MacroBadge from '$lib/components/MacroBadge.svelte';

	type Ingredient = {
		id: number;
		quantity: number;
		type: 'product' | 'meal';
		refId: number;
		name: string;
		brand?: string | null;
		totalMacros: { calories: number; protein: number; carbs: number; fat: number };
	};

	let { ingredient }: { ingredient: Ingredient } = $props();

	let editing = $state(false);
	let editQuantity = $state(ingredient.quantity);
	let editError = $state('');
	let addedToShopping = $state(false);
	let addedTimeout: ReturnType<typeof setTimeout> | undefined;

	function startEdit() {
		editQuantity = ingredient.quantity;
		editError = '';
		editing = true;
	}
</script>

<div class="py-2.5">
	<div class="flex items-center justify-between gap-2">
		<div class="min-w-0">
			<div class="flex items-center gap-1.5">
				<span class="font-medium text-[var(--color-text)] truncate">{ingredient.name}</span>
				{#if ingredient.type === 'meal'}
					<span
						class="shrink-0 rounded-full bg-[var(--color-surface-alt)] px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-[var(--color-text-muted)]"
					>
						Meal
					</span>
				{/if}
			</div>
			<p class="text-xs text-[var(--color-text-muted)]">
				&times;{ingredient.quantity}{#if ingredient.brand}&nbsp;&middot; {ingredient.brand}{/if}
			</p>
			<MacroBadge
				calories={ingredient.totalMacros.calories}
				protein={ingredient.totalMacros.protein}
				carbs={ingredient.totalMacros.carbs}
				fat={ingredient.totalMacros.fat}
				class="mt-0.5"
			/>
		</div>
		<div class="flex items-center gap-1 shrink-0">
			<form
				method="POST"
				action={ingredient.type === 'product' ? '?/quickAddProduct' : '?/quickAddSubMeal'}
				use:enhance={() => {
					return async ({ result, update }) => {
						if (result.type === 'success') {
							addedToShopping = true;
							clearTimeout(addedTimeout);
							addedTimeout = setTimeout(() => (addedToShopping = false), 1500);
						}
						await update({ reset: false });
					};
				}}
			>
				<input type="hidden" name={ingredient.type === 'product' ? 'productId' : 'subMealId'} value={ingredient.refId} />
				<input type="hidden" name="quantity" value={ingredient.quantity} />
				<button
					type="submit"
					aria-label="Add to shopping list"
					class={`h-8 w-8 flex items-center justify-center rounded-full ${
						addedToShopping
							? 'text-[var(--color-success)]'
							: 'text-[var(--color-text-muted)] hover:bg-[var(--color-surface-alt)]'
					}`}
				>
					<Icon name={addedToShopping ? 'check' : 'cart'} size={16} />
				</button>
			</form>
			<button
				type="button"
				aria-label="Edit quantity"
				onclick={startEdit}
				class="h-8 w-8 flex items-center justify-center rounded-full text-[var(--color-text-muted)] hover:bg-[var(--color-surface-alt)]"
			>
				<Icon name="edit" size={16} />
			</button>
			<form
				method="POST"
				action="?/removeIngredient"
				use:enhance={({ cancel }) => {
					if (!confirm(`Remove "${ingredient.name}"?`)) cancel();
				}}
			>
				<input type="hidden" name="ingredientId" value={ingredient.id} />
				<button
					type="submit"
					aria-label="Remove ingredient"
					class="h-8 w-8 flex items-center justify-center rounded-full text-[var(--color-danger)] hover:bg-[var(--color-danger-soft)]"
				>
					<Icon name="trash" size={16} />
				</button>
			</form>
		</div>
	</div>

	{#if editing}
		<form
			method="POST"
			action="?/updateIngredientQuantity"
			class="mt-2 flex items-end gap-2"
			use:enhance={() => {
				editError = '';
				return async ({ result, update }) => {
					if (result.type === 'success') {
						editing = false;
					} else if (result.type === 'failure') {
						editError = (result.data?.error as string) ?? 'Could not update quantity';
					}
					await update();
				};
			}}
		>
			<input type="hidden" name="ingredientId" value={ingredient.id} />
			<NumberField label="Quantity" name="quantity" bind:value={editQuantity} min={0.01} step={0.01} class="flex-1" />
			<Button type="button" variant="ghost" onclick={() => (editing = false)}>Cancel</Button>
			<Button type="submit" variant="primary">Save</Button>
		</form>
		{#if editError}
			<p class="mt-1 text-sm text-[var(--color-danger)]">{editError}</p>
		{/if}
	{/if}
</div>
