<script lang="ts">
	// A GitHub-style contribution grid for dose adherence. `days` is ascending (oldest first); each cell
	// is colored by whether a dose was due and whether one was logged. Hand-rolled to match the app's
	// no-charting-library convention (see ProgressChart).

	type Day = { date: string; count: number; due: boolean };
	let { days, today }: { days: Day[]; today: string } = $props();

	function weekday(iso: string): number {
		const [y, m, d] = iso.split('-').map(Number);
		return new Date(y, m - 1, d, 12).getDay();
	}

	// Pad the front so the first column starts on the correct weekday row (Sun = row 0), then chunk to weeks.
	const columns = $derived.by(() => {
		if (days.length === 0) return [] as (Day | null)[][];
		const pad = weekday(days[0].date);
		const cells: (Day | null)[] = [...Array(pad).fill(null), ...days];
		const cols: (Day | null)[][] = [];
		for (let i = 0; i < cells.length; i += 7) cols.push(cells.slice(i, i + 7));
		return cols;
	});

	function cellClass(day: Day | null): string {
		if (!day) return 'bg-transparent';
		const isToday = day.date === today;
		const ring = isToday ? ' ring-2 ring-[var(--color-accent)] ring-offset-1 ring-offset-[var(--color-surface)]' : '';
		if (day.count > 0) return `bg-[var(--color-accent)]${ring}`;
		if (day.due && day.date < today) return `bg-[var(--color-danger-soft)]${ring}`; // missed
		if (day.due) return `bg-[var(--color-accent-soft)]${ring}`; // due, not yet logged (today/future)
		return `bg-[var(--color-surface-alt)]${ring}`;
	}

	function label(day: Day | null): string {
		if (!day) return '';
		const when = new Date(`${day.date}T00:00:00`).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
		if (day.count > 0) return `${when}: ${day.count} dose${day.count > 1 ? 's' : ''} logged`;
		if (day.due && day.date < today) return `${when}: dose due, none logged`;
		if (day.due) return `${when}: dose due`;
		return `${when}: nothing scheduled`;
	}
</script>

<div class="overflow-x-auto">
	<div class="flex gap-1 min-w-max">
		{#each columns as col, ci (ci)}
			<div class="flex flex-col gap-1">
				{#each col as day, ri (ri)}
					<div class={`h-3.5 w-3.5 rounded-[3px] ${cellClass(day)}`} title={label(day)}></div>
				{/each}
			</div>
		{/each}
	</div>
</div>

<div class="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-[var(--color-text-muted)]">
	<span class="flex items-center gap-1.5"><span class="h-3 w-3 rounded-[3px] bg-[var(--color-accent)]"></span> Logged</span>
	<span class="flex items-center gap-1.5"><span class="h-3 w-3 rounded-[3px] bg-[var(--color-danger-soft)]"></span> Missed</span>
	<span class="flex items-center gap-1.5"><span class="h-3 w-3 rounded-[3px] bg-[var(--color-accent-soft)]"></span> Due</span>
	<span class="flex items-center gap-1.5"><span class="h-3 w-3 rounded-[3px] bg-[var(--color-surface-alt)]"></span> Rest day</span>
</div>
