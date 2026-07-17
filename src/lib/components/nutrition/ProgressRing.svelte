<script lang="ts">
	let {
		value,
		target,
		size = 116
	}: {
		value: number;
		target: number;
		size?: number;
	} = $props();

	const stroke = 9;
	const radius = $derived((size - stroke) / 2);
	const circumference = $derived(2 * Math.PI * radius);
	const pct = $derived(target > 0 ? Math.min(value / target, 1) : 0);
	const over = $derived(target > 0 && value > target);
</script>

<div class="relative shrink-0" style={`width:${size}px;height:${size}px`}>
	<svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden="true">
		<circle
			cx={size / 2}
			cy={size / 2}
			r={radius}
			fill="none"
			class="stroke-[var(--color-surface-alt)]"
			stroke-width={stroke}
		/>
		<circle
			cx={size / 2}
			cy={size / 2}
			r={radius}
			fill="none"
			class={over ? 'stroke-[var(--color-danger)]' : 'stroke-[var(--color-accent)]'}
			stroke-width={stroke}
			stroke-linecap="round"
			stroke-dasharray={circumference}
			stroke-dashoffset={circumference * (1 - pct)}
			transform={`rotate(-90 ${size / 2} ${size / 2})`}
		/>
	</svg>
	<div class="absolute inset-0 flex flex-col items-center justify-center">
		<span class="text-xl font-semibold text-[var(--color-text)] tabular-nums leading-none">{Math.round(value)}</span>
		<span class="text-[10px] text-[var(--color-text-muted)] mt-0.5">of {Math.round(target)} kcal</span>
	</div>
</div>
