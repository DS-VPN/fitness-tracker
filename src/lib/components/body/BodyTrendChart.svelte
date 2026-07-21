<script lang="ts">
	import { kgToDisplay, round1, type WeightUnit } from '$lib/utils/units';

	type Point = { date: string; weightKg: number; avgKg: number };

	let { points, unit }: { points: Point[]; unit: WeightUnit } = $props();

	const width = 320;
	const height = 170;
	const padding = { top: 12, right: 12, bottom: 22, left: 40 };

	function formatDate(d: string) {
		return new Date(`${d}T00:00:00`).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
	}

	// Everything is scaled/labelled in the user's display unit; canonical kg comes in from the server.
	const view = $derived.by(() => {
		if (points.length === 0) return null;
		const raw = points.map((p) => kgToDisplay(p.weightKg, unit));
		const avg = points.map((p) => kgToDisplay(p.avgKg, unit));
		const all = [...raw, ...avg];
		const minV = Math.min(...all);
		const maxV = Math.max(...all);
		const range = maxV - minV || 1;
		const innerW = width - padding.left - padding.right;
		const innerH = height - padding.top - padding.bottom;
		const x = (i: number) =>
			padding.left + (points.length === 1 ? innerW / 2 : (i / (points.length - 1)) * innerW);
		const y = (v: number) => padding.top + innerH - ((v - minV) / range) * innerH;
		return {
			minV,
			maxV,
			rawPts: raw.map((v, i) => ({ x: x(i), y: y(v) })),
			avgLine: avg.map((v, i) => `${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(' ')
		};
	});
</script>

<div class="w-full overflow-x-auto">
	<svg
		viewBox={`0 0 ${width} ${height}`}
		class="w-full h-auto min-w-[260px]"
		preserveAspectRatio="xMidYMid meet"
		role="img"
		aria-label="Body weight over time"
	>
		<line x1={padding.left} y1={padding.top} x2={padding.left} y2={height - padding.bottom} class="stroke-[var(--color-border)]" stroke-width="1" />
		<line x1={padding.left} y1={height - padding.bottom} x2={width - padding.right} y2={height - padding.bottom} class="stroke-[var(--color-border)]" stroke-width="1" />

		{#if view}
			<text x={padding.left - 6} y={padding.top + 8} text-anchor="end" font-size="9" class="fill-[var(--color-text-muted)]">{round1(view.maxV)}</text>
			<text x={padding.left - 6} y={height - padding.bottom} text-anchor="end" font-size="9" class="fill-[var(--color-text-muted)]">{round1(view.minV)}</text>

			<!-- Raw daily points, faint -->
			{#each view.rawPts as p, i (i)}
				<circle cx={p.x} cy={p.y} r="2" class="fill-[var(--color-text-muted)]" opacity="0.5" />
			{/each}

			<!-- Smoothed trend line (7-point moving average), accent -->
			<polyline points={view.avgLine} fill="none" class="stroke-[var(--color-accent)]" stroke-width="2" stroke-linejoin="round" stroke-linecap="round" />

			<text x={view.rawPts[0].x} y={height - 6} text-anchor="start" font-size="9" class="fill-[var(--color-text-muted)]">{formatDate(points[0].date)}</text>
			{#if points.length > 1}
				<text x={view.rawPts[view.rawPts.length - 1].x} y={height - 6} text-anchor="end" font-size="9" class="fill-[var(--color-text-muted)]">{formatDate(points[points.length - 1].date)}</text>
			{/if}
		{/if}
	</svg>
	<p class="mt-1 text-center text-[11px] text-[var(--color-text-muted)]">
		<span class="text-[var(--color-accent)]">—</span> 7-day trend · dots are daily weigh-ins
	</p>
</div>
