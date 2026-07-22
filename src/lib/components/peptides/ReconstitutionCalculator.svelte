<script lang="ts">
	import NumberField from '$lib/components/NumberField.svelte';
	import { concentrationMcgPerMl, drawVolumeMl, isReconInputValid, syringeUnits } from '$lib/utils/reconstitution';
	import { formatDose } from '$lib/utils/peptides';

	// Pure client-side dosing-math helper: no medical judgement, just arithmetic that turns a desired
	// dose into a syringe reading. Optionally seeds from a vial and reports the units back via `onunits`.
	let {
		vialMg = $bindable<number | null>(null),
		bacWaterMl = $bindable<number | null>(null),
		doseMcg = $bindable<number | null>(null),
		onunits
	}: {
		vialMg?: number | null;
		bacWaterMl?: number | null;
		doseMcg?: number | null;
		onunits?: (units: number | null) => void;
	} = $props();

	const input = $derived({ vialMg: vialMg ?? NaN, bacWaterMl: bacWaterMl ?? NaN, doseMcg: doseMcg ?? NaN });
	const valid = $derived(isReconInputValid(input));
	const units = $derived(valid ? syringeUnits(input) : null);
	const volumeMl = $derived(valid ? drawVolumeMl(input) : null);
	const concentration = $derived(valid ? concentrationMcgPerMl(input.vialMg, input.bacWaterMl) : null);

	$effect(() => onunits?.(units));
</script>

<div class="space-y-3">
	<div class="grid grid-cols-3 gap-2">
		<NumberField label="Vial" name="calcVialMg" bind:value={vialMg} decimalText suffix="mg" />
		<NumberField label="Water" name="calcWaterMl" bind:value={bacWaterMl} decimalText suffix="mL" />
		<NumberField label="Dose" name="calcDoseMcg" bind:value={doseMcg} decimalText suffix="mcg" />
	</div>

	{#if valid && units != null}
		<div class="rounded-[var(--radius-md)] bg-[var(--color-accent-soft)] px-4 py-3">
			<p class="text-sm text-[var(--color-text-muted)]">Draw to</p>
			<p class="text-2xl font-semibold text-[var(--color-text)] tabular-nums">
				{units} <span class="text-base font-normal">units</span>
			</p>
			<p class="mt-0.5 text-xs text-[var(--color-text-muted)] tabular-nums">
				on a U-100 insulin syringe · {volumeMl!.toFixed(2)} mL · {Math.round(concentration!)} mcg/mL
			</p>
		</div>
	{:else}
		<p class="text-xs text-[var(--color-text-muted)]">
			Enter vial size, water added and your dose to get the syringe units. {formatDose(doseMcg)} entered.
		</p>
	{/if}
</div>
