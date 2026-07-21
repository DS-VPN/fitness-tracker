<script lang="ts">
	import { page } from '$app/state';
	import Modal from './Modal.svelte';
	import Icon from './Icon.svelte';
	import { getTheme, setTheme, type Theme } from '$lib/utils/theme';

	let { open = $bindable(false) }: { open?: boolean } = $props();

	const isAdmin = $derived(page.data.user?.isAdmin ?? false);

	let theme = $state<Theme>('system');

	// Sync the control with the persisted value whenever the sheet opens.
	$effect(() => {
		if (open) theme = getTheme();
	});

	const options: { value: Theme; label: string }[] = [
		{ value: 'light', label: 'Light' },
		{ value: 'dark', label: 'Dark' },
		{ value: 'system', label: 'System' }
	];

	function choose(value: Theme) {
		theme = value;
		setTheme(value);
	}
</script>

<Modal bind:open title="Settings">
	<div class="space-y-5">
		<div>
			<p class="section-label mb-2">Appearance</p>
			<div class="flex gap-1 rounded-[var(--radius-md)] bg-[var(--color-surface-alt)] p-1">
				{#each options as option (option.value)}
					<button
						type="button"
						onclick={() => choose(option.value)}
						aria-pressed={theme === option.value}
						class={`flex-1 rounded-[calc(var(--radius-md)-2px)] py-1.5 text-sm font-medium transition-colors ${
							theme === option.value
								? 'bg-[var(--color-surface)] text-[var(--color-text)] shadow-[var(--shadow-soft)]'
								: 'text-[var(--color-text-muted)]'
						}`}
					>
						{option.label}
					</button>
				{/each}
			</div>
			<p class="mt-2 text-xs text-[var(--color-text-muted)]">
				System follows your device's light or dark setting.
			</p>
		</div>

		{#if isAdmin}
			<a
				href="/admin"
				onclick={() => (open = false)}
				class="flex items-center gap-2 border-t border-[var(--color-border)] pt-4 px-1 pb-1 text-sm font-medium text-[var(--color-text)] hover:text-[var(--color-accent)]"
			>
				<Icon name="sliders" size={18} />
				Admin panel
			</a>
		{/if}

		<form method="POST" action="/logout" class="border-t border-[var(--color-border)] pt-4">
			<button
				type="submit"
				class="flex w-full items-center gap-2 rounded-[var(--radius-md)] px-1 py-2 text-sm font-medium text-[var(--color-danger)] hover:bg-[var(--color-danger-soft)]"
			>
				<Icon name="logout" size={18} />
				Sign out
			</button>
		</form>
	</div>
</Modal>
