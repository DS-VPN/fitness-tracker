<script lang="ts">
	let {
		label,
		value,
		unit = '',
		icon
	}: { label: string; value: string | number; unit?: string; icon?: 'star' } = $props();
</script>

<div
	class="flex flex-col items-center justify-center gap-0.5 rounded-[var(--radius-md)] bg-[var(--color-surface-alt)] px-3 py-3 text-center"
>
	<span class="text-lg font-semibold text-[var(--color-accent)]"
		>{value}{#if unit}<span class="text-sm font-normal text-[var(--color-text-muted)]"> {unit}</span
			>{/if}</span
	>
	<span class="text-xs text-[var(--color-text-muted)]">{label}</span>
</div>
