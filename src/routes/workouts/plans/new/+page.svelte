<script lang="ts">
	import { enhance } from '$app/forms';
	import PageHeader from '$lib/components/PageHeader.svelte';
	import TextField from '$lib/components/TextField.svelte';
	import Button from '$lib/components/Button.svelte';
	import type { ActionData } from './$types';

	let { form }: { form: ActionData } = $props();

	let name = $state('');
	let submitting = $state(false);
</script>

<svelte:head><title>New plan · Fitness Tracker</title></svelte:head>

<PageHeader title="New plan" back="/workouts/plans" />

<div class="mx-auto max-w-md px-4 pt-2">
	<form
		method="POST"
		class="space-y-5"
		use:enhance={() => {
			submitting = true;
			return async ({ update }) => {
				await update();
				submitting = false;
			};
		}}
	>
		<TextField label="Name" name="name" bind:value={name} required placeholder="e.g. Push Day" />
		{#if form?.error}
			<p class="text-sm text-[var(--color-danger)]">{form.error}</p>
		{/if}
		<Button type="submit" variant="primary" size="lg" full class="w-full" disabled={submitting}>
			Create plan
		</Button>
	</form>
</div>
