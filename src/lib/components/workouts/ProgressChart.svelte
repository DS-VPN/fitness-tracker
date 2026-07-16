<script lang="ts">
	type HistoryPoint = { date: string; topWeight: number };

	let { history }: { history: HistoryPoint[] } = $props();

	const width = 320;
	const height = 160;
	const padding = { top: 10, right: 12, bottom: 22, left: 34 };

	function formatDate(d: string) {
		const date = new Date(`${d}T00:00:00`);
		return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
	}

	const points = $derived.by(() => {
		if (history.length === 0) return [];
		const weights = history.map((h) => h.topWeight);
		const minW = Math.min(...weights);
		const maxW = Math.max(...weights);
		const range = maxW - minW || 1;
		const innerW = width - padding.left - padding.right;
		const innerH = height - padding.top - padding.bottom;
		return history.map((h, i) => {
			const x = padding.left + (history.length === 1 ? innerW / 2 : (i / (history.length - 1)) * innerW);
			const y = padding.top + innerH - ((h.topWeight - minW) / range) * innerH;
			return { x, y, date: h.date, topWeight: h.topWeight };
		});
	});

	const polylinePoints = $derived(points.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' '));
	const minWeight = $derived(history.length ? Math.min(...history.map((h) => h.topWeight)) : 0);
	const maxWeight = $derived(history.length ? Math.max(...history.map((h) => h.topWeight)) : 0);
</script>

<div class="w-full overflow-x-auto">
	<svg
		viewBox={`0 0 ${width} ${height}`}
		class="w-full h-auto min-w-[260px]"
		preserveAspectRatio="xMidYMid meet"
		role="img"
		aria-label="Top weight per session over time"
	>
		<line
			x1={padding.left}
			y1={padding.top}
			x2={padding.left}
			y2={height - padding.bottom}
			class="stroke-[var(--color-border)]"
			stroke-width="1"
		/>
		<line
			x1={padding.left}
			y1={height - padding.bottom}
			x2={width - padding.right}
			y2={height - padding.bottom}
			class="stroke-[var(--color-border)]"
			stroke-width="1"
		/>

		{#if points.length > 0}
			<text x={padding.left - 6} y={padding.top + 8} text-anchor="end" font-size="9" class="fill-[var(--color-text-muted)]"
				>{maxWeight}</text
			>
			<text x={padding.left - 6} y={height - padding.bottom} text-anchor="end" font-size="9" class="fill-[var(--color-text-muted)]"
				>{minWeight}</text
			>

			<polyline
				points={polylinePoints}
				fill="none"
				class="stroke-[var(--color-accent)]"
				stroke-width="2"
				stroke-linejoin="round"
				stroke-linecap="round"
			/>

			{#each points as p, i (i)}
				<circle cx={p.x} cy={p.y} r="3" class="fill-[var(--color-accent)]" />
			{/each}

			<text x={points[0].x} y={height - 6} text-anchor="start" font-size="9" class="fill-[var(--color-text-muted)]"
				>{formatDate(points[0].date)}</text
			>
			{#if points.length > 1}
				<text
					x={points[points.length - 1].x}
					y={height - 6}
					text-anchor="end"
					font-size="9"
					class="fill-[var(--color-text-muted)]">{formatDate(points[points.length - 1].date)}</text
				>
			{/if}
		{/if}
	</svg>
</div>
