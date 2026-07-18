<script lang="ts">
	import Modal from './Modal.svelte';
	import Icon from './Icon.svelte';
	import Button from './Button.svelte';
	import { getTheme, setTheme, type Theme } from '$lib/utils/theme';

	let { open = $bindable(false) }: { open?: boolean } = $props();

	let theme = $state<Theme>('system');

	// Apple Health weight sync — reveal-on-demand so the token is only minted when wanted.
	let healthToken = $state('');
	let healthBusy = $state(false);
	let healthError = $state('');
	let copied = $state('');
	let copiedTimeout: ReturnType<typeof setTimeout> | undefined;

	const endpoint = $derived(
		typeof location !== 'undefined' ? `${location.origin}/api/weight` : '/api/weight'
	);

	async function revealHealthSetup() {
		healthBusy = true;
		healthError = '';
		try {
			const res = await fetch('/api/token', { method: 'POST' });
			if (!res.ok) throw new Error();
			healthToken = ((await res.json()) as { token: string }).token;
		} catch {
			healthError = 'Could not fetch your token — try again.';
		} finally {
			healthBusy = false;
		}
	}

	async function copy(label: string, value: string) {
		try {
			await navigator.clipboard.writeText(value);
			copied = label;
			clearTimeout(copiedTimeout);
			copiedTimeout = setTimeout(() => (copied = ''), 1500);
		} catch {
			// Clipboard unavailable — the value is visible and selectable either way.
		}
	}

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

		<div class="border-t border-[var(--color-border)] pt-4">
			<p class="section-label mb-2">Apple Health</p>
			{#if !healthToken}
				<p class="mb-2 text-xs text-[var(--color-text-muted)]">
					Auto-log your weight from Apple Health with a tiny iOS Shortcut — the browser can't read
					Health directly, but a Shortcut can post it here.
				</p>
				<Button variant="secondary" size="md" onclick={revealHealthSetup} disabled={healthBusy}>
					{healthBusy ? 'One moment…' : 'Set up weight sync'}
				</Button>
				{#if healthError}
					<p class="mt-2 text-sm text-[var(--color-danger)]">{healthError}</p>
				{/if}
			{:else}
				<ol class="list-decimal space-y-1.5 pl-4 text-xs leading-relaxed text-[var(--color-text-muted)]">
					<li>
						In <strong>Shortcuts</strong>, add “Find Health Samples” — type <strong>Weight</strong>,
						sorted latest first, limit 1.
					</li>
					<li>
						Add “Get Contents of URL” — method <strong>POST</strong>, JSON body with field
						<code>weight</code> set to the sample, and this header + URL:
					</li>
				</ol>
				<div class="mt-2 space-y-1.5">
					<div class="flex items-center gap-1.5">
						<code
							class="min-w-0 flex-1 truncate rounded-[var(--radius-sm)] bg-[var(--color-surface-alt)] px-2 py-1.5 font-mono text-[11px] text-[var(--color-text)]"
							>Authorization: Bearer {healthToken}</code
						>
						<Button variant="ghost" size="md" onclick={() => copy('auth', `Bearer ${healthToken}`)}>
							{copied === 'auth' ? 'Copied' : 'Copy'}
						</Button>
					</div>
					<div class="flex items-center gap-1.5">
						<code
							class="min-w-0 flex-1 truncate rounded-[var(--radius-sm)] bg-[var(--color-surface-alt)] px-2 py-1.5 font-mono text-[11px] text-[var(--color-text)]"
							>{endpoint}</code
						>
						<Button variant="ghost" size="md" onclick={() => copy('url', endpoint)}>
							{copied === 'url' ? 'Copied' : 'Copy'}
						</Button>
					</div>
				</div>
				<p class="mt-2 text-xs leading-relaxed text-[var(--color-text-muted)]">
					3. Run it after weighing, or schedule it as a daily Automation. Keep the token private —
					it can log to your account.
				</p>
			{/if}
		</div>

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
