<script lang="ts">
	import Chip from './Chip.svelte';
	import { parseDecimal } from '$lib/utils/parseDecimal';
	import { formatPortions, formatDecimalInput } from '$lib/utils/formatPortions';

	let {
		label,
		name,
		value = $bindable(1),
		chips = [0.5, 1, 1.5, 2, 3],
		class: className = ''
	}: {
		label: string;
		/** When set, the picker renders its own hidden form input carrying `value` (dot-decimal). */
		name?: string;
		value?: number;
		chips?: number[];
		class?: string;
	} = $props();

	// `customText` is only seeded when the field opens, never re-derived from `value` while the user
	// is typing, so it can't fight in-progress input like a trailing "," (same rule as NumberStepper).
	let customOpen = $state(false);
	let customText = $state('');
	let customEl = $state<HTMLInputElement | null>(null);

	function pick(chip: number) {
		value = chip;
		customOpen = false;
	}

	function openCustom() {
		customText = value > 0 ? formatDecimalInput(value) : '';
		customOpen = true;
	}

	function handleCustomInput(e: Event) {
		customText = (e.currentTarget as HTMLInputElement).value;
		value = parseDecimal(customText);
	}

	$effect(() => {
		if (customOpen) {
			customEl?.focus();
			customEl?.select();
		}
	});
</script>

<div class={className}>
	<span class="block text-xs font-medium text-[var(--color-text-muted)] mb-1.5">{label}</span>
	{#if name}<input type="hidden" {name} {value} />{/if}
	<div class="flex flex-wrap gap-1.5" role="group" aria-label={label}>
		{#each chips as chip (chip)}
			<Chip selected={!customOpen && value === chip} onclick={() => pick(chip)}>
				{formatPortions(chip)}
			</Chip>
		{/each}
		<Chip selected={customOpen} onclick={openCustom}>Other</Chip>
	</div>
	{#if customOpen}
		<input
			bind:this={customEl}
			type="text"
			inputmode="decimal"
			value={customText}
			oninput={handleCustomInput}
			placeholder="e.g. 1,25"
			aria-label={`${label} — custom amount`}
			class="mt-2 h-12 w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-center text-lg font-medium focus:outline-none"
		/>
		{#if customText.trim() !== '' && value <= 0}
			<p class="mt-1 text-xs text-[var(--color-danger)]">Enter a number above 0 — e.g. 1,25</p>
		{/if}
	{/if}
</div>
