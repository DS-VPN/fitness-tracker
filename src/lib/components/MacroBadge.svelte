<script lang="ts">
	let {
		calories,
		protein,
		carbs,
		fat,
		class: className = ''
	}: { calories: number; protein: number; carbs: number; fat: number; class?: string } = $props();

	const fmt = (n: number) => (Number.isInteger(n) ? n : Math.round(n * 10) / 10);
</script>

<p class={`text-sm text-[var(--color-text-muted)] tabular-nums ${className}`}>
	<span class="font-medium text-[var(--color-text)]">{fmt(calories)}</span> kcal
	<span class="mx-1 opacity-50">·</span>{fmt(protein)}p
	<span class="mx-1 opacity-50">·</span>{fmt(carbs)}c
	<span class="mx-1 opacity-50">·</span>{fmt(fat)}f
</p>
