<script lang="ts">
	let {
		label,
		value,
		target,
		unit = 'g'
	}: {
		label: string;
		value: number;
		target: number;
		unit?: string;
	} = $props();

	const pct = $derived(target > 0 ? Math.min(value / target, 1) : 0);
	const remaining = $derived(Math.round((target - value) * 10) / 10);
	const over = $derived(target > 0 && value > target);

	function fmt(n: number) {
		return Math.round(n * 10) / 10;
	}
</script>

<div>
	<div class="flex items-baseline justify-between gap-2 mb-1">
		<span class="text-xs font-medium text-[var(--color-text)]">{label}</span>
		<span class="text-xs text-[var(--color-text-muted)] tabular-nums">
			{fmt(value)} / {fmt(target)} {unit}
			{#if over}
				<span class="text-[var(--color-danger)]">· {fmt(-remaining)} over</span>
			{:else}
				· {remaining} left
			{/if}
		</span>
	</div>
	<div class="h-2 rounded-full bg-[var(--color-surface-alt)] overflow-hidden">
		<div
			class={`h-full rounded-full ${over ? 'bg-[var(--color-danger)]' : 'bg-[var(--color-accent)]'}`}
			style={`width:${pct * 100}%`}
		></div>
	</div>
</div>
