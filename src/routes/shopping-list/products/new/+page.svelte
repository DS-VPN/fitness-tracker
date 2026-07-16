<script lang="ts">
	import PageHeader from '$lib/components/PageHeader.svelte';
	import ProductForm from '$lib/components/shopping/ProductForm.svelte';
	import type { ActionData } from './$types';

	let { form }: { form: ActionData } = $props();
</script>

<svelte:head><title>New product · Fitness Tracker</title></svelte:head>

<PageHeader title="New product" back="/shopping-list/products" />

<div class="mx-auto max-w-md px-4 pt-2">
	<ProductForm submitLabel="Add product" formError={form?.error} />
</div>
