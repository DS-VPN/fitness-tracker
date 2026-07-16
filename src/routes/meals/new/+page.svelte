<script lang="ts">
	import PageHeader from '$lib/components/PageHeader.svelte';
	import MealForm from '$lib/components/meals/MealForm.svelte';
	import type { ActionData, PageData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();
</script>

<svelte:head><title>New meal · Fitness Tracker</title></svelte:head>

<PageHeader title="New meal" back="/meals" />

<div class="mx-auto max-w-md px-4 pt-2">
	<MealForm categories={data.categories} submitLabel="Add meal" formError={form?.error} />
</div>
