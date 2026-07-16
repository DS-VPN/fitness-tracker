<script lang="ts">
	import Icon from './Icon.svelte';

	let {
		label,
		value = $bindable(0),
		step = 1,
		min = 0,
		class: className = ''
	}: { label: string; value?: number; step?: number; min?: number; class?: string } = $props();

	function dec() {
		value = Math.max(min, round(value - step));
	}
	function inc() {
		value = round(value + step);
	}
	function round(n: number) {
		return Math.round(n * 100) / 100;
	}
</script>

<div class={className}>
	<span class="block text-xs font-medium text-[var(--color-text-muted)] mb-1.5 text-center">{label}</span>
	<div
		class="flex items-center rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] overflow-hidden"
	>
		<button
			type="button"
			aria-label={`Decrease ${label}`}
			onclick={dec}
			class="h-12 w-11 flex items-center justify-center text-[var(--color-text)] active:bg-[var(--color-surface-alt)] shrink-0"
		>
			<Icon name="minus" size={18} />
		</button>
		<input
			type="number"
			inputmode="decimal"
			bind:value
			class="w-full h-12 text-center text-lg font-medium bg-transparent focus:outline-none [appearance:textfield]"
		/>
		<button
			type="button"
			aria-label={`Increase ${label}`}
			onclick={inc}
			class="h-12 w-11 flex items-center justify-center text-[var(--color-text)] active:bg-[var(--color-surface-alt)] shrink-0"
		>
			<Icon name="plus" size={18} />
		</button>
	</div>
</div>
