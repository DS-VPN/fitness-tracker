<script lang="ts">
	import { enhance } from '$app/forms';
	import Modal from '$lib/components/Modal.svelte';
	import TextField from '$lib/components/TextField.svelte';
	import Button from '$lib/components/Button.svelte';

	let { open = $bindable(false) }: { open?: boolean } = $props();

	let username = $state('');
	let password = $state('');
	let error = $state('');

	$effect(() => {
		if (open) {
			username = '';
			password = '';
			error = '';
		}
	});
</script>

<Modal bind:open title="Add user">
	<form
		method="POST"
		action="?/createUser"
		class="space-y-4"
		use:enhance={() => {
			error = '';
			return async ({ result, update }) => {
				if (result.type === 'success') open = false;
				else if (result.type === 'failure') error = (result.data?.error as string) ?? 'Could not create user';
				await update({ reset: false });
			};
		}}
	>
		<TextField label="Username" name="username" bind:value={username} required hint="3–24 chars: letters, numbers, _ or -." />
		<TextField label="Password" name="password" type="password" bind:value={password} required hint="At least 8 characters." />
		{#if error}
			<p class="text-sm text-[var(--color-danger)]">{error}</p>
		{/if}
		<Button type="submit" variant="primary" full class="w-full">Create user</Button>
	</form>
</Modal>
