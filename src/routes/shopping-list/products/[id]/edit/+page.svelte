<script lang="ts">
	import { enhance } from '$app/forms';
	import PageHeader from '$lib/components/PageHeader.svelte';
	import ProductForm from '$lib/components/shopping/ProductForm.svelte';
	import Button from '$lib/components/Button.svelte';
	import Icon from '$lib/components/Icon.svelte';
	import type { ActionData, PageData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();
</script>

<svelte:head><title>Edit {data.product.name} · Fitness Tracker</title></svelte:head>

<PageHeader title="Edit product" back="/shopping-list/products" />

<div class="mx-auto max-w-md px-4 pt-2 space-y-4">
	{#key data.product.id}
		<ProductForm
			action="?/update"
			initial={{
				name: data.product.name,
				brand: data.product.brand,
				barcode: data.product.barcode,
				servingSize: data.product.servingSize,
				calories: data.product.calories,
				protein: data.product.protein,
				carbs: data.product.carbs,
				fat: data.product.fat,
				fiber: data.product.fiber,
				sugar: data.product.sugar,
				sodium: data.product.sodium
			}}
			submitLabel="Save changes"
			formError={form?.error}
		/>
	{/key}

	<form
		method="POST"
		action="?/delete"
		use:enhance={({ cancel }) => {
			if (!confirm(`Delete "${data.product.name}"? This can't be undone.`)) {
				cancel();
			}
		}}
	>
		<Button type="submit" variant="danger" size="md" full class="w-full">
			<Icon name="trash" size={16} />
			Delete product
		</Button>
	</form>
</div>
