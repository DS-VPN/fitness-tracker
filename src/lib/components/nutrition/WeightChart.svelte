<script lang="ts">
	type Point = { date: string; weightKg: number; trendKg: number };

	let { points }: { points: Point[] } = $props();

	const width = 320;
	const height = 96;
	const padding = { top: 8, right: 8, bottom: 8, left: 34 };

	const layout = $derived.by(() => {
		if (points.length === 0) return null;
		const values = points.flatMap((p) => [p.weightKg, p.trendKg]);
		let min = Math.min(...values);
		let max = Math.max(...values);
		// Keep at least a 1 kg span so a flat week doesn't render as wild swings.
		if (max - min < 1) {
			const mid = (max + min) / 2;
			min = mid - 0.5;
			max = mid + 0.5;
		}
		const innerW = width - padding.left - padding.right;
		const innerH = height - padding.top - padding.bottom;
		const x = (i: number) =>
			padding.left + (points.length === 1 ? innerW / 2 : (i / (points.length - 1)) * innerW);
		const y = (v: number) => padding.top + innerH - ((v - min) / (max - min)) * innerH;
		return {
			min,
			max,
			scale: points.map((p, i) => ({ x: x(i), y: y(p.weightKg) })),
			trend: points.map((p, i) => `${x(i).toFixed(1)},${y(p.trendKg).toFixed(1)}`).join(' ')
		};
	});

	const fmt = (n: number) => String(Math.round(n * 10) / 10);
</script>

{#if layout}
	<svg
		viewBox={`0 0 ${width} ${height}`}
		class="w-full h-auto"
		preserveAspectRatio="xMidYMid meet"
		role="img"
		aria-label="Body weight and smoothed trend"
	>
		<text
			x={padding.left - 6}
			y={padding.top + 7}
			text-anchor="end"
			font-size="9"
			class="fill-[var(--color-text-muted)]">{fmt(layout.max)}</text
		>
		<text
			x={padding.left - 6}
			y={height - padding.bottom}
			text-anchor="end"
			font-size="9"
			class="fill-[var(--color-text-muted)]">{fmt(layout.min)}</text
		>

		{#each layout.scale as p, i (i)}
			<circle cx={p.x} cy={p.y} r="2.2" class="fill-[var(--color-text-muted)] opacity-40" />
		{/each}

		{#if points.length > 1}
			<polyline
				points={layout.trend}
				fill="none"
				class="stroke-[var(--color-accent)]"
				stroke-width="2"
				stroke-linejoin="round"
				stroke-linecap="round"
			/>
		{/if}
	</svg>
{/if}
