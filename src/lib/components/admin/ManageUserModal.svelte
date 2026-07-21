<script lang="ts">
	import { enhance } from '$app/forms';
	import Modal from '$lib/components/Modal.svelte';
	import TextField from '$lib/components/TextField.svelte';
	import Button from '$lib/components/Button.svelte';
	import Icon from '$lib/components/Icon.svelte';

	// Structural subset of AdminUser — kept local so a client component never imports from $lib/server.
	type ManagedUser = { id: number; username: string; isAdmin: boolean; meals: number; workouts: number; photos: number };

	let {
		open = $bindable(false),
		user,
		meId,
		adminCount
	}: { open?: boolean; user: ManagedUser | null; meId: number; adminCount: number } = $props();

	let newPassword = $state('');
	let error = $state('');
	let confirmDelete = $state(false);

	$effect(() => {
		if (open) {
			newPassword = '';
			error = '';
			confirmDelete = false;
		}
	});

	const isSelf = $derived(!!user && user.id === meId);
	const isLastAdmin = $derived(!!user && user.isAdmin && adminCount <= 1);

	function onResult(closeOnSuccess = true) {
		return async ({ result, update }: { result: { type: string; data?: Record<string, unknown> }; update: () => Promise<void> }) => {
			if (result.type === 'success') {
				if (closeOnSuccess) open = false;
			} else if (result.type === 'failure') {
				error = (result.data?.error as string) ?? 'Something went wrong';
			}
			await update();
		};
	}
</script>

<Modal bind:open title={user?.username ?? 'User'}>
	{#if user}
		<div class="space-y-5">
			<p class="text-xs text-[var(--color-text-muted)] tabular-nums">
				{user.meals} meals · {user.workouts} workouts · {user.photos} photos
			</p>

			<!-- Reset password -->
			<form
				method="POST"
				action="?/setPassword"
				class="space-y-3"
				use:enhance={() => {
					error = '';
					return onResult();
				}}
			>
				<input type="hidden" name="userId" value={user.id} />
				<TextField label="Set new password" name="password" type="password" bind:value={newPassword} required hint="Immediately signs out their existing sessions." />
				<Button type="submit" variant="secondary" full class="w-full">Reset password</Button>
			</form>

			<!-- Role -->
			<form
				method="POST"
				action="?/toggleAdmin"
				class="border-t border-[var(--color-border)] pt-4"
				use:enhance={() => {
					error = '';
					return onResult();
				}}
			>
				<input type="hidden" name="userId" value={user.id} />
				<input type="hidden" name="value" value={(!user.isAdmin).toString()} />
				<div class="flex items-center justify-between gap-3">
					<div>
						<p class="text-sm font-medium text-[var(--color-text)]">Role</p>
						<p class="text-xs text-[var(--color-text-muted)]">{user.isAdmin ? 'Administrator' : 'Standard user'}</p>
					</div>
					<Button type="submit" variant="secondary" disabled={isLastAdmin}>
						{user.isAdmin ? 'Remove admin' : 'Make admin'}
					</Button>
				</div>
				{#if isLastAdmin}
					<p class="mt-2 text-xs text-[var(--color-text-muted)]">This is the only admin — promote someone else first.</p>
				{/if}
			</form>

			<!-- Delete -->
			{#if isSelf}
				<p class="border-t border-[var(--color-border)] pt-4 text-xs text-[var(--color-text-muted)]">
					You can't delete or demote your own account here.
				</p>
			{:else if !isLastAdmin}
				<form
					method="POST"
					action="?/deleteUser"
					class="border-t border-[var(--color-border)] pt-4"
					use:enhance={() => {
						error = '';
						return onResult();
					}}
				>
					<input type="hidden" name="userId" value={user.id} />
					{#if confirmDelete}
						<p class="mb-2 text-sm text-[var(--color-text)]">
							Permanently delete <span class="font-medium">{user.username}</span> and all their data
							({user.meals} meals, {user.workouts} workouts, {user.photos} photos)? This can't be undone.
						</p>
						<div class="flex gap-2">
							<Button type="button" variant="ghost" full class="w-full" onclick={() => (confirmDelete = false)}>Cancel</Button>
							<Button type="submit" variant="danger" full class="w-full">Delete permanently</Button>
						</div>
					{:else}
						<Button type="button" variant="danger" full class="w-full" onclick={() => (confirmDelete = true)}>
							<Icon name="trash" size={16} />
							Delete user
						</Button>
					{/if}
				</form>
			{/if}

			{#if error}
				<p class="text-sm text-[var(--color-danger)]">{error}</p>
			{/if}
		</div>
	{/if}
</Modal>
