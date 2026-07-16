<script lang="ts">
	import Icon from '$lib/components/Icon.svelte';

	let { targetSeconds = 90 }: { targetSeconds?: number } = $props();

	let remaining = $state(targetSeconds);
	const done = $derived(remaining <= 0);

	$effect(() => {
		if (remaining <= 0) return;
		const interval = setInterval(() => {
			remaining = Math.max(0, remaining - 1);
		}, 1000);
		return () => clearInterval(interval);
	});

	function adjust(delta: number) {
		remaining = Math.max(0, remaining + delta);
	}

	function skip() {
		remaining = 0;
	}

	function fmt(s: number) {
		const m = Math.floor(s / 60);
		const sec = s % 60;
		return `${m}:${String(sec).padStart(2, '0')}`;
	}
</script>

<div
	class={`sticky top-[calc(3.5rem+env(safe-area-inset-top))] z-10 rounded-[var(--radius-lg)] border p-3 flex items-center justify-between gap-3 shadow-[var(--shadow-soft)] ${
		done
			? 'bg-[var(--color-success-soft)] border-[var(--color-success)]'
			: 'bg-[var(--color-surface-alt)] border-[var(--color-border)]'
	}`}
>
	<div>
		<p class="text-xs text-[var(--color-text-muted)]">{done ? 'Rest done — go!' : 'Resting'}</p>
		<p class={`text-2xl font-semibold tabular-nums ${done ? 'text-[var(--color-success)]' : 'text-[var(--color-text)]'}`}>
			{fmt(remaining)}
		</p>
	</div>
	<div class="flex items-center gap-1.5">
		<button
			type="button"
			aria-label="Subtract 15 seconds"
			onclick={() => adjust(-15)}
			class="h-9 w-9 flex items-center justify-center rounded-full bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-text)]"
		>
			<Icon name="minus" size={16} />
		</button>
		<button
			type="button"
			aria-label="Add 15 seconds"
			onclick={() => adjust(15)}
			class="h-9 w-9 flex items-center justify-center rounded-full bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-text)]"
		>
			<Icon name="plus" size={16} />
		</button>
		<button
			type="button"
			onclick={skip}
			class="h-9 px-3 flex items-center justify-center rounded-full bg-[var(--color-surface)] border border-[var(--color-border)] text-sm text-[var(--color-text-muted)]"
		>
			Skip
		</button>
	</div>
</div>
