<script lang="ts">
	import PageHeader from '$lib/components/PageHeader.svelte';
	import EmptyState from '$lib/components/EmptyState.svelte';
	import Button from '$lib/components/Button.svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	// Default to a natural before/after: oldest on the left, newest on the right. `photos` is newest-first.
	const oldest = $derived(data.photos[data.photos.length - 1]);
	const newest = $derived(data.photos[0]);

	let leftId = $state<number | null>(null);
	let rightId = $state<number | null>(null);

	$effect(() => {
		if (leftId === null && oldest) leftId = oldest.id;
		if (rightId === null && newest) rightId = newest.id;
	});

	const options = $derived(
		data.photos.map((p) => ({
			id: p.id,
			label: `${fmtDate(p.date)}${p.pose ? ` · ${p.pose}` : ''}`
		}))
	);

	const left = $derived(data.photos.find((p) => p.id === leftId) ?? null);
	const right = $derived(data.photos.find((p) => p.id === rightId) ?? null);

	function fmtDate(d: string) {
		return new Date(`${d}T00:00:00`).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
	}
</script>

<svelte:head><title>Compare · Fitness Tracker</title></svelte:head>

<PageHeader title="Compare" back="/body/photos" />

<div class="mx-auto max-w-md px-4 pb-4 space-y-4">
	{#if data.photos.length < 2}
		<EmptyState icon="camera" title="Need two photos" description="Add at least two progress photos to compare them side by side.">
			<Button href="/body/photos" variant="primary">Back to photos</Button>
		</EmptyState>
	{:else}
		<div class="grid grid-cols-2 gap-3">
			{#each [{ side: 'left', id: leftId, photo: left }, { side: 'right', id: rightId, photo: right }] as col (col.side)}
				<div class="space-y-2">
					<select
						aria-label={`${col.side} photo`}
						value={col.id}
						onchange={(e) => {
							const v = Number((e.currentTarget as HTMLSelectElement).value);
							if (col.side === 'left') leftId = v;
							else rightId = v;
						}}
						class="w-full h-10 px-2.5 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] text-xs text-[var(--color-text)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
					>
						{#each options as opt (opt.id)}
							<option value={opt.id}>{opt.label}</option>
						{/each}
					</select>
					<div class="overflow-hidden rounded-[var(--radius-md)] bg-[var(--color-surface-alt)]">
						{#if col.photo}
							<img src={`/body/photos/${col.photo.id}/file`} alt={`Progress photo ${fmtDate(col.photo.date)}`} class="aspect-[3/4] w-full object-cover" />
						{/if}
					</div>
					{#if col.photo?.caption}
						<p class="text-center text-xs text-[var(--color-text-muted)]">{col.photo.caption}</p>
					{/if}
				</div>
			{/each}
		</div>
	{/if}
</div>
