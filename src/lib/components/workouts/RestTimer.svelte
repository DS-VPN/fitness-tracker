<script lang="ts">
	import Icon from '$lib/components/Icon.svelte';

	let { targetSeconds = 90 }: { targetSeconds?: number } = $props();

	// Drive the countdown off an absolute wall-clock deadline rather than a
	// decrementing counter. Browsers throttle or suspend setInterval when the
	// tab/app is backgrounded, which would freeze a counter-based timer; deriving
	// `remaining` from Date.now() means the elapsed time is always real, and a
	// visibilitychange resync makes the displayed value correct the instant the
	// app is brought back to the foreground.
	let endAt = $state(Date.now() + targetSeconds * 1000);
	let now = $state(Date.now());

	const remaining = $derived(Math.max(0, Math.ceil((endAt - now) / 1000)));
	const done = $derived(remaining <= 0);
	// Elapsed fraction, for the thin progress fill along the timer's bottom edge.
	const elapsedPct = $derived(targetSeconds > 0 ? Math.min(100, ((targetSeconds - remaining) / targetSeconds) * 100) : 100);

	$effect(() => {
		if (done) return;
		const interval = setInterval(() => {
			now = Date.now();
		}, 250);
		// Resync immediately when returning to the foreground — background timers
		// are throttled, so `now` may be stale until the next tick fires.
		const onVisible = () => {
			if (document.visibilityState === 'visible') now = Date.now();
		};
		document.addEventListener('visibilitychange', onVisible);
		return () => {
			clearInterval(interval);
			document.removeEventListener('visibilitychange', onVisible);
		};
	});

	function adjust(delta: number) {
		now = Date.now();
		// Clamp so the deadline never falls into the past when subtracting.
		endAt = Math.max(now, endAt + delta * 1000);
	}

	function skip() {
		endAt = Date.now();
		now = endAt;
	}

	function fmt(s: number) {
		const m = Math.floor(s / 60);
		const sec = s % 60;
		return `${m}:${String(sec).padStart(2, '0')}`;
	}
</script>

<div
	class={`sticky top-[calc(3.5rem+env(safe-area-inset-top))] z-10 rounded-[var(--radius-lg)] border overflow-hidden shadow-[var(--shadow-soft)] ${
		done
			? 'bg-[var(--color-success-soft)] border-[var(--color-success)]'
			: 'bg-[var(--color-surface-alt)] border-[var(--color-border)]'
	}`}
>
	<div class="p-3 flex items-center justify-between gap-3">
		<div>
			<p class="text-xs font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">
				{done ? 'Rest done — go' : 'Resting'}
			</p>
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
	<!-- Elapsed-rest fill along the bottom edge -->
	<div class="h-1 bg-[var(--color-border)]">
		<div
			class={`h-full transition-[width] duration-1000 ease-linear ${done ? 'bg-[var(--color-success)]' : 'bg-[var(--color-accent)]'}`}
			style={`width:${elapsedPct}%`}
		></div>
	</div>
</div>
