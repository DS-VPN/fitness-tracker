<script lang="ts">
	import PageHeader from '$lib/components/PageHeader.svelte';
	import MealForm from '$lib/components/meals/MealForm.svelte';
	import type { ActionData, PageData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();
</script>

<svelte:head><title>Edit {data.meal.name} · Fitness Tracker</title></svelte:head>

<PageHeader title="Edit meal" back={`/meals/${data.meal.id}`} />

<div class="mx-auto max-w-md px-4 pt-2">
	{#key data.meal.id}
		<MealForm
			categories={data.categories}
			initial={{
				name: data.meal.name,
				portions: data.meal.portions,
				categoryIds: data.meal.categories.map((c) => c.id)
			}}
			submitLabel="Save changes"
			formError={form?.error}
		/>
	{/key}
</div>
