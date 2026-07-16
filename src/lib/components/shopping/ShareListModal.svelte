<script lang="ts">
	import { enhance } from '$app/forms';
	import Modal from '$lib/components/Modal.svelte';
	import TextField from '$lib/components/TextField.svelte';
	import Button from '$lib/components/Button.svelte';
	import Icon from '$lib/components/Icon.svelte';

	let {
		open = $bindable(false),
		shares
	}: {
		open?: boolean;
		shares: { userId: number; username: string }[];
	} = $props();

	let username = $state('');
	let shareError = $state('');
</script>

<Modal bind:open title="Share your list">
	<div class="space-y-2">
		{#each shares as share (share.userId)}
			<div class="flex items-center justify-between gap-2">
				<span class="text-sm text-[var(--color-text)]">{share.username}</span>
				<form method="POST" action="?/revokeShare" use:enhance>
					<input type="hidden" name="userId" value={share.userId} />
					<Button type="submit" variant="ghost" size="md">Remove</Button>
				</form>
			</div>
		{:else}
			<p class="text-sm text-[var(--color-text-muted)]">Nobody has access to your list yet.</p>
		{/each}
	</div>

	<form
		method="POST"
		action="?/share"
		class="mt-4 flex items-end gap-2 border-t border-[var(--color-border)] pt-4"
		use:enhance={() => {
			shareError = '';
			return async ({ result, update }) => {
				if (result.type === 'success') {
					username = '';
				} else if (result.type === 'failure') {
					shareError = (result.data as { error?: string } | undefined)?.error ?? 'Could not share list';
				}
				await update({ reset: false });
			};
		}}
	>
		<TextField label="Share with username" name="username" bind:value={username} placeholder="e.g. anna" class="flex-1" />
		<Button type="submit" variant="primary" size="icon">
			<Icon name="plus" size={20} />
			<span class="sr-only">Share</span>
		</Button>
	</form>
	{#if shareError}
		<p class="mt-2 text-sm text-[var(--color-danger)]">{shareError}</p>
	{/if}
</Modal>
